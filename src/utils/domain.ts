import type {
  Project,
  Task,
  Assignment,
  StaffLeave,
  ProjectStatus,
  TaskStatus,
  UserAccount,
  UserRole
} from '../types/index.ts';

/**
 * Chuẩn hóa dữ liệu nghiệp vụ về đúng bộ mã trạng thái của CSDL (Bảng 3.10).
 * Dữ liệu cũ trong localStorage hoặc API có thể dùng mã tiếng Anh (active, done, plan...)
 * nên mọi bản ghi được đưa về mã chuẩn ngay khi nạp vào ứng dụng.
 */

export const normalizeProjectStatus = (s?: string): ProjectStatus => {
  switch (s) {
    case 'planning':
    case 'plan':
      return 'LAP_KE_HOACH';
    case 'in_progress':
    case 'doing':
      return 'DANG_THUC_HIEN';
    case 'paused':
      return 'TAM_DUNG';
    case 'completed':
    case 'done':
      return 'HOAN_THANH';
    case 'cancelled':
      return 'HUY';
    case 'LAP_KE_HOACH':
    case 'DANG_THUC_HIEN':
    case 'TAM_DUNG':
    case 'HOAN_THANH':
    case 'HUY':
      return s;
    default:
      return 'LAP_KE_HOACH';
  }
};

export const normalizeTaskStatus = (s?: string): TaskStatus => {
  switch (s) {
    case 'not_started':
    case 'plan':
      return 'CHUA_BAT_DAU';
    case 'doing':
    case 'in_progress':
      return 'DANG_THUC_HIEN';
    case 'done':
    case 'completed':
      return 'HOAN_THANH';
    case 'cancelled':
      return 'HUY';
    case 'CHUA_BAT_DAU':
    case 'DANG_THUC_HIEN':
    case 'HOAN_THANH':
    case 'HUY':
      return s;
    default:
      return 'CHUA_BAT_DAU';
  }
};

export const normalizeRecordStatus = (s?: string): 'HIEU_LUC' | 'HUY' =>
  s === 'HUY' || s === 'cancelled' ? 'HUY' : 'HIEU_LUC';

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  LAP_KE_HOACH: 'Lập kế hoạch',
  DANG_THUC_HIEN: 'Đang triển khai',
  TAM_DUNG: 'Tạm dừng',
  HOAN_THANH: 'Hoàn thành',
  HUY: 'Hủy'
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  CHUA_BAT_DAU: 'Chưa bắt đầu',
  DANG_THUC_HIEN: 'Đang thực hiện',
  HOAN_THANH: 'Hoàn thành',
  HUY: 'Hủy'
};

export const ROLE_LABEL: Record<string, string> = {
  QUAN_TRI: 'Quản trị hệ thống',
  QUAN_LY: 'Quản lý',
  BAN_GIAM_DOC: 'Ban giám đốc',
  DOI_TRUONG: 'Đội trưởng thi công'
};

export const DOC_TYPE_LABEL: Record<string, string> = {
  THIET_KE: 'Thiết kế',
  THI_CONG: 'Thi công',
  HOAN_CONG: 'Hoàn công',
  NGHIEM_THU: 'Nghiệm thu',
  BAN_GIAO: 'Bàn giao'
};

export const SYSTEM_TYPES = [
  'Hạ tầng mạng và thoại',
  'Mạng không dây',
  'Hệ thống âm thanh thông báo',
  'Âm thanh, hình ảnh và hội nghị trực tuyến',
  'Camera giám sát',
  'Kiểm soát ra vào',
  'Nhà thông minh'
];

export const normalizeRole = (r?: string): UserRole => {
  switch (r) {
    case 'admin': return 'QUAN_TRI';
    case 'manager': return 'QUAN_LY';
    case 'team_lead': return 'DOI_TRUONG';
    case 'director': return 'BAN_GIAM_DOC';
    default: return (r as UserRole) || 'QUAN_LY';
  }
};

