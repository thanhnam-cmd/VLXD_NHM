import React from 'react';
import { UserAccount } from '../types/index.ts';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CalendarClock, 
  ClipboardCheck, 
  FileBox, 
  Users2, 
  ShieldCheck,
  Building2,
  BarChart3,
  CalendarDays,
  Settings,
  History,
  CheckSquare
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'projects' 
  | 'tasks' 
  | 'assignments' 
  | 'worklogs' 
  | 'docs' 
  | 'staff' 
  | 'leaves' 
  | 'clients' 
  | 'reports' 
  | 'admin'
  | 'my_tasks'
  | 'scope'
  | 'config'
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: UserAccount;
  counts: {
    projects: number;
    tasks: number;
    docs: number;
    staff: number;
    pendingWorkLogs: number;
    conflicts: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  counts
}) => {
  const role = currentUser.role;
  const isAdmin = role === 'admin' || role === 'QUAN_TRI';
  const isManager = role === 'manager' || role === 'QUAN_LY';
  const isTeamLead = role === 'team_lead' || role === 'DOI_TRUONG';
  const isDirector = role === 'director' || role === 'BAN_GIAM_DOC';

  // 1. Menu cho Quản trị viên (QUAN_TRI) - 4 mục chuẩn
  if (isAdmin) {
    return (
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] sticky top-[53px]">
        <div className="p-3 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quản trị hệ thống (AD)
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
              <span>Tài khoản hệ thống (AD-01)</span>
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
              <span>Phạm vi dự án (AD-04)</span>
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
              <span>Cấu hình hệ thống (AD-05)</span>
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
              <span>Nhật ký thao tác (AD-06)</span>
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center font-mono">
          NMH ELV · QUAN_TRI v1.0
        </div>
      </aside>
    );
  }

  // 2. Menu cho Đội trưởng thi công (DOI_TRUONG) - 4 mục chuẩn (Mobile First)
  if (isTeamLead) {
    return (
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] sticky top-[53px]">
        <div className="p-3 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Công trường thi công
            </div>

            <button
              type="button"
              onClick={() => onTabChange('worklogs')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'worklogs' || activeTab === 'my_tasks'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Việc của tôi (RS-01)</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('projects')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dự án được giao (PR-02)</span>
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
              <FileBox className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Hồ sơ kỹ thuật (DC-01)</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('assignments')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'assignments'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Lịch đội thi công (HR-06)</span>
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center font-mono">
          NMH ELV · DOI_TRUONG v1.0
        </div>
      </aside>
    );
  }

  // 3. Menu cho Ban Giám Đốc (BAN_GIAM_DOC) - 4 mục chuẩn (Read-only)
  if (isDirector) {
    return (
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] sticky top-[53px]">
        <div className="p-3 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Điều hành doanh nghiệp
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
              <span>Tổng quan doanh nghiệp (RP-01)</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('projects')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dự án toàn công ty (PR-02)</span>
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
              <span>Nhân sự &amp; tải việc (RP-03)</span>
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
              <BarChart3 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Báo cáo tổng hợp (RP-02)</span>
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center font-mono">
          NMH ELV · BAN_GIAM_DOC (Chỉ xem)
        </div>
      </aside>
    );
  }

  // 4. Menu cho Quản lý dự án (QUAN_LY) - 3 nhóm 9 mục đầy đủ
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] sticky top-[53px]">
      <div className="p-3 space-y-4 overflow-y-auto">
        {/* Nhóm 1: Điều hành */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Điều hành dự án
          </div>

          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Tổng quan (PR-01)</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('projects')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dự án (PR-02)</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
              {counts.projects}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('worklogs')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'worklogs'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Công việc (PR-07)</span>
            </span>
            {counts.pendingWorkLogs > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                {counts.pendingWorkLogs}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('assignments')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Phân công (HR-07)</span>
            </span>
            {counts.conflicts > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 text-red-700">
                {counts.conflicts} vướng
              </span>
            )}
          </button>
        </div>

        {/* Nhóm 2: Nguồn lực */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Nguồn lực &amp; Lịch
          </div>

          <button
            type="button"
            onClick={() => onTabChange('staff')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Users2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Nhân sự (HR-01)</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
              {counts.staff}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('leaves')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'leaves'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Lịch nghỉ &amp; bận (HR-05)</span>
            </span>
          </button>
        </div>

        {/* Nhóm 3: Dữ liệu */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Dữ liệu kỹ thuật
          </div>

          <button
            type="button"
            onClick={() => onTabChange('docs')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FileBox className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Hồ sơ kỹ thuật (DC-01)</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
              {counts.docs}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('clients')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Khách hàng (PR-11)</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('reports')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Báo cáo dự án (RP-02)</span>
            </span>
          </button>
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center font-mono">
        NMH ELV · QUAN_LY v1.0
      </div>
    </aside>
  );
};
