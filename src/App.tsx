import React, { useState, useEffect, useRef } from 'react';
import { TechDoc, UserAccount, UserRole } from './types/index.ts';
import { dbService, DatabaseStatus } from './services/db.ts';
import { StoreProvider, useStore } from './state/store.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { MobileTabBar } from './components/MobileTabBar.tsx';
import { DocViewerModal, downloadDoc } from './components/DocViewerModal.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { DatabaseModal } from './components/DatabaseModal.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';
import { QuickSearchModal } from './components/QuickSearchModal.tsx';
import { QuickViewDrawer } from './components/QuickViewDrawer.tsx';
import { isTaskOverdue, isTaskUpcoming7Days } from './utils/progressCalculator.ts';
import { isDirectorRole, isTeamLeadRole, isProjectOpen, normalizeRole } from './utils/domain.ts';

import { DashboardView } from './views/DashboardView.tsx';
import { ProjectsView } from './views/ProjectsView.tsx';
import { ProjectDetailView } from './views/ProjectDetailView.tsx';
import { AssignmentView, AssignmentDraft } from './views/AssignmentView.tsx';
import { WorkLogView } from './views/WorkLogView.tsx';
import { TechnicalDocsView } from './views/TechnicalDocsView.tsx';
import { StaffView } from './views/StaffView.tsx';
import { AdminView } from './views/AdminView.tsx';
import { ReportsView } from './views/ReportsView.tsx';
import { MyProjectsView } from './views/MyProjectsView.tsx';
import { CatalogView } from './views/CatalogView.tsx';
import { TeamLeadProjectView } from './views/TeamLeadProjectView.tsx';

/** Tham số điều hướng giữa các màn hình (bộ lọc mang theo từ thẻ chỉ số, ngữ cảnh mở biểu mẫu) */
export interface NavParams {
  projectStatus?: string;
  assignTab?: 'assignments' | 'leaves' | 'contractor';
  assignFilter?: 'unassigned' | 'affected' | 'pending';
  draft?: AssignmentDraft;
  worklogStatus?: string;
  worklogTaskId?: string;
  worklogProjectId?: string;
  reportTab?: 'BC-01' | 'BC-02' | 'BC-03' | 'BC-04';
  reportFilter?: string;
  focusTaskId?: string;
}

const getLandingTabForUser = (user: UserAccount): ActiveTab => {
  const role = normalizeRole(user.role);
  if (role === 'QUAN_TRI') return 'admin';
  if (role === 'DOI_TRUONG') return 'my_tasks';
  return 'dashboard'; // Quản lý và Ban giám đốc: Tổng quan (Bảng 3.11)
};

