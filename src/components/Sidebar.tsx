import React from 'react';
import { UserAccount } from '../types/index.ts';
import { 
  Users2, 
  FolderKanban, 
  FileBox, 
  LayoutDashboard, 
  CalendarClock, 
  ClipboardCheck, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  History
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'projects' 
  | 'assignments' 
  | 'leaves' 
  | 'worklogs' 
  | 'my_tasks' 
  | 'docs' 
  | 'staff' 
  | 'reports' 
  | 'admin' 
  | 'scope' 
  | 'config' 
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: UserAccount;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser
}) => {
  const role = currentUser.role;
  const isAdmin = role === 'admin' || role === 'QUAN_TRI';
  const isManager = role === 'manager' || role === 'QUAN_LY';
  const isTeamLead = role === 'team_lead' || role === 'DOI_TRUONG';
  const isDirector = role === 'director' || role === 'BAN_GIAM_DOC';

  // 1. Menu Quản trị viên (QUAN_TRI - Làm tổng: có tất cả các quyền hệ thống và nghiệp vụ)
  if (isAdmin) {
    return (
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] sticky top-[53px]">
        <div className="p-3 space-y-3 overflow-y-auto">
          {/* Nhóm 1: Nghiệp vụ toàn doanh nghiệp */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PHÂN HỆ NGHIỆP VỤ (TỔNG QUẢN)
            </div>

            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Tổng quan</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('projects')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'projects' || activeTab === 'my_tasks'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dự án và Hạng mục</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('assignments')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'assignments' || activeTab === 'leaves'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Phân công thi công</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('worklogs')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'worklogs'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Nhật ký hiện trường</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('docs')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileBox className="w-4 h-4 text-red-600 shrink-0" />
              <span>Hồ sơ kỹ thuật</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('staff')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Hồ sơ nhân sự</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Báo cáo</span>
            </button>
          </div>

          {/* Nhóm 2: Quản trị hệ thống */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              QUẢN TRỊ HỆ THỐNG
            </div>

            <button
              type="button"
              onClick={() => onTabChange('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Tài khoản &amp; Phân quyền</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('scope')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'scope'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Phạm vi dự án</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('config')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Cấu hình</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('audit')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Nhật ký thao tác</span>
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[10px] text-slate-400 text-center font-medium">
          Hệ thống NMH · Quản trị toàn quyền
        </div>
      </aside>
    );
  }

  // 2. Menu Đội trưởng thi công (DOI_TRUONG) - Bảng 3.11: 2 mục phẳng
  if (isTeamLead) {
    return (
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] sticky top-[53px]">
        <div className="p-3 space-y-3 overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PHÂN HỆ NGHIỆP VỤ
            </div>

            <button
              type="button"
              onClick={() => onTabChange('projects')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'projects' || activeTab === 'my_tasks'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dự án của tôi</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('worklogs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'worklogs'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Nhật ký hiện trường</span>
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[10px] text-slate-400 text-center font-medium">
          Hệ thống NMH · Đội thi công
        </div>
      </aside>
    );
  }

  // 3. Menu Ban Giám Đốc (BAN_GIAM_DOC) - Bảng 3.11: 3 mục phẳng (Read-Only)
  if (isDirector) {
    return (
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] sticky top-[53px]">
        <div className="p-3 space-y-3 overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PHÂN HỆ NGHIỆP VỤ
            </div>

            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Tổng quan</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Báo cáo</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('worklogs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'worklogs'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Nhật ký hiện trường</span>
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[10px] text-slate-400 text-center font-medium">
          Hệ thống NMH · Ban Giám Đốc (Chỉ xem)
        </div>
      </aside>
    );
  }

  // 4. Menu Quản lý dự án (QUAN_LY) - Bảng 3.11: 7 mục chuẩn
  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] sticky top-[53px]">
      <div className="p-3 space-y-3 overflow-y-auto">
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            PHÂN HỆ NGHIỆP VỤ
          </div>

          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Tổng quan</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('projects')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dự án và Hạng mục</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('assignments')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'assignments' || activeTab === 'leaves'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Phân công thi công</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('worklogs')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'worklogs'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Nhật ký hiện trường</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('docs')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FileBox className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Hồ sơ kỹ thuật</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('staff')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Hồ sơ nhân sự</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('reports')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Báo cáo</span>
          </button>
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[10px] text-slate-400 text-center font-medium">
        Hệ thống NMH · Quản lý dự án
      </div>
    </aside>
  );
};