export const isAdminRole = (u?: UserAccount | null) => normalizeRole(u?.role) === 'QUAN_TRI';
export const isManagerRole = (u?: UserAccount | null) => normalizeRole(u?.role) === 'QUAN_LY';
export const isTeamLeadRole = (u?: UserAccount | null) => normalizeRole(u?.role) === 'DOI_TRUONG';
export const isDirectorRole = (u?: UserAccount | null) => normalizeRole(u?.role) === 'BAN_GIAM_DOC';
/** Quản lý và Quản trị viên (làm tổng) được thao tác nghiệp vụ; Ban giám đốc chỉ xem. */
export const canOperate = (u?: UserAccount | null) => isManagerRole(u) || isAdminRole(u);

/** Đưa chuỗi ngày về dạng 'YYYY-MM-DD HH:mm:ss' để so sánh thống nhất. */
export const toDbDateTime = (s?: string, defaultTime = '08:00:00'): string => {
  if (!s) return '';
  const v = s.replace('T', ' ').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v} ${defaultTime}`;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(v)) return `${v}:00`;
  return v;
};

export const toTime = (s?: string) => {
  if (!s) return NaN;
  return new Date(toDbDateTime(s).replace(' ', 'T')).getTime();
};

const pad = (n: number) => String(n).padStart(2, '0');

/** dd/mm/yyyy theo QC-04 */
export const formatDate = (s?: string) => {
  if (!s) return '';
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
};

/** dd/mm/yyyy HH:mm theo QC-04 */
export const formatDateTime = (s?: string) => {
  if (!s) return '';
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
  return formatDate(s);
};

/** Chuyển Date thành 'YYYY-MM-DD HH:mm:ss' theo giờ địa phương */
export const dateToDb = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export const nowDb = () => dateToDb(new Date());

/** Số ngày lịch giữa hai mốc (theo ngày, bỏ giờ) */
/** Ngày (yyyy-mm-dd) là Chủ nhật */
export const isSunday = (d: string) => new Date(toDbDateTime(d).slice(0, 10) + 'T00:00:00').getDay() === 0;

/**
 * Số ngày làm việc theo kế hoạch: N_kh = (E − S + 1) − CN(S, E), CN là số Chủ nhật trong khoảng S..E.
 * Ví dụ 19/10/2026 (Thứ Hai) – 25/10/2026: 7 ngày, trừ Chủ nhật 25/10 → 6.
 */
export const workingDays = (from: string, to: string) => {
  const s = toDbDateTime(from).slice(0, 10), e = toDbDateTime(to).slice(0, 10);
  if (!s || !e || e < s) return 0;
  const total = daysBetween(s, e) + 1;
  const firstDow = new Date(s + 'T00:00:00').getDay();
  const toFirstSunday = (7 - firstDow) % 7;
  const sundays = toFirstSunday >= total ? 0 : Math.floor((total - 1 - toFirstSunday) / 7) + 1;
  return total - sundays;
};

export const daysBetween = (from: string, to: string) => {
  const a = new Date(toDbDateTime(from).slice(0, 10) + 'T00:00:00').getTime();
  const b = new Date(toDbDateTime(to).slice(0, 10) + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
};

export const overlaps = (sA: string, eA: string, sB: string, eB: string) => {
  const a1 = toTime(sA), a2 = toTime(eA), b1 = toTime(sB), b2 = toTime(eB);
  if ([a1, a2, b1, b2].some(isNaN)) return false;
  return a1 < b2 && b1 < a2;
};

export const isProjectOpen = (p?: Project) =>
  !!p && (p.status === 'LAP_KE_HOACH' || p.status === 'DANG_THUC_HIEN' || p.status === 'TAM_DUNG');

/** Dự án nhận phân công mới: chỉ Lập kế hoạch hoặc Đang triển khai */
export const projectAcceptsAssignments = (p?: Project) =>
  !!p && (p.status === 'LAP_KE_HOACH' || p.status === 'DANG_THUC_HIEN');

/** Dự án nhận công việc/hạng mục mới: mọi trạng thái trừ Hoàn thành, Hủy */
export const projectAcceptsTasks = (p?: Project) => isProjectOpen(p);

export const isTaskOpen = (t?: Task) => !!t && (t.status === 'CHUA_BAT_DAU' || t.status === 'DANG_THUC_HIEN');

export const isRecordActive = (r?: { status: string }) => !!r && r.status === 'HIEU_LUC';

export const normalizeProject = (p: any): Project => ({
  ...p,
  id: String(p.id),
  name: p.name ?? p.ten ?? '',
  clientName: p.clientName ?? p.client,
  client: p.client ?? p.clientName,
  startDate: toDbDateTime(p.startDate, '08:00:00'),
  dueDate: toDbDateTime(p.dueDate, '17:00:00'),
  status: normalizeProjectStatus(p.status)
});

export const normalizeTask = (t: any): Task => ({
  ...t,
  id: String(t.id),
  title: t.title ?? t.name ?? '',
  description: t.description ?? t.notes ?? '',
  locationArea: t.locationArea ?? t.location,
  assigneeId: t.assigneeId ?? t.leadStaffId ?? '',
  assigneeName: t.assigneeName ?? t.leadStaffName,
  startDate: toDbDateTime(t.startDate, '08:00:00'),
  dueDate: toDbDateTime(t.dueDate, '17:00:00'),
  status: normalizeTaskStatus(t.status)
});

export const normalizeAssignment = (a: any): Assignment => ({
  ...a,
  id: String(a.id),
  startDate: toDbDateTime(a.startDate ?? a.startTime, '08:00:00'),
  endDate: toDbDateTime(a.endDate ?? a.endTime, '17:00:00'),
  notes: a.notes ?? a.shiftNotes,
  status: normalizeRecordStatus(a.status)
});

export const normalizeLeave = (l: any): StaffLeave => ({
  ...l,
  id: String(l.id),
  startDate: toDbDateTime(l.startDate, '08:00:00'),
  endDate: toDbDateTime(l.endDate, '17:00:00'),
  status: normalizeRecordStatus(l.status)
});

export const normalizeAccount = (a: UserAccount): UserAccount => ({ ...a, role: normalizeRole(a.role) });

/** Sinh mã kế tiếp theo tiền tố, ví dụ nextCode(['HM01','HM02'], 'HM', 2) => 'HM03' */
export const nextCode = (codes: (string | undefined)[], prefix: string, width: number) => {
  let max = 0;
  codes.forEach(c => {
    if (!c || !c.startsWith(prefix)) return;
    const n = parseInt(c.slice(prefix.length), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};

/** Mã định danh số nằm trong giới hạn kiểu INT của PostgreSQL (khóa chính các bảng) */
export const newId = () => String(10_000_000 + Math.floor(Math.random() * 2_000_000_000));

/** Trạng thái hạng mục suy ra từ công việc: Chưa giao, Chưa bắt đầu, Đang thực hiện, Hoàn thành (MH-08 thành phần 5) */
export const getCategoryStatus = (catTasks: Task[]) => {
  const valid = catTasks.filter(t => t.status !== 'HUY');
  if (valid.length === 0) return { key: 'CHUA_GIAO', label: 'Chưa giao', pct: null as number | null, bar: 'bg-slate-200', badge: 'bg-slate-100 text-slate-500' };
  const done = valid.filter(t => t.status === 'HOAN_THANH').length;
  const pct = Math.round((done / valid.length) * 100);
  if (done === valid.length) return { key: 'HOAN_THANH', label: 'Hoàn thành', pct, bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' };
  if (done > 0 || valid.some(t => t.status === 'DANG_THUC_HIEN')) return { key: 'DANG_THUC_HIEN', label: 'Đang thực hiện', pct, bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800' };
  return { key: 'CHUA_BAT_DAU', label: 'Chưa bắt đầu', pct, bar: 'bg-amber-300', badge: 'bg-amber-100 text-amber-800' };
};

/** Tỷ lệ hoàn thành: Hoàn thành / không Hủy; null nếu chưa có công việc không bị Hủy */
export const completionRate = (projTasks: Task[]) => {
  const valid = projTasks.filter(t => t.status !== 'HUY');
  if (valid.length === 0) return null;
  return Math.round((valid.filter(t => t.status === 'HOAN_THANH').length / valid.length) * 100);
};

export const PHONE_RE =/^[0-9+ .-]{1,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
