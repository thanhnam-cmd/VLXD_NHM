import test from 'node:test';
import assert from 'node:assert/strict';
import { checkIntervalOverlap, checkScheduleConflict } from './conflictChecker.ts';
import { calculateProjectProgress, isTaskOverdue, isTaskUpcoming7Days, DEMO_QUERY_TIME } from './progressCalculator.ts';
import type { Assignment, StaffLeave, Task, Project, Staff } from '../types/index.ts';

test('checkIntervalOverlap detects true overlapping date intervals', () => {
  // A: Oct 1 - Oct 10, B: Oct 5 - Oct 15 -> Overlap!
  assert.equal(checkIntervalOverlap('2026-10-01', '2026-10-10', '2026-10-05', '2026-10-15'), true);

  // A: Oct 1 - Oct 5, B: Oct 10 - Oct 15 -> Disjoint (No overlap)
  assert.equal(checkIntervalOverlap('2026-10-01', '2026-10-05', '2026-10-10', '2026-10-15'), false);

  // Boundary condition in thesis: End of A touches Start of B (Oct 5 == Oct 5) -> strictly allowed!
  assert.equal(checkIntervalOverlap('2026-10-01', '2026-10-05', '2026-10-05', '2026-10-10'), false);
});

test('checkScheduleConflict blocks cross-project assignment collisions', () => {
  const existingAssignments: Assignment[] = [
    {
      id: 'asg-1',
      taskId: 't-1',
      projectId: 'p-1',
      staffId: 'staff-hung',
      startDate: '2026-10-10',
      endDate: '2026-10-20',
      status: 'active',
      createdAt: '2026-10-01',
      assignedBy: 'manager'
    }
  ];

  const activeLeaves: StaffLeave[] = [];

  // Collision with existing assignment
  const resConflict = checkScheduleConflict(
    'staff-hung',
    '2026-10-15',
    '2026-10-25',
    existingAssignments,
    activeLeaves
  );
  assert.equal(resConflict.hasConflict, true);
  assert.equal(resConflict.conflictType, 'assignment');

  // No collision on separate time window
  const resOk = checkScheduleConflict(
    'staff-hung',
    '2026-10-21',
    '2026-10-30',
    existingAssignments,
    activeLeaves
  );
  assert.equal(resOk.hasConflict, false);
});

test('KB08: Lập phân công CV12 cho NV006 (Đặng Hoài Nam) chồng lấn bản ghi 31', () => {
  const assignments: Assignment[] = [
    {
      id: '31',
      taskId: '12',
      taskCode: 'CV12',
      projectId: '3',
      staffId: '6',
      startDate: '2026-10-09 08:00:00',
      endDate: '2026-10-16 17:00:00',
      status: 'HIEU_LUC'
    }
  ];

  const res = checkScheduleConflict(
    '6',
    '2026-10-13 08:00:00',
    '2026-10-15 17:00:00',
    assignments,
    []
  );

  assert.equal(res.hasConflict, true);
  assert.equal(res.conflictType, 'assignment');
  assert.equal(res.recordId, '31');
  assert.equal(res.ruleCode, 'KB08');
});

test('KB09: Lập phân công CV12 cho NV014 (Cao Văn Bình) trùng lịch nghỉ số 4', () => {
  const leaves: StaffLeave[] = [
    {
      id: '4',
      staffId: '14',
      startDate: '2026-10-18 08:00:00',
      endDate: '2026-10-20 17:00:00',
      reason: 'Đi công tác ngoài tỉnh (đã xin phép)',
      status: 'HIEU_LUC'
    }
  ];

  const res = checkScheduleConflict(
    '14',
    '2026-10-18 09:00:00',
    '2026-10-20 16:00:00',
    [],
    leaves
  );

  assert.equal(res.hasConflict, true);
  assert.equal(res.conflictType, 'leave');
  assert.equal(res.recordId, '4');
  assert.equal(res.ruleCode, 'KB09');
});

