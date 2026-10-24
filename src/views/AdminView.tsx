import React, { useEffect, useMemo, useState } from 'react';
import { UserAccount, UserRole, SystemConfig, AuditLog } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { dbService } from '../services/db.ts';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';
import { ShieldCheck, KeyRound, Lock, Unlock, UserPlus, Table, FolderKanban, Settings, History, ChevronDown, ChevronUp, AlertTriangle, Copy, Check, Pencil, Search } from 'lucide-react';
import { useToast, Modal, Drawer, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary, ConfirmDialog, Pagination, StatusBadge } from '../components/ui.tsx';
import { ROLE_LABEL, normalizeRole, formatDateTime, toDbDateTime } from '../utils/domain.ts';
import { PERMISSION_MATRIX, ROLE_SCOPE, ROLE_DESCRIPTION, AUDIT_ACTION_LABEL, RoleKey, PermLabel } from '../utils/permissions.ts';
import { FILE_TYPE_LABEL } from '../components/DocDialogs.tsx';
import { ChangePasswordModal } from '../components/ChangePasswordModal.tsx';

type AdminTab = 'accounts' | 'matrix' | 'scope' | 'config' | 'audit';

const ROLES: RoleKey[] = ['QUAN_TRI', 'QUAN_LY', 'BAN_GIAM_DOC', 'DOI_TRUONG'];

const genPassword = () => {
  const up = 'ABCDEFGHJKMNPQRSTUVWXYZ', low = 'abcdefghjkmnpqrstuvwxyz', dig = '23456789';
  const pick = (s: string) => s.charAt(Math.floor(Math.random() * s.length));
  let p = pick(up) + pick(low) + pick(dig);
  for (let i = 0; i < 7; i++) p += pick(up + low + dig);
  return p.split('').sort(() => Math.random() - 0.5).join('');
};

/** Hiển thị mật khẩu tạm một lần kèm nút Sao chép */
const TempPasswordModal: React.FC<{ name: string; password: string; onClose: () => void }> = ({ name, password, onClose }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Modal title="Mật khẩu tạm" subtitle={name} onClose={onClose} size="sm" footer={<button type="button" className={btnPrimary} onClick={onClose}>Đã lưu, đóng</button>}>
      <p className="text-slate-600">Mật khẩu tạm chỉ hiển thị một lần. Hãy chuyển riêng cho người dùng và nhắc đổi mật khẩu ở lần đăng nhập sau.</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-slate-100 rounded-lg font-mono text-sm font-bold text-slate-900">{password}</code>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(password); setCopied(true); }} className="px-3 py-2 rounded-lg border border-slate-300 font-semibold flex items-center gap-1 cursor-pointer">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} Sao chép
        </button>
      </div>
    </Modal>
  );
};

