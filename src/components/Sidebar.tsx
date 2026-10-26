import React, { useEffect, useState } from 'react';
import { UserAccount } from '../types/index.ts';
import {
  FolderKanban,
  FileBox,
  LayoutDashboard,
  CalendarClock,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  Settings,
  History,
  ChevronDown,
  ChevronRight,
  Library
} from 'lucide-react';
import { normalizeRole } from '../utils/domain.ts';

export type ActiveTab =
  | 'dashboard'
  | 'projects'
  | 'assignments'
  | 'leaves'
  | 'contractor'
  | 'worklogs'
  | 'my_tasks'
  | 'docs'
  | 'staff'
  | 'cat_customers'
  | 'cat_projects'
  | 'cat_subcontractors'
  | 'cat_categories'
  | 'cat_teams'
  | 'cat_skills'
  | 'cat_systems'
  | 'reports'
  | 'admin'
  | 'scope'
  | 'config'
  | 'audit';

interface MenuLeaf {
  id: ActiveTab;
  label: string;
  icon?: React.ReactNode;
  match?: ActiveTab[];
}

interface MenuGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  children: MenuLeaf[];
}

type MenuItem = MenuLeaf | MenuGroup;

const isGroup = (m: MenuItem): m is MenuGroup => (m as MenuGroup).children !== undefined;

/** Mục con của "Phân công thi công" (thay cho 3 tab ở góc phải màn hình) */
const ASSIGNMENT_GROUP: MenuGroup = {
  key: 'assign',
  label: 'Phân công thi công',
  icon: <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />,
  children: [
    { id: 'assignments', label: 'Lập và tra cứu phân công' },
    { id: 'leaves', label: 'Lịch nghỉ/bận' },
    { id: 'contractor', label: 'Đội thi công ngoài' }
  ]
};

/** Nhóm "Danh mục" (thay cho mục "Hồ sơ nhân sự") */
const CATALOG_GROUP: MenuGroup = {
  key: 'catalog',
  label: 'Danh mục',
  icon: <Library className="w-4 h-4 text-purple-600 shrink-0" />,
  children: [
    { id: 'staff', label: 'Nhân sự' },
    { id: 'cat_customers', label: 'Khách hàng' },
    { id: 'cat_projects', label: 'Dự án' },
    { id: 'cat_subcontractors', label: 'Đội thi công ngoài' },
    { id: 'cat_categories', label: 'Hạng mục' },
    { id: 'cat_teams', label: 'Tổ đội' },
    { id: 'cat_skills', label: 'Chuyên môn' },
    { id: 'cat_systems', label: 'Loại hệ thống' }
  ]
};

const BUSINESS_MENU: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" /> },
  { id: 'projects', label: 'Dự án và Hạng mục', icon: <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" /> },
  ASSIGNMENT_GROUP,
  { id: 'worklogs', label: 'Nhật ký hiện trường', icon: <ClipboardCheck className="w-4 h-4 text-indigo-600 shrink-0" /> },
  { id: 'docs', label: 'Hồ sơ kỹ thuật', icon: <FileBox className="w-4 h-4 text-rose-600 shrink-0" /> },
  CATALOG_GROUP,
  { id: 'reports', label: 'Báo cáo', icon: <BarChart3 className="w-4 h-4 text-teal-600 shrink-0" /> }
];

