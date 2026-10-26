import React, { useState } from 'react';
import { DateInput } from '../components/inputs.tsx';
import type { ExternalAssignment, ExternalSubcontractor } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';
import { formatDate, formatDateTime, toDbDateTime, toTime, daysBetween, isTaskOpen, isTeamLeadRole, canOperate, isDirectorRole } from '../utils/domain.ts';
import { useToast, Modal, Drawer, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary, ConfirmDialog } from '../components/ui.tsx';
import { Plus, Search } from 'lucide-react';
import { SearchSelect } from '../components/inputs.tsx';
import { Field, ctlCls } from '../components/reportKit.tsx';

export const externalState = (e: ExternalAssignment) => {
  if (e.status === 'HUY') return { key: 'HUY', label: 'Đã hủy', cls: 'bg-slate-300 text-slate-700' };
  const q = toTime(DEMO_QUERY_TIME);
  if (q < toTime(e.startDate)) return { key: 'SAP', label: 'Sắp triển khai', cls: 'bg-slate-100 text-slate-600' };
  if (q > toTime(e.dueDate)) return { key: 'KET_THUC', label: 'Đã kết thúc', cls: 'bg-emerald-100 text-emerald-800' };
  return { key: 'DANG', label: 'Đang triển khai', cls: 'bg-blue-100 text-blue-800' };
};

/** "Đã cập nhật x/y ngày": y tính từ ngày bắt đầu đến ngày liền trước thời điểm tra cứu, tối đa đến ngày kết thúc */
export const staffingProgress = (e: ExternalAssignment) => {
  const total = daysBetween(e.startDate, e.dueDate) + 1;
  const y = Math.max(0, Math.min(total, daysBetween(e.startDate, DEMO_QUERY_TIME)));
  return { x: (e.dailyStaffing || []).length, y, total };
};

const money = (v?: number) => (v ? `${v.toLocaleString('vi-VN')} đ` : '—');