/** Biểu mẫu Cấp tài khoản mới / Sửa tài khoản (MH-04, Hình 3.9) */
const AccountFormModal: React.FC<{ account?: UserAccount; onClose: () => void; onSaved: (msg: string, tempPass?: { name: string; password: string }) => void }> = ({ account, onClose, onSaved }) => {
  const { accounts, staff, projects, currentUser, createAccount, updateAccount } = useStore();
  const isEdit = !!account;
  const [username, setUsername] = useState(account?.username || '');
  const [name, setName] = useState(account?.name || '');
  const [role, setRole] = useState<UserRole | ''>(account ? normalizeRole(account.role) : '');
  const [staffId, setStaffId] = useState(account?.staffId || '');
  const [staffQuery, setStaffQuery] = useState('');
  const [projectIds, setProjectIds] = useState<string[]>(account?.assignedProjectIds || []);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [roleConfirm, setRoleConfirm] = useState(false);

  const staffOptions = staff.filter(s => s.isActive && (!accounts.some(a => a.staffId === s.id) || s.id === account?.staffId))
    .filter(s => !staffQuery || `${s.code} ${s.name}`.toLowerCase().includes(staffQuery.toLowerCase()));

  const doSave = () => {
    if (isEdit) {
      const r = updateAccount(account!.id, { name, role: role as UserRole, staffId: staffId || undefined, projectIds });
      if (!r.ok) return setErr(r.message);
      onSaved(r.message);
      return;
    }
    if (password !== confirm) return setErr('Mật khẩu xác nhận không trùng khớp.');
    const r = createAccount({ username, name, role: role as UserRole, staffId: staffId || undefined, projectIds, password });
    if (!r.ok) return setErr(r.message);
    onSaved(r.message, { name: r.data!.name, password });
  };

  const submit = () => {
    setErr(null);
    if (!role) return setErr('Vui lòng chọn vai trò.');
    if (isEdit && role !== normalizeRole(account!.role)) {
      if (account!.id === currentUser.id) return setErr('Không thể thay đổi quyền hoặc khóa tài khoản của chính bạn.');
      setRoleConfirm(true);
      return;
    }
    doSave();
  };

  return (
    <>
      <Modal title={isEdit ? 'Sửa tài khoản' : 'Cấp tài khoản mới'} onClose={onClose} size="lg"
        footer={<>
          <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
          <button type="button" className={btnPrimary} onClick={submit}>{isEdit ? 'Lưu thay đổi' : 'Lưu tài khoản'}</button>
        </>}>
        <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Tên đăng nhập</Label>
            <input value={username} disabled={isEdit} maxLength={50} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="Ví dụ: qly.hung" className={`${inputCls} font-mono`} />
            <Hint>Tối đa 50 ký tự, chữ thường không dấu{isEdit ? '; không đổi khi sửa' : ''}</Hint>
          </div>
          <div>
            <Label required>Họ tên hiển thị</Label>
            <input value={name} maxLength={120} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Nguyễn Văn Hùng" className={inputCls} />
            <Hint>Tối đa 120 ký tự</Hint>
          </div>
          <div>
            <Label required>Vai trò</Label>
            <select value={role} onChange={e => setRole(e.target.value as UserRole)} className={inputCls}>
              <option value="">-- Chọn vai trò --</option>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            {role && <Hint>{ROLE_DESCRIPTION[role as RoleKey]}</Hint>}
          </div>
          <div>
            <Label required={role === 'DOI_TRUONG'}>Nhân sự liên kết</Label>
            <div className="flex gap-1.5">
              <input value={staffQuery} onChange={e => setStaffQuery(e.target.value)} placeholder="Tìm..." className={`${inputCls} w-24`} />
              <select value={staffId} onChange={e => {
                setStaffId(e.target.value);
                const s = staff.find(x => x.id === e.target.value);
                if (s && !name.trim()) setName(s.name);
              }} className={inputCls}>
                <option value="">-- Tìm và chọn nhân sự --</option>
                {staffOptions.map(s => <option key={s.id} value={s.id}>{s.code} – {s.name}</option>)}
              </select>
            </div>
            <Hint>Bắt buộc với Đội trưởng; nên liên kết với Quản lý. Chỉ nhân sự đang làm việc, chưa có tài khoản.</Hint>
          </div>
        </div>
        {role === 'QUAN_LY' && (
          <div>
            <Label>Phạm vi dự án (chỉ với vai trò Quản lý)</Label>
            <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 grid grid-cols-2 gap-1">
              {projects.map(p => (
                <label key={p.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={projectIds.includes(p.id)} onChange={e => setProjectIds(e.target.checked ? [...projectIds, p.id] : projectIds.filter(x => x !== p.id))} />
                  <span className="font-mono">{p.code}</span>
                </label>
              ))}
            </div>
            <Hint>Có thể để trống và cấp sau ở mục Phạm vi dự án.</Hint>
          </div>
        )}
        {!isEdit && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Mật khẩu tạm</Label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} font-mono`} />
              <button type="button" onClick={() => { const p = genPassword(); setPassword(p); setConfirm(p); }} className="mt-1.5 px-2.5 py-1 rounded-lg border border-blue-300 text-blue-700 text-[11px] font-semibold hover:bg-blue-50 cursor-pointer">Tạo ngẫu nhiên</button>
              <Hint>Tối thiểu 8 ký tự gồm chữ hoa, chữ thường và chữ số</Hint>
            </div>
            <div>
              <Label required>Xác nhận mật khẩu</Label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={`${inputCls} font-mono`} />
            </div>
          </div>
        )}
        <ErrorBox message={err} />
      </Modal>
      {roleConfirm && (
        <ConfirmDialog
          title="Xác nhận đổi vai trò"
          message={`Đổi vai trò của ${account!.name} từ ${ROLE_LABEL[normalizeRole(account!.role)]} sang ${ROLE_LABEL[role as string]}? Quyền mới có hiệu lực từ yêu cầu tiếp theo của tài khoản.`}
          onClose={() => setRoleConfirm(false)}
          onConfirm={() => { setRoleConfirm(false); doSave(); }}
        />
      )}
    </>
  );
};

const ResetPasswordModal: React.FC<{ account: UserAccount; onClose: () => void; onDone: (m: string, pass: string) => void }> = ({ account, onClose, onDone }) => {
  const { resetPassword } = useStore();
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal title="Đặt lại mật khẩu" subtitle={`${account.name} (${account.username})`} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => { const r = resetPassword(account.id, pass); if (!r.ok) return setErr(r.message); onDone(r.message, pass); }}>Xác nhận</button>
      </>}>
      <div>
        <Label required>Mật khẩu tạm</Label>
        <div className="flex gap-2">
          <input value={pass} onChange={e => setPass(e.target.value)} className={`${inputCls} font-mono`} />
          <button type="button" onClick={() => setPass(genPassword())} className="px-3 rounded-lg border border-blue-300 text-blue-700 font-semibold whitespace-nowrap cursor-pointer">Tạo ngẫu nhiên</button>
        </div>
        <Hint>Sau khi xác nhận, các phiên đang đăng nhập của tài khoản bị thu hồi; người dùng được nhắc đổi mật khẩu ở lần đăng nhập sau.</Hint>
      </div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Ngăn cấp Phạm vi dự án của một tài khoản Quản lý (MH-19, Hình 3.12) */
const ScopeDrawer: React.FC<{ account: UserAccount; onClose: () => void; onSaved: (m: string) => void }> = ({ account, onClose, onSaved }) => {
  const { projects, updateAccountScope } = useStore();
  const [granted, setGranted] = useState<string[]>(account.assignedProjectIds || []);
  const [leftSel, setLeftSel] = useState<string[]>([]);
  const [rightSel, setRightSel] = useState<string[]>([]);
  const [qLeft, setQLeft] = useState('');
  const [qRight, setQRight] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const match = (q: string) => (p: { code: string; name: string }) => !q || `${p.code} ${p.name}`.toLowerCase().includes(q.toLowerCase());
  const left = projects.filter(p => !granted.includes(p.id)).filter(match(qLeft));
  const right = projects.filter(p => granted.includes(p.id)).filter(match(qRight));
  const Row = ({ p, sel, setSel, showGrant }: { p: typeof projects[number]; sel: string[]; setSel: (v: string[]) => void; showGrant?: boolean }) => (
    <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer">
      <input type="checkbox" className="mt-0.5" checked={sel.includes(p.id)} onChange={e => setSel(e.target.checked ? [...sel, p.id] : sel.filter(x => x !== p.id))} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5"><span className="font-mono font-bold text-[11px]">{p.code}</span><StatusBadge status={p.status} /></div>
        <div className="text-[11px] text-slate-700 truncate">{p.name}</div>
        {showGrant && account.scopeGrants?.[p.id] && (
          <div className="text-[10px] text-slate-500">Cấp bởi {account.scopeGrants[p.id].grantedBy} lúc {formatDateTime(account.scopeGrants[p.id].grantedAt)}</div>
        )}
      </div>
    </label>
  );
  return (
    <Drawer title={`Phạm vi dự án của ${account.name}`} subtitle={account.username} onClose={onClose} width="max-w-4xl">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
        <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-2 space-y-2">
          <div className="font-bold text-slate-700 px-1">Dự án chưa cấp ({left.length})</div>
          <input value={qLeft} onChange={e => setQLeft(e.target.value)} placeholder="Tìm theo mã hoặc tên dự án" className={inputCls} />
          <div className="space-y-1.5 max-h-96 overflow-y-auto">{left.map(p => <Row key={p.id} p={p} sel={leftSel} setSel={setLeftSel} />)}</div>
        </div>
        <div className="flex flex-col gap-2 pt-16">
          <button type="button" title="Cấp các dự án đã tick" onClick={() => { setGranted([...granted, ...leftSel]); setLeftSel([]); }} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold cursor-pointer">›</button>
          <button type="button" title="Gỡ các dự án đã tick" onClick={() => rightSel.length && setConfirmRemove(true)} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold cursor-pointer">‹</button>
          <button type="button" title="Cấp tất cả dự án đang hiển thị" onClick={() => setGranted(Array.from(new Set([...granted, ...left.map(p => p.id)])))} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold cursor-pointer">»</button>
        </div>
        <div className="border border-blue-200 rounded-xl bg-blue-50/30 p-2 space-y-2">
          <div className="font-bold text-blue-900 px-1">Dự án đã cấp ({right.length})</div>
          <input value={qRight} onChange={e => setQRight(e.target.value)} placeholder="Tìm theo mã hoặc tên dự án" className={inputCls} />
          <div className="space-y-1.5 max-h-96 overflow-y-auto">{right.map(p => <Row key={p.id} p={p} sel={rightSel} setSel={setRightSel} showGrant />)}</div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => { const r = updateAccountScope(account.id, granted); onSaved(r.message); }}>Lưu phạm vi</button>
      </div>
      {confirmRemove && (
        <Modal title="Gỡ dự án khỏi phạm vi" onClose={() => setConfirmRemove(false)} size="sm"
          footer={<>
            <button type="button" className={btnSecondary} onClick={() => setConfirmRemove(false)}>Hủy bỏ</button>
            <button type="button" className={btnPrimary} onClick={() => { setGranted(granted.filter(id => !rightSel.includes(id))); setRightSel([]); setConfirmRemove(false); }}>Xác nhận gỡ</button>
          </>}>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-900">
            Quản lý này sẽ không còn thấy dự án này và các phân công liên quan. Dữ liệu của dự án không bị thay đổi.
          </div>
        </Modal>
      )}
    </Drawer>
  );
};

/** Hiển thị JSON Trước/Sau, tô vàng trường thay đổi (MH-21 thành phần 7) */
const JsonBlock: React.FC<{ title: string; value: any; compare?: any }> = ({ title, value, compare }) => {
  if (value === null || value === undefined) return null;
  const entries = typeof value === 'object' ? Object.entries(value) : [['gia_tri', value]];
  return (
    <div className="flex-1 min-w-0">
      <div className="font-bold text-slate-600 mb-1">{title}</div>
      <pre className="p-2 bg-white rounded border border-slate-200 overflow-x-auto text-[11px] leading-relaxed">
        {'{\n'}
        {entries.map(([k, v], i) => {
          const changed = compare && typeof compare === 'object' && JSON.stringify(compare[k]) !== JSON.stringify(v);
          return <span key={k} className={changed ? 'bg-yellow-100' : ''}>{`  "${k}": ${JSON.stringify(v)}${i < entries.length - 1 ? ',' : ''}\n`}</span>;
        })}
        {'}'}
      </pre>
    </div>
  );
};

interface AdminViewProps {
  initialTab?: AdminTab;
}

export const AdminView: React.FC<AdminViewProps> = ({ initialTab = 'accounts' }) => {
  const store = useStore();
  const { accounts, staff, currentUser, config, auditLogs, setAccountLock } = store;
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  // ---------- MH-04 ----------
  const [q, setQ] = useState('');
  const [fRole, setFRole] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [formAcc, setFormAcc] = useState<{ account?: UserAccount } | null>(null);
  const [tempPass, setTempPass] = useState<{ name: string; password: string } | null>(null);
  const [resetAcc, setResetAcc] = useState<UserAccount | null>(null);
  const [ownPassword, setOwnPassword] = useState(false);
  const [lockAcc, setLockAcc] = useState<UserAccount | null>(null);

  const filteredAccounts = accounts.filter(a => {
    if (q && !`${a.name} ${a.username}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (fRole && normalizeRole(a.role) !== fRole) return false;
    if (fStatus === 'active' && !a.isActive) return false;
    if (fStatus === 'locked' && a.isActive) return false;
    return true;
  });

  // ---------- MH-05 ----------
  const [collapsed, setCollapsed] = useState<string[]>([]);

  // ---------- MH-19 ----------
  const [sq, setSq] = useState('');
  const [sStatus, setSStatus] = useState('');
  const [scopeAcc, setScopeAcc] = useState<UserAccount | null>(null);
  const managers = accounts.filter(a => normalizeRole(a.role) === 'QUAN_LY')
    .filter(a => !sq || `${a.name} ${a.username}`.toLowerCase().includes(sq.toLowerCase()))
    .filter(a => !sStatus || (sStatus === 'active' ? a.isActive : !a.isActive));

  // ---------- MH-20 ----------
  const toDisplay = (s: string) => (s ? formatDateTime(s) : '');
  const [draft, setDraft] = useState(() => ({
    queryTime: toDisplay(config.evaluationTimestamp),
    upcoming: String(config.upcomingThresholdDays),
    session: String(config.sessionTimeoutMinutes),
    maxMb: String(config.maxUploadSizeMB),
    types: config.allowedFileTypes.split(',').filter(Boolean),
    backup: String(config.backupRetentionCount ?? 7)
  }));
  const [cfgErr, setCfgErr] = useState<string | null>(null);
  const [confirmQueryChange, setConfirmQueryChange] = useState<SystemConfig | null>(null);
  const parseDisplay = (s: string) => {
    const m = s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
    if (!m) return null;
    return `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}:00`;
  };
  const buildConfig = (): SystemConfig | string => {
    let qt = '';
    if (draft.queryTime.trim()) {
      const p = parseDisplay(draft.queryTime);
      if (!p || isNaN(new Date(p.replace(' ', 'T')).getTime())) return 'Thời điểm tra cứu không hợp lệ.';
      qt = p;
    }
    const intIn = (v: string, min: number, max: number) => /^\d+$/.test(v) && +v >= min && +v <= max;
    if (!intIn(draft.upcoming, 1, 30)) return 'Giá trị phải là số nguyên từ 1 đến 30.';
    if (!intIn(draft.session, 5, 240)) return 'Giá trị phải là số nguyên từ 5 đến 240.';
    if (!intIn(draft.maxMb, 1, 500)) return 'Giá trị phải là số nguyên từ 1 đến 500.';
    if (draft.types.length === 0) return 'Vui lòng chọn ít nhất một loại tệp.';
    if (!intIn(draft.backup, 1, 60)) return 'Giá trị phải là số nguyên từ 1 đến 60.';
    return {
      ...config,
      evaluationTimestamp: qt,
      upcomingThresholdDays: +draft.upcoming,
      sessionTimeoutMinutes: +draft.session,
      maxUploadSizeMB: +draft.maxMb,
      allowedFileTypes: draft.types.join(','),
      backupRetentionCount: +draft.backup
    };
  };
  const built = buildConfig();
  const dirty = typeof built !== 'string' && (
    built.evaluationTimestamp !== config.evaluationTimestamp || built.upcomingThresholdDays !== config.upcomingThresholdDays ||
    built.sessionTimeoutMinutes !== config.sessionTimeoutMinutes || built.maxUploadSizeMB !== config.maxUploadSizeMB ||
    built.allowedFileTypes !== config.allowedFileTypes || built.backupRetentionCount !== (config.backupRetentionCount ?? 7));
  const saveConfig = (c: SystemConfig) => {
    const r = store.saveConfig(c);
    if (!r.ok) return setCfgErr(r.message);
    setCfgErr(null);
    toast.show(r.message);
  };

  // ---------- MH-21 ----------
  const monthStart = DEMO_QUERY_TIME.slice(0, 8) + '01';
  const [aFrom, setAFrom] = useState(monthStart);
  const [aTo, setATo] = useState(new Date().toISOString().slice(0, 10) > DEMO_QUERY_TIME.slice(0, 10) ? new Date().toISOString().slice(0, 10) : DEMO_QUERY_TIME.slice(0, 10));
  const [aUser, setAUser] = useState('');
  const [aAction, setAAction] = useState('');
  const [aObject, setAObject] = useState('');
  const [aPage, setAPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const objectTypes = useMemo(() => Array.from(new Set(['Dự án', 'Công việc', 'Phân công', 'Lịch nghỉ/bận', 'Phiên bản hồ sơ', 'Tài khoản', 'Nhân sự đội ngoài theo ngày', ...auditLogs.map(l => l.objectType)])), [auditLogs]);
  const auditErr = aFrom && aTo && aTo < aFrom ? 'Ngày kết thúc không được trước ngày bắt đầu.' : null;
  const auditRows = auditErr ? [] : auditLogs.filter(l => {
    const d = l.time.slice(0, 10);
    if (aFrom && d < aFrom) return false;
    if (aTo && d > aTo) return false;
    if (aUser && l.user !== aUser) return false;
    if (aAction && l.action !== aAction) return false;
    if (aObject && l.objectType !== aObject) return false;
    return true;
  }).sort((a, b) => b.time.localeCompare(a.time));
  const AUDIT_PAGE = 10;
  const pageRows = auditRows.slice((aPage - 1) * AUDIT_PAGE, aPage * AUDIT_PAGE);

  const PAGE_TITLE: Record<AdminTab, string> = {
    accounts: 'Quản lý tài khoản', matrix: 'Quản lý tài khoản', scope: 'Phạm vi dự án', config: 'Cấu hình hệ thống', audit: 'Nhật ký thao tác'
  };
  const isAccountsPage = activeTab === 'accounts' || activeTab === 'matrix';

  return (
    <div className="space-y-6">
      {toast.node}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-700">QUẢN TRỊ HỆ THỐNG</span>
          <h2 className="text-lg font-bold text-[#0D1A36] mt-1">{PAGE_TITLE[activeTab]}</h2>
        </div>
        {activeTab === 'accounts' && (
          <button type="button" onClick={() => setFormAcc({})}
            className="flex items-center gap-2 px-4 py-2 bg-[#152A55] text-white rounded-xl text-xs font-semibold hover:bg-[#1E3A75] shadow-xs cursor-pointer self-start sm:self-auto">
            <UserPlus className="w-4 h-4" /><span>+ Cấp tài khoản mới</span>
          </button>
        )}
        {activeTab === 'config' && (
          <button type="button" disabled={!dirty}
            onClick={() => {
              if (typeof built === 'string') return setCfgErr(built);
              if (built.evaluationTimestamp !== config.evaluationTimestamp) return setConfirmQueryChange(built);
              saveConfig(built);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto">
            Lưu thay đổi
          </button>
        )}
      </div>

      {/* MH-04 có hai tab: Tài khoản (n) và Vai trò và quyền */}
      {isAccountsPage && (
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
          <button onClick={() => setActiveTab('accounts')} className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'accounts' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            <ShieldCheck className="w-4 h-4" /><span>Tài khoản ({filteredAccounts.length})</span>
          </button>
          <button onClick={() => setActiveTab('matrix')} className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'matrix' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            <Table className="w-4 h-4" /><span>Vai trò và quyền</span>
          </button>
        </div>
      )}

      {/* ===== MH-04: Tab Tài khoản ===== */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm họ tên hoặc tên đăng nhập" className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg w-64" />
            </div>
            <select value={fRole} onChange={e => setFRole(e.target.value)} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg">
              <option value="">Mọi vai trò</option>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg">
              <option value="">Mọi trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                <tr><th className="p-3">Họ tên hiển thị / tên đăng nhập</th><th className="p-3">Vai trò</th><th className="p-3">Nhân sự liên kết</th><th className="p-3">Trạng thái</th><th className="p-3">Đăng nhập gần nhất</th><th className="p-3 text-right">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map(acc => {
                  const isSelf = acc.id === currentUser.id;
                  const linked = staff.find(s => s.id === acc.staffId);
                  return (
                    <tr key={acc.id} className={!acc.isActive ? 'bg-red-50/30' : 'hover:bg-slate-50/70'}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#0D1A36]">{acc.name}</span>
                          {isSelf && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">Bạn đang đăng nhập</span>}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">{acc.username}</div>
                      </td>
                      <td className="p-3"><span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{ROLE_LABEL[normalizeRole(acc.role)]}</span></td>
                      <td className="p-3">{linked ? `${linked.code} – ${linked.name}` : <span className="text-slate-400">Chưa liên kết</span>}</td>
                      <td className="p-3">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${acc.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{acc.isActive ? 'Đang hoạt động' : 'Bị khóa'}</span>
                        {!acc.isActive && acc.lockReason && <div className="text-[10px] text-red-700 mt-1">Lý do: {acc.lockReason}</div>}
                      </td>
                      <td className="p-3 font-mono text-slate-600">{acc.lastLogin ? formatDateTime(acc.lastLogin) : 'Chưa đăng nhập'}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" title="Sửa" onClick={() => setFormAcc({ account: acc })} className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"><Pencil className="w-4 h-4" /></button>
                          <button type="button" title={isSelf ? 'Đổi mật khẩu của bạn' : 'Đặt lại mật khẩu'} onClick={() => isSelf ? setOwnPassword(true) : setResetAcc(acc)} className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"><KeyRound className="w-4 h-4" /></button>
                          <button type="button" disabled={isSelf} title={isSelf ? 'Không thể khóa tài khoản của chính bạn' : acc.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'} onClick={() => setLockAcc(acc)}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 cursor-pointer ${acc.isActive ? 'text-slate-500 hover:text-red-600 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50'}`}>
                            {acc.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MH-05: Vai trò và quyền (chỉ xem) ===== */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-64">Chức năng</th>
                  {ROLES.map(r => (
                    <th key={r} className="p-3">
                      <div className="font-bold text-[#0D1A36]">{ROLE_SCOPE[r].title}</div>
                      <div className="text-[10px] font-normal text-slate-500">Phạm vi dữ liệu: {ROLE_SCOPE[r].scope}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX.map(g => {
                  const isCollapsed = collapsed.includes(g.group);
                  return (
                    <React.Fragment key={g.group}>
                      <tr className="bg-slate-100/70 cursor-pointer" onClick={() => setCollapsed(isCollapsed ? collapsed.filter(x => x !== g.group) : [...collapsed, g.group])}>
                        <td colSpan={5} className="p-2.5 font-bold text-slate-800">
                          <span className="inline-flex items-center gap-1">{isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}{g.group}</span>
                        </td>
                      </tr>
                      {!isCollapsed && g.rows.map(row => (
                        <tr key={row.feature} className="border-t border-slate-100">
                          <td className="p-3 font-semibold text-slate-900">{row.feature}</td>
                          {ROLES.map(r => (
                            <td key={r} className="p-3" title={row.perms[r].note}>
                              {row.perms[r].labels.length === 0 ? <span className="text-slate-400">—</span> : (
                                <div className="flex flex-wrap gap-1">
                                  {row.perms[r].labels.map((l: PermLabel) => <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">{l}</span>)}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <strong>Chú giải:</strong> Xem – xem dữ liệu; Tạo – thêm mới; Sửa – điều chỉnh; Duyệt – xác nhận, phê duyệt hoặc chọn bản triển khai; Hủy – hủy bản ghi (không xóa);
            Khóa – khóa/mở khóa tài khoản; Xem nhật ký – tra cứu nhật ký thao tác; "—" – không có quyền. Di chuột vào ô để xem phạm vi áp dụng.
            Ma trận ở chế độ chỉ xem; muốn đổi quyền của một người dùng, Quản trị viên đổi vai trò ở tab Tài khoản.
          </div>
        </div>
      )}

      {/* ===== MH-19: Phạm vi dự án ===== */}
      {activeTab === 'scope' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap gap-2 text-xs">
            <input value={sq} onChange={e => setSq(e.target.value)} placeholder="Tìm tên đăng nhập hoặc họ tên" className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg w-64" />
            <select value={sStatus} onChange={e => setSStatus(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
              <option value="">Mọi trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
              <tr><th className="py-2 pr-3">Tài khoản Quản lý</th><th className="py-2 pr-3">Nhân sự liên kết</th><th className="py-2 pr-3">Trạng thái</th><th className="py-2 pr-3">Phạm vi hiện tại</th><th className="py-2 text-right">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {managers.map(m => {
                const linked = staff.find(s => s.id === m.staffId);
                return (
                  <tr key={m.id}>
                    <td className="py-2.5 pr-3"><div className="font-bold">{m.name}</div><div className="font-mono text-[11px] text-slate-500">{m.username}</div></td>
                    <td className="py-2.5 pr-3">{linked ? `${linked.code} – ${linked.name}` : 'Chưa liên kết'}</td>
                    <td className="py-2.5 pr-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${m.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{m.isActive ? 'Đang hoạt động' : 'Bị khóa'}</span></td>
                    <td className="py-2.5 pr-3 font-semibold">{(m.assignedProjectIds || []).length} dự án</td>
                    <td className="py-2.5 text-right">
                      <button type="button" disabled={!m.isActive} title={!m.isActive ? 'Chỉ cấp phạm vi cho tài khoản Quản lý đang hoạt động.' : undefined} onClick={() => setScopeAcc(m)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 disabled:opacity-40 cursor-pointer">
                        <FolderKanban className="w-3.5 h-3.5 inline mr-1" />Phạm vi
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-[11px] text-blue-900">
            Chỉ tài khoản vai trò Quản lý có phạm vi dự án; Ban giám đốc xem toàn doanh nghiệp, Đội trưởng theo công việc được giao, Quản trị hệ thống không dùng bảng này.
          </div>
        </div>
      )}

      {/* ===== MH-20: Cấu hình hệ thống ===== */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span><strong>Lưu ý:</strong> thay đổi "Thời điểm tra cứu" sẽ làm đổi kết quả cảnh báo quá hạn và sắp đến hạn của toàn hệ thống.</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
              <tr><th className="py-2 pr-3 w-1/3">Tham số</th><th className="py-2 pr-3">Giá trị</th><th className="py-2 w-40">Cập nhật lần cuối</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {([
                ['Thời điểm tra cứu', 'THOI_DIEM_TRA_CUU', <input value={draft.queryTime} onChange={e => setDraft({ ...draft, queryTime: e.target.value })} placeholder="dd/mm/yyyy HH:mm" className={`${inputCls} font-mono`} />, 'Ngày giờ dd/mm/yyyy HH:mm hoặc để trống (dùng giờ máy chủ)'],
                ['Số ngày tính là sắp đến hạn', 'SO_NGAY_SAP_DEN_HAN', <input type="number" value={draft.upcoming} onChange={e => setDraft({ ...draft, upcoming: e.target.value })} className={`${inputCls} font-mono`} />, 'Số nguyên 1 đến 30'],
                ['Thời gian hết phiên (phút)', 'THOI_GIAN_HET_PHIEN_PHUT', <input type="number" value={draft.session} onChange={e => setDraft({ ...draft, session: e.target.value })} className={`${inputCls} font-mono`} />, 'Số nguyên 5 đến 240'],
                ['Dung lượng tối đa mỗi tệp (MB)', 'DUNG_LUONG_TAI_LEN_TOI_DA_MB', <input type="number" value={draft.maxMb} onChange={e => setDraft({ ...draft, maxMb: e.target.value })} className={`${inputCls} font-mono`} />, 'Số nguyên 1 đến 500'],
                ['Loại tệp cho phép tải lên', 'LOAI_TEP_CHO_PHEP', (
                  <div className="flex flex-wrap gap-3 p-2 border border-slate-300 rounded-lg bg-slate-50">
                    {Object.entries(FILE_TYPE_LABEL).map(([k, v]) => (
                      <label key={k} className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={draft.types.includes(k)} onChange={e => setDraft({ ...draft, types: e.target.checked ? [...draft.types, k] : draft.types.filter(x => x !== k) })} /> {v}
                      </label>
                    ))}
                  </div>
                ), 'Chọn ít nhất một loại'],
                ['Số bản sao lưu hằng ngày được giữ', 'SO_NGAY_GIU_SAO_LUU', <input type="number" value={draft.backup} onChange={e => setDraft({ ...draft, backup: e.target.value })} className={`${inputCls} font-mono`} />, 'Số nguyên 1 đến 60']
              ] as [string, string, React.ReactNode, string][]).map(([label, key, input, hint]) => (
                <tr key={key}>
                  <td className="py-3 pr-3 align-top"><div className="font-bold text-slate-800">{label}</div><div className="font-mono text-[10px] text-slate-500">{key}</div></td>
                  <td className="py-3 pr-3">{input}<Hint>{hint}</Hint></td>
                  <td className="py-3 font-mono text-slate-600 align-top">{formatDateTime(config.updatedAt?.[key]) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ErrorBox message={typeof built === 'string' ? built : cfgErr} />
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-[11px] text-blue-900">
            Mỗi lần lưu, hệ thống ghi nhật ký thao tác loại "Điều chỉnh" kèm giá trị trước và sau. Cấu hình chỉ có sáu tham số này.
          </div>
        </div>
      )}

      {/* ===== MH-21: Nhật ký thao tác (chỉ đọc) ===== */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 text-xs items-center">
            <input type="date" value={aFrom} onChange={e => { setAFrom(e.target.value); setAPage(1); }} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono" />
            <span>–</span>
            <input type="date" value={aTo} onChange={e => { setATo(e.target.value); setAPage(1); }} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono" />
            <select value={aUser} onChange={e => { setAUser(e.target.value); setAPage(1); }} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg">
              <option value="">Mọi người thực hiện</option>
              {accounts.map(a => <option key={a.id} value={a.username}>{a.username}</option>)}
              <option value="Hệ thống">Hệ thống</option>
            </select>
            <select value={aAction} onChange={e => { setAAction(e.target.value); setAPage(1); }} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg">
              <option value="">Mọi loại thao tác</option>
              {Object.entries(AUDIT_ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={aObject} onChange={e => { setAObject(e.target.value); setAPage(1); }} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg">
              <option value="">Mọi đối tượng</option>
              {objectTypes.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {auditErr && <div className="p-3"><ErrorBox message={auditErr} /></div>}
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200 bg-white">
              <tr><th className="p-3">Thời điểm</th><th className="p-3">Người thực hiện</th><th className="p-3">Thao tác</th><th className="p-3">Đối tượng</th><th className="p-3">Lý do</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 && !auditErr && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Không có thao tác nào theo bộ lọc đã chọn.</td></tr>}
              {pageRows.map((log: AuditLog) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                    <td className="p-3 font-mono text-slate-600">{formatDateTime(log.time)}</td>
                    <td className="p-3 font-semibold">{log.user || 'Hệ thống'}</td>
                    <td className="p-3">{AUDIT_ACTION_LABEL[log.action] || log.action}</td>
                    <td className="p-3">{log.objectType} #{log.objectId}</td>
                    <td className="p-3 text-slate-600">{log.reason || '—'}</td>
                  </tr>
                  {expanded === log.id && (
                    <tr>
                      <td colSpan={5} className="p-3 bg-slate-50">
                        <div className="flex gap-3 flex-col sm:flex-row">
                          {log.oldVal !== null && log.oldVal !== undefined && <JsonBlock title="Trước" value={log.oldVal} />}
                          <JsonBlock title="Sau" value={log.newVal} compare={log.oldVal} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="px-5 pb-3"><Pagination page={aPage} pageSize={AUDIT_PAGE} total={auditRows.length} unit="bản ghi" onChange={setAPage} /></div>
        </div>
      )}

      {/* Hộp thoại */}
      {formAcc && (
        <AccountFormModal account={formAcc.account} onClose={() => setFormAcc(null)}
          onSaved={(m, tp) => { setFormAcc(null); toast.show(m); if (tp) setTempPass(tp); }} />
      )}
      {tempPass && <TempPasswordModal name={tempPass.name} password={tempPass.password} onClose={() => setTempPass(null)} />}
      {resetAcc && <ResetPasswordModal account={resetAcc} onClose={() => setResetAcc(null)} onDone={(m, p) => { const n = resetAcc.name; setResetAcc(null); toast.show(m); setTempPass({ name: n, password: p }); }} />}
      {ownPassword && <ChangePasswordModal onClose={() => setOwnPassword(false)} onDone={(m) => { setOwnPassword(false); toast.show(m); }} />}
      {lockAcc && (
        <ConfirmDialog
          title={lockAcc.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          danger={lockAcc.isActive}
          requireReason={lockAcc.isActive}
          reasonLabel="Lý do khóa tài khoản"
          message={lockAcc.isActive
            ? <>Khóa tài khoản <strong>{lockAcc.name}</strong> ({lockAcc.username})? Mọi phiên đăng nhập bị thu hồi; liên kết nhân sự và dữ liệu lịch sử được giữ nguyên.</>
            : <>Mở khóa tài khoản <strong>{lockAcc.name}</strong> ({lockAcc.username})?</>}
          confirmLabel={lockAcc.isActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
          onClose={() => setLockAcc(null)}
          onConfirm={(reason) => { const r = setAccountLock(lockAcc.id, lockAcc.isActive, reason); if (!r.ok) return r.message; setLockAcc(null); toast.show(r.message); }}
        />
      )}
      {scopeAcc && <ScopeDrawer account={scopeAcc} onClose={() => setScopeAcc(null)} onSaved={(m) => { setScopeAcc(null); toast.show(m); }} />}
      {confirmQueryChange && (
        <ConfirmDialog title="Xác nhận đổi thời điểm tra cứu"
          message="Thay đổi Thời điểm tra cứu sẽ làm đổi kết quả cảnh báo quá hạn và sắp đến hạn của toàn hệ thống. Tiếp tục lưu?"
          onClose={() => setConfirmQueryChange(null)}
          onConfirm={() => { saveConfig(confirmQueryChange); setConfirmQueryChange(null); }} />
      )}
    </div>
  );
};