const ADMIN_MENU: MenuItem[] = [
  { id: 'admin', label: 'Tài khoản & Phân quyền', icon: <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" /> },
  { id: 'scope', label: 'Phạm vi dự án', icon: <FolderKanban className="w-4 h-4 text-blue-600 shrink-0" /> },
  { id: 'config', label: 'Cấu hình', icon: <Settings className="w-4 h-4 text-slate-600 shrink-0" /> },
  { id: 'audit', label: 'Nhật ký thao tác', icon: <History className="w-4 h-4 text-amber-600 shrink-0" /> }
];

const TEAM_LEAD_MENU: MenuItem[] = [
  { id: 'projects', label: 'Dự án của tôi', icon: <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />, match: ['projects', 'my_tasks'] },
  { id: 'worklogs', label: 'Nhật ký hiện trường', icon: <ClipboardCheck className="w-4 h-4 text-blue-600 shrink-0" /> }
];

const DIRECTOR_MENU: MenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" /> },
  { id: 'reports', label: 'Báo cáo', icon: <BarChart3 className="w-4 h-4 text-amber-600 shrink-0" /> },
  { id: 'worklogs', label: 'Nhật ký hiện trường', icon: <ClipboardCheck className="w-4 h-4 text-emerald-600 shrink-0" /> }
];

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: UserAccount;
}

const itemCls = (active: boolean) =>
  `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
    active ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, currentUser }) => {
  const role = normalizeRole(currentUser.role);
  const groupOf = (tab: ActiveTab) => [ASSIGNMENT_GROUP, CATALOG_GROUP].find(g => g.children.some(c => c.id === tab))?.key;
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const g = groupOf(activeTab);
    return g ? [g] : [];
  });

  // Khi chuyển tới một mục con (từ thẻ chỉ số, thông báo...), tự mở nhóm chứa mục đó
  useEffect(() => {
    const g = groupOf(activeTab);
    if (g && !openGroups.includes(g)) setOpenGroups(prev => [...prev, g]);
  }, [activeTab]);

  const toggle = (key: string) => setOpenGroups(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  const renderItems = (items: MenuItem[]) =>
    items.map(item => {
      if (!isGroup(item)) {
        const active = (item.match || [item.id]).includes(activeTab);
        return (
          <button key={item.id} type="button" onClick={() => onTabChange(item.id)} className={itemCls(active)}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      }
      const open = openGroups.includes(item.key);
      const containsActive = item.children.some(c => c.id === activeTab);
      return (
        <div key={item.key}>
          <button
            type="button"
            onClick={() => toggle(item.key)}
            aria-expanded={open}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
              containsActive && !open ? 'bg-blue-50 text-blue-700 font-bold' : containsActive ? 'text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          {open && (
            <div className="mt-0.5 ml-5 pl-2 border-l border-slate-200 space-y-0.5">
              {item.children.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onTabChange(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                    activeTab === c.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    });

  const sections: { title: string; items: MenuItem[] }[] =
    role === 'QUAN_TRI'
      ? [{ title: 'NGHIỆP VỤ', items: BUSINESS_MENU }, { title: 'QUẢN TRỊ', items: ADMIN_MENU }]
      : role === 'DOI_TRUONG'
        ? [{ title: 'NGHIỆP VỤ', items: TEAM_LEAD_MENU }]
        : role === 'BAN_GIAM_DOC'
          ? [{ title: 'NGHIỆP VỤ', items: DIRECTOR_MENU }]
          : [{ title: 'NGHIỆP VỤ', items: BUSINESS_MENU }];

  const footer =
    role === 'QUAN_TRI' ? 'Hệ thống NMH · Quản trị toàn quyền'
      : role === 'DOI_TRUONG' ? 'Hệ thống NMH · Đội thi công'
        : role === 'BAN_GIAM_DOC' ? 'Hệ thống NMH · Ban Giám Đốc (Chỉ xem)'
          : 'Hệ thống NMH · Quản lý dự án';

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] sticky top-[53px] print:hidden">
      <div className="p-3 space-y-3 overflow-y-auto">
        {sections.map((s, i) => (
          <div key={s.title} className={`space-y-1 ${i > 0 ? 'pt-2 border-t border-slate-100' : ''}`}>
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.title}</div>
            {renderItems(s.items)}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[10px] text-slate-400 text-center font-medium">{footer}</div>
    </aside>
  );
};

/** Các tab thuộc nhóm Danh mục */
export const CATALOG_TABS: ActiveTab[] = CATALOG_GROUP.children.map(c => c.id);
