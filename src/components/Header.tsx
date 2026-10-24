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
import { useStore } from '../state/store.tsx';
import { formatDateTime } from '../utils/domain.ts';
import { ChangePasswordModal } from './ChangePasswordModal.tsx';
import { useToast } from './ui.tsx';

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
  const { config } = useStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // Mật khẩu tạm do Quản trị viên cấp: tự mở hộp thoại đổi mật khẩu khi đăng nhập
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(!!currentUser.mustChangePassword);
  const toast = useToast();

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

  return (
    <>
    <header className="print:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2 shadow-xs transition-all">
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

          {/* Thời điểm tra cứu (QC-05): theo khóa THOI_DIEM_TRA_CUU, để trống thì dùng giờ thực */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px]"
            title={config.evaluationTimestamp
              ? 'Mốc tính quá hạn, sắp đến hạn được cố định trong Cấu hình (THOI_DIEM_TRA_CUU). Để trống tham số này để dùng giờ thực.'
              : 'Đang dùng giờ thực để tính quá hạn, sắp đến hạn.'}
          >
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Thời điểm tra cứu: <strong className="font-mono">{formatDateTime(DEMO_QUERY_TIME)}</strong>{!config.evaluationTimestamp && ' (giờ thực)'}</span>
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
                {dbStatus?.connected ? 'PostgreSQL Live' : 'CSDL Vật tư & Dự án'}
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
        </div>
      </div>

    </header>
    {isChangePasswordOpen && (
      <ChangePasswordModal forced={!!currentUser.mustChangePassword} onClose={() => setIsChangePasswordOpen(false)}
        onDone={(m) => { setIsChangePasswordOpen(false); toast.show(m); }} />
    )}
    {toast.node}
    </>
  );
};
