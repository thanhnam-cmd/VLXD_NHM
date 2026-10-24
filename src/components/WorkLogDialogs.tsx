import React, { useRef, useState } from 'react';
import type { WorkLog, Task, UserAccount } from '../types/index.ts';
import { useStore, AppStore } from '../state/store.tsx';
import { Modal, Drawer, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary } from './ui.tsx';
import { formatDate, formatDateTime, isManagerRole, isAdminRole, isTeamLeadRole, normalizeRole, canOperate } from '../utils/domain.ts';
import { X, Camera, AlertCircle, Building2, ImageOff } from 'lucide-react';

/** Nhãn trạng thái thẻ báo cáo suy ra từ dữ liệu (MH-12, Bảng 3.10) */
export const getLogLabel = (log: WorkLog, task?: Task) => {
  if (log.correctionForLogId) return { key: 'DINH_CHINH', label: 'Đính chính', cls: 'bg-purple-100 text-purple-800' };
  if (log.requestApproval) {
    if (task?.status === 'HOAN_THANH') return { key: 'DA_XAC_NHAN', label: 'Quản lý đã xác nhận hoàn thành', cls: 'bg-emerald-100 text-emerald-800' };
    if (task?.status !== 'HUY') return { key: 'CHO_XAC_NHAN', label: 'Chờ Quản lý xác nhận', cls: 'bg-amber-100 text-amber-800' };
  }
  return { key: 'CAP_NHAT', label: 'Cập nhật tiến độ', cls: 'bg-blue-100 text-blue-800' };
};

/** Bản ghi do tài khoản Quản lý tạo mang nhãn phụ "Ghi nhận thay hiện trường" */
export const isRecordedByManager = (log: WorkLog, accounts: UserAccount[]) => {
  if (log.recordedByManager !== undefined) return log.recordedByManager;
  const acc = accounts.find(a => a.username === log.submittedByUsername || a.id === log.submittedByAccountId);
  return !!acc && (normalizeRole(acc.role) === 'QUAN_LY' || normalizeRole(acc.role) === 'QUAN_TRI');
};

export const reporterOf = (log: WorkLog, store: Pick<AppStore, 'staff' | 'accounts'>) => {
  const acc = store.accounts.find(a => a.username === log.submittedByUsername || a.id === log.submittedByAccountId);
  const s = store.staff.find(x => x.id === (log.submittedByStaffId || acc?.staffId));
  const name = s?.name || log.submittedByStaffName || acc?.name || '—';
  const title = s?.roleTitleDisplay || log.submittedByRole || '';
  return { name, title: title.startsWith('Đội trưởng') ? 'Đội trưởng' : title };
};

type Photo = { name: string; dataUrl?: string; size?: number };

/** Ảnh thu nhỏ: nếu chỉ có tên tệp (ảnh lưu ngoài ứng dụng) thì hiện biểu tượng thay vì ảnh vỡ */
const PhotoThumb: React.FC<{ photo: Photo; className?: string }> = ({ photo, className = '' }) =>
  photo.dataUrl ? (
    <img src={photo.dataUrl} alt={photo.name} className={`${className} object-cover rounded border border-slate-200`} />
  ) : (
    <span title={photo.name} className={`${className} rounded border border-slate-200 bg-slate-100 text-slate-500 flex flex-col items-center justify-center gap-0.5 p-1`}>
      <ImageOff className="w-4 h-4" />
      <span className="text-[8px] leading-tight truncate max-w-full">{photo.name}</span>
    </span>
  );

/**
 * Biểu mẫu "Gửi báo cáo nhật ký hiện trường" (MH-18) và hộp thoại "Ghi nhận kết quả" của Quản lý (MH-12).
 * Quản lý: không có ô đề nghị xác nhận hoàn thành, bản ghi mang nhãn "Ghi nhận thay hiện trường".
 */
