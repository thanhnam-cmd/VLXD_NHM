import React, { useMemo, useState } from 'react';
import { DateInput, SearchSelect } from './inputs.tsx';
import type { Project, Customer, ProjectStatus, ProjectExternalTeam } from '../types/index.ts';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { useStore } from '../state/store.tsx';
import { Modal, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary, btnDanger } from './ui.tsx';
import { PROJECT_STATUS_LABEL, EMAIL_RE, PHONE_RE, nextCode, toDbDateTime, toTime, formatDate } from '../utils/domain.ts';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';

/** Hộp thoại Thêm khách hàng mới (MH-02, Hình 3.18) */
export const CustomerModal: React.FC<{ customer?: Customer; onClose: () => void; onSaved: (c: Customer) => void }> = ({ customer, onClose, onSaved }) => {
  const { customers, addCustomer, updateCustomer } = useStore();
  const isEdit = !!customer;
  const [code, setCode] = useState(() => customer?.code || nextCode(customers.map(c => c.code), 'KH', 3));
  const [name, setName] = useState(customer?.name || '');
  const [contact, setContact] = useState(customer?.contactPerson || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    if (!code.trim()) return setErr('Vui lòng nhập mã khách hàng.');
    if (!name.trim()) return setErr('Vui lòng nhập tên khách hàng.');
    if (phone && !PHONE_RE.test(phone)) return setErr('Số điện thoại không hợp lệ.');
    if (email && !EMAIL_RE.test(email)) return setErr('Email không hợp lệ.');
    const data = { code, name, contactPerson: contact, phone, email, address, notes };
    if (isEdit) {
      const r = updateCustomer(customer!.id, data);
      if (!r.ok) return setErr(r.message);
      return onSaved({ ...customer!, ...data });
    }
    const r = addCustomer(data);
    if (!r.ok) return setErr(r.message);
    onSaved(r.data!);
  };

  return (
    <Modal
      title={isEdit ? `Sửa khách hàng ${customer!.code}` : 'Thêm khách hàng mới'}
      onClose={onClose}
      size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={submit}>Lưu khách hàng</button>
      </>}
    >
      <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <Label required>Mã khách hàng</Label>
          <input maxLength={20} value={code} disabled={isEdit} onChange={e => setCode(e.target.value)} className={`${inputCls} font-mono`} />
          <Hint>Dạng KHnnn, có thể sửa; không trùng</Hint>
        </div>
        <div>
          <Label>Số điện thoại</Label>
          <input maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xx..." className={inputCls} />
        </div>
      </div>
      <div>
        <Label required>Tên khách hàng hoặc đơn vị</Label>
        <input maxLength={200} value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Công ty TNHH ABC" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <Label>Đầu mối liên hệ</Label>
          <input maxLength={120} value={contact} onChange={e => setContact(e.target.value)} placeholder="Họ tên người liên hệ" className={inputCls} />
        </div>
        <div>
          <Label>Email</Label>
          <input maxLength={120} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@..." className={inputCls} />
        </div>
      </div>
      <div>
        <Label>Địa chỉ</Label>
        <input maxLength={255} value={address} onChange={e => setAddress(e.target.value)} placeholder="Địa chỉ trụ sở" className={inputCls} />
      </div>
      <div>
        <Label>Ghi chú</Label>
        <input maxLength={255} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tối đa 255 ký tự" className={inputCls} />
      </div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Biểu mẫu Tạo và Sửa dự án (MH-02, Hình 3.17) */
export const ProjectFormModal: React.FC<{ project?: Project; onClose: () => void; onSaved: (p: Project) => void }> = ({ project, onClose, onSaved }) => {
  const { projects, customers, staff, subcontractors, createProject, updateProject } = useStore();
  const isEdit = !!project;
  const year = DEMO_QUERY_TIME.slice(0, 4);
  const [code, setCode] = useState(project?.code || nextCode(projects.map(p => p.code), `NMH-${year}-`, 3));
  const [name, setName] = useState(project?.name || '');
  const [customerId, setCustomerId] = useState(project?.clientId || '');
  const [place, setPlace] = useState(project?.place || '');
  const [scope, setScope] = useState(project?.scopeSummary || '');
  const [startDate, setStartDate] = useState(project?.startDate?.slice(0, 10) || '');
  const [dueDate, setDueDate] = useState(project?.dueDate?.slice(0, 10) || '');
  const [managerId, setManagerId] = useState(project?.managerId || '');
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Đội khoán ngoài (nếu có): mỗi dòng một đội + số nhân sự tham gia
  const [extTeams, setExtTeams] = useState<{ contractorId: string; workerCount: string }[]>(
    (project?.externalTeams || []).map(x => ({ contractorId: x.contractorId, workerCount: String(x.workerCount) })));
  const setExt = (i: number, k: 'contractorId' | 'workerCount', v: string) => setExtTeams(prev => prev.map((x, j) => j === i ? { ...x, [k]: v } : x));

  const managers = staff.filter(s => s.roleTitle === 'QUAN_LY' && s.isActive);
  const customer = customers.find(c => c.id === customerId);

  const submit = () => {
    if (!code.trim()) return setErr('Vui lòng nhập mã dự án.');
    if (!name.trim()) return setErr('Vui lòng nhập tên dự án.');
    if (!customerId) return setErr('Vui lòng chọn khách hàng.');
    if (!place.trim()) return setErr('Vui lòng nhập địa điểm thi công.');
    if (!startDate || !dueDate) return setErr('Vui lòng nhập ngày bắt đầu và ngày kết thúc dự kiến.');
    if (!isEdit && startDate < DEMO_QUERY_TIME.slice(0, 10)) return setErr('Ngày không được trước ngày hiện tại. Vui lòng kiểm tra lại.');
    if (dueDate < startDate) return setErr('Ngày kết thúc không được trước ngày bắt đầu.');
    if (!managerId) return setErr('Vui lòng chọn người phụ trách dự án.');
    const teamRows = extTeams.filter(x => x.contractorId || x.workerCount);
    if (teamRows.some(x => !x.contractorId)) return setErr('Vui lòng chọn đội khoán ngoài cho từng dòng (hoặc xóa dòng trống).');
    if (teamRows.some(x => !/^\d+$/.test(x.workerCount) || +x.workerCount < 1 || +x.workerCount > 200)) return setErr('Số nhân sự tham gia của đội khoán ngoài phải từ 1 đến 200.');
    if (new Set(teamRows.map(x => x.contractorId)).size !== teamRows.length) return setErr('Mỗi đội khoán ngoài chỉ được gắn một lần trong dự án.');
    const externalTeams: ProjectExternalTeam[] = teamRows.map(x => ({ contractorId: x.contractorId, workerCount: +x.workerCount }));
    const mgr = staff.find(s => s.id === managerId);
    const data = {
      code: code.trim(),
      name: name.trim(),
      clientId: customerId,
      clientName: customer?.name,
      client: customer?.name,
      place: place.trim(),
      scopeSummary: scope.trim(),
      startDate: toDbDateTime(startDate, '08:00:00'),
      dueDate: toDbDateTime(dueDate, '17:00:00'),
      managerId,
      managerName: mgr?.name,
      externalTeams
    };
    if (isEdit) {
      const r = updateProject(project!.id, data);
      if (!r.ok) return setErr(r.message);
      onSaved({ ...project!, ...data });
    } else {
      const r = createProject(data);
      if (!r.ok) return setErr(r.message);
      onSaved(r.data!);
    }
  };

  return (
    <>
      <Modal
        title={isEdit ? `Sửa thông tin dự án ${project!.code}` : 'Tạo dự án mới'}
        onClose={onClose}
        size="lg"
        footer={<>
          <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
          <button type="button" className={btnPrimary} onClick={submit}>{isEdit ? 'Lưu thay đổi' : 'Lưu dự án'}</button>
        </>}
      >
        <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Mã dự án</Label>
            <input maxLength={30} value={code} disabled={isEdit} onChange={e => setCode(e.target.value)} className={`${inputCls} font-mono font-bold`} />
            <Hint>Dạng NMH-yyyy-nnn, tối đa 30 ký tự, không trùng{isEdit ? '; không đổi khi sửa' : ''}</Hint>
          </div>
          <div>
            <Label required>Người phụ trách dự án</Label>
            <select value={managerId} onChange={e => setManagerId(e.target.value)} className={inputCls}>
              <option value="">-- Chọn người phụ trách --</option>
              {managers.map(s => <option key={s.id} value={s.id}>{s.name} – {s.roleTitleDisplay}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label required>Tên dự án</Label>
          <input maxLength={255} value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Hạ tầng mạng và camera giám sát..." className={inputCls} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-slate-700 font-semibold">Khách hàng <span className="text-red-500">(*)</span></label>
            <button type="button" onClick={() => setIsCustomerOpen(true)} className="text-[11px] text-blue-700 hover:underline font-semibold cursor-pointer">
              + Thêm khách hàng mới
            </button>
          </div>
          <SearchSelect value={customerId} onChange={setCustomerId} className={inputCls}
            placeholder="Gõ mã hoặc tên khách hàng rồi bấm chọn…"
            options={customers.map(c => ({ value: c.id, label: `${c.code} – ${c.name}`, sub: [c.contactPerson, c.phone].filter(Boolean).join(' · ') }))} />
          {customer && (
            <Hint>Đầu mối: <strong>{customer.contactPerson || '—'}</strong> · {customer.phone || '—'} (lấy từ hồ sơ khách hàng)</Hint>
          )}
        </div>
        <div>
          <Label required>Địa điểm thi công</Label>
          <input maxLength={255} value={place} onChange={e => setPlace(e.target.value)} placeholder="Địa chỉ công trình" className={inputCls} />
        </div>
        <div>
          <Label>Phạm vi công việc</Label>
          <textarea rows={2} value={scope} onChange={e => setScope(e.target.value)} placeholder="Mô tả ngắn các hệ thống và khu vực thi công" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Ngày bắt đầu dự kiến</Label>
            <DateInput value={startDate} onChange={e => setStartDate(e.target.value)} className={`${inputCls} font-mono`} />
            <Hint>dd/mm/yyyy · giờ mặc định 08:00</Hint>
          </div>
          <div>
            <Label required>Ngày kết thúc dự kiến</Label>
            <DateInput value={dueDate} onChange={e => setDueDate(e.target.value)} className={`${inputCls} font-mono`} />
            <Hint>dd/mm/yyyy · giờ mặc định 17:00</Hint>
          </div>
        </div>
        <div className={`rounded-xl border p-3 space-y-2 ${extTeams.length ? 'border-purple-200 bg-purple-50/40' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-slate-700 font-semibold"><Building2 className="w-4 h-4 text-purple-600" /> Đội khoán ngoài (nếu có)</label>
            <button type="button" onClick={() => setExtTeams(prev => [...prev, { contractorId: '', workerCount: '' }])} className="text-[11px] text-blue-700 hover:underline font-semibold cursor-pointer flex items-center gap-0.5">
              <Plus className="w-3.5 h-3.5" /> Gắn đội khoán ngoài
            </button>
          </div>
          {extTeams.length === 0 ? (
            <Hint>Dự án chưa gắn đội khoán ngoài. Bấm "Gắn đội khoán ngoài" để chọn đội và số nhân sự tham gia.</Hint>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-500">
                <div className="col-span-8">Đội khoán ngoài <span className="text-red-500">(*)</span></div>
                <div className="col-span-3">Số nhân sự tham gia <span className="text-red-500">(*)</span></div>
              </div>
              {extTeams.map((x, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select value={x.contractorId} onChange={e => setExt(i, 'contractorId', e.target.value)} className={`${inputCls} col-span-8`}>
                    <option value="">-- Chọn đội khoán ngoài --</option>
                    {subcontractors
                      .filter(c => c.status === 'HOP_TAC' || c.id === x.contractorId)
                      .filter(c => c.id === x.contractorId || !extTeams.some(o => o.contractorId === c.id))
                      .map(c => <option key={c.id} value={c.id}>{c.companyName}{c.area ? ` – ${c.area}` : ''}{c.status !== 'HOP_TAC' ? ' (ngừng hợp tác)' : ''}</option>)}
                  </select>
                  <div className="col-span-3 relative">
                    <input type="number" min={1} max={200} value={x.workerCount} onChange={e => setExt(i, 'workerCount', e.target.value)} placeholder="VD: 4" className={`${inputCls} font-mono pr-10`} />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">người</span>
                  </div>
                  <button type="button" title="Bỏ đội này" onClick={() => setExtTeams(prev => prev.filter((_, j) => j !== i))} className="col-span-1 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer justify-self-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Hint>Tổng nhân sự đội ngoài: <strong>{extTeams.reduce((t, x) => t + (+x.workerCount || 0), 0)} người</strong>. Danh sách đội lấy từ Danh mục đội thi công ngoài.</Hint>
            </>
          )}
        </div>
        <ErrorBox message={err} />
      </Modal>
      {isCustomerOpen && (
        <CustomerModal
          onClose={() => setIsCustomerOpen(false)}
          onSaved={(c) => { setCustomerId(c.id); setIsCustomerOpen(false); }}
        />
      )}
    </>
  );
};

type ProjectDialogKind = 'status' | 'complete' | 'cancel';

/** Ba hộp thoại theo "Quy tắc đổi trạng thái dự án" (MH-07) */
export const ProjectStatusDialog: React.FC<{
  project: Project;
  kind: ProjectDialogKind;
  onClose: () => void;
  onDone: (message: string) => void;
  onViewTasks?: () => void;
}> = ({ project, kind, onClose, onDone, onViewTasks }) => {
  const { changeProjectStatus, tasks } = useStore();
  const options: ProjectStatus[] =
    project.status === 'LAP_KE_HOACH' ? ['DANG_THUC_HIEN'] :
    project.status === 'DANG_THUC_HIEN' ? ['TAM_DUNG'] :
    project.status === 'TAM_DUNG' ? ['DANG_THUC_HIEN'] : [];
  const [target, setTarget] = useState<ProjectStatus | ''>('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const unfinished = tasks.filter(t => t.projectId === project.id && t.status !== 'HUY' && t.status !== 'HOAN_THANH').length;

  const run = (status: ProjectStatus) => {
    const r = changeProjectStatus(project.id, status, reason.trim() || undefined);
    if (!r.ok) return setErr(r.message);
    onDone(r.message);
  };

  if (kind === 'complete') {
    return (
      <Modal title={`Xác nhận hoàn thành dự án ${project.code}`} subtitle={project.name} onClose={onClose} size="sm"
        footer={<>
          <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
          <button type="button" className={btnPrimary} onClick={() => run('HOAN_THANH')}>Xác nhận hoàn thành</button>
        </>}>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
          Hệ thống không tự chuyển dự án sang Hoàn thành; Quản lý xác nhận khi mọi công việc không bị Hủy đã Hoàn thành.
          Thời điểm tra cứu được ghi làm thời điểm hoàn thành. <strong>Hoàn thành là trạng thái cuối.</strong>
        </div>
        <ErrorBox message={err} />
        {err && unfinished > 0 && onViewTasks && (
          <button type="button" onClick={onViewTasks} className="text-[11px] text-blue-700 font-semibold hover:underline cursor-pointer">Xem công việc</button>
        )}
      </Modal>
    );
  }

  if (kind === 'cancel') {
    return (
      <Modal title={`Hủy dự án ${project.code}`} subtitle={project.name} onClose={onClose} size="sm"
        footer={<>
          <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
          <button type="button" className={btnDanger} onClick={() => run('HUY')}>Xác nhận hủy dự án</button>
        </>}>
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] leading-relaxed space-y-0.5">
          <div><strong>Hệ quả:</strong></div>
          <div>• Công việc đã Hoàn thành được giữ; công việc chưa hoàn thành chuyển sang Hủy.</div>
          <div>• Phân công bắt đầu từ thời điểm xác nhận bị hủy; phân công đang diễn ra kết thúc tại thời điểm xác nhận.</div>
          <div>• Phần việc giao đội ngoài còn hiệu lực bị hủy; lịch sử được giữ.</div>
          <div>• Hủy là trạng thái cuối.</div>
        </div>
        <div>
          <Label required>Lý do hủy dự án</Label>
          <textarea rows={2} maxLength={255} value={reason} onChange={e => setReason(e.target.value)} placeholder="Tối đa 255 ký tự" className={inputCls} />
        </div>
        <ErrorBox message={err} />
      </Modal>
    );
  }

  return (
    <Modal title="Đổi trạng thái dự án" subtitle={`${project.code} · ${project.name}`} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} disabled={!target} onClick={() => target && run(target)}>Xác nhận đổi trạng thái</button>
      </>}>
      <div>
        <Label>Trạng thái hiện tại</Label>
        <div className="p-2 bg-slate-100 rounded-lg font-semibold text-slate-800">{PROJECT_STATUS_LABEL[project.status]}</div>
      </div>
      <div>
        <Label required>Trạng thái mới</Label>
        <select value={target} onChange={e => { setTarget(e.target.value as ProjectStatus); setErr(null); }} className={`${inputCls} font-bold`}>
          <option value="">-- Chọn trạng thái mới --</option>
          {options.map(o => <option key={o} value={o}>{PROJECT_STATUS_LABEL[o]}</option>)}
        </select>
        <Hint>Không quay lại Lập kế hoạch. Hoàn thành và Hủy thực hiện bằng mục riêng trong menu.</Hint>
      </div>
      {target === 'TAM_DUNG' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
          Dự án tạm dừng không nhận phân công mới; chỉ được thu hẹp hoặc hủy phân công đang có.
        </div>
      )}
      <div>
        <Label>Lý do (không bắt buộc)</Label>
        <input maxLength={255} value={reason} onChange={e => setReason(e.target.value)} className={inputCls} />
      </div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Các mục menu hợp lệ theo trạng thái hiện tại của dự án */
export const projectMenuItems = (p: Project) => ({
  edit: p.status !== 'HOAN_THANH' && p.status !== 'HUY',
  status: p.status === 'LAP_KE_HOACH' || p.status === 'DANG_THUC_HIEN' || p.status === 'TAM_DUNG',
  complete: p.status === 'DANG_THUC_HIEN' || p.status === 'TAM_DUNG',
  cancel: p.status !== 'HOAN_THANH' && p.status !== 'HUY'
});

export const overdueDaysOf = (dueDate: string) => {
  const ref = toTime(DEMO_QUERY_TIME);
  const due = toTime(dueDate);
  if (isNaN(due) || due >= ref) return 0;
  const a = new Date(dueDate.slice(0, 10) + 'T00:00:00').getTime();
  const b = new Date(DEMO_QUERY_TIME.slice(0, 10) + 'T00:00:00').getTime();
  return Math.max(1, Math.round((b - a) / 86400000));
};

export { formatDate };