const AppShell: React.FC = () => {
  const store = useStore();
  const { currentUser, accounts, visibleProjects, scoped, assignments, leaves, staff } = store;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('nmh_auth_status') === 'logged_in');
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => getLandingTabForUser(currentUser));
  const [nav, setNav] = useState<NavParams>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [docViewer, setDocViewer] = useState<{ doc: TechDoc; versionNum?: number } | null>(null);
  const setSelectedDocForViewer = (doc: TechDoc | null, v?: { versionNum: number }) => setDocViewer(doc ? { doc, versionNum: v?.versionNum } : null);
  const [quickView, setQuickView] = useState<{ projectId: string; taskId?: string } | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const isDirector = isDirectorRole(currentUser);
  const isTeamLead = isTeamLeadRole(currentUser);

  /**
   * Kết nối dữ liệu: 'online' – dữ liệu thật trên PostgreSQL; 'local' – máy chủ không cấu hình CSDL (chạy thử trên máy);
   * 'checking' / 'unreachable' / 'dberror' – đang chờ máy chủ: không cho thao tác để tránh làm việc trên dữ liệu mẫu.
   */
  const [conn, setConn] = useState<'checking' | 'online' | 'local' | 'unreachable' | 'dberror'>('checking');
  const retryTimer = useRef<number | null>(null);
  const refreshDbStatus = async () => {
    if (retryTimer.current) { window.clearTimeout(retryTimer.current); retryTimer.current = null; }
    const retry = (ms: number) => { retryTimer.current = window.setTimeout(refreshDbStatus, ms); };
    try {
      const status = await dbService.getDatabaseStatus();
      setDbStatus(status);
      if (status.unreachable) { setConn('unreachable'); return retry(5000); }
      if (!status.hasDatabaseUrl) { setConn('local'); return; }
      if (!status.connected || !status.hasCoreTables) { setConn('dberror'); return retry(10000); }
      // Dữ liệu thật: nạp toàn bộ từ PostgreSQL; từ đây mọi thay đổi được ghi về CSDL
      const data = await dbService.bootstrap();
      if (!data) { setConn('unreachable'); return retry(5000); }
      store.loadFromDatabase(data);
      setConn('online');
    } catch (err) {
      console.warn('Database status check failed:', err);
      setConn('unreachable');
      retry(5000);
    }
  };

  useEffect(() => { refreshDbStatus(); return () => { if (retryTimer.current) window.clearTimeout(retryTimer.current); }; }, []);

  const go = (tab: ActiveTab, params: NavParams = {}) => {
    setSelectedProjectId(null);
    setNav(params);
    // Lịch nghỉ/bận và Đội thi công ngoài là mục riêng trên thanh menu dọc
    if (tab === 'assignments' && params.assignTab && params.assignTab !== 'assignments') {
      setActiveTab(params.assignTab);
      return;
    }
    setActiveTab(tab);
  };

  const openProject = (projectId: string, focusTaskId?: string) => {
    if (isDirector) {
      setQuickView({ projectId, taskId: focusTaskId });
      return;
    }
    setNav(prev => ({ ...prev, focusTaskId }));
    setSelectedProjectId(projectId);
  };

  const handleLogin = (user: UserAccount) => {
    store.setCurrentUser(user);
    store.recordLogin(user.id);
    localStorage.setItem('nmh_auth_status', 'logged_in');
    setIsAuthenticated(true);
    go(getLandingTabForUser(user));
  };

  const handleLogout = () => {
    setSelectedProjectId(null);
    setSelectedDocForViewer(null);
    setQuickView(null);
    setIsAuthenticated(false);
    localStorage.setItem('nmh_auth_status', 'logged_out');
  };

  const handleAccountSwitch = (account: UserAccount) => {
    store.setCurrentUser(account);
    store.recordLogin(account.id);
    go(getLandingTabForUser(account));
  };

  const handleRoleSwitch = (role: UserRole) => {
    const matched = accounts.find(a => normalizeRole(a.role) === normalizeRole(role) && a.isActive);
    if (matched) handleAccountSwitch(matched);
  };

  // Tải về: tệp gốc đã lưu trong CSDL; hồ sơ chưa có tệp gốc (dữ liệu mẫu) tải dạng ảnh PNG
  const handleDownloadDoc = (doc: TechDoc, versionNum?: number) =>
    downloadDoc(doc, versionNum, store.projects.find(p => p.id === doc.projectId)?.name);

  // Thông báo (COM-01) theo phạm vi dữ liệu
  const openProjectIds = new Set(visibleProjects.filter(isProjectOpen).map(p => p.id));
  const overdueCount = scoped.tasks.filter(t => openProjectIds.has(t.projectId) && isTaskOverdue(t.dueDate, t.status)).length;
  const upcomingCount = scoped.tasks.filter(t => openProjectIds.has(t.projectId) && isTaskUpcoming7Days(t.dueDate, t.status)).length;
  const affectedCount = isDirector || isTeamLead ? 0 : store.getAffectedAssignments().filter(a => store.visibleProjectIds.has(a.projectId)).length;
  const pendingExternal = isDirector || isTeamLead ? [] : store.pendingDailyConfirmations().map(x => ({
    key: `${x.ext.id}-${x.day.date}`, team: x.ext.contractorName, date: x.day.date, count: x.day.reportedCount ?? x.day.presentCount, workerCount: x.ext.workerCount
  }));
  const totalNotifications = overdueCount + upcomingCount + affectedCount + pendingExternal.length;

  if (!isAuthenticated) {
    return <LoginScreen accounts={accounts} onLogin={handleLogin} />;
  }

  const sidebarTab: ActiveTab = selectedProjectId ? (isTeamLead ? 'my_tasks' : 'projects') : activeTab;

  const renderMain = () => {
    if (selectedProjectId) {
      if (isTeamLead) {
        return (
          <TeamLeadProjectView
            projectId={selectedProjectId}
            onBack={() => setSelectedProjectId(null)}
            onSendReport={(projectId, taskId) => go('worklogs', { worklogProjectId: projectId, worklogTaskId: taskId })}
            onViewDoc={setSelectedDocForViewer}
            onDownloadDoc={handleDownloadDoc}
          />
        );
      }
      return (
        <ProjectDetailView
          projectId={selectedProjectId}
          focusTaskId={nav.focusTaskId}
          onBack={() => setSelectedProjectId(null)}
          onOpenAssign={(draft) => go('assignments', { assignTab: 'assignments', draft })}
          onOpenWorklogs={(taskId) => go('worklogs', { worklogTaskId: taskId })}
          onOpenExternal={() => go('assignments', { assignTab: 'contractor' })}
          onViewDoc={setSelectedDocForViewer}
          onDownloadDoc={handleDownloadDoc}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={go}
            onOpenProject={openProject}
            onRefresh={refreshDbStatus}
          />
        );
      case 'projects':
      case 'my_tasks':
        if (isTeamLead) return <MyProjectsView onOpenProject={(id) => setSelectedProjectId(id)} />;
        return <ProjectsView key={nav.projectStatus || 'all'} initialStatus={nav.projectStatus} onSelectProject={(id) => setSelectedProjectId(id)} />;
      case 'assignments':
      case 'leaves':
      case 'contractor':
        return (
          <AssignmentView
            key={JSON.stringify(nav)}
            initialTab={activeTab}
            initialFilter={nav.assignFilter}
            draft={nav.draft}
          />
        );
      case 'worklogs':
        return (
          <WorkLogView
            key={JSON.stringify(nav)}
            initialStatus={nav.worklogStatus}
            initialTaskId={nav.worklogTaskId}
            initialProjectId={nav.worklogProjectId}
          />
        );
      case 'docs':
        return <TechnicalDocsView onOpenDocViewer={setSelectedDocForViewer} onDownloadDoc={handleDownloadDoc} />;
      case 'staff':
        return <StaffView onOpenAssignments={() => go('assignments', { assignTab: 'assignments' })} />;
      case 'cat_customers':
      case 'cat_projects':
      case 'cat_subcontractors':
      case 'cat_categories':
      case 'cat_teams':
      case 'cat_skills':
      case 'cat_systems':
        return <CatalogView key={activeTab} kind={activeTab} onOpenProject={(id) => setSelectedProjectId(id)} onNavigate={(t) => go(t)} />;
      case 'reports':
        return (
          <ReportsView
            key={`${nav.reportTab}-${nav.reportFilter}`}
            projects={visibleProjects}
            tasks={scoped.tasks}
            staff={staff}
            assignments={scoped.assignments}
            leaves={leaves}
            workLogs={scoped.workLogs}
            currentUser={currentUser}
            initialTab={nav.reportTab || 'BC-01'}
            initialFilter={nav.reportFilter}
            onSelectProject={(pId, taskId) => openProject(pId, taskId)}
          />
        );
      case 'admin':
      case 'scope':
      case 'config':
      case 'audit':
        return <AdminView initialTab={activeTab === 'admin' ? 'accounts' : activeTab} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header
        currentUser={currentUser}
        accounts={accounts}
        onRoleSwitch={handleRoleSwitch}
        onAccountSwitch={handleAccountSwitch}
        onLogout={handleLogout}
        dbStatus={dbStatus}
        onOpenMenu={() => setMobileMenu(true)}
        notificationCount={totalNotifications}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      <div className="flex flex-1">
        <div className="hidden md:block">
          <Sidebar activeTab={sidebarTab} onTabChange={(tab) => go(tab)} currentUser={currentUser} />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-24 md:pb-8 print:p-0 print:max-w-none">
          {conn === 'local' && (
            <div className="mb-4 p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs">Chế độ chạy thử: máy chủ chưa cấu hình CSDL, dữ liệu chỉ lưu trên trình duyệt này.</div>
          )}
          {store.offline && conn === 'online' && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
              Mất kết nối tới máy chủ. Thay đổi chưa lưu sẽ tự gửi khi có kết nối; dữ liệu của người khác chưa cập nhật được.
            </div>
          )}
          {store.syncError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold flex items-center justify-between gap-3 flex-wrap">
              <span>{store.syncError}</span>
              <button type="button" onClick={store.retrySync} className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold cursor-pointer">Gửi lại ngay</button>
            </div>
          )}
          {store.syncNotice && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start justify-between gap-3">
              <span><strong>Dữ liệu vừa được người khác thay đổi.</strong> {store.syncNotice}</span>
              <button type="button" onClick={() => store.setSyncNotice(null)} className="px-3 py-1 rounded-lg border border-amber-400 bg-white font-semibold shrink-0 cursor-pointer">Đã hiểu</button>
            </div>
          )}
          {renderMain()}
        </main>
      </div>

      <MobileTabBar activeTab={sidebarTab} onTabChange={(tab) => go(tab)} currentUser={currentUser} />

      {/* Chờ kết nối máy chủ dữ liệu: không cho thao tác trên dữ liệu mẫu */}
      {(conn === 'checking' || conn === 'unreachable' || conn === 'dberror') && (
        <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-slate-200 border-t-[#152A55] animate-spin" />
            <div className="font-bold text-[#0D1A36]">{conn === 'dberror' ? 'Máy chủ chưa kết nối được cơ sở dữ liệu' : 'Đang kết nối máy chủ dữ liệu…'}</div>
            <div className="text-xs text-slate-600">
              {conn === 'checking' ? 'Vui lòng chờ trong giây lát.'
                : conn === 'dberror' ? 'Hệ thống tự thử lại mỗi 10 giây. Nếu kéo dài, vui lòng báo Quản trị viên.'
                : 'Máy chủ có thể đang khởi động (tối đa khoảng 1 phút). Hệ thống tự thử lại mỗi 5 giây.'}
            </div>
            {conn !== 'checking' && <button type="button" onClick={refreshDbStatus} className="px-4 py-2 rounded-lg bg-[#152A55] text-white text-xs font-semibold cursor-pointer">Thử lại ngay</button>}
          </div>
        </div>
      )}

      {/* Menu đầy đủ dạng ngăn trượt trên điện thoại */}
      {mobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex print:hidden" onClick={() => setMobileMenu(false)}>
          <div className="h-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <Sidebar drawer activeTab={sidebarTab} onTabChange={(tab) => { setMobileMenu(false); go(tab); }} currentUser={currentUser} />
          </div>
          <div className="flex-1 bg-black/45 backdrop-blur-[1px]" />
        </div>
      )}

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        // Cùng nguồn với số trên chuông: chỉ dự án đang mở, phân công bị ảnh hưởng theo lịch nghỉ còn hiệu lực
        tasks={scoped.tasks.filter(t => openProjectIds.has(t.projectId))}
        projects={visibleProjects}
        assignments={isDirector || isTeamLead ? [] : store.getAffectedAssignments().filter(a => store.visibleProjectIds.has(a.projectId))}
        leaves={leaves}
        onSelectTask={(taskId, projectId) => {
          setIsNotificationDrawerOpen(false);
          if (isTeamLead) setSelectedProjectId(projectId);
          else openProject(projectId, taskId);
        }}
        onSelectAffectedAssignments={() => {
          setIsNotificationDrawerOpen(false);
          go('assignments', { assignTab: 'leaves', assignFilter: 'affected' });
        }}
        pendingExternal={pendingExternal}
        onOpenPendingExternal={() => go('assignments', { assignTab: 'contractor', assignFilter: 'pending' })}
      />

      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        projects={visibleProjects}
        tasks={scoped.tasks}
        staff={isDirector || isTeamLead ? [] : staff}
        docs={isDirector ? [] : scoped.docs}
        onSelectProject={(projectId) => isTeamLead ? setSelectedProjectId(projectId) : openProject(projectId)}
        onSelectTask={(taskId, projectId) => isTeamLead ? setSelectedProjectId(projectId) : openProject(projectId, taskId)}
        onSelectStaff={() => go('staff')}
        onSelectDoc={(doc) => setSelectedDocForViewer(doc)}
      />

      {quickView && (
        <QuickViewDrawer projectId={quickView.projectId} taskId={quickView.taskId} onClose={() => setQuickView(null)} />
      )}

      {docViewer && (
        <DocViewerModal doc={docViewer.doc} versionNum={docViewer.versionNum} onClose={() => setDocViewer(null)} />
      )}

      <DatabaseModal isOpen={isDbModalOpen} onClose={() => setIsDbModalOpen(false)} status={dbStatus} onRefreshStatus={refreshDbStatus} />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
