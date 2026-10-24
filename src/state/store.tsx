import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Project,
  Task,
  Staff,
  Assignment,
  StaffLeave,
  WorkLog,
  TechDoc,
  TechDocVersion,
  UserAccount,
  UserRole,
  Category,
  Customer,
  ExternalSubcontractor,
  ExternalAssignment,
  ExternalDailyStaffing,
  AuditLog,
  AuditAction,
  SystemConfig,
  Team,
  SkillCatalog,
  SystemType,
  ProjectStatus,
  TaskStatus
} from '../types/index.ts';
import { dbService } from '../services/db.ts';
import { DEMO_QUERY_TIME, applyQueryConfig } from '../utils/progressCalculator.ts';
import {
  normalizeProject,
  normalizeTask,
  normalizeAssignment,
  normalizeLeave,
  normalizeAccount,
  normalizeRole,
  formatDate,
  formatDateTime,
  overlaps,
  toTime,
  nowDb,
  newId,
  isRecordActive,
  isAdminRole,
  isManagerRole,
  isTeamLeadRole,
  isDirectorRole,
  projectAcceptsAssignments,
  projectAcceptsTasks,
  isTaskOpen,
  PROJECT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  ROLE_LABEL
} from '../utils/domain.ts';

export interface OpResult<T = any> {
  ok: boolean;
  message: string;
  data?: T;
}

const ok = <T,>(message: string, data?: T): OpResult<T> => ({ ok: true, message, data });
const fail = (message: string): OpResult => ({ ok: false, message });

/** Kết quả kiểm tra xung đột của một nhân sự (MH-09, thành phần 10) */
export interface ConflictItem {
  type: 'assignment' | 'leave';
  message: string;
  recordId: string;
}