export const WorkLogForm: React.FC<{
  initialProjectId?: string;
  initialTaskId?: string;
  correctionOf?: WorkLog;
  onSaved: (msg: string) => void;
  onCancel?: () => void;
  compact?: boolean;
}> = ({ initialProjectId, initialTaskId, correctionOf, onSaved, onCancel }) => {
  const store = useStore();
  const { currentUser, visibleProjects, tasks, categories, externalAssignments, config, addWorkLog, isTaskAssignedToMe, subcontractors } = store;
  const isLead = isTeamLeadRole(currentUser);
  const [projectId, setProjectId] = useState(correctionOf?.projectId || initialProjectId || '');
  const [taskId, setTaskId] = useState(correctionOf?.taskId || initialTaskId || '');
  const [content, setContent] = useState('');
  const [issues, setIssues] = useState('');
  const [externalId, setExternalId] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [requestApproval, setRequestApproval] = useState(false);
  // Ghi chú đội thi công ngoài (không bắt buộc): tên đội, số người, tình trạng nhân sự, chú thích
  const [extNoteOn, setExtNoteOn] = useState(false);
  const [extTeamId, setExtTeamId] = useState('');
  const [extTeamCount, setExtTeamCount] = useState('');
  const [extStatus, setExtStatus] = useState<'' | 'DU' | 'THIEU' | 'THUA'>('');
  const [extNote, setExtNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const projectOptions = visibleProjects.filter(p =>
    tasks.some(t => t.projectId === p.id && t.status !== 'HUY' && (!isLead || isTaskAssignedToMe(t))));
  const taskOptions = tasks
    .filter(t => t.projectId === projectId && t.status !== 'HUY' && (!isLead || isTaskAssignedToMe(t)))
    .map(t => ({ t, cat: categories.find(c => c.id === t.categoryId) }))
    .sort((a, b) => (a.cat?.orderNum || 0) - (b.cat?.orderNum || 0));
  const activeExternals = externalAssignments.filter(e => e.taskId === taskId && e.status === 'HIEU_LUC');

  const addPhotos = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    for (const f of arr) {
      if (!/\.(jpe?g|png)$/i.test(f.name)) { setErr('Định dạng tệp không được hỗ trợ.'); return; }
      if (f.size > config.maxUploadSizeMB * 1024 * 1024) { setErr('Tệp vượt quá dung lượng cho phép.'); return; }
    }
    if (photos.length + arr.length > 10) { setErr('Chỉ được tải tối đa 10 ảnh.'); return; }
    setErr(null);
    arr.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, { name: f.name, size: f.size, dataUrl: String(reader.result) }]);
      reader.readAsDataURL(f);
    });
  };

  const submit = () => {
    if (!projectId) return setErr('Vui lòng chọn dự án.');
    if (!taskId) return setErr(isLead ? 'Vui lòng chọn công việc.' : 'Vui lòng chọn hạng mục và công việc.');
    if (extNoteOn && !extTeamId) return setErr('Vui lòng chọn tên đội thi công ngoài.');
    if (extNoteOn && extTeamCount && !(/^\d+$/.test(extTeamCount) && +extTeamCount >= 0 && +extTeamCount <= 200)) return setErr('Số người của đội thi công ngoài phải từ 0 đến 200.');
    setBusy(true);
    const r = addWorkLog({
      projectId,
      taskId,
      content: content.trim(),
      issuesFaced: issues.trim() || undefined,
      externalAssignmentId: externalId || undefined,
      photos,
      requestApproval: isLead ? requestApproval : false,
      correctionForLogId: correctionOf?.id,
      externalTeamId: extNoteOn ? extTeamId : undefined,
      externalTeamCount: extNoteOn && extTeamCount !== '' ? +extTeamCount : undefined,
      externalStaffingStatus: extNoteOn && extStatus ? extStatus : undefined,
      externalTeamNote: extNoteOn && extNote.trim() ? extNote.trim() : undefined
    });
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    setContent(''); setIssues(''); setPhotos([]); setRequestApproval(false); setExternalId('');
    setExtNoteOn(false); setExtTeamId(''); setExtTeamCount(''); setExtStatus(''); setExtNote('');
    if (!correctionOf) { setTaskId(initialTaskId || ''); }
    onSaved(correctionOf ? 'Đã lưu bản đính chính.' : r.message);
  };

  return (
    <div className="space-y-3.5 text-xs">
      <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
      <div>
        <Label required>Dự án công trình</Label>
        <select value={projectId} disabled={!!correctionOf} onChange={e => { setProjectId(e.target.value); setTaskId(''); }} className={inputCls}>
          <option value="">-- Chọn dự án --</option>
          {projectOptions.map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
        </select>
      </div>
      <div>
        <Label required>Hạng mục và công việc</Label>
        <select value={taskId} disabled={!!correctionOf || !projectId} onChange={e => { setTaskId(e.target.value); setExternalId(''); }} className={inputCls}>
          <option value="">-- Chọn công việc --</option>
          {taskOptions.map(({ t, cat }) => (
            <option key={t.id} value={t.id}>{cat?.name || 'Hạng mục'} – {t.code} · {t.title}</option>
          ))}
        </select>
      </div>
      <div>
        <Label required>Nội dung đã thực hiện</Label>
        <textarea rows={4} maxLength={2000} value={content} onChange={e => setContent(e.target.value)}
          placeholder="Ví dụ: Kéo 800 m cáp Cat6 tầng 5, lắp 12 loa âm trần; tình hình hiện trường…" className={inputCls} />
        <Hint>{content.length}/2.000 ký tự</Hint>
      </div>
      <div>
        <Label>Khó khăn, vướng mắc</Label>
        <textarea rows={2} maxLength={1000} value={issues} onChange={e => setIssues(e.target.value)} placeholder="Tối đa 1.000 ký tự" className={inputCls} />
      </div>
      {activeExternals.length > 0 && (
        <div>
          <Label>Phần việc giao ngoài liên quan</Label>
          <select value={externalId} onChange={e => setExternalId(e.target.value)} className={inputCls}>
            <option value="">-- Không gắn phần việc giao ngoài --</option>
            {activeExternals.map(e => <option key={e.id} value={e.id}>{e.contractorName} · {formatDate(e.startDate)} – {formatDate(e.dueDate)}</option>)}
          </select>
        </div>
      )}
      <div className={`rounded-xl border p-3 space-y-2.5 ${extNoteOn ? 'border-purple-200 bg-purple-50/40' : 'border-slate-200'}`}>
        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
          <input type="checkbox" checked={extNoteOn} onChange={e => setExtNoteOn(e.target.checked)} />
          <Building2 className="w-4 h-4 text-purple-600" /> Ghi chú đội thi công ngoài (nếu có)
        </label>
        {extNoteOn && (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <Label required>Tên đội thi công</Label>
                <select value={extTeamId} onChange={e => setExtTeamId(e.target.value)} className={inputCls}>
                  <option value="">-- Chọn đội thi công ngoài --</option>
                  {subcontractors.map(x => <option key={x.id} value={x.id}>{x.companyName}{x.status !== 'HOP_TAC' ? ' (ngừng hợp tác)' : ''}</option>)}
                </select>
              </div>
              <div>
                <Label>Số người có mặt</Label>
                <input type="number" min={0} max={200} value={extTeamCount} onChange={e => setExtTeamCount(e.target.value)} className={`${inputCls} font-mono`} />
              </div>
            </div>
            <div>
              <Label>Tình trạng nhân sự so với yêu cầu</Label>
              <div className="flex gap-2">
                {([['DU', 'Đủ'], ['THIEU', 'Thiếu'], ['THUA', 'Thừa']] as const).map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setExtStatus(extStatus === k ? '' : k)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${extStatus === k ? (k === 'DU' ? 'bg-emerald-600 text-white border-emerald-600' : k === 'THIEU' ? 'bg-red-600 text-white border-red-600' : 'bg-amber-500 text-white border-amber-500') : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Chú thích</Label>
              <textarea rows={2} maxLength={500} value={extNote} onChange={e => setExtNote(e.target.value)} placeholder="Ví dụ: thiếu 1 thợ kéo cáp buổi chiều; đội tự bổ sung ngày mai…" className={inputCls} />
            </div>
          </>
        )}
      </div>
      <div>
        <Label>Ảnh hiện trường</Label>
        <button type="button" onClick={() => fileRef.current?.click()} className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-500 flex items-center justify-center gap-2 cursor-pointer">
          <Camera className="w-4 h-4" /> Chọn hoặc chụp ảnh (JPG, PNG; tối đa 10 ảnh)
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png" capture="environment" multiple className="hidden" onChange={e => { addPhotos(e.target.files); e.target.value = ''; }} />
        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                <img src={p.dataUrl} alt={p.name} className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 bg-white rounded-full border border-slate-300 p-0.5 cursor-pointer"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      {isLead && !correctionOf && (
        <label className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer">
          <input type="checkbox" checked={requestApproval} onChange={e => setRequestApproval(e.target.checked)} />
          <span className="text-amber-900 font-medium">Đề nghị Quản lý xác nhận hoàn thành công việc</span>
        </label>
      )}
      <ErrorBox message={err} />
      <div className="flex items-center justify-end gap-2">
        {onCancel && <button type="button" className={btnSecondary} onClick={onCancel}>Hủy bỏ</button>}
        <button type="button" disabled={busy} onClick={submit} className={`${btnPrimary} ${onCancel ? '' : 'w-full'}`}>
          {busy ? 'Đang gửi…' : correctionOf ? 'Lưu cập nhật tiếp theo' : isLead ? 'Gửi báo cáo hiện trường' : 'Lưu kết quả'}
        </button>
      </div>
    </div>
  );
};

