import React, { useState } from 'react';
import { Project, Task, Staff } from '../types/index.ts';
import { calculateProjectProgress, getStageStatus } from '../utils/progressCalculator.ts';
import { 
  Plus, 
  MapPin, 
  User, 
  Calendar, 
  ChevronRight, 
  Search, 
  Building,
  CheckCircle2
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  staff: Staff[];
  onSelectProject: (projectId: string) => void;
  onAddProject: (project: Omit<Project, 'id'>) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  tasks,
  staff,
  onSelectProject,
  onAddProject
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New project form state
  const [code, setCode] = useState(`NMH-PRJ-2026-${Math.floor(10 + Math.random() * 90)}`);
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [client, setClient] = useState('');
  const [managerId, setManagerId] = useState(staff[0]?.id || '');
  const [startDate, setStartDate] = useState('2026-10-15');
  const [dueDate, setDueDate] = useState('2027-06-30');
  const [scopeSummary, setScopeSummary] = useState('');
  const [totalFloorArea, setTotalFloorArea] = useState('2.500 m²');

  const filtered = projects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.place.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const mgrObj = staff.find(s => s.id === managerId);
    onAddProject({
      code: code.trim(),
      name: name.trim(),
      place: place.trim(),
      client: client.trim(),
      clientName: client.trim(),
      managerId,
      managerName: mgrObj?.name || 'Quản lý NMH',
      startDate,
      dueDate,
      status: 'planning',
      scopeSummary: scopeSummary.trim() || 'Triển khai hạ tầng điện nhẹ ELV theo thiết kế phê duyệt.',
      totalFloorArea
    });

    setIsCreateOpen(false);
    setName('');
    setPlace('');
    setClient('');
  };

  const stages: Array<'Khảo sát' | 'Thiết kế' | 'Xây dựng' | 'Hoàn thiện' | 'Nghiệm thu'> = [
    'Khảo sát', 'Thiết kế', 'Xây dựng', 'Hoàn thiện', 'Nghiệm thu'
  ];

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">
            Quản Lý Danh Mục Dự Án &amp; Công Trình
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu trúc 3 cấp chuẩn hóa: Dự án → Hạng mục → Công việc (Theo đề tài nghiên cứu NMH)
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Tạo dự án mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên dự án, vị trí, chủ đầu tư..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#152A55]/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Lọc trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 w-full sm:w-auto"
          >
            <option value="all">Tất cả dự án ({projects.length})</option>
            <option value="in_progress">Đang triển khai</option>
            <option value="planning">Lập kế hoạch</option>
            <option value="completed">Đã hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((project) => {
          const projectTasks = tasks.filter(t => t.projectId === project.id);
          const progress = calculateProjectProgress(projectTasks);
          const manager = staff.find(s => s.id === project.managerId);

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-[#152A55] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {project.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {project.status === 'in_progress' ? 'Đang triển khai' : project.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0D1A36] group-hover:text-[#152A55] transition-colors mt-1">
                      {project.name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xl font-bold font-mono text-[#152A55] tabular-nums">
                      {progress}%
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">hoàn thành</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {project.place}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" /> {project.client}
                  </span>
                </div>

                {/* 5-Stage progress bar */}
                <div className="my-3">
                  <div className="grid grid-cols-5 gap-1.5">
                    {stages.map((stage) => {
                      const stageTasks = projectTasks.filter(t => t.stage === stage);
                      const status = getStageStatus(stageTasks);

                      let barStyle = 'bg-slate-100 border border-dashed border-slate-300';
                      if (status === 'plan') barStyle = 'bg-amber-100 border border-amber-400';
                      if (status === 'doing') barStyle = 'bg-blue-100 border border-blue-500';
                      if (status === 'done') barStyle = 'bg-emerald-600 border border-emerald-600';

                      return (
                        <div key={stage} className="text-center">
                          <div className={`h-2 rounded-xs ${barStyle}`} />
                          <div className="text-[10px] text-slate-500 mt-1 truncate">
                            {stage}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 mb-3">
                  {project.scopeSummary}
                </p>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Phụ trách: <strong>{manager?.name}</strong>
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Hạn: {project.dueDate}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Project */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Tạo mới dự án thi công điện nhẹ</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mã dự án</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Quy mô / Diện tích</label>
                  <input
                    type="text"
                    value={totalFloorArea}
                    onChange={(e) => setTotalFloorArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tên dự án / Công trình</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tòa văn phòng thông minh Licogi..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Địa điểm thi công</label>
                  <input
                    type="text"
                    required
                    placeholder="Quận / Tỉnh thành..."
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Chủ đầu tư / Đối tác</label>
                  <input
                    type="text"
                    required
                    placeholder="Tên cơ quan, doanh nghiệp..."
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Kỹ sư phụ trách NMH</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {s.roleTitle}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Hạn hoàn thành</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tóm tắt phạm vi kỹ thuật</label>
                <textarea
                  rows={2}
                  placeholder="Hệ thống mạng LAN, camera quan sát, máng cáp, âm thanh PA..."
                  value={scopeSummary}
                  onChange={(e) => setScopeSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#152A55] text-white rounded-lg hover:bg-[#1E3A75]"
                >
                  Lưu dự án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
