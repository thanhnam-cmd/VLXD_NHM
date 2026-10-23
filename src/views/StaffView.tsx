import React, { useState } from 'react';
import { Staff, StaffSkill, Assignment } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';
import { UserPlus, Search, Star } from 'lucide-react';
import { useToast, Modal, Drawer, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary, Pagination } from '../components/ui.tsx';
import { formatDate, formatDateTime, isRecordActive, toTime, nextCode, ROLE_LABEL, normalizeRole, canOperate } from '../utils/domain.ts';

const ROLE_TITLES: [string, string][] = [
  ['QUAN_LY', 'Quản lý dự án'], ['DOI_TRUONG', 'Đội trưởng'], ['KY_SU', 'Kỹ sư kỹ thuật'],
  ['KY_THUAT_VIEN', 'Kỹ thuật viên'], ['CONG_NHAN', 'Công nhân thi công'], ['NHAN_VIEN_THIET_KE', 'Nhân viên thiết kế']
];
const SKILLS = [
  'Kéo cáp và lắp máng cáp, ống luồn', 'Cấu hình mạng, VLAN, WiFi', 'Lắp đặt và cấu hình camera giám sát', 'Kiểm soát ra vào, khóa từ',
  'Âm thanh thông báo', 'Âm thanh hình ảnh và hội nghị trực tuyến', 'Hạ tầng thoại, tổng đài', 'Nhà thông minh',
  'Thiết kế bản vẽ CAD, shop drawing', 'Khảo sát và nghiệm thu'
];
const TEAMS: [string, string][] = [['1', 'Đội thi công 1'], ['2', 'Đội thi công 2'], ['3', 'Đội thi công 3'], ['4', 'Tổ thiết kế']];
const LEVEL_LABEL: Record<string, string> = { CO_BAN: 'Cơ bản', THANH_THAO: 'Thành thạo', CHUYEN_SAU: 'Chuyên sâu' };

const primarySkill = (s: Staff) => s.skills?.find(k => k.isPrimary)?.name || s.specialty || '';
const teamShort = (s: Staff) => TEAMS.find(t => t[0] === s.teamId)?.[1] || (s.teamName ? s.teamName.split(' - ')[0] : '—');

interface StaffViewProps {
  onOpenAssignments: () => void;
}

const PAGE_SIZE = 10;