/** Hộp thoại Phê duyệt hoàn thành công việc (MH-12, Hình 3.33) */
export const ApproveModal: React.FC<{ log: WorkLog; onClose: () => void; onDone: (msg: string) => void }> = ({ log, onClose, onDone }) => {
  const store = useStore();
  const { tasks, projects, approveWorkLog } = store;
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const t = tasks.find(x => x.id === log.taskId);
  const p = projects.find(x => x.id === log.projectId);
  const rep = reporterOf(log, store);
  return (
    <Modal title="Phê duyệt hoàn thành công việc" onClose={onClose}
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => {
          const r = approveWorkLog(log.id, note.trim());
          if (!r.ok) return setErr(r.message);
          onDone(r.message);
        }}>Xác nhận phê duyệt</button>
      </>}>
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
        <div><span className="text-slate-500">Dự án:</span> <strong>{p?.code} · {p?.name}</strong></div>
        <div><span className="text-slate-500">Công việc:</span> <strong>{t?.code} · {t?.title}</strong> (hạn {formatDate(t?.dueDate)})</div>
        <div><span className="text-slate-500">Người gửi:</span> {rep.name}{rep.title ? ` – ${rep.title}` : ''} · {(log.photos || []).length} ảnh đính kèm</div>
        <div className="pt-1 text-slate-700">{log.content}</div>
      </div>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
        Công việc sẽ chuyển sang Hoàn thành. Các phân công bắt đầu từ thời điểm xác nhận sẽ bị hủy; phân công đang diễn ra kết thúc tại thời điểm xác nhận. Thao tác này không hoàn tác.
      </div>
      <div>
        <Label>Ghi chú của Quản lý</Label>
        <textarea rows={2} maxLength={255} value={note} onChange={e => setNote(e.target.value)} placeholder="Không bắt buộc; tối đa 255 ký tự; lưu vào nhật ký thao tác" className={inputCls} />
      </div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Thẻ báo cáo trong dòng thời gian (MH-12, MH-15, MH-18) */
