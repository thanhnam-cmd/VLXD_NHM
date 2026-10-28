import React from 'react';
import { DEMO_QUERY_TIME, UPCOMING_DAYS, isTaskOverdue, isTaskUpcoming7Days } from '../utils/progressCalculator.ts';
import { useStore } from '../state/store.tsx';
import { isDirectorRole, formatDate, formatDateTime, daysBetween } from '../utils/domain.ts';
import type { ActiveTab } from '../components/Sidebar.tsx';
import type { NavParams } from '../App.tsx';
import { 
  FolderKanban, 
  RotateCw, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  CalendarX2,
  Users2,
  CalendarClock
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab, params?: NavParams) => void;
  onOpenProject: (projectId: string, taskId?: string) => void;
  onRefresh?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenProject,
  onRefresh
}) => {
  const store = useStore();
  const { currentUser, visibleProjects: projects, scoped, workLogs, visibleProjectIds } = store;
  const tasks = scoped.tasks;
  const assignments = scoped.assignments;
  const isDirector = isDirectorRole(currentUser);

  // Thẻ chỉ số dự án: Quản lý mở MH-07, Ban giám đốc mở BC-01 (không có danh sách dự án)
  const onNavigateTab = (tab: string, filterParam?: string) => {
    if (tab === 'projects') return onNavigate('projects', { projectStatus: filterParam === 'all' ? undefined : filterParam });
    if (tab === 'reports') {
      if (filterParam === 'overdue' || filterParam === 'upcoming') return onNavigate('reports', { reportTab: 'BC-03', reportFilter: filterParam });
      return onNavigate('reports', { reportTab: 'BC-01', reportFilter: filterParam === 'all' ? undefined : filterParam });
    }
    if (tab === 'leaves') return onNavigate('assignments', { assignTab: 'leaves', assignFilter: 'affected' });
    if (tab === 'worklogs') return onNavigate('worklogs', { worklogStatus: 'pending' });
    if (tab === 'assignments') return onNavigate('assignments', { assignTab: 'assignments', assignFilter: 'unassigned' });
  };
  const onOpenAssign = () => onNavigate('assignments');
  const onOpenDocs = () => onNavigate('docs');

  // 1. Five project status counts
  const totalProjects = projects.length;
  const canceledProjects = projects.filter(p => p.status === 'HUY' || p.status === 'cancelled').length;
  const planProjects = projects.filter(p => p.status === 'LAP_KE_HOACH' || p.status === 'planning').length;
  const doingProjects = projects.filter(p => p.status === 'DANG_THUC_HIEN' || p.status === 'in_progress').length;
  const pausedProjects = projects.filter(p => p.status === 'TAM_DUNG' || p.status === 'paused').length;
  const doneProjects = projects.filter(p => p.status === 'HOAN_THANH' || p.status === 'completed').length;

  // Active project IDs for tasks
  const activeProjectIds = projects
    .filter(p => p.status === 'LAP_KE_HOACH' || p.status === 'DANG_THUC_HIEN' || p.status === 'TAM_DUNG')
    .map(p => p.id);

  // 2. Overdue & Upcoming tasks (only in active projects, non-completed, non-canceled)
  const overdueTasks = tasks.filter(t => {
    if (!activeProjectIds.includes(t.projectId)) return false;
    return isTaskOverdue(t.dueDate, t.status);
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const upcomingTasks = tasks.filter(t => {
    if (!activeProjectIds.includes(t.projectId)) return false;
    return isTaskUpcoming7Days(t.dueDate, t.status);
  });

  // 3. Khung "Cần xử lý" (Chỉ Quản lý)
  // 3.1. Phân công bị ảnh hưởng bởi lịch nghỉ/bận
  const affectedAssignments = store.getAffectedAssignments().filter(a => visibleProjectIds.has(a.projectId));

  // 3.1b. Nhân sự đội khoán ngoài đội trưởng đã báo, chờ Quản lý xác nhận
  const pendingExternalDays = store.pendingDailyConfirmations ? store.pendingDailyConfirmations() : [];

  // 3.2. Chờ xác nhận hoàn thành
  const pendingApprovalTasks = tasks.filter(t => {
    if (t.status !== 'DANG_THUC_HIEN' && t.status !== 'doing') return false;
    const logs = workLogs.filter(w => w.taskId === t.id && !w.recordedByManager).sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const latest = logs[0];
    return !!latest && !!latest.requestApproval && !latest.statusVerifiedByManager;
  });

  // 3.3. Công việc chưa có nhân sự (thuộc dự án chưa hoàn thành/hủy)
  const unassignedTasks = tasks.filter(t => {
    if (!activeProjectIds.includes(t.projectId)) return false;
    if (t.status === 'HOAN_THANH' || t.status === 'HUY') return false;
    const hasAsg = assignments.some(a => a.taskId === t.id && (a.status === 'HIEU_LUC' || a.status === 'active'));
    return !hasAsg;
  });

  // 4. Biểu đồ Công việc theo trạng thái
  const taskStatusCounts = {
    not_started: tasks.filter(t => t.status === 'CHUA_BAT_DAU' || t.status === 'plan').length,
    doing: tasks.filter(t => t.status === 'DANG_THUC_HIEN' || t.status === 'doing').length,
    done: tasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'done').length,
    canceled: tasks.filter(t => t.status === 'HUY' || t.status === 'cancelled').length
  };
  const maxTaskCount = Math.max(1, taskStatusCounts.not_started, taskStatusCounts.doing, taskStatusCounts.done, taskStatusCounts.canceled);

  // Helper calculate overdue days
  // Số ngày lịch giữa hạn hoàn thành và thời điểm tra cứu (hạn 07/10, tra cứu 12/10: quá 5 ngày)
  const getOverdueDays = (dueDateStr: string) => Math.max(1, daysBetween(dueDateStr, DEMO_QUERY_TIME));

  return (
    <div className="space-y-5">
      {/* 1. Tiêu đề trang (MH-06 Mục 3.3.4.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-[#0D1A36] tracking-tight">
            Tổng quan dự án
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Cập nhật lúc <strong>{formatDateTime(DEMO_QUERY_TIME)}</strong></span>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Làm mới dữ liệu"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Hai nút nhanh (Chỉ Quản lý có hai nút này; Ban giám đốc không có) */}
        {!isDirector && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenAssign}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Phân công nhân sự</span>
            </button>
            <button
              type="button"
              onClick={onOpenDocs}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <span>Tra cứu hồ sơ kỹ thuật</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Bảy thẻ chỉ số (MH-06 Thành phần 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Thẻ 1: Tổng dự án */}
        <button
          type="button"
          onClick={() => {
            if (isDirector) onNavigateTab('reports', 'all');
            else onNavigateTab('projects', 'all');
          }}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all text-left cursor-pointer group"
        >
          <div className="text-[11px] font-semibold text-slate-500 truncate">Tổng dự án</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-900">{totalProjects}</span>
            <span className="text-[11px] text-slate-500">dự án</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            (hủy: {canceledProjects})
          </div>
        </button>

        {/* Thẻ 2: Lập kế hoạch */}
        <button
          type="button"
          onClick={() => {
            if (isDirector) onNavigateTab('reports', 'LAP_KE_HOACH');
            else onNavigateTab('projects', 'LAP_KE_HOACH');
          }}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all text-left cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-slate-500 truncate">Lập kế hoạch</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-800">{planProjects}</span>
            <span className="text-[11px] text-slate-500">dự án</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">Chuẩn bị hồ sơ</div>
        </button>

        {/* Thẻ 3: Đang triển khai */}
        <button
          type="button"
          onClick={() => {
            if (isDirector) onNavigateTab('reports', 'DANG_THUC_HIEN');
            else onNavigateTab('projects', 'DANG_THUC_HIEN');
          }}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all text-left cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-blue-700 truncate">Đang triển khai</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-blue-700">{doingProjects}</span>
            <span className="text-[11px] text-slate-500">dự án</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">Đang thi công</div>
        </button>

        {/* Thẻ 4: Tạm dừng */}
        <button
          type="button"
          onClick={() => {
            if (isDirector) onNavigateTab('reports', 'TAM_DUNG');
            else onNavigateTab('projects', 'TAM_DUNG');
          }}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all text-left cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-amber-600 truncate">Tạm dừng</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-amber-600">{pausedProjects}</span>
            <span className="text-[11px] text-slate-500">dự án</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">Chờ hiện trường</div>
        </button>

        {/* Thẻ 5: Hoàn thành */}
        <button
          type="button"
          onClick={() => {
            if (isDirector) onNavigateTab('reports', 'HOAN_THANH');
            else onNavigateTab('projects', 'HOAN_THANH');
          }}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all text-left cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-emerald-600 truncate">Hoàn thành</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-emerald-600">{doneProjects}</span>
            <span className="text-[11px] text-slate-500">dự án</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">Đã nghiệm thu</div>
        </button>

        {/* Thẻ 6: Quá hạn (công việc) - Màu đỏ */}
        <button
          type="button"
          onClick={() => onNavigateTab('reports', 'overdue')}
          className="p-3 bg-red-50/70 rounded-xl border border-red-200 hover:border-red-400 hover:shadow-xs transition-all text-left cursor-pointer"
        >
          <div className="text-[11px] font-bold text-red-700 truncate">Quá hạn</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-red-700">{overdueTasks.length}</span>
            <span className="text-[11px] text-red-600 font-medium">công việc</span>
          </div>
          <div className="text-[10px] text-red-500 mt-0.5 truncate">Cần xử lý gấp</div>
        </button>

        {/* Thẻ 7: Sắp đến hạn (công việc) - Màu cam */}
        <button
          type="button"
          onClick={() => onNavigateTab('reports', 'upcoming')}
          className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-xs transition-all text-left cursor-pointer"
        >
          <div className="text-[11px] font-bold text-amber-700 truncate">Sắp đến hạn</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-amber-700">{upcomingTasks.length}</span>
            <span className="text-[11px] text-amber-600 font-medium">công việc</span>
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5 truncate">Trong {UPCOMING_DAYS} ngày tới</div>
        </button>
      </div>

      {/* 3. Khung "Cần xử lý" (Chỉ Quản lý có khung này theo Mục 3.3.4.1 và Phụ lục B.1) */}
      {!isDirector && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Cần xử lý ngay
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* Mục 1: Phân công bị ảnh hưởng */}
            <button
              type="button"
              onClick={() => onNavigateTab('leaves')}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                affectedAssignments.length > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/80'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">Phân công bị ảnh hưởng</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Trùng lịch nghỉ/bận cần điều chuyển</div>
              </div>
              <span className={`text-xl font-bold font-mono px-2 py-0.5 rounded-md ${
                affectedAssignments.length > 0 ? 'bg-amber-200/70 text-amber-900' : 'text-slate-400'
              }`}>
                {affectedAssignments.length}
              </span>
            </button>

            {/* Mục 2: Chờ xác nhận hoàn thành */}
            <button
              type="button"
              onClick={() => onNavigateTab('worklogs')}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                pendingApprovalTasks.length > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/80'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">Chờ xác nhận hoàn thành</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Đề nghị từ Đội trưởng gửi về</div>
              </div>
              <span className={`text-xl font-bold font-mono px-2 py-0.5 rounded-md ${
                pendingApprovalTasks.length > 0 ? 'bg-amber-200/70 text-amber-900' : 'text-slate-400'
              }`}>
                {pendingApprovalTasks.length}
              </span>
            </button>

            {/* Mục 2b: Nhân sự đội khoán ngoài chờ xác nhận */}
            <button
              type="button"
              onClick={() => onNavigate('assignments', { assignTab: 'contractor', assignFilter: 'pending' })}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                pendingExternalDays.length > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/80'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">Nhân sự đội ngoài chờ xác nhận</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Đội trưởng đã báo đủ/thiếu trong ngày</div>
              </div>
              <span className={`text-xl font-bold font-mono px-2 py-0.5 rounded-md ${
                pendingExternalDays.length > 0 ? 'bg-amber-200/70 text-amber-900' : 'text-slate-400'
              }`}>
                {pendingExternalDays.length}
              </span>
            </button>

            {/* Mục 3: Công việc chưa có nhân sự */}
            <button
              type="button"
              onClick={() => onNavigateTab('assignments')}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                unassignedTasks.length > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/80'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">Công việc chưa có nhân sự</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Cần lập lịch phân công thi công</div>
              </div>
              <span className={`text-xl font-bold font-mono px-2 py-0.5 rounded-md ${
                unassignedTasks.length > 0 ? 'bg-amber-200/70 text-amber-900' : 'text-slate-400'
              }`}>
                {unassignedTasks.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Khung Cảnh báo tiến độ & Biểu đồ trạng thái (2 Cột) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cột trái: Khung Cảnh báo tiến độ (Thành phần 6) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                {overdueTasks.length > 0 ? (
                  <span className="text-red-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Cảnh báo tiến độ: có {overdueTasks.length} công việc quá hạn cần rà soát
                  </span>
                ) : (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Không có công việc quá hạn.
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('reports', 'overdue')}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {overdueTasks.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium text-center">
                  {projects.length === 0 ? 'Chưa có dự án nào trong phạm vi của bạn.' : 'Không có công việc quá hạn.'}
                </div>
              ) : (
                overdueTasks.slice(0, 10).map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const days = getOverdueDays(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-lg border border-red-100 bg-red-50/40 hover:bg-red-50 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded-md bg-red-600 text-white font-bold text-[10px]">
                            Quá {days} ngày
                          </span>
                          <span className="font-bold text-slate-900 truncate">
                            {task.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {project?.code} · Phụ trách: <strong>{task.assigneeName || 'Chưa gán'}</strong> · Hạn: {formatDate(task.dueDate)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenProject(task.projectId, task.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Cột phải: Biểu đồ Công việc theo trạng thái (Thành phần 7) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
            Công việc theo trạng thái
          </div>

          <div className="space-y-3 pt-2">
            {/* Chưa bắt đầu */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Chưa bắt đầu</span>
                <span className="font-bold font-mono text-slate-800">{taskStatusCounts.not_started}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-400 rounded-full transition-all"
                  style={{ width: `${(taskStatusCounts.not_started / maxTaskCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Đang thực hiện */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-blue-700 font-medium">Đang thực hiện</span>
                <span className="font-bold font-mono text-blue-700">{taskStatusCounts.doing}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${(taskStatusCounts.doing / maxTaskCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Hoàn thành */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-emerald-700 font-medium">Hoàn thành</span>
                <span className="font-bold font-mono text-emerald-700">{taskStatusCounts.done}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(taskStatusCounts.done / maxTaskCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Hủy */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 font-medium">Hủy</span>
                <span className="font-bold font-mono text-slate-600">{taskStatusCounts.canceled}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-300 rounded-full transition-all"
                  style={{ width: `${(taskStatusCounts.canceled / maxTaskCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