/** Màn hình Hồ sơ nhân sự (MH-03) */
export const StaffView: React.FC<StaffViewProps> = ({ onOpenAssignments }) => {
  const store = useStore();
  const { staff, accounts, assignments, leaves, tasks, projects, currentUser } = store;
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [fTitle, setFTitle] = useState('');
  const [fSkill, setFSkill] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<{ staff?: Staff } | null>(null);
  const [viewStaff, setViewStaff] = useState<Staff | null>(null);
  const canEdit = canOperate(currentUser);

  const rows = staff.filter(s => {
    if (search && !`${s.code} ${s.name} ${s.phone}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (fTitle && s.roleTitle !== fTitle) return false;
    if (fSkill && !(s.skills?.some(k => k.name === fSkill) || (s.specialty || '').toLowerCase().includes(fSkill.split(',')[0].toLowerCase()))) return false;
    if (fStatus === 'active' && !s.isActive) return false;
    if (fStatus === 'inactive' && s.isActive) return false;
    return true;
  });
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {toast.node}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">Hồ sơ nhân sự</h2>
        {canEdit && (
          <button type="button" onClick={() => setForm({})} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#152A55] text-white hover:bg-[#1E3A75] shadow-xs cursor-pointer">
            <UserPlus className="w-4 h-4" /> Thêm nhân sự
          </button>
        )}
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap gap-2 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm mã, họ tên, số điện thoại" className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg w-64" />
        </div>
        <select value={fTitle} onChange={e => { setFTitle(e.target.value); setPage(1); }} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
          <option value="">Mọi chức danh</option>
          {ROLE_TITLES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={fSkill} onChange={e => { setFSkill(e.target.value); setPage(1); }} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
          <option value="">Mọi chuyên môn</option>
          {SKILLS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(1); }} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
          <option value="">Mọi tình trạng</option>
          <option value="active">Đang làm việc</option>
          <option value="inactive">Ngừng làm việc</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
            <tr><th className="p-3">Mã</th><th className="p-3">Họ tên</th><th className="p-3">Chức danh</th><th className="p-3">Đội/tổ</th><th className="p-3">Chuyên môn chính</th><th className="p-3">Số điện thoại</th><th className="p-3">Tình trạng</th><th className="p-3">Tài khoản</th><th className="p-3 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.length === 0 ? <tr><td colSpan={9} className="p-6 text-center text-slate-400">Không có nhân sự phù hợp.</td></tr> : pageRows.map(s => (
              <tr key={s.id} className={s.isActive ? 'hover:bg-slate-50/60' : 'opacity-50'}>
                <td className="p-3 font-mono font-bold text-slate-600">{s.code}</td>
                <td className="p-3 font-bold text-slate-900">{s.name}</td>
                <td className="p-3">{ROLE_TITLES.find(r => r[0] === s.roleTitle)?.[1] || s.roleTitleDisplay}</td>
                <td className="p-3">{teamShort(s)}</td>
                <td className="p-3">{primarySkill(s) || <span className="text-slate-400">Chưa cập nhật chuyên môn</span>}</td>
                <td className="p-3 font-mono">{s.phone}</td>
                <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{s.isActive ? 'Đang làm việc' : 'Ngừng làm việc'}</span></td>
                <td className="p-3">{accounts.some(a => a.staffId === s.id) ? 'Có' : 'Chưa có'}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button type="button" onClick={() => setViewStaff(s)} className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded font-semibold cursor-pointer">Xem</button>
                  {canEdit && <button type="button" onClick={() => setForm({ staff: s })} className="px-2 py-1 text-blue-700 hover:bg-blue-50 rounded font-semibold cursor-pointer">Sửa</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} unit="nhân sự" onChange={setPage} />

      {viewStaff && (() => {
        const s = staff.find(x => x.id === viewStaff.id) || viewStaff;
        const upcoming = assignments.filter(a => a.staffId === s.id && isRecordActive(a) && toTime(a.endDate) > toTime(DEMO_QUERY_TIME)).sort((a, b) => a.startDate.localeCompare(b.startDate));
        const activeLeaves = leaves.filter(l => l.staffId === s.id && isRecordActive(l) && toTime(l.endDate) >= toTime(DEMO_QUERY_TIME));
        const acc = accounts.find(a => a.staffId === s.id);
        const skills: StaffSkill[] = s.skills?.length ? s.skills : s.specialty ? [{ name: s.specialty, level: 'THANH_THAO', isPrimary: true }] : [];
        return (
          <Drawer title={`${s.code} · ${s.name}`} subtitle={ROLE_TITLES.find(r => r[0] === s.roleTitle)?.[1] || s.roleTitleDisplay} onClose={() => setViewStaff(null)}>
            <div className="p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800 mb-1">Thông tin cá nhân</div>
              <div>Đội/tổ: {teamShort(s)} · Điện thoại: {s.phone || '—'} · Email: {s.email || '—'}</div>
              <div>Ngày vào làm: {formatDate(s.startDate) || '—'}{!s.isActive && ` · Ngừng làm việc từ ${formatDate(s.leaveDate)}`}</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.length === 0 ? <span className="text-slate-400">Chưa cập nhật chuyên môn</span> : skills.map(k => (
                  <span key={k.name} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">{k.isPrimary ? '★ ' : ''}{k.name} · {LEVEL_LABEL[k.level]}</span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800 mb-1">Phân công sắp tới</div>
              {upcoming.length === 0 ? <div className="text-slate-400">Không có phân công sắp tới.</div> : upcoming.map(a => (
                <div key={a.id} className="flex justify-between py-0.5"><span className="font-mono">{tasks.find(t => t.id === a.taskId)?.code} · {projects.find(p => p.id === a.projectId)?.code}</span><span className="font-mono text-slate-500">{formatDateTime(a.startDate)} – {formatDateTime(a.endDate)}</span></div>
              ))}
            </div>
            <div className="p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800 mb-1">Lịch nghỉ/bận còn hiệu lực</div>
              {activeLeaves.length === 0 ? <div className="text-slate-400">Không có.</div> : activeLeaves.map(l => (
                <div key={l.id} className="py-0.5"><span className="font-mono">{formatDateTime(l.startDate)} – {formatDateTime(l.endDate)}</span> · {l.reason}</div>
              ))}
            </div>
            <div className="p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800 mb-1">Tài khoản liên kết</div>
              {acc ? <div>{acc.username} · {ROLE_LABEL[normalizeRole(acc.role)]} · {acc.isActive ? 'Đang hoạt động' : 'Bị khóa'}</div> : <div className="text-slate-400">Chưa có tài khoản</div>}
            </div>
          </Drawer>
        );
      })()}

      {form && <StaffFormModal staff={form.staff} onClose={() => setForm(null)} onSaved={(m) => { setForm(null); toast.show(m); }} onOpenAssignments={onOpenAssignments} />}
    </div>
  );
};

/** Biểu mẫu hồ sơ nhân sự (MH-03, Hình 3.40) */
const StaffFormModal: React.FC<{ staff?: Staff; onClose: () => void; onSaved: (m: string) => void; onOpenAssignments: () => void }> = ({ staff: s, onClose, onSaved, onOpenAssignments }) => {
  const { staff, accounts, assignments, tasks, saveStaff } = useStore();
  const isEdit = !!s;
  const codeLocked = isEdit && (assignments.some(a => a.staffId === s!.id) || accounts.some(a => a.staffId === s!.id));
  const [code, setCode] = useState(s?.code || nextCode(staff.map(x => x.code), 'NV', 3));
  const [name, setName] = useState(s?.name || '');
  const [roleTitle, setRoleTitle] = useState(s?.roleTitle || '');
  const [teamId, setTeamId] = useState(s?.teamId || '');
  const [skills, setSkills] = useState<StaffSkill[]>(s?.skills?.length ? s.skills : s?.specialty ? [{ name: SKILLS.find(k => k.toLowerCase().startsWith((s.specialty || '').toLowerCase().slice(0, 8))) || s.specialty, level: 'THANH_THAO', isPrimary: true }] : []);
  const [phone, setPhone] = useState(s?.phone || '');
  const [email, setEmail] = useState(s?.email || '');
  const [active, setActive] = useState(s ? s.isActive : true);
  const [leaveDate, setLeaveDate] = useState(s?.leaveDate || '');
  const [startDate, setStartDate] = useState(s?.startDate || '');
  const [notes, setNotes] = useState(s?.notes || '');
  const [err, setErr] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<Assignment[] | null>(null);

  const ongoing = isEdit && !active && leaveDate
    ? assignments.filter(a => a.staffId === s!.id && isRecordActive(a) && a.startDate.slice(0, 10) < leaveDate && a.endDate.slice(0, 10) >= leaveDate)
    : [];

  const submit = () => {
    if (!active && leaveDate && startDate && leaveDate < startDate) return setErr('Ngày ngừng làm việc không được trước ngày bắt đầu làm việc.');
    const title = ROLE_TITLES.find(r => r[0] === roleTitle)?.[1] || '';
    const primary = skills.find(k => k.isPrimary)?.name || skills[0]?.name || '';
    const team = TEAMS.find(t => t[0] === teamId);
    const r = saveStaff({
      code: code.trim(), name: name.trim(), roleTitle, roleTitleDisplay: title,
      teamId: teamId || undefined, teamName: team?.[1], phone: phone.trim(), email: email.trim(),
      specialty: primary, skills, isActive: active, leaveDate: active ? undefined : leaveDate,
      startDate, notes: notes.trim()
    }, s?.id);
    if (!r.ok) {
      setErr(r.message);
      if (Array.isArray(r.data)) setBlocking(r.data);
      return;
    }
    onSaved(r.message);
  };

  return (
    <Modal title={isEdit ? `Sửa hồ sơ nhân sự ${s!.code}` : 'Thêm nhân sự'} onClose={onClose} size="lg"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={submit}>Lưu hồ sơ</button>
      </>}>
      <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label required>Mã nhân sự</Label>
          <input maxLength={20} value={code} disabled={codeLocked} onChange={e => setCode(e.target.value)} className={`${inputCls} font-mono`} />
          {codeLocked && <Hint>Không đổi vì đã có phân công hoặc tài khoản liên kết</Hint>}
        </div>
        <div className="col-span-2"><Label required>Họ và tên</Label><input maxLength={120} value={name} onChange={e => setName(e.target.value)} className={inputCls} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Chức danh</Label>
          <select value={roleTitle} onChange={e => setRoleTitle(e.target.value)} className={inputCls}>
            <option value="">-- Chọn chức danh --</option>
            {ROLE_TITLES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <Label>Đội/tổ</Label>
          <select value={teamId} onChange={e => setTeamId(e.target.value)} className={inputCls}>
            <option value="">-- Không thuộc đội/tổ --</option>
            {TEAMS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div>
        <Label>Chuyên môn</Label>
        <div className="space-y-1.5">
          {skills.map((k, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <select value={k.name} onChange={e => setSkills(skills.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={inputCls}>
                {[k.name, ...SKILLS.filter(x => x !== k.name)].map(x => <option key={x} value={x}>{x}</option>)}
              </select>
              <select value={k.level} onChange={e => setSkills(skills.map((x, j) => j === i ? { ...x, level: e.target.value as StaffSkill['level'] } : x))} className={`${inputCls} w-36`}>
                {Object.entries(LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button type="button" title="Chuyên môn chính" onClick={() => setSkills(skills.map((x, j) => ({ ...x, isPrimary: j === i })))} className={`p-2 rounded-lg border cursor-pointer ${k.isPrimary ? 'bg-amber-100 border-amber-300 text-amber-600' : 'border-slate-300 text-slate-400'}`}><Star className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => setSkills(skills.filter((_, j) => j !== i))} className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setSkills([...skills, { name: SKILLS.find(x => !skills.some(k => k.name === x)) || SKILLS[0], level: 'THANH_THAO', isPrimary: skills.length === 0 }])} className="text-[11px] text-blue-700 font-semibold hover:underline cursor-pointer">+ Thêm chuyên môn</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Số điện thoại</Label><input maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} /><Hint>Nên nhập vì Đội trưởng dùng để liên hệ phối hợp</Hint></div>
        <div><Label>Email</Label><input maxLength={120} value={email} onChange={e => setEmail(e.target.value)} className={inputCls} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label required>Tình trạng làm việc</Label>
          <select value={active ? 'active' : 'inactive'} onChange={e => setActive(e.target.value === 'active')} className={inputCls}>
            <option value="active">Đang làm việc</option>
            <option value="inactive">Ngừng làm việc</option>
          </select>
        </div>
        <div><Label>Ngày bắt đầu làm việc</Label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={`${inputCls} font-mono`} /></div>
        {!active && <div><Label required>Ngày ngừng làm việc</Label><input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} className={`${inputCls} font-mono`} /></div>}
      </div>
      <div><Label>Ghi chú</Label><textarea rows={2} maxLength={255} value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} /></div>
      {ongoing.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
          <div className="font-bold">Phân công đang diễn ra tại ngày ngừng (cần rà soát):</div>
          {ongoing.map(a => <div key={a.id}>{tasks.find(t => t.id === a.taskId)?.code} · {a.projectCode} · {formatDateTime(a.startDate)} – {formatDateTime(a.endDate)}</div>)}
        </div>
      )}
      <ErrorBox message={err} />
      {blocking && blocking.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 space-y-0.5">
          {blocking.map(a => <div key={a.id}>{tasks.find(t => t.id === a.taskId)?.code} · {a.projectCode} · {formatDateTime(a.startDate)} – {formatDateTime(a.endDate)}</div>)}
          <button type="button" onClick={() => { onClose(); onOpenAssignments(); }} className="text-blue-700 font-semibold hover:underline cursor-pointer">Xử lý phân công</button>
        </div>
      )}
    </Modal>
  );
};
