import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DateInput } from '../components/inputs.tsx';
import { Task, TechDoc, TaskStatus, Category, Assignment } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';
import {
  formatDate, formatDateTime, getCategoryStatus, completionRate, canOperate, isDirectorRole,
  projectAcceptsAssignments, projectAcceptsTasks, isRecordActive, DOC_TYPE_LABEL, toTime, overlaps, daysBetween
} from '../utils/domain.ts';
import { ChevronLeft, Plus, FileText, Calendar, MapPin, User, Building2, FileBox, LayoutDashboard, Upload, MoreVertical, Users2 } from 'lucide-react';
import { useToast, StatusBadge } from '../components/ui.tsx';
import { ProjectFormModal, ProjectStatusDialog, projectMenuItems } from '../components/ProjectDialogs.tsx';
import { CategoryFormModal, TaskFormModal, TaskStatusConfirm } from '../components/TaskDialogs.tsx';
import { UploadDocModal, DocsTable, latestUploadAt, displayVersion } from '../components/DocDialogs.tsx';
import { EditAssignmentModal, CancelAssignmentDialog } from '../components/AssignmentDialogs.tsx';
import { taskApprovalNote, RecordResultModal } from '../components/WorkLogDialogs.tsx';
import { ExternalDetailDrawer } from './ExternalTeamsTab.tsx';
import type { AssignmentDraft } from './AssignmentView.tsx';

interface ProjectDetailViewProps {
  projectId: string;
  focusTaskId?: string;
  onBack: () => void;
  onOpenAssign: (draft: AssignmentDraft) => void;
  onOpenWorklogs: (taskId: string) => void;
  onOpenExternal: () => void;
  onViewDoc: (doc: TechDoc, v?: { versionNum: number }) => void;
  onDownloadDoc: (doc: TechDoc, versionNum?: number) => void;
}

