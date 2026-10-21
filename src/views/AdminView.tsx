import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole, Staff, Project } from '../types/index.ts';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Unlock, 
  Plus, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  Table,
  FolderKanban,
  Settings,
  History,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';

interface AdminViewProps {
  accounts: UserAccount[];
  staff: Staff[];
  projects: Project[];
  currentUser: UserAccount;
  initialTab?: 'accounts' | 'scope' | 'config' | 'audit' | 'matrix';
  onUpdateRole: (userId: string, newRole: UserRole) => void;
  onToggleAccountLock: (userId: string, reason?: string) => void;
  onResetPassword: (userId: string) => void;
  onCreateAccount: (account: Omit<UserAccount, 'id'>) => void;
  onUpdateAccountScope: (userId: string, projectIds: string[]) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  accounts,
  staff,
  projects,
  currentUser,
  initialTab = 'accounts',
  onUpdateRole,
  onToggleAccountLock,
  onResetPassword,
  onCreateAccount,
  onUpdateAccountScope
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'scope' | 'config' | 'audit' | 'matrix'>(initialTab);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // New account form modal (AD-02)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('QUAN_LY');
  const [newStaffId, setNewStaffId] = useState('');

  // Lock account modal (AD-03)
  const [lockModalAcc, setLockModalAcc] = useState<UserAccount | null>(null);
  const [lockReason, setLockReason] = useState('Nghỉ việc; khóa theo quy trình bàn giao');

  // Scope state (AD-04)
  const managerAccounts = accounts.filter(a => a.role === 'QUAN_LY' || a.role === 'manager');
  const [selectedManagerId, setSelectedManagerId] = useState<string>(managerAccounts[0]?.id || '2');

  // System config state (AD-05)
  const [configQueryTime, setConfigQueryTime] = useState(DEMO_QUERY_TIME);
  const [configUpcomingDays, setConfigUpcomingDays] = useState(7);
  const [configSessionTimeout, setConfigSessionTimeout] = useState(30);
  const [configMaxUploadMB, setConfigMaxUploadMB] = useState(50);
  const [configAllowedFiles, setConfigAllowedFiles] = useState(['Bản vẽ CAD', 'PDF', 'Ảnh hiện trường', 'Bảng tính', 'Bộ hồ sơ nén']);
  const [configBackupDays, setConfigBackupDays] = useState(7);

