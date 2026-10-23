import React from 'react';
import { ActiveTab } from './Sidebar.tsx';
import { UserAccount } from '../types/index.ts';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CalendarClock, 
  ClipboardCheck, 
  BarChart3
} from 'lucide-react';

interface MobileTabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: UserAccount;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  currentUser
}) => {
  const role = currentUser.role;
  const isAdmin = role === 'admin' || role === 'QUAN_TRI';
  const isTeamLead = role === 'team_lead' || role === 'DOI_TRUONG';
  const isDirector = role === 'director' || role === 'BAN_GIAM_DOC';

  let tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [];

  if (isAdmin) {
    // Quản trị viên (Làm tổng): Tổng quan, Dự án, Phân công, Tài khoản, Báo cáo
    tabs = [
      { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'projects', label: 'Dự án', icon: <FolderKanban className="w-5 h-5" /> },
      { id: 'assignments', label: 'Phân công', icon: <CalendarClock className="w-5 h-5" /> },
      { id: 'admin', label: 'Quản trị', icon: <ClipboardCheck className="w-5 h-5" /> },
      { id: 'reports', label: 'Báo cáo', icon: <BarChart3 className="w-5 h-5" /> }
    ];
  } else if (isTeamLead) {
    // Đội trưởng: Dự án của tôi & Nhật ký hiện trường (Mục 3.3.6)
    tabs = [
      { id: 'projects', label: 'Dự án của tôi', icon: <FolderKanban className="w-5 h-5" /> },
      { id: 'worklogs', label: 'Nhật ký', icon: <ClipboardCheck className="w-5 h-5" /> }
    ];
  } else if (isDirector) {
    // Ban Giám Đốc: Tổng quan, Báo cáo & Nhật ký hiện trường (Mục 3.3.5)
    tabs = [
      { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'reports', label: 'Báo cáo', icon: <BarChart3 className="w-5 h-5" /> },
      { id: 'worklogs', label: 'Nhật ký', icon: <ClipboardCheck className="w-5 h-5" /> }
    ];
  } else {
    // Quản lý: Tối đa 5 mục chính (Mục 3.3.4)
    tabs = [
      { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'projects', label: 'Dự án', icon: <FolderKanban className="w-5 h-5" /> },
      { id: 'assignments', label: 'Phân công', icon: <CalendarClock className="w-5 h-5" /> },
      { id: 'worklogs', label: 'Nhật ký', icon: <ClipboardCheck className="w-5 h-5" /> },
      { id: 'reports', label: 'Báo cáo', icon: <BarChart3 className="w-5 h-5" /> }
    ];
  }

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 py-1 shadow-lg"
      style={{ paddingBottom: 'calc(4px + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Thanh điều hướng di động"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || 
            (tab.id === 'projects' && isTeamLead && (activeTab === 'my_tasks' || activeTab === 'projects'));
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors min-w-[60px] ${
                isActive 
                  ? 'text-blue-700 font-bold' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className={isActive ? 'text-blue-700' : 'text-slate-400'}>
                {tab.icon}
              </span>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-700 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
