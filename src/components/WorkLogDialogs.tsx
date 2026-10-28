import React, { useEffect, useRef, useState } from 'react';
import type { WorkLog, Task, UserAccount, ExternalReportItem } from '../types/index.ts';
import { useStore, AppStore, activeExternalsFor, staffStatusOf } from '../state/store.tsx';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';
import { Modal, Drawer, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary } from './ui.tsx';
import { formatDate, formatDateTime, isManagerRole, isAdminRole, isTeamLeadRole, normalizeRole, canOperate } from '../utils/domain.ts';
import { X, Camera, AlertCircle, Building2, ChevronLeft, ChevronRight, Download, MessageSquare, RotateCcw, CheckCircle2 } from 'lucide-react';
import { renderSamplePhoto, compressImage, downloadUrl } from '../utils/fileArt.ts';
import { ConfirmDailyModal, DayConfirmBadge, STAFF_STATUS_LABEL } from './ExternalDailyDialogs.tsx';

/** Nhãn trạng thái thẻ báo cáo suy ra từ dữ liệu (MH-12, Bảng 3.10) */
export const getLogLabel = (log: WorkLog, task?: Task) => {
  if (log.correctionForLogId) return { key: 'DINH_CHINH', label: 'Bổ sung, đính chính', cls: 'bg-purple-100 text-purple-800' };
  if (log.requestApproval) {
    if (task?.status === 'HOAN_THANH') return { key: 'DA_XAC_NHAN', label: 'Quản lý đã xác nhận hoàn thành', cls: 'bg-emerald-100 text-emerald-800' };
    const last = [...(log.comments || [])].filter(c => c.kind !== 'NHAN_XET').pop();
    if (last?.kind === 'YEU_CAU_CAP_NHAT' && task?.status !== 'HUY') return { key: 'YEU_CAU_CAP_NHAT', label: 'Quản lý yêu cầu cập nhật lại', cls: 'bg-red-100 text-red-800' };
    if (task?.status !== 'HUY') return { key: 'CHO_XAC_NHAN', label: 'Đã gửi · chờ Quản lý xác nhận', cls: 'bg-amber-100 text-amber-800' };
  }
  return { key: 'CAP_NHAT', label: 'Cập nhật tiến độ', cls: 'bg-blue-100 text-blue-800' };
};