const useStoreState = () => {
  // ---------- Dữ liệu nền ----------
  const [config, setConfig] = useState<SystemConfig>(() => dbService.getConfig());
  applyQueryConfig(config.evaluationTimestamp, config.upcomingThresholdDays);

  const [accounts, setAccounts] = useState<UserAccount[]>(() => dbService.getAccounts().map(normalizeAccount));
  const [projects, setProjects] = useState<Project[]>(() => dbService.getProjects().map(normalizeProject));
  const [tasks, setTasks] = useState<Task[]>(() => dbService.getTasks().map(normalizeTask));
  const [staff, setStaff] = useState<Staff[]>(() => dbService.getStaff());
  const [assignments, setAssignments] = useState<Assignment[]>(() => dbService.getAssignments().map(normalizeAssignment));
  const [leaves, setLeaves] = useState<StaffLeave[]>(() => dbService.getLeaves().map(normalizeLeave));
  // Một số bản ghi mẫu thiếu projectId: suy ra từ công việc để lọc đúng phạm vi
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(() => {
    const allTasks = dbService.getTasks();
    return dbService.getWorkLogs().map(w => ({ ...w, projectId: w.projectId || String(allTasks.find(t => String(t.id) === String(w.taskId))?.projectId || '') }));
  });
  const [docs, setDocs] = useState<TechDoc[]>(() => dbService.getDocs());
  const [categories, setCategories] = useState<Category[]>(() => dbService.getCategories());
  const [customers, setCustomers] = useState<Customer[]>(() => dbService.getCustomers());
  const [subcontractors, setSubcontractors] = useState<ExternalSubcontractor[]>(() => dbService.getSubcontractors());
  const [externalAssignments, setExternalAssignments] = useState<ExternalAssignment[]>(() => dbService.getExternalAssignments());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => dbService.getAuditLogs());
  const [teams, setTeams] = useState<Team[]>(() => dbService.getTeams());
  const [skills, setSkills] = useState<SkillCatalog[]>(() => dbService.getSkills());
  const [systemTypes, setSystemTypes] = useState<SystemType[]>(() => dbService.getSystemTypes());

  const [currentUser, setCurrentUserState] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('nmh_logged_user');
      if (saved) return normalizeAccount(JSON.parse(saved));
    } catch {}
    const list = dbService.getAccounts();
    return normalizeAccount(list.find(a => a.username === 'qly.bao') || list[0]);
  });

  useEffect(() => { dbService.saveProjects(projects); }, [projects]);
  useEffect(() => { dbService.saveTasks(tasks); }, [tasks]);
  useEffect(() => { dbService.saveStaff(staff); }, [staff]);
  useEffect(() => { dbService.saveAssignments(assignments); }, [assignments]);
  useEffect(() => { dbService.saveLeaves(leaves); }, [leaves]);
  useEffect(() => { dbService.saveWorkLogs(workLogs); }, [workLogs]);
  useEffect(() => { dbService.saveDocs(docs); }, [docs]);
  useEffect(() => { dbService.saveAccounts(accounts); }, [accounts]);
  useEffect(() => { dbService.saveCategories(categories); }, [categories]);
  useEffect(() => { dbService.saveCustomers(customers); }, [customers]);
  useEffect(() => { dbService.saveSubcontractors(subcontractors); }, [subcontractors]);
  useEffect(() => { dbService.saveExternalAssignments(externalAssignments); }, [externalAssignments]);
  useEffect(() => { dbService.saveAuditLogs(auditLogs); }, [auditLogs]);
  useEffect(() => { dbService.saveConfig(config); }, [config]);
  useEffect(() => { dbService.saveTeams(teams); }, [teams]);
  useEffect(() => { dbService.saveSkills(skills); }, [skills]);
  useEffect(() => { dbService.saveSystemTypes(systemTypes); }, [systemTypes]);

  // Giữ thông tin tài khoản đang đăng nhập khớp với danh sách tài khoản (đổi phạm vi, đổi tên...)
  useEffect(() => {
    const fresh = accounts.find(a => a.id === currentUser.id);
    if (fresh && JSON.stringify(fresh) !== JSON.stringify(currentUser)) {
      setCurrentUserState(fresh);
      localStorage.setItem('nmh_logged_user', JSON.stringify(fresh));
    }
  }, [accounts]);

  const setCurrentUser = (u: UserAccount) => {
    const n = normalizeAccount(u);
    setCurrentUserState(n);
    localStorage.setItem('nmh_logged_user', JSON.stringify(n));
  };

  // ---------- Chế độ CSDL PostgreSQL thật ----------
  const [dbMode, setDbMode] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const snapshots = useRef<Record<string, Map<string, string>>>({});
  const pendingPasswords = useRef<Record<string, string>>({});

  /** Thay dữ liệu cục bộ bằng dữ liệu đọc từ PostgreSQL (GET /api/bootstrap) */
  const loadFromDatabase = (data: Record<string, any>) => {
    snapshots.current = {};
    if (data.projects) setProjects(data.projects.map(normalizeProject));
    if (data.tasks) setTasks(data.tasks.map(normalizeTask));
    if (data.staff) setStaff(data.staff);
    if (data.assignments) setAssignments(data.assignments.map(normalizeAssignment));
    if (data.leaves) setLeaves(data.leaves.map(normalizeLeave));
    if (data.workLogs) setWorkLogs(data.workLogs);
    if (data.docs) setDocs(data.docs);
    if (data.accounts) setAccounts(data.accounts.map(normalizeAccount));
    if (data.categories) setCategories(data.categories);
    if (data.customers) setCustomers(data.customers);
    if (data.subcontractors) setSubcontractors(data.subcontractors);
    if (data.externalAssignments) setExternalAssignments(data.externalAssignments);
    if (data.auditLogs) setAuditLogs(data.auditLogs);
    if (data.teams) setTeams(data.teams);
    if (data.skills) setSkills(data.skills);
    if (data.systemTypes) setSystemTypes(data.systemTypes);
    if (data.config) setConfig(prev => ({ ...prev, ...data.config, updatedAt: { ...(prev.updatedAt || {}), ...(data.config.updatedAt || {}) } }));
    setDbMode(true);
  };

  /**
   * Sau khi nạp từ CSDL, mỗi lần dữ liệu đổi sẽ gửi các bản ghi vừa thêm/sửa lên máy chủ (POST /api/sync/:entity).
   * Lần chạy đầu chỉ ghi nhớ trạng thái vừa nạp, không gửi lại.
   */
  const useDbSync = (entity: string, rows: { id: string }[]) => {
    useEffect(() => {
      if (!dbMode) return;
      const snap = snapshots.current[entity];
      if (!snap) {
        snapshots.current[entity] = new Map(rows.map(r => [r.id, JSON.stringify(r)]));
        return;
      }
      const changed = rows.filter(r => snap.get(r.id) !== JSON.stringify(r));
      if (changed.length === 0) return;
      changed.forEach(r => snap.set(r.id, JSON.stringify(r)));
      const payload = entity === 'accounts'
        ? changed.map(r => (pendingPasswords.current[r.id] ? { ...r, _password: pendingPasswords.current[r.id] } : r))
        : changed;
      dbService.syncEntity(entity, payload, currentUser.username).then(res => {
        if (!res.success) {
          setSyncError(`Không lưu được vào CSDL (${entity}): ${res.error || 'lỗi kết nối'}`);
          changed.forEach(r => snap.delete(r.id));
          return;
        }
        setSyncError(null);
        if (entity === 'accounts') changed.forEach(r => { delete pendingPasswords.current[r.id]; });
      });
    }, [rows, dbMode]);
  };

  useDbSync('customers', customers);
  useDbSync('staff', staff);
  useDbSync('accounts', accounts);
  useDbSync('projects', projects);
  useDbSync('categories', categories);
  useDbSync('tasks', tasks);
  useDbSync('assignments', assignments);
  useDbSync('leaves', leaves);
  useDbSync('subcontractors', subcontractors);
  useDbSync('externalAssignments', externalAssignments);
  useDbSync('workLogs', workLogs);
  useDbSync('docs', docs);
  useDbSync('auditLogs', auditLogs);
  useDbSync('teams', teams);
  useDbSync('skills', skills);
  useDbSync('systemTypes', systemTypes);
  const configRows = useMemo(() => [{ ...config, id: 'config' }], [config]);
  useDbSync('config', configRows);

  const actor = () => currentUser.username || currentUser.name;
  const actorName = () => currentUser.name;
  const queryTime = () => DEMO_QUERY_TIME;

  // ---------- Nhật ký thao tác (MH-21) ----------
  const logAudit = (action: AuditAction, objectType: string, objectId: string, reason?: string, oldVal?: any, newVal?: any) => {
    const entry: AuditLog = { id: newId(), time: nowDb(), user: actor(), action, objectType, objectId, reason, oldVal, newVal };
    setAuditLogs(prev => [entry, ...prev]);
  };

  // ---------- Phạm vi dữ liệu theo vai trò ----------
  const role = normalizeRole(currentUser.role);
  const myStaffId = currentUser.staffId;

  /** Công việc "được giao" cho Đội trưởng: phụ trách chính hoặc có phân công còn hiệu lực */
  const isTaskAssignedToMe = (t: Task) =>
    !!myStaffId && (t.assigneeId === myStaffId || assignments.some(a => a.taskId === t.id && a.staffId === myStaffId && isRecordActive(a)));

  const visibleProjects = useMemo(() => {
    if (role === 'QUAN_TRI' || role === 'BAN_GIAM_DOC') return projects;
    if (role === 'QUAN_LY') {
      const ids = currentUser.assignedProjectIds || [];
      return projects.filter(p => ids.includes(p.id));
    }
    // Đội trưởng: dự án có ít nhất một công việc được giao chưa Hủy
    return projects.filter(p => tasks.some(t => t.projectId === p.id && t.status !== 'HUY' && isTaskAssignedToMe(t)));
  }, [projects, tasks, assignments, currentUser, role]);

  const visibleProjectIds = useMemo(() => new Set(visibleProjects.map(p => p.id)), [visibleProjects]);

  const scoped = useMemo(() => ({
    tasks: tasks.filter(t => visibleProjectIds.has(t.projectId)),
    assignments: assignments.filter(a => visibleProjectIds.has(a.projectId)),
    workLogs: workLogs.filter(w => visibleProjectIds.has(w.projectId)),
    docs: docs.filter(d => visibleProjectIds.has(d.projectId)),
    categories: categories.filter(c => visibleProjectIds.has(c.projectId)),
    externalAssignments: externalAssignments.filter(e => visibleProjectIds.has(e.projectId || tasks.find(t => t.id === e.taskId)?.projectId || ''))
  }), [tasks, assignments, workLogs, docs, categories, externalAssignments, visibleProjectIds]);

  // ---------- Kiểm tra xung đột lịch (QC & MH-09) ----------
  const findConflicts = (staffId: string, start: string, end: string, excludeAssignmentId?: string, extraAssignments: Assignment[] = []): ConflictItem[] => {
    const person = staff.find(s => s.id === staffId);
    const name = person?.name || 'Nhân sự';
    const items: ConflictItem[] = [];
    [...assignments, ...extraAssignments].forEach(a => {
      if (a.id === excludeAssignmentId || a.staffId !== staffId || !isRecordActive(a)) return;
      if (!overlaps(start, end, a.startDate, a.endDate)) return;
      const t = tasks.find(x => x.id === a.taskId);
      const p = projects.find(x => x.id === a.projectId);
      const canSee = visibleProjectIds.has(a.projectId);
      items.push({
        type: 'assignment',
        recordId: a.id,
        message: canSee
          ? `${name} đã có phân công ${t?.code ? t.code + ' · ' : ''}${t?.title || a.taskName || ''} (${p?.code || a.projectCode || ''}) từ ${formatDateTime(a.startDate)} đến ${formatDateTime(a.endDate)}.`
          : `${name} đã có phân công khác trong khoảng này.`
      });
    });
    leaves.forEach(l => {
      if (l.staffId !== staffId || !isRecordActive(l)) return;
      if (!overlaps(start, end, l.startDate, l.endDate)) return;
      items.push({
        type: 'leave',
        recordId: l.id,
        message: `${name} có lịch nghỉ/bận từ ${formatDateTime(l.startDate)} đến ${formatDateTime(l.endDate)} (${l.reason}).`
      });
    });
    return items;
  };

  /** Phân công Hiệu lực bị một lịch nghỉ/bận Hiệu lực chưa kết thúc chồng lấn */
  const getAffectedAssignments = (leave?: StaffLeave) => {
    const q = toTime(queryTime());
    return assignments.filter(a => {
      if (!isRecordActive(a)) return false;
      return leaves.some(l => {
        if (leave && l.id !== leave.id) return false;
        if (!isRecordActive(l) || l.staffId !== a.staffId) return false;
        if (toTime(l.endDate) <= q) return false;
        return overlaps(a.startDate, a.endDate, l.startDate, l.endDate);
      });
    });
  };

  /**
   * Hệ quả G2 khi xác nhận hoàn thành hoặc hủy công việc/dự án:
   * phân công bắt đầu từ thời điểm xác nhận bị hủy, phân công đang diễn ra kết thúc tại thời điểm xác nhận.
   */
  const applyAssignmentCutoff = (taskIds: string[], reasonPrefix: string) => {
    const q = queryTime();
    const qt = toTime(q);
    const changes = new Map<string, Partial<Assignment>>();
    assignments.forEach(a => {
      if (!taskIds.includes(a.taskId) || !isRecordActive(a)) return;
      if (toTime(a.startDate) >= qt) {
        changes.set(a.id, { status: 'HUY', cancelledAt: q, cancelledBy: actorName(), cancelReason: reasonPrefix });
        logAudit('HUY', 'Phân công', a.id, `${reasonPrefix}: phân công bắt đầu từ thời điểm xác nhận`, { trang_thai: 'HIEU_LUC' }, { trang_thai: 'HUY' });
      } else if (toTime(a.endDate) > qt) {
        changes.set(a.id, { endDate: q });
        logAudit('KET_THUC_SOM', 'Phân công', a.id, `${reasonPrefix}: kết thúc khoảng đang diễn ra tại thời điểm xác nhận`, { ket_thuc: a.endDate }, { ket_thuc: q });
      }
    });
    if (changes.size > 0) setAssignments(prev => prev.map(a => changes.has(a.id) ? { ...a, ...changes.get(a.id) } : a));
  };

  const cancelExternalForTasks = (taskIds: string[], reason: string) => {
    const ids = externalAssignments.filter(e => taskIds.includes(e.taskId) && e.status === 'HIEU_LUC').map(e => e.id);
    ids.forEach(id => logAudit('HUY', 'Phần việc giao ngoài', id, reason, { trang_thai: 'HIEU_LUC' }, { trang_thai: 'HUY' }));
    if (ids.length > 0) setExternalAssignments(prev => prev.map(e => ids.includes(e.id) ? { ...e, status: 'HUY', cancelReason: reason, cancelledAt: queryTime() } : e));
  };

  // ---------- Khách hàng (MH-02) ----------
  const addCustomer = (c: Omit<Customer, 'id'>): OpResult<Customer> => {
    if (!c.code.trim() || !c.name.trim()) return fail('Vui lòng nhập mã và tên khách hàng.');
    if (customers.some(x => x.code.toLowerCase() === c.code.trim().toLowerCase())) return fail('Mã đã được sử dụng. Vui lòng chọn mã khác.');
    const created: Customer = { ...c, code: c.code.trim(), name: c.name.trim(), id: newId() };
    setCustomers(prev => [...prev, created]);
    logAudit('TAO_MOI', 'Khách hàng', created.id, undefined, null, { ma: created.code, ten: created.name });
    return ok(`Đã thêm khách hàng ${created.name}.`, created);
  };

  const updateCustomer = (id: string, c: Omit<Customer, 'id'>): OpResult => {
    if (!c.code.trim() || !c.name.trim()) return fail('Vui lòng nhập mã và tên khách hàng.');
    if (customers.some(x => x.id !== id && x.code.toLowerCase() === c.code.trim().toLowerCase())) return fail('Mã đã được sử dụng. Vui lòng chọn mã khác.');
    const old = customers.find(x => x.id === id);
    setCustomers(prev => prev.map(x => x.id === id ? { ...x, ...c, code: c.code.trim(), name: c.name.trim() } : x));
    // Tên khách hàng hiển thị trên dự án cũng cập nhật theo
    setProjects(prev => prev.map(p => p.clientId === id ? { ...p, clientName: c.name.trim(), client: c.name.trim() } : p));
    logAudit('DIEU_CHINH', 'Khách hàng', id, undefined, { ma: old?.code, ten: old?.name }, { ma: c.code, ten: c.name });
    return ok(`Đã lưu khách hàng ${c.name.trim()}.`);
  };

  // ---------- Danh mục: Tổ đội, Chuyên môn, Loại hệ thống ----------
  /** Thêm/sửa một mục danh mục có mã + tên; mã không trùng, không cho đổi mã khi sửa */
  const saveCatalogItem = <T extends { id: string; code: string; name: string }>(
    list: T[], setList: React.Dispatch<React.SetStateAction<T[]>>, label: string, data: Omit<T, 'id'>, editId?: string
  ): OpResult => {
    const lower = label.toLowerCase();
    if (!data.code.trim()) return fail(`Vui lòng nhập mã ${lower}.`);
    if (!data.name.trim()) return fail(`Vui lòng nhập tên ${lower}.`);
    if (list.some(x => x.id !== editId && x.code.toLowerCase() === data.code.trim().toLowerCase())) return fail('Mã đã được sử dụng. Vui lòng chọn mã khác.');
    if (list.some(x => x.id !== editId && x.name.trim().toLowerCase() === data.name.trim().toLowerCase())) return fail(`Tên ${lower} đã tồn tại.`);
    if (editId) {
      const old = list.find(x => x.id === editId);
      setList(prev => prev.map(x => x.id === editId ? { ...x, ...data, code: x.code, name: data.name.trim() } : x));
      logAudit('DIEU_CHINH', label, editId, undefined, { ten: old?.name }, { ten: data.name });
      return ok(`Đã lưu ${lower} ${data.name.trim()}.`);
    }
    const created = { ...data, code: data.code.trim(), name: data.name.trim(), id: newId() } as T;
    setList(prev => [...prev, created]);
    logAudit('TAO_MOI', label, created.id, undefined, null, { ma: created.code, ten: created.name });
    return ok(`Đã thêm ${lower} ${created.name}.`);
  };
  const saveTeam = (data: Omit<Team, 'id'>, editId?: string) => {
    const r = saveCatalogItem(teams, setTeams, 'Tổ đội', data, editId);
    // Đổi tên tổ đội thì tên đội trên hồ sơ nhân sự đổi theo
    if (r.ok && editId) setStaff(prev => prev.map(s => s.teamId === editId ? { ...s, teamName: data.name.trim() } : s));
    return r;
  };
  const saveSkill = (data: Omit<SkillCatalog, 'id'>, editId?: string) => saveCatalogItem(skills, setSkills, 'Chuyên môn', data, editId);
  const saveSystemType = (data: Omit<SystemType, 'id'>, editId?: string) => {
    const r = saveCatalogItem(systemTypes, setSystemTypes, 'Loại hệ thống', data, editId);
    if (r.ok && editId) setCategories(prev => prev.map(c => c.systemTypeId === editId ? { ...c, systemTypeName: data.name.trim() } : c));
    return r;
  };

  // ---------- Dự án (MH-02, MH-07, MH-08) ----------
  const createProject = (data: Omit<Project, 'id' | 'status'>): OpResult<Project> => {
    if (projects.some(p => p.code.toLowerCase() === data.code.trim().toLowerCase())) return fail('Mã đã được sử dụng. Vui lòng chọn mã khác.');
    const created: Project = { ...data, code: data.code.trim(), id: newId(), status: 'LAP_KE_HOACH', createdAt: nowDb() };
    setProjects(prev => [created, ...prev]);
    // Tự thêm vào phạm vi của chính tài khoản Quản lý đang tạo
    if (isManagerRole(currentUser)) {
      setAccounts(prev => prev.map(a => a.id === currentUser.id ? {
        ...a,
        assignedProjectIds: [...(a.assignedProjectIds || []), created.id],
        scopeGrants: { ...(a.scopeGrants || {}), [created.id]: { grantedBy: actor(), grantedAt: nowDb() } }
      } : a));
    }
    logAudit('TAO_MOI', 'Dự án', created.id, undefined, null, { ma_du_an: created.code, ten: created.name, trang_thai: 'LAP_KE_HOACH' });
    return ok(`Đã tạo dự án ${created.code}.`, created);
  };

  const updateProject = (id: string, data: Partial<Project>): OpResult => {
    const old = projects.find(p => p.id === id);
    if (!old) return fail('Không tìm thấy dự án.');
    const start = data.startDate ?? old.startDate;
    const end = data.dueDate ?? old.dueDate;
    const outside = tasks.filter(t => t.projectId === id && t.status !== 'HUY' && (toTime(t.startDate) < toTime(start) || toTime(t.dueDate) > toTime(end)));
    if (outside.length > 0) return fail(`Còn công việc nằm ngoài thời gian mới của dự án (${outside.map(t => t.code).join(', ')}). Hãy điều chỉnh công việc trước.`);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data, code: p.code } : p));
    const teamText = (list?: { contractorId: string; workerCount: number }[]) =>
      (list || []).map(x => `${subcontractors.find(c => c.id === x.contractorId)?.companyName || x.contractorId} (${x.workerCount} người)`).join('; ') || null;
    logAudit('DIEU_CHINH', 'Dự án', id, undefined,
      { ten: old.name, dia_diem: old.place, bat_dau: old.startDate, ket_thuc: old.dueDate, khach_hang: old.clientName, phu_trach: old.managerName, doi_khoan_ngoai: teamText(old.externalTeams) },
      { ten: data.name ?? old.name, dia_diem: data.place ?? old.place, bat_dau: start, ket_thuc: end, khach_hang: data.clientName ?? old.clientName, phu_trach: data.managerName ?? old.managerName, doi_khoan_ngoai: teamText(data.externalTeams ?? old.externalTeams) });
    return ok(`Đã lưu thay đổi dự án ${old.code}.`);
  };

  const markPasswordChanged = () => {
    setAccounts(prev => prev.map(a => a.id === currentUser.id ? { ...a, mustChangePassword: false } : a));
    setCurrentUserState(u => ({ ...u, mustChangePassword: false }));
    logAudit('DIEU_CHINH', 'Tài khoản', currentUser.id, 'Tự đổi mật khẩu', null, { doi_mat_khau: true });
  };

  const changeProjectStatus = (id: string, next: ProjectStatus, reason?: string): OpResult => {
    const p = projects.find(x => x.id === id);
    if (!p) return fail('Không tìm thấy dự án.');
    if (isDirectorRole(currentUser) || isTeamLeadRole(currentUser)) return fail('Bạn không có quyền thực hiện thao tác này.');
    const allowed: Record<string, string[]> = {
      LAP_KE_HOACH: ['DANG_THUC_HIEN', 'HUY'],
      DANG_THUC_HIEN: ['TAM_DUNG', 'HOAN_THANH', 'HUY'],
      TAM_DUNG: ['DANG_THUC_HIEN', 'HOAN_THANH', 'HUY']
    };
    if (!(allowed[p.status] || []).includes(next)) return fail('Chuyển trạng thái này không được phép.');

    const projTasks = tasks.filter(t => t.projectId === id);
    if (next === 'HOAN_THANH') {
      const valid = projTasks.filter(t => t.status !== 'HUY');
      if (valid.length === 0) return fail('Chưa thể xác nhận hoàn thành: dự án chưa có công việc hoàn thành.');
      const unfinished = valid.filter(t => t.status !== 'HOAN_THANH');
      if (unfinished.length > 0) return fail(`Chưa thể xác nhận hoàn thành: còn ${unfinished.length} công việc chưa hoàn thành.`);
      setProjects(prev => prev.map(x => x.id === id ? { ...x, status: 'HOAN_THANH', completedAt: queryTime(), completedBy: actorName() } : x));
      logAudit('XAC_NHAN_HOAN_THANH', 'Dự án', id, reason, { trang_thai: p.status }, { trang_thai: 'HOAN_THANH' });
      return ok(`Đã cập nhật trạng thái dự án ${p.code} thành Hoàn thành.`);
    }
    if (next === 'HUY') {
      if (!reason || !reason.trim()) return fail('Vui lòng nhập lý do hủy dự án.');
      const openIds = projTasks.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'HUY').map(t => t.id);
      setTasks(prev => prev.map(t => openIds.includes(t.id) ? { ...t, status: 'HUY', cancelledAt: queryTime(), cancelledBy: actorName(), cancelReason: `Hủy theo dự án: ${reason}` } : t));
      applyAssignmentCutoff(projTasks.map(t => t.id), 'Hủy dự án');
      cancelExternalForTasks(projTasks.map(t => t.id), `Hủy dự án: ${reason}`);
      setProjects(prev => prev.map(x => x.id === id ? { ...x, status: 'HUY', cancelledAt: queryTime(), cancelledBy: actorName(), cancelReason: reason } : x));
      logAudit('HUY', 'Dự án', id, reason, { trang_thai: p.status }, { trang_thai: 'HUY' });
      return ok(`Đã cập nhật trạng thái dự án ${p.code} thành Hủy.`);
    }
    setProjects(prev => prev.map(x => x.id === id ? { ...x, status: next } : x));
    logAudit('DOI_TRANG_THAI', 'Dự án', id, reason, { trang_thai: p.status }, { trang_thai: next });
    return ok(`Đã cập nhật trạng thái dự án ${p.code} thành ${PROJECT_STATUS_LABEL[next]}.`);
  };

  // ---------- Hạng mục (MH-08c) ----------
  const saveCategory = (data: Omit<Category, 'id'>, editId?: string): OpResult<Category> => {
    const p = projects.find(x => x.id === data.projectId);
    if (!editId && !projectAcceptsTasks(p)) return fail('Không thể thêm hạng mục vào dự án đã hoàn thành hoặc đã hủy.');
    if (!data.name.trim()) return fail('Vui lòng nhập tên hạng mục.');
    if (!data.systemTypeName) return fail('Vui lòng chọn loại hệ thống.');
    if (categories.some(c => c.projectId === data.projectId && c.id !== editId && c.code.toLowerCase() === data.code.trim().toLowerCase())) {
      return fail('Mã hạng mục đã được sử dụng trong dự án này.');
    }
    if (editId) {
      const old = categories.find(c => c.id === editId);
      setCategories(prev => prev.map(c => c.id === editId ? { ...c, ...data, code: c.code } : c));
      logAudit('DIEU_CHINH', 'Hạng mục', editId, undefined, { ten: old?.name, loai: old?.systemTypeName, thu_tu: old?.orderNum }, { ten: data.name, loai: data.systemTypeName, thu_tu: data.orderNum });
      return ok(`Đã lưu thay đổi hạng mục ${data.name}.`);
    }
    const created: Category = { ...data, code: data.code.trim(), id: newId() };
    setCategories(prev => [...prev, created]);
    logAudit('TAO_MOI', 'Hạng mục', created.id, undefined, null, { ma: created.code, ten: created.name });
    return ok(`Đã thêm hạng mục ${created.name}.`, created);
  };

  // ---------- Công việc (MH-08, MH-08a) ----------
  const saveTask = (data: Omit<Task, 'id' | 'status'>, editId?: string): OpResult<Task> => {
    const p = projects.find(x => x.id === data.projectId);
    if (!editId && !projectAcceptsTasks(p)) return fail('Không thể thêm công việc vào dự án đã hoàn thành hoặc đã hủy.');
    if (!data.categoryId) return fail('Vui lòng chọn hạng mục.');
    if (!data.title.trim()) return fail('Vui lòng nhập tên công việc.');
    if (!data.assigneeId) return fail('Vui lòng chọn người phụ trách chính.');
    if (!data.startDate) return fail('Vui lòng nhập ngày bắt đầu.');
    if (!data.dueDate) return fail('Vui lòng nhập hạn hoàn thành.');
    if (toTime(data.dueDate) < toTime(data.startDate)) return fail('Hạn hoàn thành không được trước ngày bắt đầu.');
    if (p && (toTime(data.startDate) < toTime(p.startDate) || toTime(data.dueDate) > toTime(p.dueDate))) {
      return fail(`Thời gian công việc phải nằm trong thời gian của dự án (${formatDate(p.startDate)} – ${formatDate(p.dueDate)}).`);
    }
    if (tasks.some(t => t.id !== editId && t.categoryId === data.categoryId && (t.code || '').toLowerCase() === (data.code || '').trim().toLowerCase())) {
      return fail('Mã công việc đã được sử dụng trong hạng mục này.');
    }
    const cat = categories.find(c => c.id === data.categoryId);
    const assignee = staff.find(s => s.id === data.assigneeId);
    if (editId) {
      const old = tasks.find(t => t.id === editId);
      const outside = assignments.filter(a => a.taskId === editId && isRecordActive(a) && (toTime(a.startDate) < toTime(data.startDate) || toTime(a.endDate) > toTime(data.dueDate)));
      if (outside.length > 0) return fail('Còn phân công nằm ngoài thời gian mới của công việc. Hãy điều chỉnh hoặc hủy phân công trước.');
      setTasks(prev => prev.map(t => t.id === editId ? { ...t, ...data, code: t.code, categoryCode: cat?.code, assigneeName: assignee?.name, lastUpdated: nowDb() } : t));
      logAudit('DIEU_CHINH', 'Công việc', editId, undefined,
        { ten: old?.title, bat_dau: old?.startDate, ket_thuc: old?.dueDate, phu_trach: old?.assigneeName },
        { ten: data.title, bat_dau: data.startDate, ket_thuc: data.dueDate, phu_trach: assignee?.name });
      return ok(`Đã lưu thay đổi công việc ${data.title}.`);
    }
    if (p && toTime(data.startDate) < toTime(queryTime().slice(0, 10) + ' 00:00:00')) {
      return fail('Ngày không được trước ngày hiện tại. Vui lòng kiểm tra lại.');
    }
    const created: Task = {
      ...data,
      code: (data.code || '').trim(),
      id: newId(),
      status: 'CHUA_BAT_DAU',
      categoryCode: cat?.code,
      assigneeName: assignee?.name,
      createdAt: nowDb(),
      lastUpdated: nowDb()
    };
    setTasks(prev => [...prev, created]);
    logAudit('TAO_MOI', 'Công việc', created.id, undefined, null, { ma: created.code, ten: created.title, trang_thai: 'CHUA_BAT_DAU' });
    return ok(`Đã tạo công việc ${created.title}.`, created);
  };

  const changeTaskStatus = (taskId: string, next: TaskStatus, reason?: string): OpResult => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return fail('Không tìm thấy công việc.');
    if (t.status === 'HOAN_THANH' || t.status === 'HUY') return fail(`Công việc đã ở trạng thái ${TASK_STATUS_LABEL[t.status]}, không thể thay đổi.`);
    if (isDirectorRole(currentUser) || isTeamLeadRole(currentUser)) return fail('Bạn không có quyền thực hiện thao tác này.');
    if (next === t.status) return ok('Không có thay đổi.');
    if (next === 'HOAN_THANH') {
      setTasks(prev => prev.map(x => x.id === taskId ? { ...x, status: 'HOAN_THANH', completedAt: queryTime(), approvedBy: actorName(), lastUpdated: nowDb() } : x));
      applyAssignmentCutoff([taskId], 'Xác nhận hoàn thành công việc');
      logAudit('XAC_NHAN_HOAN_THANH', 'Công việc', taskId, reason, { trang_thai: t.status }, { trang_thai: 'HOAN_THANH' });
      return ok(`Đã xác nhận hoàn thành công việc ${t.title}.`);
    }
    if (next === 'HUY') {
      if (!reason || !reason.trim()) return fail('Vui lòng nhập lý do hủy công việc.');
      setTasks(prev => prev.map(x => x.id === taskId ? { ...x, status: 'HUY', cancelledAt: queryTime(), cancelledBy: actorName(), cancelReason: reason, lastUpdated: nowDb() } : x));
      applyAssignmentCutoff([taskId], 'Hủy công việc');
      cancelExternalForTasks([taskId], `Hủy công việc: ${reason}`);
      logAudit('HUY', 'Công việc', taskId, reason, { trang_thai: t.status }, { trang_thai: 'HUY' });
      return ok(`Đã hủy công việc ${t.title}.`);
    }
    setTasks(prev => prev.map(x => x.id === taskId ? { ...x, status: next, lastUpdated: nowDb() } : x));
    logAudit('DOI_TRANG_THAI', 'Công việc', taskId, undefined, { trang_thai: t.status }, { trang_thai: next });
    return ok(`Đã cập nhật trạng thái công việc ${t.title}.`);
  };

  // ---------- Phân công (MH-09) ----------
  const validateAssignmentBase = (taskId: string, staffId: string, start: string, end: string): string | null => {
    const t = tasks.find(x => x.id === taskId);
    const p = projects.find(x => x.id === t?.projectId);
    const s = staff.find(x => x.id === staffId);
    if (!p) return 'Vui lòng chọn dự án.';
    if (!t) return 'Vui lòng chọn công việc.';
    if (!s) return 'Vui lòng chọn ít nhất một nhân sự.';
    if (p.status === 'TAM_DUNG') return 'Dự án đang tạm dừng, chưa thể lập phân công mới.';
    if (!projectAcceptsAssignments(p)) return 'Dự án đã hoàn thành hoặc đã hủy, không thể lập phân công mới.';
    if (!isTaskOpen(t)) return 'Công việc đã hoàn thành hoặc đã hủy, không thể phân công thêm.';
    if (!s.isActive) return 'Nhân sự đã ngừng làm việc, không thể phân công.';
    if (!start || !end) return 'Vui lòng nhập thời gian bắt đầu và kết thúc.';
    if (toTime(end) <= toTime(start)) return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
    if (toTime(start) < toTime(t.startDate) || toTime(end) > toTime(t.dueDate)) {
      return `Khoảng phân công phải nằm trong thời gian của công việc (${formatDate(t.startDate)} – ${formatDate(t.dueDate)}).`;
    }
    return null;
  };

  const createAssignments = (items: { taskId: string; staffId: string; startDate: string; endDate: string; notes?: string }[]): OpResult<Assignment[]> => {
    if (items.length === 0) return fail('Vui lòng chọn ít nhất một nhân sự.');
    const created: Assignment[] = [];
    for (const it of items) {
      const err = validateAssignmentBase(it.taskId, it.staffId, it.startDate, it.endDate);
      if (err) return fail(err);
      const conflicts = findConflicts(it.staffId, it.startDate, it.endDate, undefined, created);
      if (conflicts.length > 0) return fail(conflicts[0].message);
      const t = tasks.find(x => x.id === it.taskId)!;
      const p = projects.find(x => x.id === t.projectId)!;
      const s = staff.find(x => x.id === it.staffId)!;
      created.push({
        id: newId(),
        taskId: t.id, taskCode: t.code, taskName: t.title,
        projectId: p.id, projectCode: p.code,
        staffId: s.id, staffName: s.name,
        startDate: it.startDate, endDate: it.endDate,
        status: 'HIEU_LUC', notes: it.notes,
        assignedBy: actorName(), createdAt: nowDb()
      });
    }
    setAssignments(prev => [...created, ...prev]);
    created.forEach(a => logAudit('TAO_MOI', 'Phân công', a.id, undefined, null, { nhan_su: a.staffName, cong_viec: a.taskCode, tu: a.startDate, den: a.endDate }));
    const names = Array.from(new Set(created.map(a => a.staffName))).join(', ');
    return ok(`Đã lưu phân công cho ${names} từ ${formatDate(items[0].startDate)} đến ${formatDate(items[items.length - 1].endDate)}.`, created);
  };

  const updateAssignment = (id: string, data: { staffId: string; startDate: string; endDate: string; notes?: string }): OpResult => {
    const a = assignments.find(x => x.id === id);
    if (!a || !isRecordActive(a)) return fail('Chỉ sửa được phân công còn hiệu lực.');
    const p = projects.find(x => x.id === a.projectId);
    if (p?.status === 'TAM_DUNG') {
      if (data.staffId !== a.staffId || toTime(data.startDate) < toTime(a.startDate) || toTime(data.endDate) > toTime(a.endDate)) {
        return fail('Dự án đang tạm dừng: chỉ được thu hẹp khoảng hiện có hoặc hủy phân công.');
      }
    } else {
      const err = validateAssignmentBase(a.taskId, data.staffId, data.startDate, data.endDate);
      if (err) return fail(err);
    }
    if (toTime(data.endDate) <= toTime(data.startDate)) return fail('Thời gian kết thúc phải sau thời gian bắt đầu.');
    const conflicts = findConflicts(data.staffId, data.startDate, data.endDate, id);
    if (conflicts.length > 0) return fail(conflicts[0].message);
    const s = staff.find(x => x.id === data.staffId);
    setAssignments(prev => prev.map(x => x.id === id ? { ...x, ...data, staffName: s?.name, affectedDeferred: false } : x));
    logAudit('DIEU_CHINH', 'Phân công', id, undefined,
      { nhan_su: a.staffName, tu: a.startDate, den: a.endDate, ghi_chu: a.notes },
      { nhan_su: s?.name, tu: data.startDate, den: data.endDate, ghi_chu: data.notes });
    return ok('Đã cập nhật phân công.');
  };

  const cancelAssignment = (id: string, reason: string): OpResult => {
    if (!reason || !reason.trim()) return fail('Vui lòng nhập lý do hủy phân công.');
    const a = assignments.find(x => x.id === id);
    if (!a || !isRecordActive(a)) return fail('Phân công không còn hiệu lực.');
    setAssignments(prev => prev.map(x => x.id === id ? { ...x, status: 'HUY', cancelledAt: nowDb(), cancelledBy: actorName(), cancelReason: reason } : x));
    logAudit('HUY', 'Phân công', id, reason, { trang_thai: 'HIEU_LUC' }, { trang_thai: 'HUY' });
    return ok('Đã hủy phân công. Bản ghi được giữ trong lịch sử.');
  };

  /** Thay nhân sự (MH-10 bước 9): hủy phân công cũ và tạo phân công mới trong một thao tác */
  const replaceAssignmentStaff = (id: string, newStaffId: string): OpResult => {
    const a = assignments.find(x => x.id === id);
    if (!a || !isRecordActive(a)) return fail('Phân công không còn hiệu lực.');
    const conflicts = findConflicts(newStaffId, a.startDate, a.endDate, id);
    if (conflicts.length > 0) return fail('Lịch của nhân sự vừa được cập nhật và phát sinh trùng. Vui lòng kiểm tra lại.');
    const s = staff.find(x => x.id === newStaffId);
    if (!s || !s.isActive) return fail('Nhân sự đã ngừng làm việc, không thể phân công.');
    const created: Assignment = {
      ...a, id: newId(), staffId: s.id, staffName: s.name, status: 'HIEU_LUC',
      assignedBy: actorName(), createdAt: nowDb(), cancelReason: undefined, cancelledAt: undefined, cancelledBy: undefined, affectedDeferred: false,
      notes: `Thay thế ${a.staffName || ''} do nghỉ/bận`
    };
    setAssignments(prev => [created, ...prev.map(x => x.id === id ? { ...x, status: 'HUY' as const, cancelledAt: nowDb(), cancelledBy: actorName(), cancelReason: 'Thay thế do nghỉ/bận' } : x)]);
    logAudit('HUY', 'Phân công', id, 'Thay thế do nghỉ/bận', { trang_thai: 'HIEU_LUC' }, { trang_thai: 'HUY' });
    logAudit('TAO_MOI', 'Phân công', created.id, 'Thay thế do nghỉ/bận', null, { nhan_su: s.name, tu: a.startDate, den: a.endDate });
    return ok(`Đã thay ${a.staffName} bằng ${s.name}.`);
  };

  const deferAffectedAssignments = (ids: string[]) => {
    setAssignments(prev => prev.map(a => ids.includes(a.id) ? { ...a, affectedDeferred: true } : a));
  };

  // ---------- Lịch nghỉ/bận (MH-10) ----------
  const saveLeave = (data: { staffId: string; startDate: string; endDate: string; reason: string }, editId?: string): OpResult<{ leave: StaffLeave; affected: Assignment[] }> => {
    const s = staff.find(x => x.id === data.staffId);
    if (!s) return fail('Vui lòng chọn nhân sự.');
    if (!data.startDate || !data.endDate) return fail('Vui lòng nhập thời gian nghỉ/bận.');
    if (!data.reason.trim()) return fail('Vui lòng nhập lý do.');
    if (toTime(data.endDate) <= toTime(data.startDate)) return fail('Ngày kết thúc không được trước ngày bắt đầu.');
    const minStart = toTime(queryTime()) - 7 * 86400000;
    if (!editId && toTime(data.startDate.slice(0, 10) + ' 23:59:59') < minStart) {
      return fail('Chỉ được ghi nhận lịch nghỉ/bận bắt đầu muộn nhất 7 ngày trước ngày hiện tại. Vui lòng kiểm tra lại.');
    }
    const dup = leaves.find(l => l.id !== editId && l.staffId === data.staffId && isRecordActive(l) && overlaps(data.startDate, data.endDate, l.startDate, l.endDate));
    if (dup) return fail(`Nhân sự đã có lịch nghỉ/bận từ ${formatDate(dup.startDate)} đến ${formatDate(dup.endDate)}. Vui lòng điều chỉnh khoảng thời gian.`);
    let leave: StaffLeave;
    if (editId) {
      const old = leaves.find(l => l.id === editId)!;
      leave = { ...old, ...data, staffName: s.name };
      setLeaves(prev => prev.map(l => l.id === editId ? leave : l));
      logAudit('DIEU_CHINH', 'Lịch nghỉ/bận', editId, undefined, { tu: old.startDate, den: old.endDate, ly_do: old.reason }, { tu: data.startDate, den: data.endDate, ly_do: data.reason });
    } else {
      leave = { ...data, id: newId(), staffName: s.name, status: 'HIEU_LUC', recordedBy: actorName(), recordedAt: nowDb() };
      setLeaves(prev => [leave, ...prev]);
      logAudit('TAO_MOI', 'Lịch nghỉ/bận', leave.id, undefined, null, { nhan_su: s.name, tu: data.startDate, den: data.endDate, ly_do: data.reason });
    }
    const affected = assignments.filter(a => a.staffId === data.staffId && isRecordActive(a) && overlaps(a.startDate, a.endDate, data.startDate, data.endDate));
    return ok(`Đã ghi nhận lịch nghỉ/bận của ${s.name}.`, { leave, affected });
  };

  const cancelLeave = (id: string, reason: string): OpResult => {
    if (!reason.trim()) return fail('Vui lòng nhập lý do hủy lịch.');
    const l = leaves.find(x => x.id === id);
    if (!l || !isRecordActive(l)) return fail('Lịch nghỉ/bận không còn hiệu lực.');
    setLeaves(prev => prev.map(x => x.id === id ? { ...x, status: 'HUY', cancelledAt: nowDb(), cancelReason: reason } : x));
    logAudit('HUY', 'Lịch nghỉ/bận', id, reason, { trang_thai: 'HIEU_LUC' }, { trang_thai: 'HUY' });
    return ok('Đã hủy lịch nghỉ/bận. Các phân công đã hủy trước đó không tự khôi phục.');
  };

  // ---------- Đội thi công ngoài (MH-11) ----------
  const saveSubcontractor = (data: Omit<ExternalSubcontractor, 'id'>, editId?: string): OpResult => {
    if (!data.companyName.trim()) return fail('Vui lòng nhập tên đơn vị.');
    if (!data.contactPerson.trim()) return fail('Vui lòng nhập họ tên đầu mối.');
    if (data.taxCode && !/^(\d{10}|\d{13})$/.test(data.taxCode)) return fail('Mã số thuế gồm 10 hoặc 13 chữ số.');
    if (data.phone && !/^[0-9+ .]{1,20}$/.test(data.phone)) return fail('Số điện thoại không hợp lệ.');
    if (editId) {
      const old = subcontractors.find(s => s.id === editId);
      setSubcontractors(prev => prev.map(s => s.id === editId ? { ...s, ...data } : s));
      logAudit('DIEU_CHINH', 'Đội thi công ngoài', editId, undefined, { ten: old?.companyName, tinh_trang: old?.status }, { ten: data.companyName, tinh_trang: data.status });
      return ok(`Đã lưu đơn vị ${data.companyName}.`);
    }
    const created = { ...data, id: newId() };
    setSubcontractors(prev => [...prev, created]);
    logAudit('TAO_MOI', 'Đội thi công ngoài', created.id, undefined, null, { ten: data.companyName });
    return ok(`Đã thêm đơn vị ${data.companyName}.`);
  };

  const saveExternalAssignment = (data: Omit<ExternalAssignment, 'id' | 'status' | 'contractorName'>, editId?: string): OpResult => {
    const c = subcontractors.find(s => s.id === data.contractorId);
    if (!c) return fail('Vui lòng chọn đội thi công ngoài.');
    if (!editId && c.status !== 'HOP_TAC') return fail('Đơn vị đã ngừng hợp tác, không thể giao phần việc mới.');
    const t = tasks.find(x => x.id === data.taskId);
    if (!data.projectId) return fail('Vui lòng chọn dự án.');
    if (!t) return fail('Vui lòng chọn công việc.');
    if (t.projectId !== data.projectId) return fail('Công việc không thuộc dự án đã chọn.');
    if (!isTaskOpen(t)) return fail('Công việc đã hoàn thành hoặc đã hủy, không thể giao thêm.');
    if (!data.workDescription.trim()) return fail('Vui lòng nhập mô tả phần việc giao.');
    if (!data.nmhCoordinatorId) return fail('Vui lòng chọn nhân sự NMH phối hợp.');
    if (!data.startDate || !data.dueDate || toTime(data.dueDate) <= toTime(data.startDate)) return fail('Thời gian kết thúc phải sau thời gian bắt đầu.');
    if (toTime(data.startDate) < toTime(t.startDate) || toTime(data.dueDate) > toTime(t.dueDate)) return fail('Thời gian làm việc phải nằm trong thời gian của công việc được giao.');
    if (data.workerCount !== undefined && (data.workerCount < 1 || data.workerCount > 200)) return fail('Số người dự kiến phải từ 1 đến 200.');
    if (data.contractValue !== undefined && data.contractValue <= 0) return fail('Giá trị khoán phải lớn hơn 0.');
    if (editId) {
      const old = externalAssignments.find(e => e.id === editId);
      setExternalAssignments(prev => prev.map(e => e.id === editId ? { ...e, ...data, contractorName: c.companyName } : e));
      logAudit('DIEU_CHINH', 'Phần việc giao ngoài', editId, undefined, { mo_ta: old?.workDescription, tu: old?.startDate, den: old?.dueDate }, { mo_ta: data.workDescription, tu: data.startDate, den: data.dueDate });
      return ok('Đã lưu phần việc giao.');
    }
    const created: ExternalAssignment = { ...data, id: newId(), contractorName: c.companyName, status: 'HIEU_LUC', dailyStaffing: [] };
    setExternalAssignments(prev => [created, ...prev]);
    // Đồng bộ: đội được giao việc mà chưa gắn vào dự án thì tự gắn kèm số người khoán
    const proj = projects.find(p => p.id === data.projectId);
    if (proj && !(proj.externalTeams || []).some(x => x.contractorId === c.id)) {
      setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, externalTeams: [...(p.externalTeams || []), { contractorId: c.id, workerCount: data.workerCount || 1 }] } : p));
    }
    logAudit('TAO_MOI', 'Phần việc giao ngoài', created.id, undefined, null, { don_vi: c.companyName, cong_viec: t.code });
    return ok('Đã lưu phần việc giao.');
  };

  const cancelExternalAssignment = (id: string, reason: string): OpResult => {
    if (!reason.trim()) return fail('Vui lòng nhập lý do hủy phần việc giao.');
    setExternalAssignments(prev => prev.map(e => e.id === id ? { ...e, status: 'HUY', cancelReason: reason, cancelledAt: nowDb() } : e));
    logAudit('HUY', 'Phần việc giao ngoài', id, reason, { trang_thai: 'HIEU_LUC' }, { trang_thai: 'HUY' });
    return ok('Đã hủy phần việc giao.');
  };

  const upsertDailyStaffing = (extId: string, row: Omit<ExternalDailyStaffing, 'updatedBy' | 'updatedAt'>): OpResult => {
    const e = externalAssignments.find(x => x.id === extId);
    if (!e) return fail('Không tìm thấy phần việc.');
    if (!row.date || row.date < e.startDate.slice(0, 10) || row.date > e.dueDate.slice(0, 10)) return fail('Ngày cập nhật phải nằm trong thời gian đội ngoài làm việc.');
    if (row.date > queryTime().slice(0, 10)) return fail('Không thể cập nhật cho ngày chưa đến.');
    if (row.presentCount < 0 || row.presentCount > 200 || isNaN(row.presentCount)) return fail('Số nhân sự có mặt phải từ 0 đến 200.');
    const nameLines = (row.names || '').split('\n').map(x => x.trim()).filter(Boolean);
    if (nameLines.length > row.presentCount) return fail('Số họ tên đã nhập vượt quá số nhân sự có mặt.');
    const existing = (e.dailyStaffing || []).find(d => d.date === row.date);
    const record: ExternalDailyStaffing = { ...row, names: nameLines.join(', '), updatedBy: actorName(), updatedAt: nowDb() };
    setExternalAssignments(prev => prev.map(x => x.id === extId ? {
      ...x,
      dailyStaffing: [...(x.dailyStaffing || []).filter(d => d.date !== row.date), record].sort((a, b) => a.date.localeCompare(b.date))
    } : x));
    logAudit(existing ? 'DIEU_CHINH' : 'TAO_MOI', 'Nhân sự đội ngoài theo ngày', `${extId}-${row.date}`, undefined, existing ? { co_mat: existing.presentCount } : null, { co_mat: row.presentCount });
    return ok(`Đã cập nhật nhân sự triển khai ngày ${formatDate(row.date)}.`);
  };

  // ---------- Nhật ký hiện trường (MH-12, MH-18) ----------
  const addWorkLog = (data: Omit<WorkLog, 'id' | 'submittedAt'>): OpResult => {
    const t = tasks.find(x => x.id === data.taskId);
    if (!data.projectId) return fail('Vui lòng chọn dự án.');
    if (!t) return fail('Vui lòng chọn công việc.');
    if (!data.content.trim()) return fail(isManagerRole(currentUser) || isAdminRole(currentUser) ? 'Vui lòng nhập nội dung kết quả.' : 'Vui lòng nhập nội dung đã thực hiện.');
    if (data.content.length > 2000) return fail('Nội dung tối đa 2.000 ký tự.');
    if ((data.issuesFaced || '').length > 1000) return fail('Vướng mắc tối đa 1.000 ký tự.');
    if (t.status === 'HUY') return fail('Công việc đã hủy, không thể gửi báo cáo.');
    if (isTeamLeadRole(currentUser) && !isTaskAssignedToMe(t)) return fail('Bạn không có quyền gửi báo cáo cho công việc này.');
    const reporter = staff.find(s => s.id === currentUser.staffId);
    const created: WorkLog = {
      ...data,
      id: newId(),
      taskCode: t.code,
      submittedAt: nowDb(),
      submittedByAccountId: currentUser.id,
      submittedByUsername: currentUser.username,
      submittedByStaffId: currentUser.staffId,
      submittedByStaffName: reporter?.name || currentUser.name,
      submittedByRole: reporter?.roleTitleDisplay || ROLE_LABEL[role],
      recordedByManager: isManagerRole(currentUser) || isAdminRole(currentUser),
      statusVerifiedByManager: false
    };
    setWorkLogs(prev => [created, ...prev]);
    return ok(created.recordedByManager && !data.correctionForLogId ? `Đã ghi nhận kết quả cho công việc ${t.title}.` : 'Đã gửi báo cáo hiện trường.');
  };

  const approveWorkLog = (logId: string, note?: string): OpResult => {
    const log = workLogs.find(l => l.id === logId);
    if (!log) return fail('Không tìm thấy báo cáo.');
    if (!(isManagerRole(currentUser) || isAdminRole(currentUser))) return fail('Bạn không có quyền thực hiện thao tác này.');
    if ((note || '').length > 255) return fail('Ghi chú tối đa 255 ký tự.');
    const t = tasks.find(x => x.id === log.taskId);
    if (!t) return fail('Không tìm thấy công việc.');
    if (t.status === 'HOAN_THANH' || t.status === 'HUY') return fail(`Công việc đã ở trạng thái ${TASK_STATUS_LABEL[t.status]}, không thể phê duyệt lại.`);
    const r = changeTaskStatus(t.id, 'HOAN_THANH', note);
    if (!r.ok) return r;
    setWorkLogs(prev => prev.map(l => l.id === logId ? { ...l, statusVerifiedByManager: true } : l));
    return ok(`Đã xác nhận hoàn thành công việc ${t.title}.`);
  };

  // ---------- Hồ sơ kỹ thuật (MH-13, MH-08b) ----------
  const uploadDocs = (base: { projectId: string; taskId?: string; type: string; title: string; label?: string; scope: string; description?: string; changeNotes?: string },
    files: { name: string; size: number; fileType: string }[]): OpResult => {
    if (!base.projectId) return fail('Vui lòng chọn dự án.');
    if (!base.type) return fail('Vui lòng chọn loại hồ sơ.');
    if (!base.title.trim()) return fail('Vui lòng nhập tên hồ sơ.');
    if (files.length === 0) return fail('Vui lòng chọn tệp.');
    if (base.scope === 'RIENG_CONG_VIEC' && !base.taskId) return fail('Vui lòng chọn công việc liên quan.');
    const task = tasks.find(t => t.id === base.taskId);
    if (base.taskId && task?.projectId !== base.projectId) return fail('Công việc không thuộc dự án đã chọn.');
    const allowed = config.allowedFileTypes.split(',');
    for (const f of files) {
      if (!allowed.includes(f.fileType)) return fail('Định dạng tệp không được hỗ trợ.');
      if (f.size > config.maxUploadSizeMB * 1024 * 1024) return fail('Tệp vượt quá dung lượng cho phép.');
    }
    const p = projects.find(x => x.id === base.projectId);
    const created: TechDoc[] = files.map((f, i) => {
      const version: TechDocVersion = {
        versionNum: 1,
        label: base.label || '',
        originalFileName: f.name,
        storedPath: `ho_so/2026/${p?.code}/${f.name}`,
        fileType: f.fileType,
        fileSizeByte: f.size,
        fileSizeDisplay: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
        changeNotes: base.changeNotes,
        uploadedAt: nowDb(),
        uploadedBy: actorName(),
        isSelectedForExecution: false
      };
      return {
        id: newId(),
        projectId: base.projectId,
        projectCode: p?.code,
        taskId: base.taskId,
        taskCode: task?.code,
        scope: base.scope,
        type: base.type,
        title: files.length > 1 ? `${base.title} – ${f.name}` : base.title,
        description: base.description,
        uploadedBy: actorName(),
        createdAt: nowDb(),
        versions: [version]
      };
    });
    setDocs(prev => [...created, ...prev]);
    created.forEach(d => logAudit('TAI_LEN', 'Phiên bản hồ sơ', d.id, undefined, null, { ho_so: d.title, phien_ban: 1, tep: d.versions![0].originalFileName }));
    if (files.length === 1) return ok(base.label ? `Đã tải lên hồ sơ ${base.title} (phiên bản ${base.label}).` : `Đã tải lên hồ sơ ${base.title}.`);
    return ok(`Đã tải lên ${files.length} tệp.`);
  };

  const addDocVersion = (docId: string, file: { name: string; size: number; fileType: string }, label?: string, changeNotes?: string): OpResult => {
    const d = docs.find(x => x.id === docId);
    if (!d) return fail('Không tìm thấy hồ sơ.');
    if (!file) return fail('Vui lòng chọn tệp.');
    if (!config.allowedFileTypes.split(',').includes(file.fileType)) return fail('Định dạng tệp không được hỗ trợ.');
    if (file.size > config.maxUploadSizeMB * 1024 * 1024) return fail('Tệp vượt quá dung lượng cho phép.');
    const num = (d.versions || []).reduce((m, v) => Math.max(m, v.versionNum), 0) + 1;
    const v: TechDocVersion = {
      versionNum: num, label: label || '', originalFileName: file.name, storedPath: `ho_so/2026/${d.projectCode}/${num}-${file.name}`,
      fileType: file.fileType, fileSizeByte: file.size, fileSizeDisplay: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      changeNotes, uploadedAt: nowDb(), uploadedBy: actorName(), isSelectedForExecution: false
    };
    setDocs(prev => prev.map(x => x.id === docId ? { ...x, versions: [...(x.versions || []), v] } : x));
    logAudit('TAI_LEN', 'Phiên bản hồ sơ', `${docId}-${num}`, changeNotes, null, { ho_so: d.title, phien_ban: num, tep: file.name });
    return ok(`Đã bổ sung phiên bản ${num} cho hồ sơ ${d.title}.`);
  };

  const selectDocVersion = (docId: string, versionNum: number): OpResult => {
    const d = docs.find(x => x.id === docId);
    if (!d) return fail('Không tìm thấy hồ sơ.');
    const prevSel = (d.versions || []).find(v => v.isSelectedForExecution);
    setDocs(prev => prev.map(x => x.id === docId ? {
      ...x,
      versions: (x.versions || []).map(v => ({
        ...v,
        isSelectedForExecution: v.versionNum === versionNum,
        selectedAt: v.versionNum === versionNum ? nowDb() : v.selectedAt,
        selectedBy: v.versionNum === versionNum ? actorName() : v.selectedBy
      }))
    } : x));
    logAudit('CHON_BAN_TRIEN_KHAI', 'Phiên bản hồ sơ', `${docId}-${versionNum}`, undefined, { phien_ban_duoc_chon: prevSel?.versionNum ?? null }, { phien_ban_duoc_chon: versionNum });
    return ok(`Đã chọn phiên bản ${versionNum} làm bản triển khai.`);
  };

  const updateDocInfo = (docId: string, data: { title: string; type: string; scope: string; taskId?: string; description?: string }): OpResult => {
    if (!data.title.trim()) return fail('Vui lòng nhập tên hồ sơ.');
    if (!data.type) return fail('Vui lòng chọn loại hồ sơ.');
    if (data.scope === 'RIENG_CONG_VIEC' && !data.taskId) return fail('Vui lòng chọn công việc liên quan.');
    const old = docs.find(x => x.id === docId);
    const task = tasks.find(t => t.id === data.taskId);
    setDocs(prev => prev.map(x => x.id === docId ? { ...x, ...data, taskCode: task?.code } : x));
    logAudit('DIEU_CHINH', 'Hồ sơ kỹ thuật', docId, undefined, { ten: old?.title, loai: old?.type, pham_vi: old?.scope }, { ten: data.title, loai: data.type, pham_vi: data.scope });
    return ok('Đã lưu thông tin mô tả hồ sơ.');
  };

  // ---------- Nhân sự (MH-03) ----------
  const saveStaff = (data: Omit<Staff, 'id'>, editId?: string): OpResult => {
    if (!data.code.trim()) return fail('Vui lòng nhập mã nhân sự.');
    if (!data.name.trim()) return fail('Vui lòng nhập họ tên.');
    if (!data.roleTitle) return fail('Vui lòng chọn chức danh.');
    if (staff.some(s => s.id !== editId && s.code.toLowerCase() === data.code.trim().toLowerCase())) return fail('Mã nhân sự đã tồn tại.');
    if (data.phone && !/^[0-9+ .]{1,20}$/.test(data.phone)) return fail('Số điện thoại không hợp lệ.');
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return fail('Email không hợp lệ.');
    if (!data.isActive) {
      if (!data.leaveDate) return fail('Vui lòng nhập ngày ngừng làm việc.');
      if (editId) {
        const future = assignments.filter(a => a.staffId === editId && isRecordActive(a) && toTime(a.startDate) >= toTime(data.leaveDate + ' 00:00:00'));
        if (future.length > 0) return { ok: false, message: 'Còn phân công tương lai cần điều chỉnh hoặc hủy trước.', data: future };
      }
    }
    if (editId) {
      const old = staff.find(s => s.id === editId);
      setStaff(prev => prev.map(s => s.id === editId ? { ...s, ...data, leaveDate: data.isActive ? undefined : data.leaveDate } : s));
      const statusChanged = old && old.isActive !== data.isActive;
      logAudit(statusChanged ? 'DOI_TRANG_THAI' : 'DIEU_CHINH', 'Nhân sự', editId, undefined,
        { ho_ten: old?.name, chuc_danh: old?.roleTitle, tinh_trang: old?.isActive ? 'DANG_LAM_VIEC' : 'NGUNG_LAM_VIEC' },
        { ho_ten: data.name, chuc_danh: data.roleTitle, tinh_trang: data.isActive ? 'DANG_LAM_VIEC' : 'NGUNG_LAM_VIEC' });
      if (statusChanged && !data.isActive) return ok(`Đã ghi nhận ${data.name} ngừng làm việc từ ${formatDate(data.leaveDate)}.`);
      return ok(`Đã lưu hồ sơ nhân sự ${data.name}.`);
    }
    const created = { ...data, id: newId() };
    setStaff(prev => [...prev, created]);
    logAudit('TAO_MOI', 'Nhân sự', created.id, undefined, null, { ma: data.code, ho_ten: data.name });
    return ok(`Đã lưu hồ sơ nhân sự ${data.name}.`);
  };

  // ---------- Tài khoản và phạm vi (MH-04, MH-19) ----------
  const activeAdminCount = () => accounts.filter(a => normalizeRole(a.role) === 'QUAN_TRI' && a.isActive).length;

  const createAccount = (data: { username: string; name: string; role: UserRole; staffId?: string; projectIds?: string[]; password: string }): OpResult<UserAccount> => {
    const username = data.username.trim();
    if (!/^[a-z0-9._]{4,50}$/.test(username)) return fail('Tên đăng nhập gồm 4 đến 50 ký tự: chữ thường không dấu, số, dấu chấm hoặc gạch dưới.');
    if (accounts.some(a => (a.username || '').toLowerCase() === username.toLowerCase())) return fail('Tên đăng nhập đã được sử dụng. Vui lòng chọn tên khác.');
    if (!data.name.trim() || data.name.length > 120) return fail('Vui lòng nhập họ tên hiển thị (tối đa 120 ký tự).');
    if (!data.role) return fail('Vui lòng chọn vai trò.');
    if (data.role === 'DOI_TRUONG' && !data.staffId) return fail('Tài khoản Đội trưởng cần liên kết với một nhân sự.');
    if (data.staffId && accounts.some(a => a.staffId === data.staffId)) return fail('Nhân sự này đã có tài khoản.');
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(data.password)) return fail('Mật khẩu cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số.');
    const projectIds = data.role === 'QUAN_LY' ? data.projectIds || [] : [];
    const grants: Record<string, { grantedBy: string; grantedAt: string }> = {};
    projectIds.forEach(id => { grants[id] = { grantedBy: actor(), grantedAt: nowDb() }; });
    const created: UserAccount = {
      id: newId(), username, name: data.name.trim(), role: data.role, staffId: data.staffId || undefined,
      isActive: true, assignedProjectIds: projectIds, scopeGrants: grants, createdAt: nowDb(), mustChangePassword: true
    };
    pendingPasswords.current[created.id] = data.password;
    setAccounts(prev => [created, ...prev]);
    logAudit('TAO_MOI', 'Tài khoản', created.id, undefined, null, { ten_dang_nhap: username, vai_tro: data.role, nhan_su_id: data.staffId || null });
    return ok(`Đã cấp tài khoản cho ${created.name}.`, created);
  };

  const updateAccount = (id: string, data: { name: string; role: UserRole; staffId?: string; projectIds?: string[] }): OpResult => {
    const old = accounts.find(a => a.id === id);
    if (!old) return fail('Không tìm thấy tài khoản.');
    const oldRole = normalizeRole(old.role);
    if (id === currentUser.id && data.role !== oldRole) return fail('Không thể thay đổi quyền hoặc khóa tài khoản của chính bạn.');
    if (oldRole === 'QUAN_TRI' && data.role !== 'QUAN_TRI' && old.isActive && activeAdminCount() <= 1) return fail('Hệ thống cần ít nhất một tài khoản Quản trị hệ thống đang hoạt động.');
    if (data.role === 'DOI_TRUONG' && !data.staffId) return fail('Tài khoản Đội trưởng cần liên kết với một nhân sự.');
    if (data.staffId && accounts.some(a => a.id !== id && a.staffId === data.staffId)) return fail('Nhân sự này đã có tài khoản.');
    const projectIds = data.role === 'QUAN_LY' ? data.projectIds ?? old.assignedProjectIds ?? [] : [];
    const grants = { ...(old.scopeGrants || {}) };
    projectIds.forEach(pid => { if (!grants[pid]) grants[pid] = { grantedBy: actor(), grantedAt: nowDb() }; });
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, name: data.name.trim(), role: data.role, staffId: data.staffId || undefined, assignedProjectIds: projectIds, scopeGrants: grants } : a));
    logAudit('DIEU_CHINH', 'Tài khoản', id, undefined,
      { ho_ten: old.name, vai_tro: oldRole, nhan_su_id: old.staffId || null },
      { ho_ten: data.name, vai_tro: data.role, nhan_su_id: data.staffId || null });
    return ok(`Đã cập nhật tài khoản ${data.name}.`);
  };

  const resetPassword = (id: string, password: string): OpResult => {
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) return fail('Mật khẩu cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số.');
    const a = accounts.find(x => x.id === id);
    pendingPasswords.current[id] = password;
    // Đổi một trường để bản ghi tài khoản được gửi lại kèm mật khẩu mới (máy chủ chỉ lưu dạng băm)
    setAccounts(prev => prev.map(x => x.id === id ? { ...x, mustChangePassword: true, passwordResetAt: nowDb() } : x));
    logAudit('DIEU_CHINH', 'Tài khoản', id, 'Đặt lại mật khẩu; thu hồi các phiên đang đăng nhập', null, { dat_lai_mat_khau: true });
    return ok(`Đã đặt lại mật khẩu cho ${a?.name}.`);
  };

  const setAccountLock = (id: string, lock: boolean, reason?: string): OpResult => {
    const a = accounts.find(x => x.id === id);
    if (!a) return fail('Không tìm thấy tài khoản.');
    if (id === currentUser.id) return fail('Không thể thay đổi quyền hoặc khóa tài khoản của chính bạn.');
    if (lock) {
      if (!reason || !reason.trim()) return fail('Vui lòng nhập lý do khóa tài khoản.');
      if (reason.length > 255) return fail('Lý do tối đa 255 ký tự.');
      if (normalizeRole(a.role) === 'QUAN_TRI' && activeAdminCount() <= 1) return fail('Hệ thống cần ít nhất một tài khoản Quản trị hệ thống đang hoạt động.');
      setAccounts(prev => prev.map(x => x.id === id ? { ...x, isActive: false, lockReason: reason, lockedAt: nowDb() } : x));
      logAudit('KHOA', 'Tài khoản', id, reason, { trang_thai: 'HOAT_DONG' }, { trang_thai: 'BI_KHOA', ly_do: reason });
      return ok(`Đã khóa tài khoản ${a.name}.`);
    }
    setAccounts(prev => prev.map(x => x.id === id ? { ...x, isActive: true, lockReason: undefined, lockedAt: undefined } : x));
    logAudit('MO_KHOA', 'Tài khoản', id, undefined, { trang_thai: 'BI_KHOA' }, { trang_thai: 'HOAT_DONG' });
    return ok(`Đã mở khóa tài khoản ${a.name}.`);
  };

  const updateAccountScope = (id: string, projectIds: string[]): OpResult => {
    const a = accounts.find(x => x.id === id);
    if (!a || normalizeRole(a.role) !== 'QUAN_LY' || !a.isActive) return fail('Chỉ cấp phạm vi cho tài khoản Quản lý đang hoạt động.');
    const grants: Record<string, { grantedBy: string; grantedAt: string }> = {};
    projectIds.forEach(pid => { grants[pid] = a.scopeGrants?.[pid] || { grantedBy: actor(), grantedAt: nowDb() }; });
    const code = (pid: string) => projects.find(p => p.id === pid)?.code || pid;
    setAccounts(prev => prev.map(x => x.id === id ? { ...x, assignedProjectIds: projectIds, scopeGrants: grants } : x));
    logAudit('DIEU_CHINH', 'Tài khoản', id, 'Cập nhật phạm vi dự án', { pham_vi: (a.assignedProjectIds || []).map(code) }, { pham_vi: projectIds.map(code) });
    return ok(`Đã cập nhật phạm vi dự án của ${a.name}: ${projectIds.length} dự án.`);
  };

  const recordLogin = (id: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, lastLogin: nowDb() } : a));
  };

  // ---------- Cấu hình (MH-20) ----------
  const saveConfig = (next: SystemConfig): OpResult => {
    const keys: [keyof SystemConfig, string][] = [
      ['evaluationTimestamp', 'THOI_DIEM_TRA_CUU'],
      ['upcomingThresholdDays', 'SO_NGAY_SAP_DEN_HAN'],
      ['sessionTimeoutMinutes', 'THOI_GIAN_HET_PHIEN_PHUT'],
      ['maxUploadSizeMB', 'DUNG_LUONG_TAI_LEN_TOI_DA_MB'],
      ['allowedFileTypes', 'LOAI_TEP_CHO_PHEP'],
      ['backupRetentionCount', 'SO_NGAY_GIU_SAO_LUU']
    ];
    const oldVal: Record<string, any> = {};
    const newVal: Record<string, any> = {};
    const updatedAt = { ...(config.updatedAt || {}) };
    keys.forEach(([k, label]) => {
      if (String(config[k] ?? '') !== String(next[k] ?? '')) {
        oldVal[label] = config[k];
        newVal[label] = next[k];
        updatedAt[label] = nowDb();
      }
    });
    if (Object.keys(newVal).length === 0) return fail('Không có thay đổi để lưu.');
    setConfig({ ...next, updatedAt });
    applyQueryConfig(next.evaluationTimestamp, next.upcomingThresholdDays);
    logAudit('DIEU_CHINH', 'Cấu hình', 'cau_hinh', undefined, oldVal, newVal);
    return ok('Đã lưu cấu hình.');
  };

  return {
    // dữ liệu
    config, accounts, projects, tasks, staff, assignments, leaves, workLogs, docs, categories, customers,
    subcontractors, externalAssignments, auditLogs, currentUser, role,
    visibleProjects, visibleProjectIds, scoped,
    // tiện ích
    dbMode, syncError, setCurrentUser, loadFromDatabase, findConflicts, getAffectedAssignments, isTaskAssignedToMe, queryTime,
    // nghiệp vụ
    teams, skills, systemTypes, saveTeam, saveSkill, saveSystemType, updateCustomer,
    addCustomer, createProject, updateProject, changeProjectStatus,
    saveCategory, saveTask, changeTaskStatus,
    createAssignments, updateAssignment, cancelAssignment, replaceAssignmentStaff, deferAffectedAssignments,
    saveLeave, cancelLeave,
    saveSubcontractor, saveExternalAssignment, cancelExternalAssignment, upsertDailyStaffing,
    addWorkLog, approveWorkLog,
    uploadDocs, addDocVersion, selectDocVersion, updateDocInfo,
    saveStaff,
    createAccount, updateAccount, resetPassword, setAccountLock, updateAccountScope, recordLogin, markPasswordChanged,
    saveConfig
  };
};

export type AppStore = ReturnType<typeof useStoreState>;

const StoreContext = createContext<AppStore | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useStoreState();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

export const useStore = (): AppStore => {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore phải dùng bên trong StoreProvider');
  return s;
};
