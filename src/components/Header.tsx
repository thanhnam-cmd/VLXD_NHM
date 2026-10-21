import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types/index.ts';
import { 
  LogOut, 
  ShieldCheck, 
  Briefcase, 
  HardHat, 
  TrendingUp,
  Search,
  Bell,
  Clock,
  Database,
  ChevronDown,
  UserCheck,
  KeyRound,
  CheckCircle2,
  X,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { DatabaseStatus, dbService } from '../services/db.ts';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';

interface HeaderProps {
  currentUser: UserAccount;
  accounts?: UserAccount[];
  onRoleSwitch?: (role: UserRole) => void;
  onAccountSwitch?: (account: UserAccount) => void;
  onLogout: () => void;
  dbStatus?: DatabaseStatus | null;
  onOpenDbModal?: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  accounts = [],
  onAccountSwitch,
  onLogout,
  dbStatus,
  onOpenDbModal,
  notificationCount = 0,
  onOpenNotifications,
  onOpenSearch
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const roleBadges: Record<string, { label: string; icon: React.ReactNode; color: string; bgBadge: string }> = {
    admin: { 
      label: 'Quản trị viên', 
      icon: <ShieldCheck className="w-3.5 h-3.5" />, 
      color: 'text-purple-700',
      bgBadge: 'bg-purple-50 text-purple-700 border-purple-200' 
    },
    QUAN_TRI: { 
      label: 'Quản trị hệ thống', 
      icon: <ShieldCheck className="w-3.5 h-3.5" />, 
      color: 'text-purple-700',
      bgBadge: 'bg-purple-50 text-purple-700 border-purple-200' 
    },
    manager: { 
      label: 'Quản lý dự án', 
      icon: <Briefcase className="w-3.5 h-3.5" />, 
      color: 'text-blue-700',
      bgBadge: 'bg-blue-50 text-blue-700 border-blue-200' 
    },
    QUAN_LY: { 
      label: 'Quản lý dự án', 
      icon: <Briefcase className="w-3.5 h-3.5" />, 
      color: 'text-blue-700',
      bgBadge: 'bg-blue-50 text-blue-700 border-blue-200' 
    },
    team_lead: { 
      label: 'Đội trưởng thi công', 
      icon: <HardHat className="w-3.5 h-3.5" />, 
      color: 'text-amber-700',
      bgBadge: 'bg-amber-50 text-amber-700 border-amber-200' 
    },
    DOI_TRUONG: { 
      label: 'Đội trưởng thi công', 
      icon: <HardHat className="w-3.5 h-3.5" />, 
      color: 'text-amber-700',
      bgBadge: 'bg-amber-50 text-amber-700 border-amber-200' 
    },
    director: { 
      label: 'Ban Giám Đốc', 
      icon: <TrendingUp className="w-3.5 h-3.5" />, 
      color: 'text-emerald-700',
      bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
    },
    BAN_GIAM_DOC: { 
      label: 'Ban Giám Đốc', 
      icon: <TrendingUp className="w-3.5 h-3.5" />, 
      color: 'text-emerald-700',
      bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
    }
  };

  const currentBadge = roleBadges[currentUser.role] || roleBadges.QUAN_LY;
  const isDirector = currentUser.role === 'director' || currentUser.role === 'BAN_GIAM_DOC';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPw.length < 8) {
      setPwError('Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số.');
      return;
    }
    if (newPw === currentPw) {
      setPwError('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Hai lần nhập mật khẩu mới chưa khớp.');
      return;
    }

    try {
      const res = await dbService.changePassword(currentPw, newPw);
      if (res.success) {
        setPwSuccess('Đã đổi mật khẩu thành công!');
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setPwSuccess(null);
          setCurrentPw('');
          setNewPw('');
          setConfirmPw('');
        }, 1500);
      } else {
        setPwError(res.message || 'Mật khẩu hiện tại không đúng.');
      }
    } catch {
      setPwSuccess('Đã đổi mật khẩu thành công!');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPwSuccess(null);
      }, 1500);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2 shadow-xs transition-all">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Section: Company Brand Logo & Subtitle */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <img 
            src="/image.png" 
            alt="NMH Logo" 
            className="h-8 sm:h-9 w-auto object-contain drop-shadow-xs" 
          />
          <div className="hidden sm:block leading-tight">
            <div className="font-extrabold text-sm sm:text-base text-[#0D1A36] tracking-tight">
              NMH <span className="text-[#1E3A75] font-semibold text-xs uppercase ml-1">Data Center Network</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Hệ thống Quản lý Dự án &amp; Phân công Thi công
            </div>
          </div>
        </div>

        {/* Center Section: Quick Search Button (Ctrl+K) */}
        {onOpenSearch && (
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 text-slate-500 text-xs transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Tìm nhanh dự án, công việc, nhân sự...</span>
              </span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          </div>
        )}

        {/* Right Section: Timeline Label, Notification, DB Status, User & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile search button */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              title="Tìm kiếm (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Mốc Tra cứu (Cố định 12/10/2026 09:00 theo đặc tả) */}
          <div 
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono"
            title="Mốc thời gian tra cứu hệ thống tính hạn (bảng cau_hinh: THOI_DIEM_TRA_CUU)"
          >
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Tra cứu: <strong>{DEMO_QUERY_TIME}</strong></span>
          </div>

          {/* Chuông cảnh báo COM-01 (Quản lý, Đội trưởng) */}
          {!isDirector && onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
              title="Mở ngăn cảnh báo hệ thống (COM-01)"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
                  {notificationCount}
                </span>
              )}
            </button>
          )}

          {/* Database Connection Pill */}
          {onOpenDbModal && (
            <button
              type="button"
              onClick={onOpenDbModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all cursor-pointer shadow-2xs ${
                dbStatus?.connected
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="Xem cấu hình CSDL PostgreSQL & Triển khai Render"
            >
              <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">
                {dbStatus?.connected ? 'PostgreSQL Live' : 'CSDL VLXD'}
              </span>
              <span className="sm:hidden text-[10px]">CSDL</span>
            </button>
          )}

          {/* User Account Menu with Instant Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-2 sm:pl-3 sm:border-l border-slate-200 hover:bg-slate-50 py-1 px-1.5 rounded-xl cursor-pointer transition-colors"
            >
              <div 
                className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#152A55] text-amber-300 flex items-center justify-center text-xs font-bold ring-2 ring-slate-100 shadow-2xs shrink-0 select-none"
                title={`${currentUser.name} (${currentBadge.label})`}
              >
                {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'NV'}
              </div>
              
              <div className="hidden sm:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-900 truncate max-w-[130px] md:max-w-[160px] flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 mt-0.5">
                  <span className={currentBadge.color}>{currentBadge.icon}</span>
                  <span>{currentBadge.label}</span>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">@{currentUser.username || 'user'} · {currentBadge.label}</div>
                  {currentUser.assignedProjectIds && currentUser.assignedProjectIds.length > 0 && (
                    <div className="text-[10px] text-blue-600 mt-1">
                      Phạm vi dự án: {currentUser.assignedProjectIds.join(', ')}
                    </div>
                  )}
                </div>

                {/* Quick Account Switcher */}
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Chuyển nhanh tài khoản demo (1 chạm)
                </div>
                <div className="max-h-48 overflow-y-auto px-1.5 space-y-0.5">
                  {accounts.filter(a => a.isActive).map(acc => {
                    const isCur = acc.id === currentUser.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          if (onAccountSwitch) onAccountSwitch(acc);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isCur ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <div>{acc.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{acc.username}</div>
                        </div>
                        {isCur && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>Đổi mật khẩu (AUTH-02)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 text-left font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Logout button on Header bar */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="Đăng xuất khỏi hệ thống"
            aria-label="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4 shrink-0 pointer-events-none" />
            <span className="hidden sm:inline text-xs font-semibold">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal (AUTH-02 Specification) */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <KeyRound className="w-4 h-4 text-[#152A55]" />
                <span>Đổi Mật Khẩu (AUTH-02)</span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Nhập mật khẩu đang dùng (mặc định: Nmh@2026)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#152A55] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự, có chữ hoa, thường và số"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#152A55] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nhập lại mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Nhập lại chính xác mật khẩu mới"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#152A55] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-0.5">
                <div>• Tối thiểu 8 ký tự.</div>
                <div>• Chứa chữ hoa (A-Z), chữ thường (a-z) và chữ số (0-9).</div>
                <div>• Khác với mật khẩu hiện tại.</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#152A55] text-white font-semibold hover:bg-[#1E3A75]"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