  // Audit log mock state (AD-06)
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      time: '2026-10-11 15:30:00',
      user: 'qly.bao',
      action: 'TAO_MOI',
      actionLabel: 'Tạo mới',
      target: 'Phân công #92',
      reason: 'Phân công thi công đợt 2',
      oldVal: null,
      newVal: { staff: 'Cao Văn Bình', task: 'CV42', dates: '21/10/2026 - 24/10/2026' }
    },
    {
      id: 2,
      time: '2026-10-10 17:00:00',
      user: 'dt.tuan',
      action: 'TAI_LEN',
      actionLabel: 'Tải tệp lên',
      target: 'Tệp minh chứng #37',
      reason: 'Cập nhật tiến độ lắp camera phòng họp',
      oldVal: null,
      newVal: { file: 'cv40-034.jpg', size: '2.4 MB', sha256: '0ba38dae' }
    },
    {
      id: 3,
      time: '2026-10-09 16:00:00',
      user: 'qly.nhung',
      action: 'DOI_TRANG_THAI',
      actionLabel: 'Đổi trạng thái',
      target: 'Dự án NMH-2026-006',
      reason: 'Khách hàng tạm dừng mặt bằng thi công',
      oldVal: { status: 'DANG_THUC_HIEN' },
      newVal: { status: 'TAM_DUNG' }
    },
    {
      id: 4,
      time: '2026-08-28 09:00:00',
      user: 'admin',
      action: 'KHOA',
      actionLabel: 'Khóa tài khoản',
      target: 'Tài khoản qly.trung',
      reason: 'Nghỉ việc; khóa theo quy trình bàn giao',
      oldVal: { status: 'HOAT_DONG' },
      newVal: { status: 'BI_KHOA', lockReason: 'Nghỉ việc; khóa theo quy trình bàn giao' }
    }
  ]);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Selected manager for AD-04
  const currentManager = managerAccounts.find(m => m.id === selectedManagerId) || managerAccounts[0];
  const assignedIds = currentManager?.assignedProjectIds || [];
  const assignedProjects = projects.filter(p => assignedIds.includes(p.id));
  const unassignedProjects = projects.filter(p => !assignedIds.includes(p.id));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGrantProject = (projectId: string) => {
    if (!currentManager) return;
    const nextIds = [...assignedIds, projectId];
    onUpdateAccountScope(currentManager.id, nextIds);
    showToast(`Đã cấp dự án cho ${currentManager.name}`);
  };

  const handleRevokeProject = (projectId: string) => {
    if (!currentManager) return;
    const nextIds = assignedIds.filter(id => id !== projectId);
    onUpdateAccountScope(currentManager.id, nextIds);
    showToast(`Đã thu hồi dự án khỏi ${currentManager.name}`);
  };

  const handleGrantAll = () => {
    if (!currentManager) return;
    const allIds = projects.map(p => p.id);
    onUpdateAccountScope(currentManager.id, allIds);
    showToast(`Đã cấp toàn bộ ${projects.length} dự án cho ${currentManager.name}`);
  };

  const handleConfirmLock = () => {
    if (!lockModalAcc) return;
    if (lockModalAcc.isActive && lockReason.trim().length < 5) {
      showToast('Lý do khóa phải có ít nhất 5 ký tự!');
      return;
    }
    onToggleAccountLock(lockModalAcc.id, lockReason);
    setLockModalAcc(null);
    showToast(lockModalAcc.isActive ? `Đã khóa tài khoản ${lockModalAcc.name}` : `Đã mở khóa tài khoản ${lockModalAcc.name}`);
  };

  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim()) return;

    onCreateAccount({
      username: newUsername.trim(),
      name: newName.trim(),
      email: newEmail.trim() || `${newUsername.trim()}@nmh.vn`,
      role: newRole,
      staffId: newStaffId || undefined,
      isActive: true,
      assignedProjectIds: []
    });

    setIsModalOpen(false);
    setNewUsername('');
    setNewName('');
    setNewEmail('');
    showToast('Tạo tài khoản mới thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-16 right-6 z-50 p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center gap-2 shadow-2xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-700">
              PHÂN HỆ QUẢN TRỊ (AD)
            </span>
            <span className="text-xs text-slate-500 font-mono">AD-01 đến AD-06</span>
          </div>
          <h2 className="text-lg font-bold text-[#0D1A36] mt-1">
            Quản Trị Hệ Thống, Phân Quyền &amp; Cấu Hình
          </h2>
          <p className="text-xs text-slate-500">
            Giữ cửa hệ thống: Tạo/khóa tài khoản, phân bổ phạm vi dự án, giám sát tham số &amp; nhật ký thao tác
          </p>
        </div>

        {activeTab === 'accounts' && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#152A55] text-white rounded-xl text-xs font-semibold hover:bg-[#1E3A75] shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo tài khoản mới (AD-02)</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Tài khoản hệ thống (AD-01)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
            {accounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('scope')}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'scope'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Phạm vi dự án (AD-04)</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'config'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cấu hình tham số (AD-05)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật ký thao tác (AD-06)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Ma trận phân quyền vai trò</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACCOUNTS LIST (AD-01, AD-03) */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Danh sách tài khoản đăng nhập CSDL (9 tài khoản demo)</span>
            <span className="text-slate-500 text-[11px]">Mật khẩu chung kiểm thử: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">Nmh@2026</code></span>
          </div>

          <div className="divide-y divide-slate-100">
            {accounts.map((acc) => {
              const isSelf = acc.id === currentUser.id;
              const isManager = acc.role === 'QUAN_LY' || acc.role === 'manager';
              const isLocked = !acc.isActive;

              return (
                <div 
                  key={acc.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isLocked ? 'bg-red-50/30' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isLocked ? 'bg-slate-300 text-slate-600' : 'bg-[#152A55] text-amber-300'
                    }`}>
                      {acc.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isLocked ? 'line-through text-slate-400' : 'text-[#0D1A36]'}`}>
                          {acc.name}
                        </span>
                        <span className="font-mono text-xs text-slate-500 font-medium">@{acc.username}</span>
                        {isSelf && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                            Bạn đang dùng
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{acc.email}</span>
                        {isManager && (
                          <span className="text-[11px] text-blue-700 font-medium bg-blue-50/80 px-2 py-0.5 rounded">
                            Phạm vi: {acc.assignedProjectIds?.length || 0} dự án
                          </span>
                        )}
                        {isLocked && acc.lockReason && (
                          <span className="text-[11px] text-red-700 font-medium bg-red-100 px-2 py-0.5 rounded">
                            Lý do: {acc.lockReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Role selector */}
                    <div className="text-xs">
                      <select
                        value={acc.role}
                        disabled={isSelf || isLocked}
                        onChange={(e) => onUpdateRole(acc.id, e.target.value as UserRole)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold disabled:opacity-60 text-xs"
                      >
                        <option value="QUAN_LY">Quản lý dự án (QUAN_LY)</option>
                        <option value="DOI_TRUONG">Đội trưởng thi công (DOI_TRUONG)</option>
                        <option value="BAN_GIAM_DOC">Ban Giám Đốc (BAN_GIAM_DOC)</option>
                        <option value="QUAN_TRI">Quản trị hệ thống (QUAN_TRI)</option>
                      </select>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      acc.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {acc.isActive ? 'Đang hoạt động' : 'Bị khóa'}
                    </span>

                    {/* Actions (AD-03) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onResetPassword(acc.id);
                          showToast(`Đã cấp lại mật khẩu tạm Nmh@2026 cho ${acc.name}`);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs"
                        title="Đặt lại mật khẩu tạm"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLockModalAcc(acc);
                          setLockReason(acc.isActive ? 'Nghỉ việc; khóa theo quy trình bàn giao' : '');
                        }}
                        disabled={isSelf}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          acc.isActive 
                            ? 'text-slate-500 hover:text-red-600 hover:bg-red-50' 
                            : 'text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50'
                        } disabled:opacity-30`}
                        title={acc.isActive ? 'Khóa tài khoản (AD-03)' : 'Mở khóa tài khoản'}
                      >
                        {acc.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROJECT SCOPE MANAGEMENT (AD-04) */}
      {/* ========================================================================= */}
      {activeTab === 'scope' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-[#0D1A36]">Phạm Vi Dự Án Của Tài Khoản Quản Lý (AD-04)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉ tài khoản vai trò Quản lý mới cần cấp phạm vi. Ban Giám Đốc thấy tất cả; Đội trưởng thấy theo phân công.
              </p>
            </div>

            {/* Select Manager Account */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Chọn Quản lý:</span>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              >
                {managerAccounts.map(m => (
                  <option key={m.id} value={m.id}>{m.name} (@{m.username})</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2-Column Dual Listbox (AD-04) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Dự án chưa cấp */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 flex flex-col">
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700">Dự án chưa cấp ({unassignedProjects.length})</span>
                {unassignedProjects.length > 0 && (
                  <button
                    type="button"
                    onClick={handleGrantAll}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    Cấp tất cả
                  </button>
                )}
              </div>

              <div className="p-3 space-y-2 flex-1 max-h-96 overflow-y-auto">
                {unassignedProjects.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Đã cấp toàn bộ dự án cho Quản lý này
                  </div>
                ) : (
                  unassignedProjects.map(p => (
                    <div 
                      key={p.id}
                      className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs hover:border-blue-300 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-bold text-slate-500">{p.code}</div>
                        <div className="font-bold text-xs text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{p.status} · {p.place}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGrantProject(p.id)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                        title="Cấp dự án này"
                      >
                        <span>Cấp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Dự án đã cấp */}
            <div className="border border-blue-200 rounded-xl overflow-hidden bg-blue-50/30 flex flex-col">
              <div className="px-4 py-2.5 bg-blue-100 border-b border-blue-200 flex items-center justify-between">
                <span className="font-bold text-xs text-blue-900">
                  Dự án đã cấp cho {currentManager?.name} ({assignedProjects.length})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 font-bold">
                  Phạm vi P
                </span>
              </div>

              <div className="p-3 space-y-2 flex-1 max-h-96 overflow-y-auto">
                {assignedProjects.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Chưa cấp dự án nào cho Quản lý này
                  </div>
                ) : (
                  assignedProjects.map(p => (
                    <div 
                      key={p.id}
                      className="p-3 bg-white rounded-lg border border-blue-200 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-bold text-blue-700">{p.code}</div>
                        <div className="font-bold text-xs text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Cấp bởi Quản trị hệ thống · Có hiệu lực
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevokeProject(p.id)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                        title="Gỡ dự án khỏi phạm vi"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Gỡ</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SYSTEM CONFIGURATION (AD-05) */}
      {/* ========================================================================= */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="font-bold text-sm text-[#0D1A36]">Cấu Hình 6 Tham Số Hệ Thống (AD-05)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Các tham số trong bảng CSDL <code className="font-mono text-blue-700">cau_hinh</code> quyết định quy tắc tính toán hạn, cảnh báo và dung lượng
            </p>
          </div>

          {/* Yellow warning banner for THOI_DIEM_TRA_CUU */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Lưu ý quan trọng về Mốc Tra Cứu (THOI_DIEM_TRA_CUU):</span>
              <p className="mt-0.5 opacity-90 leading-relaxed">
                Thay đổi mốc này sẽ làm đổi kết quả cảnh báo quá hạn và sắp đến hạn của toàn hệ thống. Mốc mặc định của bộ dữ liệu khóa luận là <strong className="font-mono">{DEMO_QUERY_TIME}</strong>.
              </p>
            </div>
          </div>

          {/* 6 Config rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                1. Mốc thời gian tra cứu (THOI_DIEM_TRA_CUU)
              </label>
              <input
                type="text"
                value={configQueryTime}
                onChange={(e) => setConfigQueryTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-500">Mặc định: 12/10/2026 09:00:00 (để trống để dùng giờ hệ thống thật)</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="font-bold text-slate-800">
                2. Số ngày tính là sắp đến hạn (SO_NGAY_SAP_DEN_HAN)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={configUpcomingDays}
                onChange={(e) => setConfigUpcomingDays(parseInt(e.target.value, 10) || 7)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-500">Khoảng hợp lệ: 1 đến 30 ngày (Giá trị demo: 7 ngày)</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="font-bold text-slate-800">
                3. Thời gian hết phiên làm việc (THOI_GIAN_HET_PHIEN_PHUT)
              </label>
              <input
                type="number"
                min={5}
                max={240}
                value={configSessionTimeout}
                onChange={(e) => setConfigSessionTimeout(parseInt(e.target.value, 10) || 30)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-500">Tự động đăng xuất sau 30 phút không thao tác</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="font-bold text-slate-800">
                4. Dung lượng tải lên tối đa mỗi tệp (DUNG_LUONG_TAI_LEN_TOI_DA_MB)
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={configMaxUploadMB}
                onChange={(e) => setConfigMaxUploadMB(parseInt(e.target.value, 10) || 50)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 font-bold"
              />
              <p className="text-[11px] text-slate-500">Giới hạn tối đa: 50 MB / tệp</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 md:col-span-2">
              <label className="font-bold text-slate-800">
                5. Loại tệp được phép tải lên (LOAI_TEP_CHO_PHEP)
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {configAllowedFiles.map((f, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 text-xs">
                    ✓ {f}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">5 định dạng kỹ thuật: Bản vẽ CAD (.dwg), PDF, Ảnh hiện trường (JPG/PNG), Bảng tính (XLSX), Bộ hồ sơ nén (ZIP)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => showToast('Đã lưu cấu hình hệ thống! Đã ghi nhật ký thao tác loại DIEU_CHINH.')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
          >
            Lưu thay đổi cấu hình
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT LOG (AD-06) */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Nhật Ký Thao Tác Bất Biến (AD-06 / nhat_ky_thao_tac)</span>
            <span className="text-slate-500 text-[11px]">Chỉ đọc · Lưu vết Trước $\rightarrow$ Sau dạng JSON</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 text-[11px]">{log.time}</span>
                      <span className="font-bold text-[#152A55]">@{log.user}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.action === 'KHOA' ? 'bg-red-100 text-red-800' :
                        log.action === 'TAO_MOI' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.actionLabel}
                      </span>
                      <span className="font-semibold text-slate-900">{log.target}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Thu gọn' : 'So sánh Trước/Sau'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 pl-1 border-l-2 border-slate-300">
                    Lý do: {log.reason}
                  </p>

                  {/* Expanded JSON Before/After */}
                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px]">
                      <div>
                        <div className="font-bold text-slate-500 mb-1">Giá trị trước (gia_tri_cu):</div>
                        <pre className="p-2 bg-white rounded border border-slate-200 overflow-x-auto text-slate-600">
                          {log.oldVal ? JSON.stringify(log.oldVal, null, 2) : 'null (Tạo mới)'}
                        </pre>
                      </div>
                      <div>
                        <div className="font-bold text-blue-700 mb-1">Giá trị sau (gia_tri_moi):</div>
                        <pre className="p-2 bg-white rounded border border-blue-200 overflow-x-auto text-blue-900">
                          {JSON.stringify(log.newVal, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ROLE PERMISSION MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="font-bold text-sm text-[#0D1A36]">Ma Trận Phân Quyền 4 Vai Trò Chuẩn Khóa Luận</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đủ = Toàn quyền; Xem = Chỉ xem; P = Phạm vi dự án được cấp; G = Công việc được giao
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Chức năng</th>
                  <th className="p-3 text-purple-700">Quản trị (QUAN_TRI)</th>
                  <th className="p-3 text-blue-700">Quản lý (QUAN_LY)</th>
                  <th className="p-3 text-amber-700">Đội trưởng (DOI_TRUONG)</th>
                  <th className="p-3 text-emerald-700">Ban Giám Đốc (BAN_GIAM_DOC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Tài khoản &amp; Cấu hình (AD)</td>
                  <td className="p-3 font-bold text-purple-700">Đủ</td>
                  <td className="p-3 text-slate-400">—</td>
                  <td className="p-3 text-slate-400">—</td>
                  <td className="p-3 text-slate-400">—</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Dự án &amp; Hạng mục (PR-02, PR-04)</td>
                  <td className="p-3 text-slate-400">—</td>
                  <td className="p-3 font-bold text-blue-700">Đủ, P (5 dự án)</td>
                  <td className="p-3 text-amber-700">Xem, G</td>
                  <td className="p-3 text-emerald-700">Xem (Cả 10 dự án)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Lập &amp; Hủy phân công (HR-07, HR-08)</td>
                  <td className="p-3 text-slate-400">—</td>
                  <td className="p-3 font-bold text-blue-700">Đủ, P</td>
                  <td className="p-3 text-slate-400">—</td>
                  <td className="p-3 text-emerald-700">Xem</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Gửi cập nhật &amp; Minh chứng (RS-02)</td>
                  <td className="p-3 text-slate-400">—</td>
                  <td className="p-3 text-blue-700">Xem, P</td>
                  <td className="p-3 font-bold text-amber-700">Đủ, G (Ảnh hiện trường)</td>
                  <td className="p-3 text-emerald-700">Xem</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Xác nhận hoàn thành việc &amp; dự án</td>
                  <td className="p-3 text-slate-400">—</td>
                  <td className="p-3 font-bold text-blue-700">Đủ, P (Duy nhất)</td>
                  <td className="p-3 text-slate-400">—</td>
                  <td className="p-3 text-slate-400">—</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Hồ sơ bản vẽ kỹ thuật (DC-01 đến DC-05)</td>
                  <td className="p-3 text-slate-400">—</td>
                  <td className="p-3 font-bold text-blue-700">Đủ, P (Chọn bản triển khai)</td>
                  <td className="p-3 text-amber-700">Xem bản triển khai (DC-02a)</td>
                  <td className="p-3 text-emerald-700">Xem</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lock/Unlock Account Modal (AD-03) */}
      {lockModalAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${lockModalAcc.isActive ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {lockModalAcc.isActive ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0D1A36]">
                  {lockModalAcc.isActive ? 'Khóa tài khoản (AD-03)' : 'Mở khóa tài khoản'}
                </h3>
                <p className="text-xs text-slate-500">{lockModalAcc.name} (@{lockModalAcc.username})</p>
              </div>
            </div>

            {lockModalAcc.isActive && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do khóa tài khoản (bắt buộc, $\ge$ 5 ký tự) *
                </label>
                <textarea
                  rows={3}
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Ví dụ: Nghỉ việc; khóa theo quy trình bàn giao"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLockModalAcc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmLock}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs ${
                  lockModalAcc.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {lockModalAcc.isActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal (AD-02) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-[#0D1A36]">Tạo Tài Khoản Người Dùng Mới (AD-02)</h3>
            <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên đăng nhập (chữ thường, không dấu) *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  placeholder="ví dụ: qly.minh, dt.hai"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên hiển thị *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ví dụ: Nguyễn Quang Minh"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Vai trò hệ thống *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="QUAN_LY">Quản lý dự án (QUAN_LY)</option>
                  <option value="DOI_TRUONG">Đội trưởng thi công (DOI_TRUONG)</option>
                  <option value="BAN_GIAM_DOC">Ban Giám Đốc (BAN_GIAM_DOC)</option>
                  <option value="QUAN_TRI">Quản trị hệ thống (QUAN_TRI)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nhân sự liên kết (tùy chọn)</label>
                <select
                  value={newStaffId}
                  onChange={(e) => setNewStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">-- Không liên kết nhân sự --</option>
                  {staff.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code} - {s.roleTitleDisplay})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#152A55] text-white font-bold rounded-xl text-xs hover:bg-[#1E3A75] shadow-xs cursor-pointer"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
