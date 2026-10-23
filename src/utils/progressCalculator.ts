import type { Task, TaskStage } from '../types/index.ts';

export const ALL_STAGES: TaskStage[] = [
  'Khảo sát',
  'Thiết kế',
  'Xây dựng',
  'Hoàn thiện',
  'Nghiệm thu'
];

/**
 * Mốc thời gian tra cứu cố định theo tài liệu khóa luận (bảng cau_hinh: THOI_DIEM_TRA_CUU).
 * Dùng để tính toán công việc quá hạn, sắp đến hạn và phân công bị ảnh hưởng.
 */
export let DEMO_QUERY_TIME = '2026-10-12 09:00:00';
/** SO_NGAY_SAP_DEN_HAN – số ngày tính là sắp đến hạn */
export let UPCOMING_DAYS = 7;

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Áp dụng cấu hình hệ thống (MH-20). Để trống thời điểm tra cứu thì dùng giờ máy (QC-05).
 * Các module import DEMO_QUERY_TIME nhận giá trị mới nhờ liên kết động của ES module.
 */
export function applyQueryConfig(queryTime: string | undefined, upcomingDays: number | undefined) {
  if (queryTime && queryTime.trim()) {
    DEMO_QUERY_TIME = queryTime.trim();
  } else {
    const d = new Date();
    DEMO_QUERY_TIME = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
  }
  if (upcomingDays && upcomingDays > 0) UPCOMING_DAYS = upcomingDays;
}

export const STATUS_WEIGHTS = {
  not_started: 0,
  plan: 0,
  doing: 50,
  done: 100,
  cancelled: 0
};

/**
 * Calculates stage status based on all assignments/tasks in that stage
 */
export function getStageStatus(tasksInStage: Task[]): 'none' | 'plan' | 'doing' | 'done' {
  const activeTasks = tasksInStage.filter(t => t.status !== 'cancelled' && t.status !== 'HUY');
  if (activeTasks.length === 0) return 'none';
  if (activeTasks.every(t => t.status === 'done' || t.status === 'HOAN_THANH')) return 'done';
  if (activeTasks.some(t => t.status === 'doing' || t.status === 'DANG_THUC_HIEN')) return 'doing';
  if (activeTasks.some(t => t.status === 'plan' || t.status === 'CHUA_BAT_DAU')) return 'plan';
  return 'none';
}

/**
 * Calculates project completion percentage:
 * Sum of tasks completed / total active (not cancelled) tasks * 100%
 */
export function calculateProjectProgress(tasks: Task[]): number {
  const validTasks = tasks.filter(t => t.status !== 'cancelled' && t.status !== 'HUY');
  if (validTasks.length === 0) return 0;
  const doneCount = validTasks.filter(t => t.status === 'done' || t.status === 'HOAN_THANH').length;
  return Math.round((doneCount / validTasks.length) * 100);
}

/**
 * Determines whether a task is overdue relative to reference query time.
 * Overdue: dueDate < refDate AND status is neither completed nor cancelled.
 */
export function isTaskOverdue(dueDate: string, status: string, refDateStr = DEMO_QUERY_TIME): boolean {
  if (status === 'done' || status === 'cancelled' || status === 'HOAN_THANH' || status === 'HUY') return false;
  const due = new Date(dueDate).getTime();
  const ref = new Date(refDateStr).getTime();
  if (isNaN(due) || isNaN(ref)) return false;
  return due < ref;
}

/**
 * Determines whether a task is upcoming within 7 days.
 * refDate <= dueDate <= refDate + 7 days AND status not completed/cancelled.
 */
export function isTaskUpcoming7Days(dueDate: string, status: string, refDateStr = DEMO_QUERY_TIME): boolean {
  if (status === 'done' || status === 'cancelled' || status === 'HOAN_THANH' || status === 'HUY') return false;
  const due = new Date(dueDate).getTime();
  const ref = new Date(refDateStr).getTime();
  if (isNaN(due) || isNaN(ref)) return false;
  const sevenDays = UPCOMING_DAYS * 24 * 60 * 60 * 1000;
  return due >= ref && due <= ref + sevenDays;
}
