import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { Plus, MapPin, User, Calendar, Search, Building, MoreVertical } from 'lucide-react';
import { ProjectFormModal, ProjectStatusDialog, projectMenuItems, overdueDaysOf } from '../components/ProjectDialogs.tsx';
import { useToast, Pagination } from '../components/ui.tsx';
import { PROJECT_STATUS_LABEL, formatDate, getCategoryStatus, completionRate, canOperate, toTime } from '../utils/domain.ts';

interface ProjectsViewProps {
  initialStatus?: string;
  onSelectProject: (projectId: string) => void;
}

const PAGE_SIZE = 12; // QC-11

// Bộ lọc được giữ khi quay lại từ chi tiết dự án (MH-08 thành phần 1)
let savedFilters: { search: string; status: string; manager: string; sort: 'nearest' | 'newest' | 'name'; page: number } | null = null;

export const ProjectsView: React.FC<ProjectsViewProps> = ({ initialStatus, onSelectProject }) => {
  const { visibleProjects: projects, scoped, staff, currentUser } = useStore();
  const tasks = scoped.tasks;
  const categories = scoped.categories;
  const canEdit = canOperate(currentUser);
  const toast = useToast();

  const [search, setSearch] = useState(initialStatus ? '' : savedFilters?.search || '');
  const [statusFilter, setStatusFilter] = useState(initialStatus || (savedFilters?.status ?? 'all'));
  const [managerFilter, setManagerFilter] = useState(initialStatus ? 'all' : savedFilters?.manager || 'all');
  const [sortBy, setSortBy] = useState<'nearest' | 'newest' | 'name'>(savedFilters?.sort || 'nearest');
  const [page, setPage] = useState(initialStatus ? 1 : savedFilters?.page || 1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [dialog, setDialog] = useState<{ project: Project; kind: 'status' | 'complete' | 'cancel' } | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    savedFilters = { search, status: statusFilter, manager: managerFilter, sort: sortBy, page };
  }, [search, statusFilter, managerFilter, sortBy, page]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HOAN_THANH': return { label: 'Hoàn thành', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'DANG_THUC_HIEN': return { label: 'Đang triển khai', className: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'TAM_DUNG': return { label: 'Tạm dừng', className: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'HUY': return { label: 'Hủy', className: 'bg-slate-200 text-slate-600 line-through border-slate-300' };
      default: return { label: 'Lập kế hoạch', className: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const managers = staff.filter(s => s.roleTitle === 'QUAN_LY');
  const countBy = (st: string) => projects.filter(p => p.status === st).length;

  const filtered = projects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (managerFilter !== 'all' && p.managerId !== managerFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hay = [p.name, p.code, p.place, p.clientName || p.client || ''].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'vi');
    if (sortBy === 'newest') return (b.createdAt || b.startDate).localeCompare(a.createdAt || a.startDate);
    return toTime(a.dueDate) - toTime(b.dueDate);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {toast.node}

      {/* 1. Tiêu đề trang: "Dự án và Hạng mục", không có dòng mô tả */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <h1 className="text-xl font-bold text-[#0D1A36] tracking-tight">Dự án và Hạng mục</h1>
        {canEdit && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo dự án mới</span>
          </button>
        )}
      </div>

      {/* 2. Tìm kiếm và bộ lọc */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên dự án, địa điểm, khách hàng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-blue-600 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-blue-600"
          >
            <option value="all">Tất cả dự án ({projects.length})</option>
            {['LAP_KE_HOACH', 'DANG_THUC_HIEN', 'TAM_DUNG', 'HOAN_THANH', 'HUY'].map(st => (
              <option key={st} value={st}>{PROJECT_STATUS_LABEL[st]} ({countBy(st)})</option>
            ))}
          </select>

          <select
            value={managerFilter}
            onChange={(e) => { setManagerFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-blue-600"
          >
            <option value="all">Mọi người phụ trách</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-blue-600"
          >
            <option value="nearest">Hạn gần nhất</option>
            <option value="newest">Mới tạo</option>
            <option value="name">Tên A–Z</option>
          </select>
        </div>
      </div>

      {statusFilter !== 'all' && (
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <span>Bộ lọc: <strong>{PROJECT_STATUS_LABEL[statusFilter]}</strong></span>
          <button type="button" onClick={() => setStatusFilter('all')} className="text-blue-700 hover:underline font-semibold cursor-pointer">Xóa bộ lọc</button>
        </div>
      )}

      {/* 3. Danh sách thẻ dự án */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pageItems.length === 0 ? (
          <div className="col-span-full p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
            {projects.length === 0 ? 'Chưa có dự án nào trong phạm vi của bạn.' : 'Không tìm thấy dự án phù hợp.'}
          </div>
        ) : (
          pageItems.map((project) => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const progress = completionRate(projectTasks);
            const badge = getStatusBadge(project.status);
            const overdueDays = (project.status === 'LAP_KE_HOACH' || project.status === 'DANG_THUC_HIEN' || project.status === 'TAM_DUNG')
              ? overdueDaysOf(project.dueDate) : 0;
            const projCats = categories.filter(c => c.projectId === project.id).sort((a, b) => a.orderNum - b.orderNum);
            const menu = projectMenuItems(project);

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`bg-white rounded-xl border p-4 shadow-2xs hover:border-blue-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                  project.status === 'HUY' ? 'border-slate-200 bg-slate-50/60 opacity-80' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {project.code}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.className}`}>
                          {badge.label}
                        </span>
                        {overdueDays > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200">
                            Quá hạn {overdueDays} ngày
                          </span>
                        )}
                      </div>
                      <h3 className={`text-sm font-bold mt-1.5 leading-snug group-hover:text-blue-800 transition-colors ${
                        project.status === 'HUY' ? 'text-slate-500' : 'text-[#0D1A36]'
                      }`}>
                        {project.name}
                      </h3>
                    </div>

                    <div className="flex items-start gap-1 shrink-0">
                      <div className="text-right">
                        {project.status === 'HUY' ? (
                          <span className="text-[11px] font-medium text-slate-400">Đã hủy</span>
                        ) : progress !== null ? (
                          <>
                            <span className="text-xl font-bold font-mono text-blue-800 tabular-nums">{progress}%</span>
                            <span className="block text-[10px] text-slate-400 font-medium">hoàn thành</span>
                          </>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">Chưa có công việc</span>
                        )}
                      </div>

                      {/* Menu ba chấm của thẻ (thành phần 8) */}
                      <div className="relative" ref={menuOpenId === project.id ? menuRef : undefined}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === project.id ? null : project.id); }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Thao tác"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpenId === project.id && (
                          <div className="absolute right-0 top-7 z-20 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs" onClick={e => e.stopPropagation()}>
                            <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setMenuOpenId(null); onSelectProject(project.id); }}>Xem chi tiết</button>
                            {canEdit && menu.edit && (
                              <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setMenuOpenId(null); setEditProject(project); }}>Sửa thông tin</button>
                            )}
                            {canEdit && menu.status && (
                              <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setMenuOpenId(null); setDialog({ project, kind: 'status' }); }}>Đổi trạng thái</button>
                            )}
                            {canEdit && menu.complete && (
                              <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer text-emerald-700" onClick={() => { setMenuOpenId(null); setDialog({ project, kind: 'complete' }); }}>Xác nhận hoàn thành dự án</button>
                            )}
                            {canEdit && menu.cancel && (
                              <button type="button" className="w-full text-left px-3 py-2 hover:bg-red-50 cursor-pointer text-red-600" onClick={() => { setMenuOpenId(null); setDialog({ project, kind: 'cancel' }); }}>Hủy dự án</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{project.place}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Khách hàng: <strong>{project.clientName || project.client}</strong></span>
                    </div>
                  </div>

                  {/* Dải tiến độ theo hạng mục: mỗi đoạn là một hạng mục của dự án */}
                  <div className="my-2.5 p-2 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hạng mục thi công</div>
                    {projCats.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic">Chưa có hạng mục</div>
                    ) : (
                      <div className="flex gap-1.5">
                        {projCats.map(cat => {
                          const st = getCategoryStatus(projectTasks.filter(t => t.categoryId === cat.id));
                          return (
                            <div key={cat.id} className="flex-1 min-w-0" title={`${cat.code} · ${cat.name} – ${st.label}`}>
                              <div className={`h-2 rounded-full ${st.bar}`} />
                              <div className="text-[10px] text-slate-600 font-semibold truncate mt-1">{cat.name}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phụ trách: <strong>{project.managerName || staff.find(s => s.id === project.managerId)?.name}</strong></span>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-700 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hạn: {formatDate(project.dueDate)}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} unit="dự án" onChange={setPage} />

      {isCreateOpen && (
        <ProjectFormModal
          onClose={() => setIsCreateOpen(false)}
          onSaved={(p) => { setIsCreateOpen(false); toast.show(`Đã tạo dự án ${p.code}.`); onSelectProject(p.id); }}
        />
      )}
      {editProject && (
        <ProjectFormModal
          project={editProject}
          onClose={() => setEditProject(null)}
          onSaved={(p) => { setEditProject(null); toast.show(`Đã lưu thay đổi dự án ${p.code}.`); }}
        />
      )}
      {dialog && (
        <ProjectStatusDialog
          project={dialog.project}
          kind={dialog.kind}
          onClose={() => setDialog(null)}
          onDone={(msg) => { setDialog(null); toast.show(msg); }}
          onViewTasks={() => { setDialog(null); onSelectProject(dialog.project.id); }}
        />
      )}
    </div>
  );
};
