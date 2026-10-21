import React from 'react';
import { ActiveTab } from './Sidebar.tsx';
import { UserAccount } from '../types/index.ts';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CalendarClock, 
  ClipboardCheck, 
  FileBox, 
  Users2 
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
  const isDirector = currentUser.role === 'director' || currentUser.role === 'BAN_GIAM_DOC';
  const isTeamLead = currentUser.role === 'team_lead' || currentUser.role === 'DOI_TRUONG';

  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" />, show: true },
    { id: 'projects' as ActiveTab, label: 'Dự án', icon: <FolderKanban className="w-5 h-5" />, show: !isDirector },
    { id: 'assignments' as ActiveTab, label: 'Phân công', icon: <CalendarClock className="w-5 h-5" />, show: !isDirector },
    { id: 'worklogs' as ActiveTab, label: 'Nhật ký', icon: <ClipboardCheck className="w-5 h-5" />, show: true },
    { id: 'docs' as ActiveTab, label: 'Hồ sơ', icon: <FileBox className="w-5 h-5" />, show: true },
    { id: 'staff' as ActiveTab, label: 'Nhân sự', icon: <Users2 className="w-5 h-5" />, show: !isTeamLead }
  ].filter(t => t.show);

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 py-1 shadow-lg"
      style={{ paddingBottom: 'calc(4px + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Thanh điều hướng di động"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors min-w-[54px] ${
                isActive 
                  ? 'text-[#152A55] font-semibold' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className={isActive ? 'text-[#152A55]' : 'text-slate-400'}>
                {tab.icon}
              </span>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#152A55] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