/** Hộp thoại Thêm / Sửa đội thi công ngoài (Hình 3.28) */
export const SubcontractorModal: React.FC<{ sub?: ExternalSubcontractor; onClose: () => void; onSaved: (m: string) => void }> = ({ sub, onClose, onSaved }) => {
  const { saveSubcontractor } = useStore();
  const [f, setF] = useState({
    companyName: sub?.companyName || '', address: sub?.address || '', taxCode: sub?.taxCode || '',
    contactPerson: sub?.contactPerson || '', contactTitle: sub?.contactTitle || '', phone: sub?.phone || '',
    area: sub?.area || '', status: sub?.status || 'HOP_TAC', notes: sub?.notes || ''
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF(prev => ({ ...prev, [k]: v }));
  return (
    <Modal title={sub ? 'Sửa đội thi công ngoài' : 'Thêm đội thi công ngoài'} onClose={onClose}
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => {
          const r = saveSubcontractor({ ...f, status: f.status as any }, sub?.id);
          if (!r.ok) return setErr(r.message);
          onSaved(r.message);
        }}>Lưu đơn vị</button>
      </>}>
      <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
      <div><Label required>Tên đơn vị</Label><input maxLength={150} value={f.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Ví dụ: Đội thi công cáp Mai Dịch" className={inputCls} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Địa chỉ</Label><input maxLength={255} value={f.address} onChange={e => set('address', e.target.value)} className={inputCls} /></div>
        <div><Label>Mã số thuế</Label><input value={f.taxCode} onChange={e => set('taxCode', e.target.value)} placeholder="10 hoặc 13 chữ số" className={`${inputCls} font-mono`} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label required>Họ tên đầu mối</Label><input maxLength={120} value={f.contactPerson} onChange={e => set('contactPerson', e.target.value)} className={inputCls} /></div>
        <div><Label>Chức vụ đầu mối</Label><input maxLength={100} value={f.contactTitle} onChange={e => set('contactTitle', e.target.value)} placeholder="Ví dụ: Chủ đội" className={inputCls} /></div>
        <div><Label>Số điện thoại</Label><input maxLength={20} value={f.phone} onChange={e => set('phone', e.target.value)} className={inputCls} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Khu vực hoạt động</Label><input maxLength={150} value={f.area} onChange={e => set('area', e.target.value)} placeholder="Ví dụ: Cầu Giấy, Hà Nội" className={inputCls} /></div>
        <div>
          <Label required>Tình trạng hợp tác</Label>
          <select value={f.status} onChange={e => set('status', e.target.value)} className={inputCls}>
            <option value="HOP_TAC">Đang hợp tác</option>
            <option value="NGUNG_HOP_TAC">Ngừng hợp tác</option>
          </select>
        </div>
      </div>
      <div><Label>Ghi chú</Label><textarea rows={2} maxLength={255} value={f.notes} onChange={e => set('notes', e.target.value)} className={inputCls} /></div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Hộp thoại Giao phần việc cho đội thi công ngoài (Hình 3.29) */
const ExternalAssignModal: React.FC<{ ext?: ExternalAssignment; onClose: () => void; onSaved: (m: string) => void }> = ({ ext, onClose, onSaved }) => {
  const { subcontractors, visibleProjects, tasks, staff, saveExternalAssignment } = useStore();
  const [contractorId, setContractorId] = useState(ext?.contractorId || '');
  const [projectId, setProjectId] = useState(ext?.projectId || tasks.find(t => t.id === ext?.taskId)?.projectId || '');
  const [taskId, setTaskId] = useState(ext?.taskId || '');
  const [desc, setDesc] = useState(ext?.workDescription || '');
  const [sDate, setSDate] = useState(ext?.startDate.slice(0, 10) || '');
  const [sTime, setSTime] = useState(ext?.startDate.slice(11, 16) || '08:00');
  const [eDate, setEDate] = useState(ext?.dueDate.slice(0, 10) || '');
  const [eTime, setETime] = useState(ext?.dueDate.slice(11, 16) || '17:00');
  const [workers, setWorkers] = useState(ext?.workerCount ? String(ext.workerCount) : '');
  const [value, setValue] = useState(ext?.contractValue ? String(ext.contractValue) : '');
  const [coord, setCoord] = useState(ext?.nmhCoordinatorId || '');
  const [notes, setNotes] = useState(ext?.notes || '');
  const [err, setErr] = useState<string | null>(null);
  const task = tasks.find(t => t.id === taskId);
  return (
    <Modal title={ext ? 'Sửa phần việc giao' : 'Giao phần việc cho đội thi công ngoài'} onClose={onClose} size="lg"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => {
          const r = saveExternalAssignment({
            contractorId, projectId, taskId, workDescription: desc.trim(),
            startDate: sDate ? toDbDateTime(`${sDate} ${sTime}`) : '', dueDate: eDate ? toDbDateTime(`${eDate} ${eTime}`) : '',
            workerCount: workers ? parseInt(workers, 10) : undefined,
            contractValue: value ? parseInt(value.replace(/\D/g, ''), 10) : undefined,
            nmhCoordinatorId: coord, notes: notes.trim()
          }, ext?.id);
          if (!r.ok) return setErr(r.message);
          onSaved(r.message);
        }}>Lưu phần việc giao</button>
      </>}>
      <p className="text-[10px] text-slate-500">(*) Trường bắt buộc · Mỗi lần giao là một phần việc của đúng một công việc; không kiểm tra xung đột lịch cho thành viên đội ngoài.</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Đội thi công ngoài</Label>
          <select value={contractorId} onChange={e => setContractorId(e.target.value)} className={inputCls}>
            <option value="">-- Chọn đơn vị --</option>
            {subcontractors.filter(s => s.status === 'HOP_TAC' || s.id === contractorId).map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
          </select>
        </div>
        <div>
          <Label required>Dự án</Label>
          <select value={projectId} onChange={e => { setProjectId(e.target.value); setTaskId(''); }} className={inputCls}>
            <option value="">-- Chọn dự án --</option>
            {visibleProjects.filter(p => ['LAP_KE_HOACH', 'DANG_THUC_HIEN', 'TAM_DUNG'].includes(p.status)).map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <Label required>Công việc (chỉ một công việc)</Label>
        <select value={taskId} onChange={e => setTaskId(e.target.value)} disabled={!projectId} className={inputCls}>
          <option value="">-- Chọn công việc --</option>
          {tasks.filter(t => t.projectId === projectId && (isTaskOpen(t) || t.id === taskId)).map(t => <option key={t.id} value={t.id}>{t.code} · {t.title}</option>)}
        </select>
        {task && <Hint>Thời gian công việc: {formatDateTime(task.startDate)} – {formatDateTime(task.dueDate)}</Hint>}
      </div>
      <div>
        <Label required>Mô tả phần việc giao</Label>
        <textarea rows={2} maxLength={500} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ví dụ: Kéo cáp và lắp camera bãi xe, tầng hầm" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Bắt đầu dự kiến</Label>
          <DateInput value={sDate} onChange={e => setSDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <Label required>Kết thúc dự kiến</Label>
          <DateInput value={eDate} onChange={e => setEDate(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Số người dự kiến</Label><input type="number" min={1} max={200} value={workers} onChange={e => setWorkers(e.target.value)} className={`${inputCls} font-mono`} /></div>
        <div>
          <Label>Giá trị khoán dự kiến (đồng)</Label>
          <input value={value ? Number(value.replace(/\D/g, '') || 0).toLocaleString('vi-VN') : ''} onChange={e => setValue(e.target.value.replace(/\D/g, ''))} className={`${inputCls} font-mono`} />
          <Hint>Chỉ để tham khảo; không hạch toán, thanh toán</Hint>
        </div>
        <div>
          <Label required>Nhân sự NMH phối hợp</Label>
          <select value={coord} onChange={e => setCoord(e.target.value)} className={inputCls}>
            <option value="">-- Chọn nhân sự --</option>
            {staff.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} – {s.roleTitleDisplay}</option>)}
          </select>
        </div>
      </div>
      <div><Label>Ghi chú</Label><input maxLength={255} value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} /></div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Hộp thoại Cập nhật nhân sự triển khai trong ngày (Hình 3.31) */
export const DailyStaffingModal: React.FC<{ ext: ExternalAssignment; onClose: () => void; onSaved: (m: string) => void }> = ({ ext, onClose, onSaved }) => {
  const { upsertDailyStaffing } = useStore();
  const today = DEMO_QUERY_TIME.slice(0, 10);
  const defaultDate = today > ext.dueDate.slice(0, 10) ? ext.dueDate.slice(0, 10) : today;
  const [date, setDate] = useState(defaultDate);
  const existing = (ext.dailyStaffing || []).find(d => d.date === date);
  const [count, setCount] = useState(existing ? String(existing.presentCount) : '');
  const [names, setNames] = useState(existing?.names?.split(', ').join('\n') || '');
  const [content, setContent] = useState(existing?.content || '');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal title="Cập nhật nhân sự triển khai trong ngày" subtitle={`${ext.contractorName} · ${formatDate(ext.startDate)} – ${formatDate(ext.dueDate)}`} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => {
          if (count === '') return setErr('Số nhân sự có mặt phải từ 0 đến 200.');
          const r = upsertDailyStaffing(ext.id, { date, presentCount: parseInt(count, 10), names, content: content.trim() });
          if (!r.ok) return setErr(r.message);
          onSaved(r.message);
        }}>Lưu cập nhật</button>
      </>}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Ngày làm việc</Label><DateInput value={date} onChange={e => setDate(e.target.value)} className={`${inputCls} font-mono`} /></div>
        <div><Label required>Số nhân sự có mặt</Label><input type="number" min={0} max={200} value={count} onChange={e => setCount(e.target.value)} className={`${inputCls} font-mono`} /><Hint>0 nghĩa là ngày nghỉ</Hint></div>
      </div>
      {existing && <Hint>Ngày này đã có bản ghi; lưu lại sẽ sửa bản ghi và ghi nhật ký "Điều chỉnh".</Hint>}
      <div><Label>Họ tên nhân sự</Label><textarea rows={3} value={names} onChange={e => setNames(e.target.value)} placeholder="Mỗi dòng một người" className={inputCls} /></div>
      <div><Label>Nội dung triển khai</Label><input maxLength={300} value={content} onChange={e => setContent(e.target.value)} placeholder="Ví dụ: Kéo cáp Cat6 tầng 5" className={inputCls} /></div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Chi tiết phần việc giao và bảng nhân sự triển khai theo ngày (Hình 3.30) */
export const ExternalDetailDrawer: React.FC<{ extId: string; onClose: () => void; onMessage: (m: string) => void }> = ({ extId, onClose, onMessage }) => {
  const { externalAssignments, tasks, projects, staff, subcontractors, currentUser, cancelExternalAssignment } = useStore();
  const ext = externalAssignments.find(e => e.id === extId)!;
  const [daily, setDaily] = useState(false);
  const [edit, setEdit] = useState(false);
  const [cancel, setCancel] = useState(false);
  if (!ext) return null;
  const t = tasks.find(x => x.id === ext.taskId);
  const p = projects.find(x => x.id === (ext.projectId || t?.projectId));
  const sub = subcontractors.find(s => s.id === ext.contractorId);
  const st = externalState(ext);
  const prog = staffingProgress(ext);
  const isLead = isTeamLeadRole(currentUser);
  const isManager = canOperate(currentUser);
  // Phần việc khoán theo dự án: mọi đội trưởng có công việc trong dự án đều cập nhật được nhân sự theo ngày
  const isCoordinator = isLead && (currentUser.staffId === ext.nmhCoordinatorId || !ext.taskId);
  return (
    <Drawer title={ext.contractorName} subtitle={<span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${st.cls}`}>{st.label}</span>} onClose={onClose} width="max-w-2xl">
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
        <div className="flex items-center justify-between">
          <div className="font-bold text-slate-900">{t ? `${t.code} · ${p?.code} · ${t.title}` : `${p?.code} · Khoán theo dự án`}</div>
          {isManager && ext.status === 'HIEU_LUC' && ext.taskId && <button type="button" onClick={() => setEdit(true)} className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-semibold cursor-pointer">Sửa phần việc</button>}
        </div>
        <div>{ext.workDescription}</div>
        <div className="text-slate-600">Thời gian làm việc: <span className="font-mono">{formatDate(ext.startDate)} – {formatDate(ext.dueDate)}</span> ({prog.total} ngày)</div>
        <div className="text-slate-600">Đầu mối: {sub?.contactPerson}{sub?.contactTitle ? `, ${sub.contactTitle}` : ''} · {sub?.phone}</div>
        <div className="text-slate-600">Số người dự kiến: {ext.workerCount ?? '—'}{!isLead && <> · Giá trị khoán dự kiến: <strong>{money(ext.contractValue)}</strong></>}</div>
        <div className="text-slate-600">Nhân sự NMH phối hợp: <strong>{staff.find(s => s.id === ext.nmhCoordinatorId)?.name}</strong></div>
        {ext.status === 'HUY' && <div className="text-red-600">Lý do hủy: {ext.cancelReason}</div>}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
          {toTime(DEMO_QUERY_TIME) < toTime(ext.startDate) ? 'Chưa đến ngày làm việc' : `Đã cập nhật ${prog.x}/${prog.y} ngày`}
        </span>
        <div className="flex gap-2">
          {ext.status === 'HIEU_LUC' && (isManager || isCoordinator) && !isDirectorRole(currentUser) && (
            <button type="button" onClick={() => setDaily(true)} className="px-3 py-1.5 rounded-lg bg-[#152A55] text-white font-semibold cursor-pointer">Cập nhật nhân sự trong ngày</button>
          )}
          {ext.status === 'HIEU_LUC' && isManager && (
            <button type="button" onClick={() => setCancel(true)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 cursor-pointer">Hủy phần việc giao</button>
          )}
        </div>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
          <tr><th className="py-2 pr-2">Ngày</th><th className="py-2 pr-2">Có mặt</th><th className="py-2 pr-2">Họ tên nhân sự</th><th className="py-2 pr-2">Nội dung triển khai</th><th className="py-2">Người cập nhật</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(ext.dailyStaffing || []).length === 0 ? <tr><td colSpan={5} className="py-3 text-center text-slate-400">Chưa có bản ghi nhân sự theo ngày.</td></tr> :
            [...(ext.dailyStaffing || [])].sort((a, b) => a.date.localeCompare(b.date)).map(d => (
              <tr key={d.date}>
                <td className="py-2 pr-2 font-mono">{formatDate(d.date)}</td>
                <td className="py-2 pr-2 font-bold">{d.presentCount}</td>
                <td className="py-2 pr-2">{d.names || '—'}</td>
                <td className="py-2 pr-2">{d.content || '—'}</td>
                <td className="py-2 text-slate-500">{d.updatedBy}<div className="text-[10px] font-mono">{formatDateTime(d.updatedAt)}</div></td>
              </tr>
            ))}
        </tbody>
      </table>
      {daily && <DailyStaffingModal ext={ext} onClose={() => setDaily(false)} onSaved={(m) => { setDaily(false); onMessage(m); }} />}
      {edit && <ExternalAssignModal ext={ext} onClose={() => setEdit(false)} onSaved={(m) => { setEdit(false); onMessage(m); }} />}
      {cancel && (
        <ConfirmDialog title="Hủy phần việc giao" danger requireReason reasonLabel="Lý do hủy"
          message="Phần việc chuyển sang Đã hủy; các dòng nhân sự theo ngày đã nhập được giữ nguyên."
          onClose={() => setCancel(false)}
          onConfirm={(reason) => { const r = cancelExternalAssignment(ext.id, reason); if (!r.ok) return r.message; setCancel(false); onMessage(r.message); }} />
      )}
    </Drawer>
  );
};

/** Tab "Đội thi công ngoài" của màn hình Phân công thi công (MH-11) */
export const ExternalTeamsTab: React.FC = () => {
  const store = useStore();
  const { subcontractors, scoped, tasks, staff, visibleProjects, currentUser } = store;
  const toast = useToast();
  const [fProject, setFProject] = useState('');
  const [fState, setFState] = useState('');
  // Lọc theo đội khoán ngoài, kiểu giao (theo công việc / khoán theo dự án) và từ khóa
  const [fTeam, setFTeam] = useState('');
  const [fKind, setFKind] = useState('');
  const [fText, setFText] = useState('');
  const [subModal, setSubModal] = useState<{ sub?: ExternalSubcontractor } | null>(null);
  const [assignModal, setAssignModal] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancelExt, setCancelExt] = useState<ExternalAssignment | null>(null);
  const isManager = canOperate(currentUser);

  const exts = scoped.externalAssignments.filter(e => {
    const pid = e.projectId || tasks.find(t => t.id === e.taskId)?.projectId;
    if (fProject && pid !== fProject) return false;
    if (fState && externalState(e).key !== fState) return false;
    if (fTeam && e.contractorId !== fTeam) return false;
    if (fKind === 'TASK' && !e.taskId) return false;
    if (fKind === 'PROJECT' && e.taskId) return false;
    if (fText.trim()) {
      const t = tasks.find(x => x.id === e.taskId);
      const p = visibleProjects.find(x => x.id === pid);
      const hay = `${e.contractorName} ${e.workDescription} ${t?.code || ''} ${t?.title || ''} ${p?.code || ''} ${p?.name || ''}`.toLowerCase();
      if (!hay.includes(fText.trim().toLowerCase())) return false;
    }
    return true;
  });
  const teamCount = (id: string) => scoped.externalAssignments.filter(e => e.contractorId === id && e.status === 'HIEU_LUC').length;

  return (
    <div className="space-y-4">
      {toast.node}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-[#0D1A36]">Đơn vị thi công bên ngoài</h3>
          {isManager && (
            <button type="button" onClick={() => setSubModal({})} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Thêm đội thi công ngoài
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
              <tr><th className="py-2 pr-3">Đơn vị</th><th className="py-2 pr-3">Đầu mối</th><th className="py-2 pr-3">Khu vực hoạt động</th><th className="py-2 pr-3">Hợp tác</th>{isManager && <th className="py-2 text-right">Thao tác</th>}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subcontractors.map(s => (
                <tr key={s.id}>
                  <td className="py-2 pr-3"><button type="button" onClick={() => setFTeam(fTeam === s.id ? '' : s.id)} title="Lọc phần việc của đội này" className={`font-bold text-left hover:underline cursor-pointer ${fTeam === s.id ? 'text-blue-700' : ''}`}>{s.companyName}</button><div className="text-[10px] text-slate-500 font-mono">MST: {s.taxCode || '—'} · {teamCount(s.id)} phần việc hiệu lực</div></td>
                  <td className="py-2 pr-3">{s.contactPerson}{s.contactTitle ? `, ${s.contactTitle}` : ''} · {s.phone}</td>
                  <td className="py-2 pr-3">{s.area}</td>
                  <td className="py-2 pr-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.status === 'HOP_TAC' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{s.status === 'HOP_TAC' ? 'Đang hợp tác' : 'Ngừng hợp tác'}</span></td>
                  {isManager && <td className="py-2 text-right"><button type="button" onClick={() => setSubModal({ sub: s })} className="px-2 py-1 text-blue-700 hover:bg-blue-50 rounded font-semibold cursor-pointer">Sửa</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-[#0D1A36]">Phần việc giao đội thi công ngoài <span className="font-mono text-slate-500 font-normal">({exts.length})</span></h3>
          {isManager && (
            <button type="button" onClick={() => setAssignModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Giao phần việc
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5 items-end text-xs p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Field label="Tìm kiếm" className="w-full sm:w-52">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={fText} onChange={e => setFText(e.target.value)} placeholder="Phần việc, công việc, dự án" className={`${ctlCls} w-full pl-8`} />
            </div>
          </Field>
          <Field label="Đội khoán ngoài" className="w-full sm:w-60">
            <SearchSelect value={fTeam} onChange={setFTeam} allLabel="Tất cả đội" className={`${ctlCls} w-full`}
              options={subcontractors.map(sc => ({ value: sc.id, label: sc.companyName, sub: `${sc.status === 'HOP_TAC' ? 'Đang hợp tác' : 'Ngừng hợp tác'} · ${teamCount(sc.id)} phần việc hiệu lực` }))} />
          </Field>
          <Field label="Dự án" className="w-full sm:w-56">
            <SearchSelect value={fProject} onChange={setFProject} allLabel="Mọi dự án" className={`${ctlCls} w-full`}
              options={visibleProjects.map(p => ({ value: p.id, label: `${p.code} – ${p.name}` }))} />
          </Field>
          <Field label="Kiểu giao" className="w-[calc(50%-5px)] sm:w-auto">
            <select value={fKind} onChange={e => setFKind(e.target.value)} className={`${ctlCls} w-full`}>
              <option value="">Tất cả</option>
              <option value="TASK">Theo công việc</option>
              <option value="PROJECT">Khoán theo dự án</option>
            </select>
          </Field>
          <Field label="Tình trạng" className="w-[calc(50%-5px)] sm:w-auto">
            <select value={fState} onChange={e => setFState(e.target.value)} className={`${ctlCls} w-full`}>
              <option value="">Tất cả</option>
              <option value="SAP">Sắp triển khai</option>
              <option value="DANG">Đang triển khai</option>
              <option value="KET_THUC">Đã kết thúc</option>
              <option value="HUY">Đã hủy</option>
            </select>
          </Field>
          {(fText || fTeam || fProject || fKind || fState) && (
            <button type="button" onClick={() => { setFText(''); setFTeam(''); setFProject(''); setFKind(''); setFState(''); }} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold hover:bg-slate-100 cursor-pointer">Xóa bộ lọc</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {exts.length === 0 ? <div className="col-span-full text-center text-slate-400 text-xs p-6">Không có phần việc giao theo bộ lọc.</div> : exts.map(e => {
            const t = tasks.find(x => x.id === e.taskId);
            const p = visibleProjects.find(x => x.id === (e.projectId || t?.projectId));
            const st = externalState(e);
            const prog = staffingProgress(e);
            return (
              <div key={e.id} onClick={() => setDetailId(e.id)} className={`p-4 rounded-xl border cursor-pointer hover:border-purple-400 text-xs space-y-1 ${e.status === 'HUY' ? 'opacity-60 border-slate-200' : 'border-purple-200 bg-purple-50/20'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{e.contractorName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${st.cls}`}>{st.label}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600">{t ? `${t.code} · ${p?.code}` : `${p?.code} · khoán theo dự án`}</div>
                <div className="font-semibold text-slate-800">{t?.title || p?.name}</div>
                <div className="text-slate-600">{e.workDescription}</div>
                <div className="font-mono text-slate-500">{formatDate(e.startDate)} – {formatDate(e.dueDate)} ({prog.total} ngày)</div>
                <div className="text-slate-500">{st.key === 'SAP' ? 'Chưa đến ngày làm việc' : `Đã cập nhật ${prog.x}/${prog.y} ngày`}</div>
                <div className="text-slate-600">Số người dự kiến: {e.workerCount ?? '—'} · Giá trị khoán dự kiến: <strong>{money(e.contractValue)}</strong></div>
                <div className="text-slate-600">Nhân sự NMH phối hợp: {staff.find(s => s.id === e.nmhCoordinatorId)?.name}</div>
                <div className="flex gap-2 pt-1" onClick={ev => ev.stopPropagation()}>
                  <button type="button" onClick={() => setDetailId(e.id)} className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-semibold cursor-pointer">Nhân sự theo ngày</button>
                  {isManager && e.status === 'HIEU_LUC' && <button type="button" onClick={() => setCancelExt(e)} className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 font-semibold cursor-pointer">Hủy phần việc</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {subModal && <SubcontractorModal sub={subModal.sub} onClose={() => setSubModal(null)} onSaved={(m) => { setSubModal(null); toast.show(m); }} />}
      {assignModal && <ExternalAssignModal onClose={() => setAssignModal(false)} onSaved={(m) => { setAssignModal(false); toast.show(m); }} />}
      {detailId && <ExternalDetailDrawer extId={detailId} onClose={() => setDetailId(null)} onMessage={toast.show} />}
      {cancelExt && (
        <ConfirmDialog title="Hủy phần việc giao" danger requireReason reasonLabel="Lý do hủy"
          message="Phần việc chuyển sang Đã hủy; các dòng nhân sự theo ngày đã nhập được giữ nguyên."
          onClose={() => setCancelExt(null)}
          onConfirm={(reason) => { const r = store.cancelExternalAssignment(cancelExt.id, reason); if (!r.ok) return r.message; setCancelExt(null); toast.show(r.message); }} />
      )}
    </div>
  );
};
