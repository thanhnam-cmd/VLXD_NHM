import type { Assignment, StaffLeave, Task, Project, Staff } from '../types/index.ts';

/**
 * Checks if two date ranges [startA, endA) and [startB, endB) overlap.
 * As defined in thesis:
 * Interval overlap occurs if and only if: startA < endB AND startB < endA.
 * Boundary contact (startA === endB or endA === startB) is strictly allowed.
 */
export function checkIntervalOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  if (isNaN(sA) || isNaN(eA) || isNaN(sB) || isNaN(eB)) {
    return false;
  }

  // Interval [start, end)
  return sA < eB && sB < eA;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?: 'assignment' | 'leave' | 'task_status' | 'project_status' | 'time_bounds' | 'staff_inactive';
  conflictingItem?: Assignment | StaffLeave | Task | Project | Staff;
  recordId?: string;
  message?: string;
  suggestedAction?: string;
  ruleCode?: 'G3' | 'KB08' | 'KB09' | 'KB10' | 'KB11' | 'KB12' | 'KB13' | 'KB14';
}

/**
 * Validates assignment against all 7 G3 business rules:
 * 1. Nhân sự đang làm việc (KB12)
 * 2. Công việc chưa Hoàn thành / Hủy (KB13)
 * 3. Dự án Lập kế hoạch hoặc Đang triển khai (KB14)
 * 4. Nằm trong khung thời gian dự kiến của công việc (KB11)
 * 5. Không chồng lấn phân công khác của cùng nhân sự (KB08)
 * 6. Không trùng lịch nghỉ/bận của cùng nhân sự (KB09)
 * 7. Thời điểm bắt đầu phải trước thời điểm kết thúc
 */
export function checkScheduleConflict(
  staffId: string,
  newStart: string,
  newEnd: string,
  activeAssignments: Assignment[],
  activeLeaves: StaffLeave[],
  excludeAssignmentId?: string,
  context?: {
    task?: Task;
    project?: Project;
    staff?: Staff;
  }
): ConflictCheckResult {
  const sNew = new Date(newStart).getTime();
  const eNew = new Date(newEnd).getTime();

  // Rule 7: Bắt đầu phải trước kết thúc
  if (sNew >= eNew) {
    return {
      hasConflict: true,
      conflictType: 'time_bounds',
      message: 'Thời gian bắt đầu phải trước thời gian kết thúc.',
      ruleCode: 'G3'
    };
  }

  // Rule 1: Nhân sự đã ngừng làm việc (KB12)
  if (context?.staff && !context.staff.isActive) {
    return {
      hasConflict: true,
      conflictType: 'staff_inactive',
      conflictingItem: context.staff,
      message: 'Nhân sự đã ngừng làm việc; không lập phân công mới.',
      suggestedAction: 'Chọn nhân sự khác',
      ruleCode: 'KB12'
    };
  }

  // Rule 2: Công việc đã Hoàn thành hoặc Hủy (KB13)
  if (context?.task) {
    const tStatus = context.task.status;
    if (tStatus === 'HOAN_THANH' || tStatus === 'HUY' || tStatus === 'done' || tStatus === 'cancelled') {
      return {
        hasConflict: true,
        conflictType: 'task_status',
        conflictingItem: context.task,
        message: 'Công việc đã Hoàn thành hoặc Hủy; không lập thêm phân công.',
        suggestedAction: 'Đóng biểu mẫu',
        ruleCode: 'KB13'
      };
    }
  }

  // Rule 3: Dự án đang Tạm dừng hoặc Hoàn thành/Hủy (KB14)
  if (context?.project) {
    const pStatus = context.project.status;
    if (pStatus === 'TAM_DUNG' || pStatus === 'paused') {
      return {
        hasConflict: true,
        conflictType: 'project_status',
        conflictingItem: context.project,
        message: 'Dự án đang Tạm dừng: chỉ được thu hẹp hoặc hủy phân công.',
        suggestedAction: 'Tiếp tục dự án trước khi phân công mới',
        ruleCode: 'KB14'
      };
    }
    if (pStatus === 'HOAN_THANH' || pStatus === 'HUY' || pStatus === 'completed' || pStatus === 'cancelled') {
      return {
        hasConflict: true,
        conflictType: 'project_status',
        conflictingItem: context.project,
        message: 'Dự án đã Hoàn thành hoặc Hủy; không lập thêm phân công.',
        ruleCode: 'G3'
      };
    }
  }

  // Rule 4: Khoảng phân công nằm ngoài thời gian dự kiến của công việc (KB11)
  if (context?.task && context.task.startDate && context.task.dueDate) {
    const tStart = new Date(context.task.startDate).getTime();
    const tDue = new Date(context.task.dueDate).getTime();
    if (!isNaN(tStart) && !isNaN(tDue)) {
      if (sNew < tStart || eNew > tDue) {
        return {
          hasConflict: true,
          conflictType: 'time_bounds',
          conflictingItem: context.task,
          message: 'Khoảng phân công nằm ngoài thời gian dự kiến của công việc.',
          suggestedAction: 'Dùng khung của công việc',
          ruleCode: 'KB11'
        };
      }
    }
  }

  // Rule 6: Trùng lịch nghỉ/bận còn hiệu lực của nhân sự (KB09)
  for (const leave of activeLeaves) {
    const isTargetStaff = leave.staffId === staffId;
    const isEffective = leave.status === 'HIEU_LUC' || leave.status === 'active';
    if (isTargetStaff && isEffective) {
      if (checkIntervalOverlap(newStart, newEnd, leave.startDate, leave.endDate)) {
        return {
          hasConflict: true,
          conflictType: 'leave',
          conflictingItem: leave,
          recordId: leave.id,
          message: `Nhân sự có lịch nghỉ/bận còn hiệu lực chồng lấn thời gian (bản ghi #${leave.id}). Lý do: ${leave.reason} (${leave.startDate} đến ${leave.endDate}).`,
          suggestedAction: 'Chọn khoảng khác hoặc Tìm người rảnh',
          ruleCode: 'KB09'
        };
      }
    }
  }

  // Rule 5: Chồng lấn phân công còn hiệu lực của cùng nhân sự xuyên dự án (KB08)
  for (const asg of activeAssignments) {
    const isTargetStaff = asg.staffId === staffId;
    const isEffective = asg.status === 'HIEU_LUC' || asg.status === 'active';
    if (isTargetStaff && isEffective) {
      if (excludeAssignmentId && asg.id === excludeAssignmentId) {
        continue;
      }

      if (checkIntervalOverlap(newStart, newEnd, asg.startDate, asg.endDate)) {
        return {
          hasConflict: true,
          conflictType: 'assignment',
          conflictingItem: asg,
          recordId: asg.id,
          message: `Nhân sự đã có phân công còn hiệu lực chồng lấn thời gian (bản ghi #${asg.id}) thuộc công việc ${asg.taskCode || asg.taskName || 'CV'} (${asg.startDate} đến ${asg.endDate}).`,
          suggestedAction: 'Xem bản ghi đó hoặc Tìm người rảnh trong khoảng này',
          ruleCode: 'KB08'
        };
      }
    }
  }

  // Hợp lệ (KB10)
  return { 
    hasConflict: false, 
    message: 'Hợp lệ: nhân sự rảnh trong khoảng này.',
    ruleCode: 'KB10'
  };
}