export const WorkLogCard: React.FC<{
  log: WorkLog;
  onView: () => void;
  onApprove?: () => void;
  onFollowUp?: () => void;
}> = ({ log, onView, onApprove, onFollowUp }) => {
  const store = useStore();
  const { tasks, projects, categories, externalAssignments, accounts } = store;
  const t = tasks.find(x => x.id === log.taskId);
  const p = projects.find(x => x.id === log.projectId);
  const cat = categories.find(c => c.id === t?.categoryId);
  const ext = externalAssignments.find(e => e.id === log.externalAssignmentId);
  const extTeam = store.subcontractors.find(x => x.id === log.externalTeamId);
  const label = getLogLabel(log, t);
  const byManager = isRecordedByManager(log, accounts);
  const rep = reporterOf(log, store);
  const photos = log.photos || [];
  return (
    <div className={`p-4 rounded-xl border transition-all ${label.key === 'DA_XAC_NHAN' ? 'border-emerald-200 bg-emerald-50/20' : label.key === 'CHO_XAC_NHAN' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 bg-slate-50/30'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs text-[#0D1A36]">{p?.code} · {p?.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${label.cls}`}>{label.label}</span>
            {byManager && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">Ghi nhận thay hiện trường</span>}
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-0.5">{cat?.name || 'Hạng mục'} – {t?.code} · {t?.title}</div>
          {ext && <div className="text-[11px] text-purple-700 mt-0.5">Phần việc giao ngoài: {ext.contractorName}</div>}
        </div>
        <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">{formatDateTime(log.submittedAt)}</div>
      </div>
      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{log.content}</p>
      {extTeam && (
        <div className="mt-2 p-2 rounded bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-1.5">
          <Building2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div>
            <strong>Đội thi công ngoài:</strong> {extTeam.companyName}
            {log.externalTeamCount !== undefined && <> · {log.externalTeamCount} người</>}
            {log.externalStaffingStatus && <> · <span className={`font-bold ${log.externalStaffingStatus === 'DU' ? 'text-emerald-700' : log.externalStaffingStatus === 'THIEU' ? 'text-red-700' : 'text-amber-700'}`}>{log.externalStaffingStatus === 'DU' ? 'Đủ' : log.externalStaffingStatus === 'THIEU' ? 'Thiếu' : 'Thừa'} nhân sự</span></>}
            {log.externalTeamNote && <div className="mt-0.5">{log.externalTeamNote}</div>}
          </div>
        </div>
      )}
      {log.issuesFaced && (
        <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div><strong>Vướng mắc phát sinh:</strong> {log.issuesFaced}</div>
        </div>
      )}
      {photos.length > 0 && (
        <div className="flex gap-1.5 mt-2">
          {photos.slice(0, 4).map((ph, i) => <PhotoThumb key={i} photo={ph} className="w-12 h-12" />)}
          {photos.length > 4 && <span className="w-12 h-12 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600">+{photos.length - 4}</span>}
        </div>
      )}
      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 gap-2 flex-wrap">
        <span>Báo cáo bởi: <strong>{rep.name}</strong>{rep.title ? ` – ${rep.title}` : ''}</span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onView} className="px-3 py-1 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-100 cursor-pointer">Xem</button>
          {onFollowUp && <button type="button" onClick={onFollowUp} className="px-3 py-1 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-100 cursor-pointer">Gửi bổ sung</button>}
          {onApprove && label.key === 'CHO_XAC_NHAN' && (
            <button type="button" onClick={onApprove} className="px-3 py-1 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 cursor-pointer">Phê duyệt</button>
          )}
        </div>
      </div>
    </div>
  );
};