test('KB10: Lập phân công CV12 cho NV003 (Phạm Văn Cường) hợp lệ', () => {
  const task: Task = {
    id: '12',
    code: 'CV12',
    title: 'Cấu hình VLAN',
    projectId: '3',
    assigneeId: '6',
    startDate: '2026-10-09 08:00:00',
    dueDate: '2026-10-22 17:00:00',
    status: 'DANG_THUC_HIEN',
    description: ''
  };

  const project: Project = {
    id: '3',
    code: 'NMH-2026-003',
    name: 'Mạng LAN văn phòng An Bình',
    place: 'Hà Nội',
    scopeSummary: '',
    startDate: '2026-09-12 08:00:00',
    dueDate: '2026-11-06 17:00:00',
    status: 'DANG_THUC_HIEN',
    managerId: '1'
  };

  const staff: Staff = {
    id: '3',
    code: 'NV003',
    name: 'Phạm Văn Cường',
    roleTitle: 'DOI_TRUONG',
    roleTitleDisplay: 'Đội trưởng',
    phone: '',
    email: '',
    specialty: '',
    isActive: true,
    startDate: '2018-09-10'
  };

  const res = checkScheduleConflict(
    '3',
    '2026-10-13 08:00:00',
    '2026-10-15 17:00:00',
    [],
    [],
    undefined,
    { task, project, staff }
  );

  assert.equal(res.hasConflict, false);
  assert.equal(res.ruleCode, 'KB10');
  assert.match(res.message || '', /Hợp lệ/);
});

test('KB11: Lập phân công CV12 cho NV003 ngoài khung công việc', () => {
  const task: Task = {
    id: '12',
    code: 'CV12',
    title: 'Cấu hình VLAN',
    projectId: '3',
    assigneeId: '6',
    startDate: '2026-10-09 08:00:00',
    dueDate: '2026-10-22 17:00:00',
    status: 'DANG_THUC_HIEN',
    description: ''
  };

  const res = checkScheduleConflict(
    '3',
    '2026-10-08 08:00:00',
    '2026-10-10 08:00:00',
    [],
    [],
    undefined,
    { task }
  );

  assert.equal(res.hasConflict, true);
  assert.equal(res.conflictType, 'time_bounds');
  assert.equal(res.ruleCode, 'KB11');
});

test('KB12: Lập phân công cho NV023 (Phạm Văn Đạt đã ngừng làm việc)', () => {
  const staff: Staff = {
    id: '23',
    code: 'NV023',
    name: 'Phạm Văn Đạt',
    roleTitle: 'KY_THUAT_VIEN',
    roleTitleDisplay: 'Kỹ thuật viên',
    phone: '',
    email: '',
    specialty: '',
    isActive: false, // NGUNG_LAM_VIEC
    startDate: '2022-02-14',
    leaveDate: '2026-09-22'
  };

  const res = checkScheduleConflict(
    '23',
    '2026-10-13 08:00:00',
    '2026-10-15 17:00:00',
    [],
    [],
    undefined,
    { staff }
  );

  assert.equal(res.hasConflict, true);
  assert.equal(res.conflictType, 'staff_inactive');
  assert.equal(res.ruleCode, 'KB12');
});

test('KB13: Lập phân công cho CV01 (đã Hoàn thành)', () => {
  const task: Task = {
    id: '1',
    code: 'CV01',
    title: 'Khảo sát',
    projectId: '1',
    assigneeId: '6',
    startDate: '2026-06-14 08:00:00',
    dueDate: '2026-06-24 17:00:00',
    status: 'HOAN_THANH',
    description: ''
  };

  const res = checkScheduleConflict(
    '3',
    '2026-06-15 08:00:00',
    '2026-06-20 17:00:00',
    [],
    [],
    undefined,
    { task }
  );

  assert.equal(res.hasConflict, true);
  assert.equal(res.conflictType, 'task_status');
  assert.equal(res.ruleCode, 'KB13');
});

test('KB14: Lập phân công CV28 trong dự án NMH-2026-006 (Tạm dừng)', () => {
  const project: Project = {
    id: '6',
    code: 'NMH-2026-006',
    name: 'Hạ tầng thoại tòa nhà Minh Phát',
    place: 'Hà Nội',
    scopeSummary: '',
    startDate: '2026-09-17 08:00:00',
    dueDate: '2026-11-11 17:00:00',
    status: 'TAM_DUNG',
    managerId: '2'
  };

  const res = checkScheduleConflict(
    '3',
    '2026-10-13 09:00:00',
    '2026-10-16 17:00:00',
    [],
    [],
    undefined,
    { project }
  );

  assert.equal(res.hasConflict, true);
  assert.equal(res.conflictType, 'project_status');
  assert.equal(res.ruleCode, 'KB14');
});

test('DEMO_QUERY_TIME is strictly 2026-10-12 09:00:00', () => {
  assert.equal(DEMO_QUERY_TIME, '2026-10-12 09:00:00');
});
