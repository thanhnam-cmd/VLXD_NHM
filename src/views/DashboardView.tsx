import React, { useState } from 'react';
import { Project, Task, Staff, Assignment } from '../types/index.ts';
import { calculateProjectProgress, isTaskOverdue, isTaskUpcoming7Days, getStageStatus } from '../utils/progressCalculator.ts';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  MapPin,
  User,
  ExternalLink
} from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
  tasks: Task[];
  staff: Staff[];
  assignments: Assignment[];
  onOpenProject: (projectId: string) => void;
  onOpenAssign: () => void;
  onOpenDocs: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  tasks,
  staff,
  assignments,
  onOpenProject,
  onOpenAssign,
  onOpenDocs
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Ref date from thesis
  const TODAY = '2026-10-14';

  const planTasks = tasks.filter(t => t.status === 'plan');
  const doingTasks = tasks.filter(t => t.status === 'doing');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const overdueTasks = tasks.filter(t => isTaskOverdue(t.dueDate, t.status, TODAY));
  const upcomingTasks = tasks.filter(t => isTaskUpcoming7Days(t.dueDate, t.status, TODAY));

  const filteredProjects = projects.filter(p => {
    if (selectedStatusFilter !== 'all' && p.status !== selectedStatusFilter) return false;
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.place.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">
            Tổng quan Dự án &amp; Báo cáo Điều hành
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu khảo sát thi công điện nhẹ NMH LLC · Thời điểm đối chiếu: {TODAY}
          </p>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAssign}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] transition-colors"
          >
            + Phân công nhân sự
          </button>
          <button
            onClick={onOpenDocs}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Tra cứu bản vẽ
          </button>
        </div>
      </div>

      {/* KPI Statistic Cards (30% Surface, clean tabular numbers) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Tổng dự án</span>
            <FolderKanban className="w-4 h-4 text-[#152A55]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0D1A36] tabular-nums">
            {projects.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">Đang quản lý tập trung</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Đang kế hoạch</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
            {planTasks.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">Chuẩn bị triển khai</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Đang thực hiện</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 tabular-nums">
            {doingTasks.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">Thi công tại hiện trường</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Đã hoàn thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {doneTasks.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">Đã nghiệm thu nội bộ</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-200 bg-red-50/20 shadow-xs">
          <div className="flex items-center justify-between text-red-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Quá hạn</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-700 tabular-nums">
            {overdueTasks.length}
          </div>
          <div className="text-[11px] text-red-600 mt-0.5 truncate font-medium">Cần xử lý &amp; điều phối</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sắp đến hạn</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
            {upcomingTasks.length}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5 truncate font-medium">Trong 7 ngày tới</div>
        </div>
      </div>

      {/* Overdue / Upcoming Warning Callouts if any */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>CẢNH BÁO TIẾN ĐỘ: CÓ {overdueTasks.length} CÔNG VIỆC QUÁ HẠN CẦN RÀ SOÁT</span>
            </div>
            <span className="text-[11px] text-red-600 font-mono">Quy tắc UC-08</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {overdueTasks.map(t => {
              const p = projects.find(x => x.id === t.projectId);
              const assignee = staff.find(s => s.id === t.assigneeId);
              return (
                <div key={t.id} className="bg-white p-2.5 rounded-lg border border-red-200 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-800 truncate">{t.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {p?.name} · Phụ trách: {assignee?.name || 'Chưa giao'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-red-600 font-bold">Hạn: {t.dueDate}</div>
                    <button
                      onClick={() => onOpenProject(t.projectId)}
                      className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      Chi tiết <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Portfolio Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-[#0D1A36]">
              Tiến Độ Triển Khai Danh Mục Dự Án
            </h3>
            <p className="text-xs text-slate-500">
              Theo dõi tiến độ 5 hạng mục chuẩn: Khảo sát · Thiết kế · Xây dựng · Hoàn thiện · Nghiệm thu
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tìm dự án, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#152A55]/20 w-48"
            />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="in_progress">Đang triển khai</option>
              <option value="planning">Lập kế hoạch</option>
              <option value="completed">Đã hoàn thành</option>
            </select>
          </div>
        </div>

        {/* Legend for 5-stage rail */}
        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <span className="font-medium text-slate-700">Chú giải trạng thái:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-400 bg-slate-100" />
            <span>Chưa giao</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-500" />
            <span className="text-amber-800">Đang lên KH</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-600" />
            <span className="text-blue-800">Đang thực hiện</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-emerald-800">Hoàn thành</span>
          </span>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const progressPct = calculateProjectProgress(projectTasks);
            const manager = staff.find(s => s.id === project.managerId);
            const stages: Array<'Khảo sát' | 'Thiết kế' | 'Xây dựng' | 'Hoàn thiện' | 'Nghiệm thu'> = [
              'Khảo sát', 'Thiết kế', 'Xây dựng', 'Hoàn thiện', 'Nghiệm thu'
            ];

            return (
              <div 
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-[#152A55] transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-500">
                          {project.code}
                        </span>
                        {project.totalFloorArea && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {project.totalFloorArea}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#0D1A36] group-hover:text-[#152A55] transition-colors line-clamp-1 mt-0.5">
                        {project.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{project.place}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold font-mono text-[#152A55] tabular-nums">
                        {progressPct}%
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">hoàn thành</span>
                    </div>
                  </div>

                  {/* 5-Stage Rail Visualizer (From Wireframe) */}
                  <div className="my-3">
                    <div className="grid grid-cols-5 gap-1.5">
                      {stages.map((stageName) => {
                        const stageTasks = projectTasks.filter(t => t.stage === stageName);
                        const status = getStageStatus(stageTasks);

                        let barStyle = 'bg-slate-100 border border-dashed border-slate-300';
                        if (status === 'plan') barStyle = 'bg-amber-100 border border-amber-400';
                        if (status === 'doing') barStyle = 'bg-blue-100 border border-blue-500';
                        if (status === 'done') barStyle = 'bg-emerald-600 border border-emerald-600';

                        return (
                          <div key={stageName} className="text-center">
                            <div className={`h-2 rounded-xs ${barStyle}`} />
                            <div className="text-[10px] text-slate-500 mt-1 truncate" title={stageName}>
                              {stageName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scope summary */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-100 mb-3">
                    {project.scopeSummary}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="truncate font-medium text-slate-700">
                      Phụ trách: {manager?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-slate-600">Hạn: {project.dueDate}</span>
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className="text-xs font-semibold text-[#152A55] hover:text-[#1E3A75] flex items-center gap-0.5"
                    >
                      Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Workload Overview (Bottom strip) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0D1A36]">
              Khối Lượng Phân Công &amp; Trực Hiện Trường Theo Kỹ Sư
            </h3>
            <p className="text-xs text-slate-500">
              Kiểm soát số lượng công việc mở và chống chồng lấn thời gian
            </p>
          </div>
          <button
            onClick={onOpenAssign}
            className="text-xs text-[#152A55] font-semibold hover:underline flex items-center gap-1"
          >
            Quản lý phân công <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {staff.map((s) => {
            const userAssignments = assignments.filter(a => a.staffId === s.id && a.status === 'active');
            return (
              <div key={s.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-center">
                <div className="w-8 h-8 rounded-full bg-[#152A55] text-white flex items-center justify-center font-bold text-xs mx-auto mb-1">
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="font-semibold text-xs text-slate-900 truncate">{s.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{s.roleTitle}</div>
                <div className="mt-2 pt-2 border-t border-slate-200/70 font-mono text-xs">
                  <span className="font-bold text-[#152A55]">{userAssignments.length}</span>
                  <span className="text-slate-400 text-[10px]"> việc mở</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
