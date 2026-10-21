import React, { useState, useEffect } from 'react';
import { 
  Project, 
  Task, 
  Staff, 
  Assignment, 
  StaffLeave, 
  WorkLog, 
  TechDoc, 
  UserAccount, 
  UserRole,
  TaskStage 
} from './types/index.ts';
import { dbService, DatabaseStatus } from './services/db.ts';
import { checkScheduleConflict } from './utils/conflictChecker.ts';
import { Header } from './components/Header.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { MobileTabBar } from './components/MobileTabBar.tsx';
import { BlueprintModal } from './components/BlueprintModal.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { DatabaseModal } from './components/DatabaseModal.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';
import { QuickSearchModal } from './components/QuickSearchModal.tsx';
import { DEMO_QUERY_TIME } from './utils/progressCalculator.ts';

import { DashboardView } from './views/DashboardView.tsx';
import { ProjectsView } from './views/ProjectsView.tsx';
import { ProjectDetailView } from './views/ProjectDetailView.tsx';
import { AssignmentView } from './views/AssignmentView.tsx';
import { WorkLogView } from './views/WorkLogView.tsx';
import { TechnicalDocsView } from './views/TechnicalDocsView.tsx';
import { StaffView } from './views/StaffView.tsx';
import { AdminView } from './views/AdminView.tsx';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('nmh_auth_status') !== 'logged_out';
  });
  const [accounts, setAccounts] = useState<UserAccount[]>(() => dbService.getAccounts());
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('nmh_logged_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    const list = dbService.getAccounts();
    return list.find(a => a.username === 'qly.bao') || list.find(a => a.role === 'QUAN_LY') || list[0];
  });

  const getLandingTabForUser = (user: UserAccount): ActiveTab => {
    const role = user.role;
    if (role === 'admin' || role === 'QUAN_TRI') return 'admin';
    if (role === 'team_lead' || role === 'DOI_TRUONG') return 'my_tasks';
    if (role === 'director' || role === 'BAN_GIAM_DOC') return 'reports';
    return 'projects'; // QUAN_LY / manager
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('nmh_logged_user');
      if (saved) return getLandingTabForUser(JSON.parse(saved));
    } catch {}
    return 'projects';
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDocForViewer, setSelectedDocForViewer] = useState<TechDoc | null>(null);
  const [draftAssignment, setDraftAssignment] = useState<{ projectId: string; stage?: TaskStage; taskId?: string } | undefined>(undefined);

  // Persistent business data state
  const [projects, setProjects] = useState<Project[]>(() => dbService.getProjects());
  const [tasks, setTasks] = useState<Task[]>(() => dbService.getTasks());
  const [staff, setStaff] = useState<Staff[]>(() => dbService.getStaff());
  const [assignments, setAssignments] = useState<Assignment[]>(() => dbService.getAssignments());
  const [leaves, setLeaves] = useState<StaffLeave[]>(() => dbService.getLeaves());
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(() => dbService.getWorkLogs());
  const [docs, setDocs] = useState<TechDoc[]>(() => dbService.getDocs());
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  const refreshDbStatus = async () => {
    try {
      const status = await dbService.getDatabaseStatus();
      setDbStatus(status);
      if (status.connected && status.hasCoreTables) {
        const [dbProjects, dbTasks, dbStaff, dbAssignments, dbLeaves, dbWorkLogs, dbDocs, dbAccounts] = await Promise.all([
          dbService.fetchProjectsFromDB(),
          dbService.fetchTasksFromDB(),
          dbService.fetchStaffFromDB(),
          dbService.fetchAssignmentsFromDB(),
          dbService.fetchLeavesFromDB(),
          dbService.fetchWorkLogsFromDB(),
          dbService.fetchDocsFromDB(),
          dbService.fetchAccountsFromDB(),
        ]);
        if (dbProjects) setProjects(dbProjects);
        if (dbTasks) setTasks(dbTasks);
        if (dbStaff) setStaff(dbStaff);
        if (dbAssignments) setAssignments(dbAssignments);
        if (dbLeaves) setLeaves(dbLeaves);
        if (dbWorkLogs) setWorkLogs(dbWorkLogs);
        if (dbDocs) setDocs(dbDocs);
        if (dbAccounts) setAccounts(dbAccounts);
      }
    } catch (err) {
      console.warn('Database status check failed:', err);
    }
  };

  useEffect(() => {
    refreshDbStatus();
  }, []);

  // Automatically sync state to persistent storage on every change
  useEffect(() => { dbService.saveProjects(projects); }, [projects]);
  useEffect(() => { dbService.saveTasks(tasks); }, [tasks]);
  useEffect(() => { dbService.saveStaff(staff); }, [staff]);
  useEffect(() => { dbService.saveAssignments(assignments); }, [assignments]);
  useEffect(() => { dbService.saveLeaves(leaves); }, [leaves]);
  useEffect(() => { dbService.saveWorkLogs(workLogs); }, [workLogs]);
  useEffect(() => { dbService.saveDocs(docs); }, [docs]);
  useEffect(() => { dbService.saveAccounts(accounts); }, [accounts]);

  // Authentication & Role Switching
  const handleLogin = (userOrRole: UserAccount | UserRole) => {
    let targetUser: UserAccount | undefined;
    if (typeof userOrRole === 'object' && userOrRole !== null && 'id' in userOrRole) {
      targetUser = userOrRole;
    } else {
      const roleStr = String(userOrRole);
      targetUser = accounts.find(a => 
        a.role === roleStr ||
        (roleStr === 'manager' && (a.role === 'QUAN_LY' || a.role === 'manager')) ||
        (roleStr === 'team_lead' && (a.role === 'DOI_TRUONG' || a.role === 'team_lead')) ||
        (roleStr === 'director' && (a.role === 'BAN_GIAM_DOC' || a.role === 'director')) ||
        (roleStr === 'admin' && (a.role === 'QUAN_TRI' || a.role === 'admin'))
      );
    }
    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem('nmh_logged_user', JSON.stringify(targetUser));
      localStorage.setItem('nmh_auth_status', 'logged_in');
      setActiveTab(getLandingTabForUser(targetUser));
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setSelectedProjectId(null);
    setSelectedDocForViewer(null);
    setDraftAssignment(undefined);
    setIsAuthenticated(false);
    localStorage.setItem('nmh_auth_status', 'logged_out');
  };

  const handleAccountSwitch = (account: UserAccount) => {
    setCurrentUser(account);
    localStorage.setItem('nmh_logged_user', JSON.stringify(account));
    localStorage.setItem('nmh_auth_status', 'logged_in');
    setSelectedProjectId(null);
    setActiveTab(getLandingTabForUser(account));
  };

  const handleRoleSwitch = (role: UserRole) => {
    const matched = accounts.find(a => a.role === role);
    if (matched) {
      handleAccountSwitch(matched);
    } else {
      const fallbackAccount: UserAccount = {
        id: `u-${role}`,
        name: role === 'admin' ? 'Quản trị viên' : role === 'manager' ? 'Giám đốc QLDA' : role === 'team_lead' ? 'Chỉ huy công trình' : 'Ban Giám Đốc',
        email: `${role}@nmh.vn`,
        role,
        isActive: true
      };
      handleAccountSwitch(fallbackAccount);
    }
  };

  // Document download handler
  const handleDownloadDoc = (doc: TechDoc) => {
    const content = `CÔNG TY TNHH ĐẦU TƯ VÀ PHÁT TRIỂN NMH\n` +
      `NMH DATA CENTER NETWORK - HỒ SƠ KỸ THUẬT\n` +
      `-----------------------------------------\n` +
      `Tên tệp: ${doc.name}\n` +
      `Loại tài liệu: ${doc.type}\n` +
      `Phiên bản: ${doc.version}\n` +
      `Ngày ban hành: ${doc.date}\n` +
      `Quy mô: ${doc.floorArea || 'N/A'} - Cao độ: ${doc.elevation || 'N/A'}\n\n` +
      `GHI CHÚ THIẾT KẾ KỸ THUẬT:\n` +
      (doc.blueprintDetails?.architecturalNotes.map(n => `- ${n}`).join('\n') || 'Không có ghi chú thêm.');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name || doc.title || 'ho-so-ky-thuat.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Add Assignment with real-time conflict checking
  const handleAddAssignment = (newAsg: Omit<Assignment, 'id' | 'createdAt'>) => {
    const conflict = checkScheduleConflict(
      newAsg.staffId,
      newAsg.startDate,
      newAsg.endDate,
      assignments,
      leaves
    );

    if (conflict.hasConflict) {
      return { success: false, message: conflict.message };
    }

    const created: Assignment = {
      ...newAsg,
      id: `asg-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAssignments(prev => [created, ...prev]);
    return { success: true };
  };

  const handleCancelAssignment = (asgId: string) => {
    setAssignments(prev => prev.map(a => a.id === asgId ? { ...a, status: 'cancelled' } : a));
  };

  // Task Status Update
  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status'], resultSummary?: string) => {
    const today = new Date().toISOString().split('T')[0];
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          resultSummary: resultSummary !== undefined ? resultSummary : t.resultSummary,
          lastUpdated: today,
          completedAt: newStatus === 'done' ? today : t.completedAt,
          approvedBy: newStatus === 'done' ? currentUser.name : t.approvedBy
        };
      }
      return t;
    }));
  };

  // Add WorkLog & Manager Approval
  const handleAddWorkLog = (newLog: Omit<WorkLog, 'id' | 'submittedAt'>) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0] + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const created: WorkLog = {
      ...newLog,
      id: `wl-${Date.now()}`,
      submittedAt: dateStr
    };
    setWorkLogs(prev => [created, ...prev]);
  };

  const handleApproveWorkLog = (logId: string) => {
    const log = workLogs.find(l => l.id === logId);
    if (!log) return;

    // Approve the log
    setWorkLogs(prev => prev.map(l => l.id === logId ? { ...l, statusVerifiedByManager: true } : l));

    // Update the task to completed!
    handleUpdateTaskStatus(log.taskId, 'done', `Đã nghiệm thu theo nhật ký: ${log.completedVolume || log.content}`);
  };

  // Add staff & toggle status
  const handleAddStaff = (newStaff: Omit<Staff, 'id'>) => {
    const created: Staff = {
      ...newStaff,
      id: `s${staff.length + 1}`
    };
    setStaff(prev => [...prev, created]);
  };

  const handleToggleStaffStatus = (staffId: string) => {
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, isActive: !s.isActive } : s));
  };

  // Add Project & Task
  const handleAddProject = (newPrj: Omit<Project, 'id'>) => {
    const created: Project = {
      ...newPrj,
      id: `p-${Date.now()}`
    };
    setProjects(prev => [created, ...prev]);
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'lastUpdated'>) => {
    const today = new Date().toISOString().split('T')[0];
    const created: Task = {
      ...newTask,
      id: `t-${Date.now()}`,
      lastUpdated: today
    };
    setTasks(prev => [...prev, created]);
  };

  // Add Tech Doc
  const handleUploadDoc = (newDoc: Omit<TechDoc, 'id' | 'date'>) => {
    const today = new Date().toISOString().split('T')[0];
    const created: TechDoc = {
      ...newDoc,
      id: `doc-${Date.now()}`,
      date: today
    };
    setDocs(prev => [created, ...prev]);
  };

  // Add Leave & Cancel Leave
  const handleAddLeave = (newLeave: Omit<StaffLeave, 'id' | 'recordedAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const created: StaffLeave = {
      ...newLeave,
      id: `l-${Date.now()}`,
      recordedAt: today
    };
    setLeaves(prev => [created, ...prev]);
  };

  const handleCancelLeave = (leaveId: string) => {
    setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status: 'cancelled' } : l));
  };

  // Admin Account actions
  const handleUpdateRole = (userId: string, newRole: UserRole) => {
    setAccounts(prev => prev.map(a => a.id === userId ? { ...a, role: newRole } : a));
  };

  const handleToggleAccountLock = (userId: string, reason?: string) => {
    setAccounts(prev => prev.map(a => a.id === userId ? { ...a, isActive: !a.isActive, lockReason: reason } : a));
  };

  const handleUpdateAccountScope = (userId: string, projectIds: string[]) => {
    setAccounts(prev => prev.map(a => a.id === userId ? { ...a, assignedProjectIds: projectIds } : a));
  };

  const handleResetPassword = (userId: string) => {
    // Password reset notification
  };

  const handleCreateAccount = (newAcc: Omit<UserAccount, 'id'>) => {
    const created: UserAccount = {
      ...newAcc,
      id: `u-${Date.now()}`
    };
    setAccounts(prev => [...prev, created]);
  };

  // Counts for notifications & sidebar badges
  const pendingWorkLogs = workLogs.filter(w => w.requestApproval && !w.statusVerifiedByManager).length;
  const currentProject = projects.find(p => p.id === selectedProjectId);

  const overdueCount = tasks.filter(t => {
    if (t.status === 'HOAN_THANH' || t.status === 'HUY' || t.status === 'done' || t.status === 'cancelled') return false;
    return new Date(t.dueDate).getTime() < new Date(DEMO_QUERY_TIME).getTime();
  }).length;

  const upcomingCount = tasks.filter(t => {
    if (t.status === 'HOAN_THANH' || t.status === 'HUY' || t.status === 'done' || t.status === 'cancelled') return false;
    const due = new Date(t.dueDate).getTime();
    const ref = new Date(DEMO_QUERY_TIME).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return due >= ref && due <= ref + sevenDays;
  }).length;

  const affectedAssignmentsCount = assignments.filter(a => {
    if (a.status !== 'HIEU_LUC' && a.status !== 'active') return false;
    return leaves.some(l => {
      if ((l.status !== 'HIEU_LUC' && l.status !== 'active') || l.staffId !== a.staffId) return false;
      const sA = new Date(a.startDate).getTime();
      const eA = new Date(a.endDate).getTime();
      const sL = new Date(l.startDate).getTime();
      const eL = new Date(l.endDate).getTime();
      return sA < eL && sL < eA;
    });
  }).length;

  const totalNotifications = overdueCount + upcomingCount + affectedAssignmentsCount;

  // Filter projects by user role and scope (P & G)
  const isManager = currentUser.role === 'QUAN_LY' || currentUser.role === 'manager';
  const isTeamLead = currentUser.role === 'DOI_TRUONG' || currentUser.role === 'team_lead';

  const visibleProjects = projects.filter(p => {
    if (isManager && currentUser.assignedProjectIds && currentUser.assignedProjectIds.length > 0) {
      return currentUser.assignedProjectIds.includes(p.id);
    }
    if (isTeamLead) {
      // Đội trưởng thấy các dự án chứa việc được giao cho mình
      const myStaffId = currentUser.staffId || '3';
      const hasMyTask = tasks.some(t => t.projectId === p.id && t.assigneeId === myStaffId);
      const hasMyAssignment = assignments.some(a => a.projectId === p.id && a.staffId === myStaffId && (a.status === 'HIEU_LUC' || a.status === 'active'));
      return hasMyTask || hasMyAssignment;
    }
    return true; // Ban giám đốc thấy toàn bộ 10 dự án
  });

  // If not authenticated, render LoginScreen
  if (!isAuthenticated) {
    return <LoginScreen accounts={accounts} onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Top Header */}
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
        {/* Sidebar on Desktop */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={selectedProjectId ? 'projects' : activeTab}
            onTabChange={(tab) => {
              setSelectedProjectId(null);
              setActiveTab(tab);
            }}
            currentUser={currentUser}
            counts={{
              projects: visibleProjects.length,
              tasks: tasks.length,
              docs: docs.length,
              staff: staff.length,
              pendingWorkLogs,
              conflicts: affectedAssignmentsCount
            }}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-24 md:pb-8">
          {selectedProjectId && currentProject ? (
            <ProjectDetailView
              project={currentProject}
              tasks={tasks}
              staff={staff}
              docs={docs}
              assignments={assignments}
              onBack={() => setSelectedProjectId(null)}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenAssignWithDraft={(pId, stage, tId) => {
                setSelectedProjectId(null);
                setDraftAssignment({ projectId: pId, stage, taskId: tId });
                setActiveTab('assignments');
              }}
              onViewDoc={(d) => setSelectedDocForViewer(d)}
              onAddTask={handleAddTask}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  projects={visibleProjects}
                  tasks={tasks}
                  staff={staff}
                  assignments={assignments}
                  onOpenProject={(pId) => setSelectedProjectId(pId)}
                  onOpenAssign={() => setActiveTab('assignments')}
                  onOpenDocs={() => setActiveTab('docs')}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsView
                  projects={visibleProjects}
                  tasks={tasks}
                  staff={staff}
                  onSelectProject={(pId) => setSelectedProjectId(pId)}
                  onAddProject={handleAddProject}
                />
              )}

              {(activeTab === 'assignments' || activeTab === 'leaves') && (
                <AssignmentView
                  projects={visibleProjects}
                  tasks={tasks}
                  staff={staff}
                  assignments={assignments}
                  leaves={leaves}
                  draftSelection={draftAssignment}
                  onAddAssignment={handleAddAssignment}
                  onCancelAssignment={handleCancelAssignment}
                  onAddLeave={handleAddLeave}
                  onCancelLeave={handleCancelLeave}
                />
              )}

              {(activeTab === 'worklogs' || activeTab === 'my_tasks' || activeTab === 'tasks') && (
                <WorkLogView
                  workLogs={workLogs}
                  projects={visibleProjects}
                  tasks={tasks}
                  staff={staff}
                  currentUser={currentUser}
                  onAddWorkLog={handleAddWorkLog}
                  onApproveWorkLog={handleApproveWorkLog}
                />
              )}

              {activeTab === 'docs' && (
                <TechnicalDocsView
                  docs={docs}
                  projects={visibleProjects}
                  onOpenDocViewer={(d) => setSelectedDocForViewer(d)}
                  onDownloadDoc={handleDownloadDoc}
                  onUploadDoc={handleUploadDoc}
                />
              )}

              {activeTab === 'staff' && (
                <StaffView
                  staff={staff}
                  assignments={assignments}
                  onAddStaff={handleAddStaff}
                  onToggleStaffStatus={handleToggleStaffStatus}
                />
              )}

              {activeTab === 'clients' && (
                <ProjectsView
                  projects={visibleProjects}
                  tasks={tasks}
                  staff={staff}
                  onSelectProject={(pId) => setSelectedProjectId(pId)}
                  onAddProject={handleAddProject}
                />
              )}

              {activeTab === 'reports' && (
                <DashboardView
                  projects={visibleProjects}
                  tasks={tasks}
                  staff={staff}
                  assignments={assignments}
                  onOpenProject={(pId) => setSelectedProjectId(pId)}
                  onOpenAssign={() => setActiveTab('assignments')}
                  onOpenDocs={() => setActiveTab('docs')}
                />
              )}

              {(activeTab === 'admin' || activeTab === 'scope' || activeTab === 'config' || activeTab === 'audit') && (
                <AdminView
                  accounts={accounts}
                  staff={staff}
                  projects={projects}
                  currentUser={currentUser}
                  initialTab={activeTab === 'scope' ? 'scope' : activeTab === 'config' ? 'config' : activeTab === 'audit' ? 'audit' : 'accounts'}
                  onUpdateRole={handleUpdateRole}
                  onToggleAccountLock={handleToggleAccountLock}
                  onResetPassword={handleResetPassword}
                  onCreateAccount={handleCreateAccount}
                  onUpdateAccountScope={handleUpdateAccountScope}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar
        activeTab={selectedProjectId ? 'projects' : activeTab}
        onTabChange={(tab) => {
          setSelectedProjectId(null);
          setActiveTab(tab);
        }}
        currentUser={currentUser}
      />

      {/* COM-01: Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        tasks={tasks}
        projects={visibleProjects}
        assignments={assignments}
        leaves={leaves}
        onSelectTask={(taskId, projectId) => {
          setSelectedProjectId(projectId);
        }}
        onSelectAffectedAssignments={() => {
          setActiveTab('assignments');
        }}
      />

      {/* COM-02: Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        projects={visibleProjects}
        tasks={tasks}
        staff={staff}
        docs={docs}
        onSelectProject={(projectId) => {
          setSelectedProjectId(projectId);
        }}
        onSelectTask={(taskId, projectId) => {
          setSelectedProjectId(projectId);
        }}
        onSelectStaff={(staffId) => {
          setActiveTab('staff');
        }}
        onSelectDoc={(doc) => {
          setSelectedDocForViewer(doc);
        }}
      />

      {/* CAD / PDF Blueprint Modal (DC-02a) */}
      {selectedDocForViewer && (
        <BlueprintModal
          doc={selectedDocForViewer}
          onClose={() => setSelectedDocForViewer(null)}
          onDownload={handleDownloadDoc}
        />
      )}

      {/* Database Connection & Render Deployment Modal */}
      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        status={dbStatus}
        onRefreshStatus={refreshDbStatus}
      />
    </div>
  );
}
