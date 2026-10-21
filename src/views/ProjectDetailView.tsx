import React, { useState } from 'react';
import { Project, Task, TechDoc, Staff, Assignment, TaskStage } from '../types/index.ts';
import { calculateProjectProgress, getStageStatus } from '../utils/progressCalculator.ts';
import { 
  ChevronLeft, 
  Plus, 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  CheckCircle2, 
  Clock, 
  Building2,
  FileBox,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ProjectDetailViewProps {
  project: Project;
  tasks: Task[];
  staff: Staff[];
  docs: TechDoc[];
  assignments: Assignment[];
  onBack: () => void;
  onUpdateTaskStatus: (taskId: string, newStatus: Task['status'], resultSummary?: string) => void;
  onOpenAssignWithDraft: (projectId: string, stage: TaskStage, taskId: string) => void;
  onViewDoc: (doc: TechDoc) => void;
  onAddTask: (task: Omit<Task, 'id' | 'lastUpdated'>) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  tasks,
  staff,
  docs,
  assignments,
  onBack,
  onUpdateTaskStatus,
  onOpenAssignWithDraft,
  onViewDoc,
  onAddTask
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'docs' | 'subcontractor'>('tasks');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingResultText, setEditingResultText] = useState<string>('');

  // Form state for adding new task
  const [newTaskStage, setNewTaskStage] = useState<TaskStage>('Xây dựng');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('Tầng 4');
  const [newTaskAssignee, setNewTaskAssignee] = useState(staff[0]?.id || '');
  const [newTaskDue, setNewTaskDue] = useState('2026-12-31');

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projectDocs = docs.filter(d => d.projectId === project.id);
  const projectAssignments = assignments.filter(a => a.projectId === project.id && a.status === 'active');
  const progressPct = calculateProjectProgress(projectTasks);
  const manager = staff.find(s => s.id === project.managerId);

  const stages: TaskStage[] = ['Khảo sát', 'Thiết kế', 'Xây dựng', 'Hoàn thiện', 'Nghiệm thu'];

  const handleSaveResult = (taskId: string) => {
    onUpdateTaskStatus(taskId, 'doing', editingResultText);
    setEditingResultId(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const assigneeObj = staff.find(s => s.id === newTaskAssignee);
    onAddTask({
      code: `CV${String(Date.now()).slice(-4)}`,
      projectId: project.id,
      stage: newTaskStage,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      locationArea: newTaskLocation.trim(),
      assigneeId: newTaskAssignee,
      assigneeName: assigneeObj?.name || 'Kỹ sư NMH',
      startDate: '2026-10-15',
      dueDate: newTaskDue,
      status: 'plan',
      resultSummary: ''
    });

    setIsAddTaskModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Back breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#152A55] hover:text-[#1E3A75] hover:underline transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Quay lại danh sách dự án
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddTaskModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm công việc mới
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {project.code}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {project.status === 'in_progress' ? 'Đang triển khai' : project.status}
              </span>
              {project.totalFloorArea && (
                <span className="text-xs text-slate-500 font-mono">
                  Quy mô: {project.totalFloorArea}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#0D1A36] mt-1.5">
              {project.name}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {project.place}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Phụ trách: <strong>{manager?.name}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Hạn hoàn thành: <strong className="font-mono">{project.dueDate}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-slate-200">
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-[#152A55] tabular-nums">
                {progressPct}%
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Tiến độ tổng thể</div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#152A55] border-r-[#152A55] flex items-center justify-center text-[10px] font-bold text-[#152A55]">
              {projectTasks.filter(t => t.status === 'done').length}/{projectTasks.length}
            </div>
          </div>
        </div>

        {/* 5-Stage Project Progress Rail */}
        <div className="pt-4">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Tiến độ 5 hạng mục tiêu chuẩn dự án điện nhẹ (ELV):
          </div>
          <div className="grid grid-cols-5 gap-2">
            {stages.map((stage) => {
              const stageTasks = projectTasks.filter(t => t.stage === stage);
              const status = getStageStatus(stageTasks);

              let barColor = 'bg-slate-100 border-dashed border-slate-300';
              let badgeColor = 'text-slate-500 bg-slate-50';
              let statusLabel = 'Chưa giao';

              if (status === 'plan') {
                barColor = 'bg-amber-100 border-amber-400';
                badgeColor = 'text-amber-800 bg-amber-50';
                statusLabel = 'Lên kế hoạch';
              } else if (status === 'doing') {
                barColor = 'bg-blue-100 border-blue-500';
                badgeColor = 'text-blue-800 bg-blue-50';
                statusLabel = 'Đang làm';
              } else if (status === 'done') {
                barColor = 'bg-emerald-600 border-emerald-600 text-white';
                badgeColor = 'text-emerald-800 bg-emerald-50';
                statusLabel = 'Hoàn thành';
              }

              return (
                <div key={stage} className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-200 text-center">
                  <div className={`h-2.5 rounded-xs border mb-1.5 ${barColor}`} />
                  <div className="text-xs font-bold text-slate-800 truncate">{stage}</div>
                  <div className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block mt-1 font-medium ${badgeColor}`}>
                    {statusLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'tasks'
              ? 'border-[#152A55] text-[#152A55]'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Công việc &amp; Kết quả thi công ({projectTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'docs'
              ? 'border-[#152A55] text-[#152A55]'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileBox className="w-4 h-4" />
          <span>Hồ sơ kỹ thuật CAD &amp; PDF ({projectDocs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subcontractor')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'subcontractor'
              ? 'border-[#152A55] text-[#152A55]'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Đội thi công ngoài &amp; Phân công ({projectAssignments.length})</span>
        </button>
      </div>

      {/* Tab 1: Tasks grouped by Stage */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {stages.map((stage) => {
            const stageTasks = projectTasks.filter(t => t.stage === stage);
            const status = getStageStatus(stageTasks);

            return (
              <div key={stage} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Stage Header */}
                <div className="px-4 py-3 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-[#0D1A36]">{stage}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      status === 'done' ? 'bg-emerald-100 text-emerald-800' :
                      status === 'doing' ? 'bg-blue-100 text-blue-800' :
                      status === 'plan' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {status === 'done' ? 'Đã hoàn thành' :
                       status === 'doing' ? 'Đang thực hiện' :
                       status === 'plan' ? 'Lên kế hoạch' : 'Chưa giao'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const firstTask = stageTasks[0];
                      onOpenAssignWithDraft(project.id, stage, firstTask ? firstTask.id : '');
                    }}
                    className="text-xs font-semibold text-[#152A55] hover:underline flex items-center gap-1"
                  >
                    + Phân công hạng mục này
                  </button>
                </div>

                {/* Tasks List */}
                {stageTasks.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 italic">
                    Chưa có công việc nào thuộc hạng mục này.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {stageTasks.map((task) => {
                      const assignee = staff.find(s => s.id === task.assigneeId);
                      return (
                        <div key={task.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                              {task.locationArea && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                  {task.locationArea}
                                </span>
                              )}
                              {task.externalSubcontractor && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                  Giao khoán: {task.externalSubcontractor.companyName}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>

                            {/* Result Summary line */}
                            <div className="flex items-center gap-2 text-xs pt-1">
                              <span className="text-slate-400 font-medium">Kết quả:</span>
                              {editingResultId === task.id ? (
                                <div className="flex items-center gap-1.5 flex-1">
                                  <input
                                    type="text"
                                    value={editingResultText}
                                    onChange={(e) => setEditingResultText(e.target.value)}
                                    className="text-xs px-2 py-1 bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-[#152A55] flex-1"
                                    placeholder="Nhập tiến độ mới (ví dụ: đã xong 50% móng)..."
                                  />
                                  <button
                                    onClick={() => handleSaveResult(task.id)}
                                    className="px-2 py-1 bg-[#152A55] text-white rounded text-[11px] font-semibold"
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    onClick={() => setEditingResultId(null)}
                                    className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px]"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-slate-700">
                                  <span>{task.resultSummary || 'Chưa cập nhật kết quả'}</span>
                                  <button
                                    onClick={() => {
                                      setEditingResultId(task.id);
                                      setEditingResultText(task.resultSummary || '');
                                    }}
                                    className="text-[11px] text-blue-600 hover:underline"
                                  >
                                    [Sửa]
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Controls: Staff, Status, Due date */}
                          <div className="flex items-center gap-3 shrink-0 flex-wrap lg:flex-nowrap">
                            <div className="text-left text-xs">
                              <div className="text-[10px] text-slate-400 font-medium">Kỹ sư phụ trách</div>
                              <div className="font-semibold text-slate-800">{assignee?.name || 'Chưa gán'}</div>
                            </div>

                            <div className="text-left text-xs">
                              <div className="text-[10px] text-slate-400 font-medium">Hạn hoàn thành</div>
                              <div className="font-mono text-slate-700">{task.dueDate}</div>
                            </div>

                            {/* Status selector */}
                            <div className="text-left text-xs">
                              <div className="text-[10px] text-slate-400 font-medium">Trạng thái</div>
                              <select
                                value={task.status}
                                onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold focus:outline-hidden ${
                                  task.status === 'done' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                  task.status === 'doing' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                  task.status === 'plan' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                  'bg-slate-50 text-slate-700 border-slate-300'
                                }`}
                              >
                                <option value="plan">Đang lên kế hoạch</option>
                                <option value="doing">Đang thực hiện</option>
                                <option value="done">Hoàn thành (Đã duyệt)</option>
                                <option value="cancelled">Hủy</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Project Tech Docs */}
      {activeTab === 'docs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projectDocs.map((doc) => (
              <div 
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-[#152A55] transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#152A55] text-amber-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {(doc.fileFormat || 'PDF').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#0D1A36] group-hover:text-[#152A55] truncate">
                        {doc.name || doc.title || 'Hồ sơ kỹ thuật'}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                        {doc.version || 'v1.0'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {doc.type} · Dung lượng: {doc.fileSize || 'N/A'}
                    </div>
                    {doc.floorArea && (
                      <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                        Quy mô: {doc.floorArea} · Cao độ: {doc.elevation}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onViewDoc(doc)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-[#152A55] hover:text-white transition-colors shrink-0"
                >
                  Xem bản vẽ
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Subcontractors & Assignments */}
      {activeTab === 'subcontractor' && (
        <div className="space-y-4">
          {/* Subcontractor HTC Info */}
          <div className="bg-white rounded-xl border border-purple-200 p-5 shadow-xs">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Đội thi công nhận khoán bên ngoài
                </span>
                <h3 className="text-base font-bold text-[#0D1A36] mt-1.5">
                  Công ty TNHH Tư vấn và Thương mại HTC (Hải Phòng)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trụ sở: Số 1C190 Bãi Sậy - Hồng Bàng - Hải Phòng · Đại diện: Nguyễn Huy Hảo
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-right">
                <div className="text-[10px] text-purple-700 font-medium">Giá trị hợp đồng giao khoán</div>
                <div className="text-base font-bold font-mono text-purple-950">1.406.998.000 VNĐ</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Phạm vi công việc:</span>
                <div className="font-semibold text-slate-800">Thi công Lan/Tel &amp; PA Nhà A1</div>
              </div>
              <div>
                <span className="text-slate-400">Đầu mối liên hệ:</span>
                <div className="font-semibold text-slate-800">0975 722 896</div>
              </div>
              <div>
                <span className="text-slate-400">Kỹ sư NMH phối hợp:</span>
                <div className="font-semibold text-slate-800">Nguyễn Văn Hùng (Chỉ huy trưởng)</div>
              </div>
            </div>
          </div>

          {/* Active Internal Assignments for this project */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0D1A36] mb-3">
              Lịch Phân Công Kỹ Sư Nội Bộ Dự Án Này
            </h3>
            <div className="space-y-2">
              {projectAssignments.map(asg => {
                const s = staff.find(x => x.id === asg.staffId);
                const task = tasks.find(t => t.id === asg.taskId);
                return (
                  <div key={asg.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{s?.name} · {s?.roleTitle}</div>
                      <div className="text-slate-500 text-[11px]">Công việc: {task?.title}</div>
                    </div>
                    <div className="font-mono text-slate-600">
                      {asg.startDate} <span className="text-slate-400">đến</span> {asg.endDate}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Task */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Thêm công việc mới vào {project.code}</h3>
              <button onClick={() => setIsAddTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Hạng mục</label>
                <select
                  value={newTaskStage}
                  onChange={(e) => setNewTaskStage(e.target.value as TaskStage)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tên công việc</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kéo cáp Cat6 tầng 6 phòng chuyên gia..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Khu vực / Tầng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tầng 6 hoặc Phòng họp kỹ thuật..."
                  value={newTaskLocation}
                  onChange={(e) => setNewTaskLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Kỹ sư NMH phụ trách chính</label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
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
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Mô tả kỹ thuật</label>
                <textarea
                  rows={2}
                  placeholder="Nội dung chi tiết..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#152A55] text-white rounded-lg hover:bg-[#1E3A75]"
                >
                  Tạo công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
