import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types/index.ts';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Briefcase, 
  HardHat, 
  TrendingUp,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  Info,
  X
} from 'lucide-react';
import { INITIAL_ACCOUNTS } from '../data/mockData.ts';
import { dbService } from '../services/db.ts';

interface LoginScreenProps {
  accounts?: UserAccount[];
  onLogin: (account: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ accounts = INITIAL_ACCOUNTS, onLogin }) => {
  const [username, setUsername] = useState<string>('qly.bao');
  const [password, setPassword] = useState<string>('Nmh@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLockedModal, setIsLockedModal] = useState<string | null>(null);
  const [forgotModal, setForgotModal] = useState<boolean>(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập.');
      return;
    }

    setErrorMessage(null);
    setIsLockedModal(null);
    setIsLoading(true);

    try {
      const res = await dbService.login(username.trim(), password);
      setIsLoading(false);

      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        if (res.isLocked) {
          setIsLockedModal(res.message || 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
        } else {
          setErrorMessage(res.message || 'Tên đăng nhập hoặc mật khẩu không đúng.');
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Không thể kết nối đến máy chủ xác thực.');
    }
  };

  const handleSelectQuickAccount = (acc: UserAccount) => {
    setUsername(acc.username || '');
    setPassword('Nmh@2026');
    setErrorMessage(null);
    setIsLockedModal(null);

    // If account is locked (like qly.trung for KB02 test), automatically trigger login to demonstrate refusal
    if (!acc.isActive) {
      setTimeout(() => {
        setIsLockedModal(`Tài khoản đã bị khóa. Lý do: ${acc.lockReason || 'Nghỉ việc; khóa theo quy trình bàn giao'}. Vui lòng liên hệ quản trị viên.`);
      }, 100);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'QUAN_LY':
      case 'manager':
        return {
          label: 'Quản lý dự án',
          icon: <Briefcase className="w-3.5 h-3.5 text-blue-600" />,
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'DOI_TRUONG':
      case 'team_lead':
        return {
          label: 'Đội trưởng thi công',
          icon: <HardHat className="w-3.5 h-3.5 text-amber-600" />,
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'BAN_GIAM_DOC':
      case 'director':
        return {
          label: 'Ban Giám Đốc',
          icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />,
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'QUAN_TRI':
      case 'admin':
      default:
        return {
          label: 'Quản trị hệ thống',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />,
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F4F9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img 
            src="/image.png" 
            alt="NMH Data Center Network" 
            className="h-14 sm:h-16 w-auto mx-auto object-contain drop-shadow-xs" 
          />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#0D1A36]">
              Đăng Nhập Hệ Thống
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống Quản lý Dự án &amp; Phân công Thi công · NMH LLC
            </p>
          </div>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Locked Account Notification Alert (AUTH-01 & KB02) */}
        {isLockedModal && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Từ chối đăng nhập (Kịch bản KB02)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              {isLockedModal}
            </p>
          </div>
        )}

        {/* Login Form (AUTH-01) */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage(null);
                  setIsLockedModal(null);
                }}
                placeholder="vd: admin, qly.bao, dt.cuong, gd.minh..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-[#152A55] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Mặc định: <strong>Nmh@2026</strong>
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Nhập mật khẩu tài khoản"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-[#152A55] focus:bg-white focus:outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300 text-[#152A55] focus:ring-[#152A55]"
              />
              <span>Ghi nhớ phiên đăng nhập</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotModal(true)}
              className="text-[#152A55] font-semibold hover:underline cursor-pointer"
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#152A55] text-white font-semibold text-xs hover:bg-[#1E3A75] active:scale-[0.99] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực tài khoản...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập hệ thống</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Accounts Selection Box (KB01 / KB02) */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Chọn nhanh tài khoản thử nghiệm (9 tài khoản CSDL)
            </label>
            <span className="text-[10px] text-blue-600 font-medium">1 chạm điền mẫu</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/70 text-xs">
            {accounts.map((acc) => {
              const badge = getRoleBadge(acc.role);
              const isSelected = username === acc.username;

              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSelectQuickAccount(acc)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-white border-[#152A55] shadow-xs ring-1 ring-[#152A55]'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[11px] text-slate-900 truncate">
                        {acc.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      )}
                      {!acc.isActive && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-red-100 text-red-700 font-bold">Khóa</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-600 font-medium">@{acc.username}</span>
                      <span>·</span>
                      <span className="truncate">{badge.label}</span>
                    </div>
                  </div>

                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${badge.badgeClass}`}>
                    {badge.icon}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Subtext */}
        <div className="text-center pt-1">
          <p className="text-[11px] text-slate-400">
            Hệ thống nội bộ NMH LLC · CSDL PostgreSQL VLXD · Mật khẩu chung: <code className="font-mono text-slate-600 font-bold">Nmh@2026</code>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal (AUTH-01 Specification) */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Quên mật khẩu?</span>
              </div>
              <button 
                type="button" 
                onClick={() => setForgotModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Theo quy định bảo mật hệ thống nội bộ của công ty NMH, để cấp lại mật khẩu bạn vui lòng liên hệ:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 space-y-1 font-medium">
                <div>👑 <strong>Quản trị hệ thống (Admin):</strong> Nguyễn Văn Nam</div>
                <div>📞 <strong>Hotline IT nội bộ:</strong> 0900 000 101</div>
                <div>✉️ <strong>Email hỗ trợ:</strong> it.support@nmh.vn</div>
              </div>
              <p className="text-[11px] text-slate-500">
                (Mẹo: Bạn có thể đăng nhập bằng tài khoản <strong>admin</strong> với mật khẩu <strong>Nmh@2026</strong> để tự đặt lại mật khẩu cho bất kỳ tài khoản nào tại mục AD-02).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setForgotModal(false)}
              className="w-full py-2 bg-[#152A55] text-white text-xs font-semibold rounded-lg hover:bg-[#1E3A75]"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