type Tab = 'overview' | 'tasks' | 'people' | 'docs';

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  projectId, focusTaskId, onBack, onOpenAssign, onOpenWorklogs, onOpenExternal, onViewDoc, onDownloadDoc
}) => {
  const store = useStore();
  const { projects, tasks, staff, docs, assignments, categories, customers, workLogs, externalAssignments, currentUser, changeTaskStatus } = store;
  const project = projects.find(p => p.id === projectId)!;
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>(focusTaskId ? 'tasks' : 'tasks');
  const [catModal, setCatModal] = useState<{ category?: Category } | null>(null);
  const [taskModal, setTaskModal] = useState<{ task?: Task; categoryId?: string } | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ task: Task; target: TaskStatus } | null>(null);
  const [uploadFor, setUploadFor] = useState<{ category?: Category } | null>(null);
  const [projectDialog, setProjectDialog] = useState<'status' | 'complete' | 'cancel' | null>(null);
  const [editProject, setEditProject] = useState(false);
  const [recordFor, setRecordFor] = useState<Task | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  // Ngăn nhân sự đội khoán ngoài theo ngày (xem, xác nhận)
  const [extDrawer, setExtDrawer] = useState<string | null>(null);
  const [statusMenu, setStatusMenu] = useState(false);
  const [editAsg, setEditAsg] = useState<Assignment | null>(null);
  const [cancelAsg, setCancelAsg] = useState<Assignment | null>(null);
  const [asgFilter, setAsgFilter] = useState({ date: '', staffId: '', taskId: '', status: 'HIEU_LUC' });
  const catRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const close = () => { setMenuId(null); setStatusMenu(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    if (focusTaskId && taskRefs.current[focusTaskId]) {
      taskRefs.current[focusTaskId]!.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusTaskId]);

  if (!project) {
    return <div className="p-8 bg-white rounded-xl border text-center text-xs text-slate-500">Không tìm thấy trang hoặc dữ liệu bạn cần.</div>;
  }

  const canEdit = canOperate(currentUser) && !isDirectorRole(currentUser);
  const isFinal = project.status === 'HOAN_THANH' || project.status === 'HUY';
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projCats = categories.filter(c => c.projectId === project.id).sort((a, b) => a.orderNum - b.orderNum);
  const projectDocs = docs.filter(d => d.projectId === project.id).sort((a, b) => latestUploadAt(b).localeCompare(latestUploadAt(a)));
  const projectAssignments = assignments.filter(a => a.projectId === project.id);
  const activeAssignments = projectAssignments.filter(isRecordActive);
  const projectExternals = externalAssignments.filter(e => projectTasks.some(t => t.id === e.taskId));
  const activeExternals = projectExternals.filter(e => e.status === 'HIEU_LUC');
  const manager = staff.find(s => s.id === project.managerId);
  const customer = customers.find(c => c.id === project.clientId);
  const progress = completionRate(projectTasks);
  const validCount = projectTasks.filter(t => t.status !== 'HUY').length;
  const doneCount = projectTasks.filter(t => t.status === 'HOAN_THANH').length;
  const menu = projectMenuItems(project);

  const latestLog = (taskId: string) => workLogs.filter(w => w.taskId === taskId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  const overdueDays = (t: Task) => {
    if (t.status === 'HOAN_THANH' || t.status === 'HUY') return 0;
    if (toTime(t.dueDate) >= toTime(DEMO_QUERY_TIME)) return 0;
    return Math.max(1, daysBetween(t.dueDate, DEMO_QUERY_TIME));
  };
  const staffName = (id?: string) => staff.find(s => s.id === id)?.name || '—';

  const onStatusSelect = (task: Task, next: TaskStatus) => {
    if (next === 'HOAN_THANH' || next === 'HUY') {
      setStatusConfirm({ task, target: next });
      return;
    }
    const r = changeTaskStatus(task.id, next);
    toast.show(r.message, r.ok ? 'success' : 'error');
  };

  const scrollToCategory = (catId: string) => {
    setActiveTab('tasks');
    setTimeout(() => catRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const filteredAsg = projectAssignments.filter(a => {
    if (asgFilter.status !== 'all' && a.status !== asgFilter.status) return false;
    if (asgFilter.staffId && a.staffId !== asgFilter.staffId) return false;
    if (asgFilter.taskId && a.taskId !== asgFilter.taskId) return false;
    if (asgFilter.date && !overlaps(a.startDate, a.endDate, `${asgFilter.date} 00:00:00`, `${asgFilter.date} 23:59:59`)) return false;
    return true;
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));

  const canAssign = (t: Task) => projectAcceptsAssignments(project) && (t.status === 'CHUA_BAT_DAU' || t.status === 'DANG_THUC_HIEN');

  return (
    <div className="space-y-6">
      {toast.node}

      {/* 1. Liên kết quay lại & 3. Bốn nút ở phần đầu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#152A55] hover:text-[#1E3A75] hover:underline transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Quay lại danh sách dự án
        </button>

        {canEdit && !isFinal && (
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => setCatModal({})}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-2xs">
              <Plus className="w-3.5 h-3.5" /> Thêm hạng mục
            </button>
            <button type="button" disabled={projCats.length === 0} title={projCats.length === 0 ? 'Hãy thêm hạng mục trước.' : undefined}
              onClick={() => setTaskModal({})}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] transition-colors cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed">
              <Plus className="w-3.5 h-3.5" /> Thêm công việc mới
            </button>
            <div className="relative">
              <button type="button" onClick={(e) => { e.stopPropagation(); setStatusMenu(!statusMenu); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs">
                Đổi trạng thái
              </button>
              {statusMenu && (
                <div className="absolute right-0 top-9 z-20 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs" onClick={e => e.stopPropagation()}>
                  {menu.status && <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setStatusMenu(false); setProjectDialog('status'); }}>Đổi trạng thái triển khai</button>}
                  {menu.complete && <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 text-emerald-700 cursor-pointer" onClick={() => { setStatusMenu(false); setProjectDialog('complete'); }}>Xác nhận hoàn thành dự án</button>}
                  {menu.cancel && <button type="button" className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 cursor-pointer" onClick={() => { setStatusMenu(false); setProjectDialog('cancel'); }}>Hủy dự án</button>}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setEditProject(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs">
              Sửa thông tin
            </button>
          </div>
        )}
      </div>

      {project.status === 'TAM_DUNG' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
          Dự án đang tạm dừng: vẫn thêm được hạng mục và công việc nhưng không lập được phân công mới.
        </div>
      )}

      {/* 2. Thông tin dự án, 4. Vòng tiến độ, 5. Dải hạng mục */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{project.code}</span>
              <StatusBadge status={project.status} />
            </div>
            <h2 className="text-xl font-bold text-[#0D1A36] mt-1.5">{project.name}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {project.place}</span>
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> Phụ trách: <strong>{manager?.name || project.managerName}</strong></span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Thời gian: <strong className="font-mono">{formatDate(project.startDate)} – {formatDate(project.dueDate)}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Khách hàng: <strong>{customer?.name || project.clientName}</strong>
              {customer && <span> · Đầu mối: {customer.contactPerson || '—'} · {customer.phone || '—'}</span>}
            </div>
            {(project.externalTeams || []).length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 flex-wrap">
                <Building2 className="w-3.5 h-3.5 text-purple-500" />
                Đội khoán ngoài:
                {(project.externalTeams || []).map(x => {
                  const pe = externalAssignments.find(e => !e.taskId && e.projectId === project.id && e.contractorId === x.contractorId && e.status === 'HIEU_LUC');
                  const pending = (pe?.dailyStaffing || []).filter(d => !d.confirmed && d.reportedBy).length;
                  return (
                    <button key={x.contractorId} type="button" disabled={!pe} onClick={() => pe && setExtDrawer(pe.id)} title={pe ? 'Xem và xác nhận nhân sự theo ngày' : undefined}
                      className={`px-2 py-0.5 rounded-full border font-semibold ${pending ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-purple-50 border-purple-200 text-purple-800'} ${pe ? 'cursor-pointer hover:underline' : ''}`}>
                      {store.subcontractors.find(c => c.id === x.contractorId)?.companyName || 'Đội đã xóa'} · {x.workerCount} người{pending ? ` · ${pending} ngày chờ xác nhận` : ''}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-slate-200">
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-[#152A55] tabular-nums">{progress === null ? '—' : `${progress}%`}</div>
              <div className="text-[10px] text-slate-500 font-medium">{doneCount}/{validCount} công việc hoàn thành</div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-bold text-[#152A55]"
              style={{ background: `conic-gradient(#152A55 ${(progress || 0) * 3.6}deg, #e2e8f0 0deg)` }}>
              <div className="w-9 h-9 rounded-full bg-[#F8FAFC] flex items-center justify-center">{progress ?? 0}%</div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <div className="text-xs font-semibold text-slate-500 mb-2">Tiến độ theo hạng mục:</div>
          {projCats.length === 0 ? (
            <div className="text-xs text-slate-400 italic">Dự án chưa có hạng mục. Hãy bấm + Thêm hạng mục.</div>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(projCats.length, 5)}, minmax(0, 1fr))` }}>
              {projCats.map(cat => {
                const st = getCategoryStatus(projectTasks.filter(t => t.categoryId === cat.id));
                return (
                  <button type="button" key={cat.id} onClick={() => scrollToCategory(cat.id)}
                    className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-200 text-left hover:border-[#152A55] cursor-pointer">
                    <div className="text-xs font-bold text-slate-800 truncate">{cat.code} · {cat.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{cat.systemTypeName}</div>
                    <div className="h-2 rounded-full bg-slate-200 mt-1.5 overflow-hidden">
                      <div className={`h-full ${st.bar}`} style={{ width: `${st.pct ?? 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${st.badge}`}>{st.label}</span>
                      <span className="text-[10px] font-mono text-slate-600">{st.pct === null ? '—' : `${st.pct}%`}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Bốn tab */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold text-slate-500 overflow-x-auto">
        {([
          ['overview', <LayoutDashboard className="w-4 h-4" />, 'Tổng quan'],
          ['tasks', <FileText className="w-4 h-4" />, `Công việc và Kết quả thi công (${projectTasks.length})`],
          ['people', <Users2 className="w-4 h-4" />, `Nhân sự và Phân công (${activeAssignments.length + activeExternals.length})`],
          ['docs', <FileBox className="w-4 h-4" />, `Hồ sơ kỹ thuật (${projectDocs.length})`]
        ] as [Tab, React.ReactNode, string][]).map(([key, icon, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${activeTab === key ? 'border-[#152A55] text-[#152A55]' : 'border-transparent hover:text-slate-900'}`}>
            {icon}<span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Tổng quan: ba khối */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0D1A36]">Nhân sự được phân công</h3>
              <button type="button" onClick={() => setActiveTab('people')} className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
                  <tr><th className="py-2 pr-3">Nhân sự</th><th className="py-2 pr-3">Chức danh</th><th className="py-2 pr-3">Công việc</th><th className="py-2 pr-3">Hạng mục</th><th className="py-2 pr-3">Thời gian</th><th className="py-2 pr-3">Phụ trách chính</th><th className="py-2">Người lập · thời điểm</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeAssignments.length === 0 ? (
                    <tr><td colSpan={7} className="py-4 text-center text-slate-400">Chưa có phân công còn hiệu lực.</td></tr>
                  ) : [...activeAssignments].sort((a, b) => (b.createdAt || b.startDate).localeCompare(a.createdAt || a.startDate)).slice(0, 5).map(a => {
                    const t = tasks.find(x => x.id === a.taskId);
                    const s = staff.find(x => x.id === a.staffId);
                    return (
                      <tr key={a.id}>
                        <td className="py-2 pr-3 font-semibold">{s?.name || a.staffName}</td>
                        <td className="py-2 pr-3 text-slate-600">{s?.roleTitleDisplay}</td>
                        <td className="py-2 pr-3">{t?.code} · {t?.title}</td>
                        <td className="py-2 pr-3">{categories.find(c => c.id === t?.categoryId)?.code}</td>
                        <td className="py-2 pr-3 font-mono">{formatDate(a.startDate)} – {formatDate(a.endDate)}</td>
                        <td className="py-2 pr-3">{staffName(t?.assigneeId)}</td>
                        <td className="py-2 text-slate-600">{a.assignedBy || '—'}{a.createdAt ? ` · ${formatDateTime(a.createdAt)}` : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0D1A36]">Hồ sơ kỹ thuật</h3>
              <button type="button" onClick={() => setActiveTab('docs')} className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer">Xem tất cả</button>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => (
                <div key={k} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-lg font-bold font-mono text-[#152A55]">{projectDocs.filter(d => d.type === k).length}</div>
                  <div className="text-[10px] text-slate-500">{v}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {projectDocs.slice(0, 5).map(d => {
                const v = displayVersion(d);
                return (
                  <div key={d.id} className="flex items-center justify-between text-xs p-2 rounded-lg border border-slate-100">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{d.title}</div>
                      <div className="text-[10px] text-slate-500">{DOC_TYPE_LABEL[d.type] || d.type} · {v?.label || `Phiên bản ${v?.versionNum ?? 1}`} · {v?.uploadedBy || d.uploadedBy || '—'}</div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">{formatDate(v?.uploadedAt)}</span>
                  </div>
                );
              })}
              {projectDocs.length === 0 && <div className="text-slate-400 text-xs">Chưa có hồ sơ kỹ thuật.</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0D1A36] mb-3">Tiến độ</h3>
            <div className="space-y-2 mb-3">
              {projCats.map(cat => {
                const st = getCategoryStatus(projectTasks.filter(t => t.categoryId === cat.id));
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-[11px]"><span className="font-semibold">{cat.code} · {cat.name}</span><span className="font-mono">{st.pct === null ? '—' : `${st.pct}%`}</span></div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${st.bar}`} style={{ width: `${st.pct ?? 0}%` }} /></div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-[10px] mb-3">
              {(['CHUA_BAT_DAU', 'DANG_THUC_HIEN', 'HOAN_THANH', 'HUY'] as TaskStatus[]).map(s => (
                <div key={s} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-base font-bold font-mono">{projectTasks.filter(t => t.status === s).length}</div>
                  <StatusBadge status={s} kind="task" />
                </div>
              ))}
              <div className="p-1.5 rounded-lg bg-red-50 border border-red-200">
                <div className="text-base font-bold font-mono text-red-700">{projectTasks.filter(t => overdueDays(t) > 0).length}</div>
                <span className="text-red-700 font-bold">Quá hạn</span>
              </div>
            </div>
            <div className="text-[11px] font-bold text-slate-700 mb-1">Ba cập nhật mới nhất từ hiện trường</div>
            <div className="space-y-1.5">
              {workLogs.filter(w => w.projectId === project.id || projectTasks.some(t => t.id === w.taskId))
                .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 3).map(w => (
                  <div key={w.id} className="p-2 rounded-lg border border-slate-100 text-[11px]">
                    <div className="flex justify-between text-slate-500"><span>{tasks.find(t => t.id === w.taskId)?.code} · {w.submittedByStaffName}</span><span className="font-mono">{formatDateTime(w.submittedAt)}</span></div>
                    <div className="text-slate-700 truncate">{w.content}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Công việc và Kết quả thi công: một khung cho mỗi hạng mục */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {projCats.length === 0 && (
            <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">Dự án chưa có hạng mục. Hãy bấm + Thêm hạng mục.</div>
          )}
          {projCats.map((cat) => {
            const catTasks = projectTasks.filter(t => t.categoryId === cat.id);
            const st = getCategoryStatus(catTasks);
            return (
              <div key={cat.id} ref={el => { catRefs.current[cat.id] = el; }} className="bg-white rounded-xl border border-slate-200 overflow-visible shadow-xs">
                <div className="px-4 py-3 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap rounded-t-xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm font-bold text-[#0D1A36]">{cat.code} · {cat.name}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${st.badge}`}>{st.label}</span>
                    <span className="text-[11px] text-slate-500">{catTasks.length} công việc</span>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setUploadFor({ category: cat })} disabled={project.status === 'HUY'}
                        className="text-xs font-semibold text-[#152A55] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40">
                        <Upload className="w-3.5 h-3.5" /> Tải hồ sơ, bản vẽ
                      </button>
                      {!isFinal && (
                        <button type="button" onClick={() => setTaskModal({ categoryId: cat.id })} className="text-xs font-semibold text-[#152A55] hover:underline cursor-pointer">
                          + Thêm công việc
                        </button>
                      )}
                      <div className="relative">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setMenuId(menuId === `cat-${cat.id}` ? null : `cat-${cat.id}`); }} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuId === `cat-${cat.id}` && (
                          <div className="absolute right-0 top-7 z-20 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs" onClick={e => e.stopPropagation()}>
                            <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setMenuId(null); setCatModal({ category: cat }); }}>Sửa hạng mục</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {catTasks.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 italic">Chưa có công việc nào thuộc hạng mục này.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {catTasks.map((task) => {
                      const od = overdueDays(task);
                      const log = latestLog(task.id);
                      const isTaskFinal = task.status === 'HOAN_THANH' || task.status === 'HUY';
                      return (
                        <div key={task.id} ref={el => { taskRefs.current[task.id] = el; }}
                          className={`p-4 grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-center gap-3 hover:bg-slate-50/60 transition-colors ${focusTaskId === task.id ? 'bg-amber-50/60' : ''}`}>
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] text-slate-500">{task.code}</span>
                              <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                              {task.locationArea && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{task.locationArea}</span>
                              )}
                              {(() => {
                                const exts = externalAssignments.filter(e => e.status === 'HIEU_LUC' && e.taskId === task.id);
                                if (exts.length === 0) return null;
                                const pending = exts.reduce((n, e) => n + (e.dailyStaffing || []).filter(d => !d.confirmed && d.reportedBy).length, 0);
                                return (
                                  <button type="button" onClick={() => setExtDrawer(exts[0].id)} title="Xem và xác nhận nhân sự đội khoán ngoài theo ngày"
                                    className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold cursor-pointer ${pending ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                    Đội ngoài: {exts.map(e => `${e.contractorName} (${e.workerCount ?? '—'} người)`).join(', ')}{pending ? ` · ${pending} ngày chờ xác nhận` : ''}
                                  </button>
                                );
                              })()}
                            </div>
                            <button type="button" onClick={() => onOpenWorklogs(task.id)} className="flex items-start gap-2 text-xs pt-1 text-left hover:underline cursor-pointer">
                              <span className="text-slate-400 font-medium shrink-0">Kết quả:</span>
                              {log ? (
                                <span className="text-slate-700">{log.content.length > 110 ? log.content.slice(0, 110) + '…' : log.content} <span className="text-slate-400">({formatDateTime(log.submittedAt)} · {log.submittedByStaffName})</span></span>
                              ) : <span className="text-slate-400">Chưa có cập nhật kết quả</span>}
                            </button>
                            {(() => {
                              const n = taskApprovalNote(task.id, workLogs, task);
                              if (!n || n.key === 'DA_XAC_NHAN') return null;
                              return (
                                <button type="button" onClick={() => onOpenWorklogs(task.id)} className={`inline-block px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${n.cls}`}>
                                  {n.key === 'CHO_XAC_NHAN' ? 'Đội trưởng đề nghị hoàn thành – chờ bạn xác nhận' : n.label}{n.comment && <span className="font-normal">: {n.comment}</span>}
                                </button>
                              );
                            })()}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-[150px_110px_150px_auto] items-center gap-3 shrink-0">
                            <div className="text-left text-xs min-w-0">
                              <div className="text-[10px] text-slate-400 font-medium">Phụ trách chính</div>
                              <div className="font-semibold text-slate-800 truncate">{staffName(task.assigneeId)}</div>
                            </div>
                            <div className="text-left text-xs">
                              <div className="text-[10px] text-slate-400 font-medium">Hạn hoàn thành</div>
                              <div className={`font-mono ${od > 0 ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                                {formatDate(task.dueDate)}{od > 0 && <span className="block text-[10px]">Quá {od} ngày</span>}
                              </div>
                            </div>
                            <div className="text-left text-xs">
                              <div className="text-[10px] text-slate-400 font-medium">Trạng thái</div>
                              {canEdit && !isTaskFinal ? (
                                <select value={task.status} onChange={(e) => onStatusSelect(task, e.target.value as TaskStatus)}
                                  className={`w-full text-xs px-2.5 py-1 rounded-lg border font-semibold ${task.status === 'DANG_THUC_HIEN' ? 'bg-blue-50 text-blue-800 border-blue-300' : 'bg-slate-50 text-slate-700 border-slate-300'}`}>
                                  <option value="CHUA_BAT_DAU">Chưa bắt đầu</option>
                                  <option value="DANG_THUC_HIEN">Đang thực hiện</option>
                                  <option value="HOAN_THANH">Hoàn thành</option>
                                  <option value="HUY">Hủy</option>
                                </select>
                              ) : <StatusBadge status={task.status} kind="task" />}
                            </div>
                            {canEdit && (
                              <div className="flex items-center justify-end gap-1.5 w-[230px]">
                                <button type="button" disabled={!canAssign(task)}
                                  title={!canAssign(task) ? 'Công việc đã Hoàn thành/Hủy hoặc dự án không nhận phân công mới' : undefined}
                                  onClick={() => onOpenAssign({ projectId: project.id, taskId: task.id })}
                                  className="px-2.5 py-1 rounded-lg bg-[#152A55] text-white font-semibold text-[11px] hover:bg-[#1E3A75] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                                  Phân công
                                </button>
                                <button type="button" disabled={task.status === 'HUY'} onClick={() => setRecordFor(task)}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-[11px] hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                                  Ghi nhận kết quả
                                </button>
                                {!isTaskFinal && (
                                  <div className="relative">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setMenuId(menuId === task.id ? null : task.id); }} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {menuId === task.id && (
                                      <div className="absolute right-0 top-7 z-20 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs" onClick={e => e.stopPropagation()}>
                                        <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setMenuId(null); setTaskModal({ task }); }}>Sửa công việc</button>
                                        <button type="button" className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 cursor-pointer" onClick={() => { setMenuId(null); setStatusConfirm({ task, target: 'HUY' }); }}>Hủy công việc</button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
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

      {/* Tab Nhân sự và Phân công */}
      {activeTab === 'people' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0D1A36] mb-3">Nhân sự nội bộ được phân công</h3>
            <div className="flex flex-wrap gap-2 mb-3 text-xs">
              <DateInput value={asgFilter.date} onChange={e => setAsgFilter({ ...asgFilter, date: e.target.value })} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
              <select value={asgFilter.staffId} onChange={e => setAsgFilter({ ...asgFilter, staffId: e.target.value })} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
                <option value="">Mọi nhân sự</option>
                {Array.from(new Set(projectAssignments.map(a => a.staffId))).map(id => <option key={id} value={id}>{staffName(id)}</option>)}
              </select>
              <select value={asgFilter.taskId} onChange={e => setAsgFilter({ ...asgFilter, taskId: e.target.value })} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
                <option value="">Mọi công việc</option>
                {projectTasks.map(t => <option key={t.id} value={t.id}>{t.code} · {t.title}</option>)}
              </select>
              <select value={asgFilter.status} onChange={e => setAsgFilter({ ...asgFilter, status: e.target.value })} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
                <option value="HIEU_LUC">Hiệu lực</option>
                <option value="HUY">Đã hủy</option>
                <option value="all">Tất cả</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
                  <tr><th className="py-2 pr-3">Nhân sự</th><th className="py-2 pr-3">Công việc</th><th className="py-2 pr-3">Thời gian</th><th className="py-2 pr-3">Phụ trách chính</th><th className="py-2 pr-3">Người lập</th><th className="py-2 pr-3">Thời điểm lập</th><th className="py-2 pr-3">Trạng thái</th>{canEdit && <th className="py-2 text-right">Thao tác</th>}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAsg.length === 0 ? (
                    <tr><td colSpan={8} className="py-4 text-center text-slate-400">Không có phân công theo bộ lọc đã chọn.</td></tr>
                  ) : filteredAsg.map(a => {
                    const t = tasks.find(x => x.id === a.taskId);
                    return (
                      <tr key={a.id}>
                        <td className="py-2 pr-3 font-semibold">{staffName(a.staffId)}</td>
                        <td className="py-2 pr-3">{t?.code} · {t?.title}</td>
                        <td className="py-2 pr-3 font-mono">{formatDateTime(a.startDate)} – {formatDateTime(a.endDate)}</td>
                        <td className="py-2 pr-3">{staffName(t?.assigneeId)}</td>
                        <td className="py-2 pr-3">{a.assignedBy || '—'}</td>
                        <td className="py-2 pr-3 font-mono">{formatDateTime(a.createdAt) || '—'}</td>
                        <td className="py-2 pr-3"><StatusBadge status={a.status} kind="record" /></td>
                        {canEdit && (
                          <td className="py-2 text-right whitespace-nowrap">
                            {isRecordActive(a) && !isFinal && (
                              <>
                                <button type="button" onClick={() => setEditAsg(a)} className="px-2 py-1 text-blue-700 hover:bg-blue-50 rounded font-semibold cursor-pointer">Sửa</button>
                                <button type="button" onClick={() => setCancelAsg(a)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded font-semibold cursor-pointer">Hủy phân công</button>
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-purple-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0D1A36] mb-3">Đội thi công ngoài</h3>
            {projectExternals.length === 0 ? (
              <div className="text-xs text-slate-400">Dự án chưa có phần việc giao đội thi công ngoài.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projectExternals.map(e => {
                  const t = tasks.find(x => x.id === e.taskId);
                  const sub = store.subcontractors.find(s => s.id === e.contractorId);
                  return (
                    <button type="button" key={e.id} onClick={onOpenExternal}
                      className={`text-left p-3 rounded-xl border hover:border-purple-400 cursor-pointer ${e.status === 'HUY' ? 'opacity-60 border-slate-200' : 'border-purple-200 bg-purple-50/30'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{e.contractorName}</span>
                        <StatusBadge status={e.status} kind="record" />
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{t?.code} · {t?.title}</div>
                      <div className="text-[11px] text-slate-500">Đầu mối: {sub?.contactPerson} · {sub?.phone}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{formatDate(e.startDate)} – {formatDate(e.dueDate)} · đã cập nhật {(e.dailyStaffing || []).length} ngày</div>
                      <div className="text-[11px] text-purple-800 font-semibold mt-0.5">Giá trị khoán dự kiến: {e.contractValue ? `${e.contractValue.toLocaleString('vi-VN')} đ` : '—'}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Hồ sơ kỹ thuật */}
      {activeTab === 'docs' && (
        <div className="space-y-3">
          {canEdit && project.status !== 'HUY' && (
            <div className="flex justify-end">
              <button type="button" onClick={() => setUploadFor({})} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Tải lên hồ sơ
              </button>
            </div>
          )}
          <DocsTable docs={projectDocs} onView={onViewDoc} onDownload={onDownloadDoc} onMessage={toast.show} />
        </div>
      )}

      {/* Hộp thoại */}
      {catModal && <CategoryFormModal project={project} category={catModal.category} onClose={() => setCatModal(null)} onSaved={(m) => { setCatModal(null); toast.show(m); }} />}
      {taskModal && (
        <TaskFormModal project={project} task={taskModal.task} lockedCategoryId={taskModal.categoryId}
          onClose={() => setTaskModal(null)} onSaved={(m) => { setTaskModal(null); toast.show(m); setActiveTab('tasks'); }} />
      )}
      {statusConfirm && <TaskStatusConfirm task={statusConfirm.task} target={statusConfirm.target} onClose={() => setStatusConfirm(null)} onDone={(m) => { setStatusConfirm(null); toast.show(m); }} />}
      {uploadFor && <UploadDocModal fixedProjectId={project.id} contextCategory={uploadFor.category} onClose={() => setUploadFor(null)} onSaved={(m) => { setUploadFor(null); toast.show(m); }} />}
      {projectDialog && (
        <ProjectStatusDialog project={project} kind={projectDialog} onClose={() => setProjectDialog(null)}
          onDone={(m) => { setProjectDialog(null); toast.show(m); }} onViewTasks={() => { setProjectDialog(null); setActiveTab('tasks'); }} />
      )}
      {extDrawer && <ExternalDetailDrawer extId={extDrawer} onClose={() => setExtDrawer(null)} onMessage={toast.show} />}
      {editProject && <ProjectFormModal project={project} onClose={() => setEditProject(false)} onSaved={() => { setEditProject(false); toast.show(`Đã lưu thay đổi dự án ${project.code}.`); }} />}
      {recordFor && <RecordResultModal initialProjectId={project.id} initialTaskId={recordFor.id} onClose={() => setRecordFor(null)} onSaved={(m) => { setRecordFor(null); toast.show(m); }} />}
      {editAsg && <EditAssignmentModal assignment={editAsg} onClose={() => setEditAsg(null)} onSaved={(m) => { setEditAsg(null); toast.show(m); }} />}
      {cancelAsg && <CancelAssignmentDialog assignment={cancelAsg} onClose={() => setCancelAsg(null)} onDone={(m) => { setCancelAsg(null); toast.show(m); }} />}
    </div>
  );
};