/** Tình trạng đề nghị hoàn thành mới nhất của một công việc (dùng cho danh sách công việc) */
export const taskApprovalNote = (taskId: string, workLogs: WorkLog[], task?: Task) => {
  const req = workLogs.filter(w => w.taskId === taskId && w.requestApproval && !w.correctionForLogId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  if (!req || task?.status === 'HUY') return null;
  const label = getLogLabel(req, task);
  const last = [...(req.comments || [])].pop();
  return { ...label, log: req, comment: label.key === 'YEU_CAU_CAP_NHAT' ? last?.content : undefined };
};

const COMMENT_KIND: Record<string, { label: string; cls: string }> = {
  NHAN_XET: { label: 'Nhận xét', cls: 'bg-blue-100 text-blue-800' },
  PHE_DUYET: { label: 'Đã phê duyệt', cls: 'bg-emerald-100 text-emerald-800' },
  YEU_CAU_CAP_NHAT: { label: 'Yêu cầu cập nhật lại', cls: 'bg-red-100 text-red-800' }
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

type Photo = { name: string; dataUrl?: string; url?: string; size?: number };

/** Nguồn hiển thị ảnh: tệp lưu trong CSDL, ảnh vừa chụp, hoặc ảnh minh họa cho bản ghi mẫu chỉ có tên tệp */
const photoSrc = (p: Photo) => p.url || p.dataUrl || renderSamplePhoto(p.name);
const isSample = (p: Photo) => !p.url && !p.dataUrl;

const PhotoThumb: React.FC<{ photo: Photo; className?: string; onClick?: () => void }> = ({ photo, className = '', onClick }) => (
  <img src={photoSrc(photo)} alt={photo.name} title={photo.name} onClick={onClick} loading="lazy"
    className={`${className} object-cover rounded border border-slate-200 ${onClick ? 'cursor-zoom-in hover:opacity-90' : ''}`} />
);

/** Xem ảnh hiện trường phóng to, chuyển ảnh, tải về */
export const PhotoLightbox: React.FC<{ photos: Photo[]; index: number; onClose: () => void }> = ({ photos, index, onClose }) => {
  const [i, setI] = useState(index);
  const p = photos[i];
  if (!p) return null;
  const download = () => {
    if (p.url) return downloadUrl(`${p.url}?download=1`, p.name);
    downloadUrl(photoSrc(p), isSample(p) ? p.name.replace(/\.[^.]+$/, '') + '.jpg' : p.name);
  };
  return (
    <div className="fixed inset-0 z-[80] bg-black/85 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 text-white text-xs" onClick={e => e.stopPropagation()}>
        <span className="truncate">{i + 1}/{photos.length} · {p.name}{isSample(p) ? ' · ảnh minh họa (bản ghi mẫu chưa có tệp ảnh)' : ''}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={download} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 font-semibold flex items-center gap-1.5 cursor-pointer"><Download className="w-3.5 h-3.5" /> Tải ảnh</button>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-white/15 rounded cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center gap-3 px-3 pb-6 min-h-0" onClick={e => e.stopPropagation()}>
        <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="p-2 rounded-full bg-white/15 text-white disabled:opacity-20 cursor-pointer"><ChevronLeft className="w-6 h-6" /></button>
        <img src={photoSrc(p)} alt={p.name} className="max-w-full max-h-full object-contain rounded-lg" />
        <button type="button" disabled={i === photos.length - 1} onClick={() => setI(i + 1)} className="p-2 rounded-full bg-white/15 text-white disabled:opacity-20 cursor-pointer"><ChevronRight className="w-6 h-6" /></button>
      </div>
    </div>
  );
};

/** Danh sách nhận xét của Quản lý trên một báo cáo */
const CommentList: React.FC<{ log: WorkLog }> = ({ log }) => {
  const list = log.comments || [];
  if (list.length === 0) return <div className="text-slate-400">Chưa có nhận xét, đánh giá.</div>;
  return (
    <div className="space-y-2">
      {list.map(c => (
        <div key={c.id} className="p-2.5 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className={`px-1.5 py-0.5 rounded font-bold ${COMMENT_KIND[c.kind]?.cls}`}>{COMMENT_KIND[c.kind]?.label}</span><strong className="text-slate-700">{c.by}</strong></span>
            <span className="font-mono">{formatDateTime(c.at)}</span>
          </div>
          <div className="text-slate-800 mt-1 whitespace-pre-line">{c.content}</div>
        </div>
      ))}
    </div>
  );
};

/** Hộp thoại Nhận xét / Yêu cầu cập nhật lại của Quản lý */
const CommentModal: React.FC<{ log: WorkLog; kind: 'NHAN_XET' | 'YEU_CAU_CAP_NHAT'; onClose: () => void; onDone: (m: string) => void }> = ({ log, kind, onClose, onDone }) => {
  const { addLogComment } = useStore();
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal title={kind === 'YEU_CAU_CAP_NHAT' ? 'Yêu cầu cập nhật lại' : 'Thêm nhận xét'} subtitle={`${log.taskCode || ''} · ${formatDateTime(log.submittedAt)}`} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => { const r = addLogComment(log.id, kind, text); if (!r.ok) return setErr(r.message); onDone(r.message); }}>
          {kind === 'YEU_CAU_CAP_NHAT' ? 'Gửi yêu cầu' : 'Lưu nhận xét'}
        </button>
      </>}>
      {kind === 'YEU_CAU_CAP_NHAT' && <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px]">Công việc chưa được xác nhận hoàn thành. Đội trưởng sẽ thấy yêu cầu này và gửi bổ sung.</div>}
      <div>
        <Label required>{kind === 'YEU_CAU_CAP_NHAT' ? 'Nội dung cần cập nhật lại' : 'Nhận xét, đánh giá'}</Label>
        <textarea rows={4} maxLength={1000} autoFocus value={text} onChange={e => setText(e.target.value)} className={inputCls}
          placeholder={kind === 'YEU_CAU_CAP_NHAT' ? 'Ví dụ: Bổ sung ảnh đo kiểm cáp tầng 5, chưa thấy tem nhãn đầu cáp…' : 'Ví dụ: Thi công gọn gàng, đúng bản vẽ…'} />
      </div>
      <ErrorBox message={err} />
    </Modal>
  );
};

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
  // Đội khoán ngoài đang làm hôm nay của công việc này (theo công việc hoặc khoán theo dự án): mỗi đội một dòng báo cáo
  const today = DEMO_QUERY_TIME.slice(0, 10);
  const todayExts = projectId && taskId && !correctionOf ? activeExternalsFor(externalAssignments, projectId, taskId, today) : [];
  const [extRows, setExtRows] = useState<Record<string, { count: string; status: 'DU' | 'THIEU' | 'THUA'; note: string }>>({});
  useEffect(() => {
    const next: typeof extRows = {};
    todayExts.forEach(e => {
      const d = (e.dailyStaffing || []).find(x => x.date === today);
      const c = d ? d.presentCount : (e.workerCount ?? 0);
      next[e.id] = { count: String(c), status: (d?.reportedStatus as any) || staffStatusOf(c, e.workerCount), note: d?.reportNote || '' };
    });
    setExtRows(next);
  }, [taskId, projectId, todayExts.map(e => e.id).join(',')]);
  const setExtRow = (id: string, patch: Partial<{ count: string; status: 'DU' | 'THIEU' | 'THUA'; note: string }>) =>
    setExtRows(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

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
      compressImage(f).then(p => setPhotos(prev => [...prev, p])).catch(e => setErr(e.message));
    });
  };

  const submit = () => {
    if (!projectId) return setErr('Vui lòng chọn dự án.');
    if (!taskId) return setErr(isLead ? 'Vui lòng chọn công việc.' : 'Vui lòng chọn hạng mục và công việc.');
    const reports: ExternalReportItem[] = [];
    for (const e of todayExts) {
      const locked = (e.dailyStaffing || []).find(x => x.date === today && x.confirmed) && isLead;
      const row = extRows[e.id];
      if (locked || !row) continue;
      if (!/^\d+$/.test(row.count) || +row.count > 200) return setErr(`Vui lòng nhập số người có mặt hôm nay của ${e.contractorName} (0–200).`);
      reports.push({ assignmentId: e.id, contractorId: e.contractorId, contractorName: e.contractorName, workerCount: e.workerCount, count: +row.count, status: row.status, note: row.note.trim() || undefined });
    }
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
      externalTeamNote: extNoteOn && extNote.trim() ? extNote.trim() : undefined,
      externalReports: reports.length ? reports : undefined
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
      {todayExts.length > 0 && (
        <div className="rounded-xl border-2 border-purple-200 bg-purple-50/40 p-3 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-purple-900">
            <Building2 className="w-4 h-4" /> Đội khoán ngoài làm việc hôm nay ({formatDate(today)}) <span className="text-red-500">(*)</span>
          </div>
          <Hint>{isLead ? 'Báo số người có mặt và đủ/thiếu so với số khoán. Quản lý sẽ xác nhận số chính thức để làm báo cáo.' : 'Số người Quản lý nhập được ghi là số đã xác nhận.'}</Hint>
          {todayExts.map(e => {
            const d = (e.dailyStaffing || []).find(x => x.date === today);
            const row = extRows[e.id];
            if (!row) return null;
            if (isLead && d?.confirmed) return (
              <div key={e.id} className="p-2.5 rounded-lg bg-white border border-emerald-200 text-emerald-900">
                <strong>{e.contractorName}</strong> · khoán {e.workerCount ?? '—'} người — Quản lý đã xác nhận <strong>{d.presentCount} người</strong>{d.managerNote ? `: ${d.managerNote}` : ''}
              </div>
            );
            return (
              <div key={e.id} className="p-2.5 rounded-lg bg-white border border-purple-200 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{e.contractorName}</span>
                  <span className="text-[11px] text-slate-500">{e.taskId ? 'Theo công việc' : 'Khoán theo dự án'} · khoán <strong>{e.workerCount ?? '—'}</strong> người</span>
                </div>
                <div className="flex items-end gap-2 flex-wrap">
                  <div className="w-28">
                    <Label>Số người có mặt</Label>
                    <input type="number" min={0} max={200} value={row.count} className={`${inputCls} font-mono`}
                      onChange={ev => setExtRow(e.id, { count: ev.target.value, status: /^\d+$/.test(ev.target.value) ? staffStatusOf(+ev.target.value, e.workerCount) : row.status })} />
                  </div>
                  <div className="flex gap-1.5">
                    {([['DU', 'Đủ'], ['THIEU', 'Thiếu'], ['THUA', 'Thừa']] as const).map(([k, l]) => (
                      <button key={k} type="button" onClick={() => setExtRow(e.id, { status: k })}
                        className={`px-3 py-2 rounded-lg border font-semibold cursor-pointer ${row.status === k ? (k === 'DU' ? 'bg-emerald-600 text-white border-emerald-600' : k === 'THIEU' ? 'bg-red-600 text-white border-red-600' : 'bg-amber-500 text-white border-amber-500') : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>{l}</button>
                    ))}
                  </div>
                  <input value={row.note} maxLength={300} onChange={ev => setExtRow(e.id, { note: ev.target.value })} placeholder="Ghi chú (vd: thiếu 1 thợ buổi chiều)" className={`${inputCls} flex-1 min-w-[160px]`} />
                </div>
                {d && !d.confirmed && <div className="text-[11px] text-amber-700">Đã báo {d.reportedCount ?? d.presentCount} người lúc {formatDateTime(d.reportedAt || d.updatedAt)} – gửi lại sẽ cập nhật số mới.</div>}
              </div>
            );
          })}
        </div>
      )}
      {todayExts.length === 0 && (
      <div className={`rounded-xl border p-3 space-y-2.5 ${extNoteOn ? 'border-purple-200 bg-purple-50/40' : 'border-slate-200'}`}>
        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
          <input type="checkbox" checked={extNoteOn} onChange={e => {
            setExtNoteOn(e.target.checked);
            const links = visibleProjects.find(p => p.id === projectId)?.externalTeams || [];
            if (e.target.checked && !extTeamId && links.length) { setExtTeamId(links[0].contractorId); if (!extTeamCount) setExtTeamCount(String(links[0].workerCount)); }
          }} />
          <Building2 className="w-4 h-4 text-purple-600" /> Ghi chú đội thi công ngoài (đội không có trong phân công hôm nay)
        </label>
        {extNoteOn && (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <Label required>Tên đội thi công</Label>
                <select value={extTeamId} onChange={e => setExtTeamId(e.target.value)} className={inputCls}>
                  <option value="">-- Chọn đội thi công ngoài --</option>
                  {(() => {
                    const links = visibleProjects.find(p => p.id === projectId)?.externalTeams || [];
                    const linked = subcontractors.filter(x => links.some(l => l.contractorId === x.id));
                    const others = subcontractors.filter(x => !links.some(l => l.contractorId === x.id));
                    return <>
                      {linked.length > 0 && <optgroup label="Đội khoán của dự án">{linked.map(x => <option key={x.id} value={x.id}>{x.companyName} (khoán {links.find(l => l.contractorId === x.id)?.workerCount} người)</option>)}</optgroup>}
                      <optgroup label="Đội khác">{others.map(x => <option key={x.id} value={x.id}>{x.companyName}{x.status !== 'HOP_TAC' ? ' (ngừng hợp tác)' : ''}</option>)}</optgroup>
                    </>;
                  })()}
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
      )}
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
                <img src={photoSrc(p)} alt={p.name} className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
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
        <textarea rows={2} maxLength={255} value={note} onChange={e => setNote(e.target.value)} placeholder="Không bắt buộc; hiển thị cho đội trưởng trong phần nhận xét của báo cáo" className={inputCls} />
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
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [cmt, setCmt] = useState<'NHAN_XET' | 'YEU_CAU_CAP_NHAT' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmFor, setConfirmFor] = useState<{ extId: string; date: string } | null>(null);
  const logDay = log.submittedAt.slice(0, 10);
  const canConfirm = (isManagerRole(store.currentUser) || isAdminRole(store.currentUser));
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
      {(log.externalReports || []).length > 0 && (
        <div className="mt-2 rounded border border-purple-200 bg-purple-50/60 text-xs divide-y divide-purple-100">
          {(log.externalReports || []).map(r => {
            const e = externalAssignments.find(x => x.id === r.assignmentId);
            const day = r.date || logDay;
            const d = e && (e.dailyStaffing || []).find(x => x.date === day);
            return (
              <div key={r.assignmentId} className="p-2 flex items-start gap-2 flex-wrap">
                <Building2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-700" />
                <div className="flex-1 min-w-0 text-purple-900">
                  <strong>{r.contractorName || e?.contractorName}</strong> · báo <strong>{r.count}/{r.workerCount ?? e?.workerCount ?? '—'}</strong> người
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded font-bold ${STAFF_STATUS_LABEL[r.status]?.cls}`}>{STAFF_STATUS_LABEL[r.status]?.label}</span>
                  {r.note && <span className="text-slate-600"> – {r.note}</span>}
                  {d?.confirmed && <div className="text-emerald-800 mt-0.5">Quản lý xác nhận <strong>{d.presentCount} người</strong>{d.managerNote ? `: ${d.managerNote}` : ''}</div>}
                </div>
                <DayConfirmBadge d={d} />
                {canConfirm && e && d && !d.confirmed && (
                  <button type="button" onClick={() => setConfirmFor({ extId: e.id, date: day })} className="px-2.5 py-1 rounded-md bg-purple-700 text-white font-semibold cursor-pointer">Xác nhận</button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {extTeam && !(log.externalReports || []).length && (
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
          {photos.slice(0, 4).map((ph, i) => <PhotoThumb key={i} photo={ph} className="w-14 h-14" onClick={() => setLightbox(i)} />)}
          {photos.length > 4 && <button type="button" onClick={() => setLightbox(4)} className="w-14 h-14 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600 cursor-pointer">+{photos.length - 4}</button>}
        </div>
      )}
      {(log.comments || []).length > 0 && (() => {
        const last = (log.comments || [])[(log.comments || []).length - 1];
        return (
          <div className={`mt-2 p-2 rounded border text-xs flex items-start gap-1.5 ${last.kind === 'YEU_CAU_CAP_NHAT' ? 'bg-red-50 border-red-200 text-red-800' : last.kind === 'PHE_DUYET' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
            <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div><strong>{COMMENT_KIND[last.kind]?.label} – {last.by}:</strong> {last.content}{(log.comments || []).length > 1 && <span className="opacity-70"> (+{(log.comments || []).length - 1} nhận xét khác)</span>}</div>
          </div>
        );
      })()}
      {msg && <div className="mt-2 text-[11px] text-emerald-700 font-semibold">{msg}</div>}
      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 gap-2 flex-wrap">
        <span>Báo cáo bởi: <strong>{rep.name}</strong>{rep.title ? ` – ${rep.title}` : ''}</span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onView} className="px-3 py-1 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-100 cursor-pointer">Xem</button>
          {onFollowUp && <button type="button" onClick={onFollowUp} className="px-3 py-1 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-100 cursor-pointer">Gửi bổ sung</button>}
          {onApprove && <button type="button" onClick={() => setCmt('NHAN_XET')} className="px-3 py-1 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-100 cursor-pointer">Nhận xét</button>}
          {onApprove && label.key === 'CHO_XAC_NHAN' && (
            <button type="button" onClick={() => setCmt('YEU_CAU_CAP_NHAT')} className="px-3 py-1 bg-white border border-red-300 text-red-700 font-semibold rounded-md hover:bg-red-50 cursor-pointer flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Yêu cầu cập nhật lại</button>
          )}
          {onApprove && (label.key === 'CHO_XAC_NHAN' || label.key === 'YEU_CAU_CAP_NHAT') && (
            <button type="button" onClick={onApprove} className="px-3 py-1 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 cursor-pointer flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Phê duyệt</button>
          )}
        </div>
      </div>
      {lightbox !== null && <PhotoLightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} />}
      {cmt && <CommentModal log={log} kind={cmt} onClose={() => setCmt(null)} onDone={(m) => { setCmt(null); setMsg(m); window.setTimeout(() => setMsg(null), 3500); }} />}
      {confirmFor && (() => {
        const e = externalAssignments.find(x => x.id === confirmFor.extId);
        return e ? <ConfirmDailyModal ext={e} date={confirmFor.date} onClose={() => setConfirmFor(null)} onDone={(m) => { setConfirmFor(null); setMsg(m); window.setTimeout(() => setMsg(null), 3500); }} /> : null;
      })()}
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
  const fresh = workLogs.find(w => w.id === log.id) || log;
  const label = getLogLabel(fresh, t);
  const extTeam = store.subcontractors.find(x => x.id === fresh.externalTeamId);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [cmt, setCmt] = useState<'NHAN_XET' | 'YEU_CAU_CAP_NHAT' | null>(null);
  const isLead = isTeamLeadRole(store.currentUser);
  return (
    <Drawer title={`${t?.code} · ${t?.title}`} subtitle={`${formatDateTime(fresh.submittedAt)} · ${rep.name}`} onClose={onClose} width="max-w-xl">
      <div className="space-y-2">
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${label.cls}`}>{label.label}</span>
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{fresh.content}</p>
        {fresh.issuesFaced && <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700"><strong>Vướng mắc phát sinh:</strong> {fresh.issuesFaced}</div>}
        {extTeam && (
          <div className="p-2 rounded bg-purple-50 border border-purple-200 text-purple-900">
            <strong>Đội thi công ngoài:</strong> {extTeam.companyName}{fresh.externalTeamCount !== undefined && <> · {fresh.externalTeamCount} người</>}
            {fresh.externalStaffingStatus && <> · <strong>{fresh.externalStaffingStatus === 'DU' ? 'Đủ' : fresh.externalStaffingStatus === 'THIEU' ? 'Thiếu' : 'Thừa'} nhân sự</strong></>}
            {fresh.externalTeamNote && <div>{fresh.externalTeamNote}</div>}
          </div>
        )}
        {(fresh.photos || []).length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {(fresh.photos || []).map((ph, i) => <PhotoThumb key={i} photo={ph} className="w-full h-24" onClick={() => setLightbox(i)} />)}
          </div>
        )}
      </div>
      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-bold text-slate-800">Nhận xét, đánh giá của Quản lý</div>
          {allowFollowUp && !isLead && (
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setCmt('NHAN_XET')} className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-semibold cursor-pointer">+ Nhận xét</button>
              {label.key === 'CHO_XAC_NHAN' && <button type="button" onClick={() => setCmt('YEU_CAU_CAP_NHAT')} className="px-2.5 py-1 rounded-lg bg-white border border-red-300 text-red-700 font-semibold cursor-pointer">Yêu cầu cập nhật lại</button>}
            </div>
          )}
        </div>
        <CommentList log={fresh} />
      </div>
      {allowFollowUp && isLead && (
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
          <div className="font-bold text-slate-800 mb-2">Gửi bổ sung</div>
          <WorkLogForm correctionOf={fresh} onSaved={(m) => { onMessage(m); onClose(); }} />
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
      {lightbox !== null && <PhotoLightbox photos={fresh.photos || []} index={lightbox} onClose={() => setLightbox(null)} />}
      {cmt && <CommentModal log={fresh} kind={cmt} onClose={() => setCmt(null)} onDone={(m) => { setCmt(null); onMessage(m); }} />}
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
