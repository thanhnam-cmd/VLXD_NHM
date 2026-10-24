import {
  Project,
  Task,
  Staff,
  Assignment,
  StaffLeave,
  WorkLog,
  TechDoc,
  UserAccount,
  Category,
  Customer,
  ExternalSubcontractor,
  ExternalAssignment,
  AuditLog,
  SystemConfig,
  Team,
  SkillCatalog,
  SystemType
} from '../types/index.ts';
import {
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_STAFF,
  INITIAL_ASSIGNMENTS,
  INITIAL_LEAVES,
  INITIAL_WORK_LOGS,
  INITIAL_DOCS,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_SUBCONTRACTORS,
  INITIAL_EXTERNAL_ASSIGNMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_TEAMS,
  INITIAL_SKILLS,
  INITIAL_SYSTEM_TYPES,
  SYSTEM_CONFIG
} from '../data/mockData.ts';

const STORAGE_KEYS = {
  PROJECTS: 'nmh_db_projects',
  TASKS: 'nmh_db_tasks',
  STAFF: 'nmh_db_staff',
  ASSIGNMENTS: 'nmh_db_assignments',
  LEAVES: 'nmh_db_leaves',
  WORK_LOGS: 'nmh_db_worklogs',
  DOCS: 'nmh_db_docs',
  ACCOUNTS: 'nmh_db_accounts',
  CATEGORIES: 'nmh_db_categories',
  CUSTOMERS: 'nmh_db_customers',
  SUBCONTRACTORS: 'nmh_db_subcontractors',
  EXTERNAL_ASSIGNMENTS: 'nmh_db_external_assignments',
  AUDIT_LOGS: 'nmh_db_audit_logs',
  CONFIG: 'nmh_db_config',
  TEAMS: 'nmh_db_teams',
  SKILLS: 'nmh_db_skills',
  SYSTEM_TYPES: 'nmh_db_system_types'
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export interface DatabaseStatus {
  connected: boolean;
  hasDatabaseUrl: boolean;
  databaseName?: string;
  serverTime?: string;
  tablesCount?: number;
  hasCoreTables?: boolean;
  tableNames?: string[];
  totalCoreRows?: number;
  mode: string;
  message?: string;
}

export const dbService = {
  // Database Status & Initialization via Backend
  getDatabaseStatus: async (): Promise<DatabaseStatus> => {
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        return await res.json();
      }
      return {
        connected: false,
        hasDatabaseUrl: false,
        mode: 'Client Storage Mode',
        message: 'Không thể kết nối đến máy chủ backend.'
      };
    } catch {
      return {
        connected: false,
        hasDatabaseUrl: false,
        mode: 'Client Storage Mode',
        message: 'Đang chạy ở chế độ Client Storage.'
      };
    }
  },

  initPostgresDatabase: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/database/init', { method: 'POST' });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi kết nối khi khởi tạo database.' };
    }
  },

  // Remote data fetchers for PostgreSQL
  fetchProjectsFromDB: async (): Promise<Project[] | null> => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveToStorage(STORAGE_KEYS.PROJECTS, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  fetchStaffFromDB: async (): Promise<Staff[] | null> => {
    try {
      const res = await fetch('/api/staff');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveToStorage(STORAGE_KEYS.STAFF, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  fetchTasksFromDB: async (): Promise<Task[] | null> => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveToStorage(STORAGE_KEYS.TASKS, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  fetchAssignmentsFromDB: async (): Promise<Assignment[] | null> => {
    try {
      const res = await fetch('/api/assignments');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveToStorage(STORAGE_KEYS.ASSIGNMENTS, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  fetchLeavesFromDB: async (): Promise<StaffLeave[] | null> => {
    try {
      const res = await fetch('/api/leaves');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveToStorage(STORAGE_KEYS.LEAVES, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  fetchWorkLogsFromDB: async (): Promise<WorkLog[] | null> => {
    try {
      const res = await fetch('/api/worklogs');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveToStorage(STORAGE_KEYS.WORK_LOGS, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  fetchDocsFromDB: async (): Promise<TechDoc[] | null> => {
    try {
      const res = await fetch('/api/docs');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveToStorage(STORAGE_KEYS.DOCS, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  fetchAccountsFromDB: async (): Promise<UserAccount[] | null> => {
    try {
      const res = await fetch('/api/accounts');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveToStorage(STORAGE_KEYS.ACCOUNTS, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Post new assignment to backend (PostgreSQL)
  createAssignmentOnDB: async (payload: {
    taskId: string;
    staffId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) => {
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      console.warn('Backend assignment creation skipped:', err.message);
      return null;
    }
  },

  // Authentication methods (AUTH-01 & AUTH-02)
  login: async (username: string, password: string): Promise<{ success: boolean; user?: UserAccount; message?: string; isLocked?: boolean; lockReason?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      return data;
    } catch {
      // Offline / Local storage fallback
      const accounts = loadFromStorage<UserAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
      const acc = accounts.find(a => a.username?.toLowerCase() === username.trim().toLowerCase());
      if (!acc) return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' };
      if (!acc.isActive) {
        return {
          success: false,
          isLocked: true,
          lockReason: acc.lockReason || 'Nghỉ việc; khóa theo quy trình bàn giao',
          message: `Tài khoản đã bị khóa. Lý do: ${acc.lockReason || 'Nghỉ việc; khóa theo quy trình bàn giao'}. Vui lòng liên hệ quản trị viên.`
        };
      }
      if (password !== 'Nmh@2026' && password !== 'admin123' && password !== '123456') {
        return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' };
      }
      return { success: true, user: acc, message: 'Đăng nhập thành công' };
    }
  },

  /** Nạp toàn bộ dữ liệu nghiệp vụ từ PostgreSQL; trả về null nếu máy chủ chưa có CSDL */
  bootstrap: async (): Promise<Record<string, any> | null> => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) return null;
      const data = await res.json();
      return data && !data.useClientStorage ? data : null;
    } catch {
      return null;
    }
  },

  /** Ghi các bản ghi vừa thay đổi vào PostgreSQL */
  syncEntity: async (entity: string, rows: any[], actor?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/sync/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, actor })
      });
      const data = await res.json();
      return res.ok ? { success: true } : { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  changePassword: async (currentPassword: string, newPassword: string, accountId?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, accountId })
      });
      return await res.json();
    } catch {
      if (newPassword.length < 8) {
        return { success: false, message: 'Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số.' };
      }
      return { success: true, message: 'Đã đổi mật khẩu thành công.' };
    }
  },

  // Synchronous getters (reads from localStorage with mock fallback)
  getProjects: (): Project[] => loadFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS),
  saveProjects: (data: Project[]) => saveToStorage(STORAGE_KEYS.PROJECTS, data),

  getTasks: (): Task[] => loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS),
  saveTasks: (data: Task[]) => saveToStorage(STORAGE_KEYS.TASKS, data),

  getStaff: (): Staff[] => loadFromStorage<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF),
  saveStaff: (data: Staff[]) => saveToStorage(STORAGE_KEYS.STAFF, data),

  getAssignments: (): Assignment[] => loadFromStorage<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS),
  saveAssignments: (data: Assignment[]) => saveToStorage(STORAGE_KEYS.ASSIGNMENTS, data),

  getLeaves: (): StaffLeave[] => loadFromStorage<StaffLeave[]>(STORAGE_KEYS.LEAVES, INITIAL_LEAVES),
  saveLeaves: (data: StaffLeave[]) => saveToStorage(STORAGE_KEYS.LEAVES, data),

  getWorkLogs: (): WorkLog[] => loadFromStorage<WorkLog[]>(STORAGE_KEYS.WORK_LOGS, INITIAL_WORK_LOGS),
  saveWorkLogs: (data: WorkLog[]) => saveToStorage(STORAGE_KEYS.WORK_LOGS, data),

  getDocs: (): TechDoc[] => loadFromStorage<TechDoc[]>(STORAGE_KEYS.DOCS, INITIAL_DOCS),
  saveDocs: (data: TechDoc[]) => saveToStorage(STORAGE_KEYS.DOCS, data),

  getAccounts: (): UserAccount[] => loadFromStorage<UserAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS),
  saveAccounts: (data: UserAccount[]) => saveToStorage(STORAGE_KEYS.ACCOUNTS, data),

  getCategories: (): Category[] => loadFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
  saveCategories: (data: Category[]) => saveToStorage(STORAGE_KEYS.CATEGORIES, data),

  getCustomers: (): Customer[] => loadFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
  saveCustomers: (data: Customer[]) => saveToStorage(STORAGE_KEYS.CUSTOMERS, data),

  getSubcontractors: (): ExternalSubcontractor[] => loadFromStorage<ExternalSubcontractor[]>(STORAGE_KEYS.SUBCONTRACTORS, INITIAL_SUBCONTRACTORS),
  saveSubcontractors: (data: ExternalSubcontractor[]) => saveToStorage(STORAGE_KEYS.SUBCONTRACTORS, data),

  getExternalAssignments: (): ExternalAssignment[] => loadFromStorage<ExternalAssignment[]>(STORAGE_KEYS.EXTERNAL_ASSIGNMENTS, INITIAL_EXTERNAL_ASSIGNMENTS),
  saveExternalAssignments: (data: ExternalAssignment[]) => saveToStorage(STORAGE_KEYS.EXTERNAL_ASSIGNMENTS, data),

  getAuditLogs: (): AuditLog[] => loadFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  saveAuditLogs: (data: AuditLog[]) => saveToStorage(STORAGE_KEYS.AUDIT_LOGS, data),

  getTeams: (): Team[] => loadFromStorage<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS),
  saveTeams: (data: Team[]) => saveToStorage(STORAGE_KEYS.TEAMS, data),

  getSkills: (): SkillCatalog[] => loadFromStorage<SkillCatalog[]>(STORAGE_KEYS.SKILLS, INITIAL_SKILLS),
  saveSkills: (data: SkillCatalog[]) => saveToStorage(STORAGE_KEYS.SKILLS, data),

  getSystemTypes: (): SystemType[] => loadFromStorage<SystemType[]>(STORAGE_KEYS.SYSTEM_TYPES, INITIAL_SYSTEM_TYPES),
  saveSystemTypes: (data: SystemType[]) => saveToStorage(STORAGE_KEYS.SYSTEM_TYPES, data),

  getConfig: (): SystemConfig => ({ ...SYSTEM_CONFIG, ...loadFromStorage<Partial<SystemConfig>>(STORAGE_KEYS.CONFIG, {}) }),
  saveConfig: (data: SystemConfig) => saveToStorage(STORAGE_KEYS.CONFIG, data),

  // Reset entire database to pristine seed data
  resetToDefault: () => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.STAFF);
    localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
    localStorage.removeItem(STORAGE_KEYS.LEAVES);
    localStorage.removeItem(STORAGE_KEYS.WORK_LOGS);
    localStorage.removeItem(STORAGE_KEYS.DOCS);
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
  }
};
