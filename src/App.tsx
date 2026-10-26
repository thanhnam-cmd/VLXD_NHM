import React, { useState, useEffect } from 'react';
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
  assignFilter?: 'unassigned' | 'affected';
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
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const isDirector = isDirectorRole(currentUser);
  const isTeamLead = isTeamLeadRole(currentUser);

  const refreshDbStatus = async () => {
    try {
      const status = await dbService.getDatabaseStatus();
      setDbStatus(status);
      if (status.connected && status.hasCoreTables) {
        // Dữ liệu thật: nạp toàn bộ từ PostgreSQL; từ đây mọi thay đổi được ghi về CSDL
        const data = await dbService.bootstrap();
        if (data) store.loadFromDatabase(data);
      }
    } catch (err) {
      console.warn('Database status check failed:', err);
    }
  };

  useEffect(() => { refreshDbStatus(); }, []);

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
  const totalNotifications = overdueCount + upcomingCount + affectedCount;

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
        onOpenDbModal={() => setIsDbModalOpen(true)}
        notificationCount={totalNotifications}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      <div className="flex flex-1">
        <div className="hidden md:block">
          <Sidebar activeTab={sidebarTab} onTabChange={(tab) => go(tab)} currentUser={currentUser} />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-24 md:pb-8 print:p-0 print:max-w-none">
          {store.syncError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{store.syncError}</div>
          )}
          {renderMain()}
        </main>
      </div>

      <MobileTabBar activeTab={sidebarTab} onTabChange={(tab) => go(tab)} currentUser={currentUser} />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        tasks={scoped.tasks}
        projects={visibleProjects}
        assignments={isDirector || isTeamLead ? [] : scoped.assignments.filter(a => a.status === 'HIEU_LUC')}
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