/** Ngăn xem chi tiết báo cáo; Quản lý có ô "Cập nhật tiếp theo" để thêm bổ sung hoặc đính chính */
export const WorkLogDetailDrawer: React.FC<{ log: WorkLog; onClose: () => void; allowFollowUp?: boolean; onMessage: (m: string) => void }> = ({
  log, onClose, allowFollowUp, onMessage
}) => {
  const store = useStore();
  const { tasks, workLogs } = store;
  const t = tasks.find(x => x.id === log.taskId);
  const others = workLogs.filter(w => w.taskId === log.taskId && w.id !== log.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const rep = reporterOf(log, store);
  const [zoom, setZoom] = useState<string | null>(null);
  return (
    <Drawer title={`${t?.code} · ${t?.title}`} subtitle={`${formatDateTime(log.submittedAt)} · ${rep.name}`} onClose={onClose} width="max-w-xl">
      <div className="space-y-2">
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{log.content}</p>
        {log.issuesFaced && <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700"><strong>Vướng mắc phát sinh:</strong> {log.issuesFaced}</div>}
        {(log.photos || []).length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {(log.photos || []).map((ph, i) => ph.dataUrl
              ? <img key={i} src={ph.dataUrl} alt={ph.name} onClick={() => setZoom(ph.dataUrl || null)} className="w-full h-24 object-cover rounded-lg border border-slate-200 cursor-zoom-in" />
              : <PhotoThumb key={i} photo={ph} className="w-full h-24" />)}
          </div>
        )}
      </div>
      {allowFollowUp && (
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
          <div className="font-bold text-slate-800 mb-2">Cập nhật tiếp theo</div>
          <WorkLogForm correctionOf={log} onSaved={(m) => { onMessage(m); onClose(); }} />
        </div>
      )}
      <div>
        <div className="font-bold text-slate-800 mb-2">Các báo cáo khác của cùng công việc ({others.length})</div>
        <div className="space-y-2">
          {others.length === 0 ? <div className="text-slate-400">Chưa có báo cáo khác.</div> : others.map(o => (
            <div key={o.id} className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{reporterOf(o, store).name}</span>
                <span className="font-mono">{formatDateTime(o.submittedAt)}</span>
              </div>
              <div className="text-slate-700 mt-1">{o.content}</div>
            </div>
          ))}
        </div>
      </div>
      {zoom && (
        <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-6" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </Drawer>
  );
};

export const RecordResultModal: React.FC<{ initialProjectId?: string; initialTaskId?: string; onClose: () => void; onSaved: (m: string) => void }> = ({
  initialProjectId, initialTaskId, onClose, onSaved
}) => (
  <Modal title="Ghi nhận kết quả" subtitle="Lưu kết quả Quản lý tiếp nhận ngoài ứng dụng thành một bản ghi riêng (Ghi nhận thay hiện trường)" onClose={onClose} size="lg">
    <WorkLogForm initialProjectId={initialProjectId} initialTaskId={initialTaskId} onSaved={onSaved} onCancel={onClose} />
  </Modal>
);

export { canOperate, isManagerRole, isAdminRole };
