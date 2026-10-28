import React, { useState } from 'react';
import { Customer, ExternalSubcontractor, Project, Category } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { Plus, Search } from 'lucide-react';
import { useToast, Modal, Label, ErrorBox, inputCls, btnPrimary, btnSecondary, Pagination, StatusBadge } from '../components/ui.tsx';
import { CustomerModal, ProjectFormModal } from '../components/ProjectDialogs.tsx';
import { CategoryFormModal } from '../components/TaskDialogs.tsx';
import { SubcontractorModal } from './ExternalTeamsTab.tsx';
import { formatDate, canOperate, nextCode } from '../utils/domain.ts';
import type { ActiveTab } from '../components/Sidebar.tsx';

export type CatalogKind = 'cat_customers' | 'cat_projects' | 'cat_subcontractors' | 'cat_categories' | 'cat_teams' | 'cat_skills' | 'cat_systems';

const TITLES: Record<CatalogKind, { title: string; add: string }> = {
  cat_customers: { title: 'Danh mục khách hàng', add: 'Thêm khách hàng' },
  cat_projects: { title: 'Danh mục dự án', add: 'Tạo dự án mới' },
  cat_subcontractors: { title: 'Danh mục đội thi công ngoài (nhà cung cấp)', add: 'Thêm đội thi công ngoài' },
  cat_categories: { title: 'Danh mục hạng mục', add: 'Thêm hạng mục' },
  cat_teams: { title: 'Danh mục tổ đội', add: 'Thêm tổ đội' },
  cat_skills: { title: 'Danh mục chuyên môn', add: 'Thêm chuyên môn' },
  cat_systems: { title: 'Danh mục loại hệ thống', add: 'Thêm loại hệ thống' }
};

const PAGE_SIZE = 12;

/** Hộp thoại thêm/sửa mục danh mục đơn giản (mã, tên, mô tả; tổ đội có thêm loại) */
const SimpleCatalogModal: React.FC<{
  kind: 'cat_teams' | 'cat_skills' | 'cat_systems';
  item?: { id: string; code: string; name: string; description?: string; kind?: string };
  onClose: () => void;
  onSaved: (m: string) => void;
}> = ({ kind, item, onClose, onSaved }) => {
  const store = useStore();
  const list = kind === 'cat_teams' ? store.teams : kind === 'cat_skills' ? store.skills : store.systemTypes;
  const label = kind === 'cat_teams' ? 'tổ đội' : kind === 'cat_skills' ? 'chuyên môn' : 'loại hệ thống';
  const prefix = kind === 'cat_teams' ? 'DTC' : kind === 'cat_skills' ? 'CM' : 'LHT';
  const [code, setCode] = useState(item?.code || nextCode(list.map(x => x.code), prefix, kind === 'cat_teams' ? 1 : 2));
  const [name, setName] = useState(item?.name || '');
  const [teamKind, setTeamKind] = useState(item?.kind || 'THI_CONG');
  const [desc, setDesc] = useState(item?.description || '');
  const [err, setErr] = useState<string | null>(null);
  const submit = () => {
    const data = { code, name, description: desc.trim() || undefined };
    const r = kind === 'cat_teams' ? store.saveTeam({ ...data, kind: teamKind }, item?.id)
      : kind === 'cat_skills' ? store.saveSkill(data, item?.id)
        : store.saveSystemType(data, item?.id);
    if (!r.ok) return setErr(r.message);
    onSaved(r.message);
  };
  return (
    <Modal title={item ? `Sửa ${label}` : `Thêm ${label}`} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={submit}>Lưu</button>
      </>}>
      <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label required>Mã</Label>
          <input maxLength={50} value={code} disabled={!!item} onChange={e => setCode(e.target.value.toUpperCase())} className={`${inputCls} font-mono`} />
        </div>
        <div className="col-span-2">
          <Label required>Tên {label}</Label>
          <input maxLength={200} value={name} onChange={e => setName(e.target.value)} className={inputCls} />
        </div>
      </div>
      {kind === 'cat_teams' && (
        <div>
          <Label required>Loại</Label>
          <select value={teamKind} onChange={e => setTeamKind(e.target.value)} className={inputCls}>
            <option value="THI_CONG">Đội thi công</option>
            <option value="THIET_KE">Tổ thiết kế</option>
          </select>
        </div>
      )}
      <div>
        <Label>Mô tả</Label>
        <textarea rows={2} maxLength={255} value={desc} onChange={e => setDesc(e.target.value)} className={inputCls} />
      </div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Màn hình Danh mục: xem toàn bộ dữ liệu danh mục và thêm/sửa từng mục */
export const CatalogView: React.FC<{ kind: CatalogKind; onOpenProject: (id: string) => void; onNavigate: (tab: ActiveTab) => void }> = ({ kind, onOpenProject }) => {
  const store = useStore();
  const { customers, visibleProjects, projects, staff, subcontractors, externalAssignments, categories, tasks, teams, skills, systemTypes, currentUser } = store;
  const toast = useToast();
  const canEdit = canOperate(currentUser);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState('');
  const [custModal, setCustModal] = useState<{ item?: Customer } | null>(null);
  const [projModal, setProjModal] = useState<{ item?: Project } | null>(null);
  const [subModal, setSubModal] = useState<{ item?: ExternalSubcontractor } | null>(null);
  const [catModal, setCatModal] = useState<{ item?: Category; projectId?: string } | null>(null);
  const [pickProject, setPickProject] = useState(false);
  const [simpleModal, setSimpleModal] = useState<{ item?: any } | null>(null);
  const match = (...vals: (string | undefined)[]) => !q || vals.join(' ').toLowerCase().includes(q.toLowerCase());

  const onAdd = () => {
    if (kind === 'cat_customers') setCustModal({});
    else if (kind === 'cat_projects') setProjModal({});
    else if (kind === 'cat_subcontractors') setSubModal({});
    else if (kind === 'cat_categories') setPickProject(true);
    else setSimpleModal({});
  };

  // Bảng theo từng loại danh mục: tiêu đề cột + các dòng
  let head: string[] = [];
  let rows: { key: string; cells: React.ReactNode[]; onEdit?: () => void; onOpen?: () => void; faded?: boolean }[] = [];

  if (kind === 'cat_customers') {
    head = ['Mã', 'Tên khách hàng / đơn vị', 'Đầu mối', 'Số điện thoại', 'Email', 'Địa chỉ', 'Số dự án'];
    rows = customers.filter(c => match(c.code, c.name, c.contactPerson, c.phone)).map(c => ({
      key: c.id,
      cells: [<span className="font-mono font-bold">{c.code}</span>, <strong>{c.name}</strong>, c.contactPerson || '—', c.phone || '—', c.email || '—', c.address || '—', projects.filter(p => p.clientId === c.id).length],
      onEdit: () => setCustModal({ item: c })
    }));
  } else if (kind === 'cat_projects') {
    head = ['Mã dự án', 'Tên dự án', 'Khách hàng', 'Phụ trách', 'Thời gian', 'Trạng thái', 'Hạng mục', 'Công việc'];
    rows = visibleProjects.filter(p => match(p.code, p.name, p.clientName, p.place)).map(p => ({
      key: p.id,
      cells: [<span className="font-mono font-bold text-blue-700">{p.code}</span>, <strong>{p.name}</strong>, p.clientName || '—', p.managerName || staff.find(s => s.id === p.managerId)?.name || '—',
        <span className="font-mono">{formatDate(p.startDate)} – {formatDate(p.dueDate)}</span>, <StatusBadge status={p.status} />,
        categories.filter(c => c.projectId === p.id).length, tasks.filter(t => t.projectId === p.id).length],
      onEdit: p.status !== 'HOAN_THANH' && p.status !== 'HUY' ? () => setProjModal({ item: p }) : undefined,
      onOpen: () => onOpenProject(p.id)
    }));
  } else if (kind === 'cat_subcontractors') {
    head = ['Đơn vị', 'Mã số thuế', 'Đầu mối', 'Số điện thoại', 'Khu vực hoạt động', 'Hợp tác', 'Dự án tham gia', 'Phần việc đã giao'];
    rows = subcontractors.filter(s => match(s.companyName, s.contactPerson, s.area, s.taxCode)).map(s => ({
      key: s.id,
      cells: [<strong>{s.companyName}</strong>, <span className="font-mono">{s.taxCode || '—'}</span>, `${s.contactPerson}${s.contactTitle ? `, ${s.contactTitle}` : ''}`, s.phone || '—', s.area || '—',
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.status === 'HOP_TAC' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{s.status === 'HOP_TAC' ? 'Đang hợp tác' : 'Ngừng hợp tác'}</span>,
        (() => {
          const ps = projects.filter(p => (p.externalTeams || []).some(x => x.contractorId === s.id));
          return ps.length ? <span title={ps.map(p => `${p.code}: ${p.externalTeams!.find(x => x.contractorId === s.id)!.workerCount} người`).join('\n')}>{ps.length} dự án</span> : 0;
        })(),
        externalAssignments.filter(e => e.contractorId === s.id).length],
      onEdit: () => setSubModal({ item: s }),
      faded: s.status !== 'HOP_TAC'
    }));
  } else if (kind === 'cat_categories') {
    head = ['Dự án', 'Mã', 'Tên hạng mục', 'Loại hệ thống', 'Thứ tự', 'Số công việc'];
    rows = categories
      .filter(c => visibleProjects.some(p => p.id === c.projectId) && (!projectFilter || c.projectId === projectFilter))
      .filter(c => match(c.code, c.name, c.systemTypeName, projects.find(p => p.id === c.projectId)?.code))
      .sort((a, b) => (a.projectId === b.projectId ? a.orderNum - b.orderNum : Number(a.projectId) - Number(b.projectId)))
      .map(c => {
        const p = projects.find(x => x.id === c.projectId);
        return {
          key: c.id,
          cells: [<span className="font-mono text-blue-700">{p?.code}</span>, <span className="font-mono font-bold">{c.code}</span>, <strong>{c.name}</strong>, c.systemTypeName, c.orderNum, tasks.filter(t => t.categoryId === c.id).length],
          onEdit: () => setCatModal({ item: c, projectId: c.projectId }),
          onOpen: () => onOpenProject(c.projectId)
        };
      });
  } else if (kind === 'cat_teams') {
    head = ['Mã', 'Tên tổ đội', 'Loại', 'Đội trưởng', 'Mô tả', 'Số nhân sự'];
    rows = teams.filter(t => match(t.code, t.name))
      .sort((a, b) => a.code.localeCompare(b.code, 'vi', { numeric: true }))
      .map(t => {
        const leader = staff.find(s => s.teamId === t.id && s.isActive && s.roleTitle === 'DOI_TRUONG');
        return {
          key: t.id,
          cells: [<span className="font-mono font-bold">{t.code}</span>, <strong>{t.name}</strong>, t.kind === 'THIET_KE' ? 'Tổ thiết kế' : 'Đội thi công',
            leader ? <span className="font-semibold">{leader.name}</span>
              : t.kind === 'THIET_KE' ? <span className="text-slate-400">—</span>
              : <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold" title="Gán chức danh Đội trưởng cho một nhân sự của tổ ở Danh mục nhân sự để giao việc theo tổ">Chưa có đội trưởng</span>,
            t.description || '—', staff.filter(s => s.teamId === t.id && s.isActive).length],
          onEdit: () => setSimpleModal({ item: t })
        };
      });
  } else if (kind === 'cat_skills') {
    head = ['Mã', 'Tên chuyên môn', 'Mô tả', 'Số nhân sự có chuyên môn'];
    rows = skills.filter(s => match(s.code, s.name)).map(s => ({
      key: s.id,
      cells: [<span className="font-mono font-bold">{s.code}</span>, <strong>{s.name}</strong>, s.description || '—',
        staff.filter(st => st.skills?.some(k => k.name === s.name) || st.specialty === s.name).length],
      onEdit: () => setSimpleModal({ item: s })
    }));
  } else {
    head = ['Mã', 'Tên loại hệ thống', 'Mô tả', 'Số hạng mục'];
    rows = systemTypes.filter(s => match(s.code, s.name)).map(s => ({
      key: s.id,
      cells: [<span className="font-mono font-bold">{s.code}</span>, <strong>{s.name}</strong>, s.description || '—', categories.filter(c => c.systemTypeId === s.id).length],
      onEdit: () => setSimpleModal({ item: s })
    }));
  }

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {toast.node}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">{TITLES[kind].title}</h2>
        {canEdit && (
          <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#152A55] text-white hover:bg-[#1E3A75] shadow-xs cursor-pointer self-start sm:self-auto">
            <Plus className="w-4 h-4" /> {TITLES[kind].add}
          </button>
        )}
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap gap-2 text-xs items-center">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Tìm theo mã, tên…" className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg w-64" />
        </div>
        {kind === 'cat_categories' && (
          <select value={projectFilter} onChange={e => { setProjectFilter(e.target.value); setPage(1); }} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
            <option value="">Mọi dự án</option>
            {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
          </select>
        )}
        <span className="ml-auto font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{rows.length} mục</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
            <tr>{head.map(h => <th key={h} className="p-3">{h}</th>)}<th className="p-3 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.length === 0 ? (
              <tr><td colSpan={head.length + 1} className="p-6 text-center text-slate-400">Không có dữ liệu phù hợp.</td></tr>
            ) : pageRows.map(r => (
              <tr key={r.key} className={`hover:bg-slate-50/60 ${r.faded ? 'opacity-60' : ''}`}>
                {r.cells.map((c, i) => <td key={i} className="p-3">{c}</td>)}
                <td className="p-3 text-right whitespace-nowrap">
                  {r.onOpen && <button type="button" onClick={r.onOpen} className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded font-semibold cursor-pointer">Xem</button>}
                  {canEdit && r.onEdit && <button type="button" onClick={r.onEdit} className="px-2 py-1 text-blue-700 hover:bg-blue-50 rounded font-semibold cursor-pointer">Sửa</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} unit="mục" onChange={setPage} />

      {custModal && <CustomerModal customer={custModal.item} onClose={() => setCustModal(null)} onSaved={(c) => { setCustModal(null); toast.show(custModal.item ? `Đã lưu khách hàng ${c.name}.` : `Đã thêm khách hàng ${c.name}.`); }} />}
      {projModal && <ProjectFormModal project={projModal.item} onClose={() => setProjModal(null)} onSaved={(p) => { setProjModal(null); toast.show(projModal.item ? `Đã lưu thay đổi dự án ${p.code}.` : `Đã tạo dự án ${p.code}.`); }} />}
      {subModal && <SubcontractorModal sub={subModal.item} onClose={() => setSubModal(null)} onSaved={(m) => { setSubModal(null); toast.show(m); }} />}
      {simpleModal && (kind === 'cat_teams' || kind === 'cat_skills' || kind === 'cat_systems') && (
        <SimpleCatalogModal kind={kind} item={simpleModal.item} onClose={() => setSimpleModal(null)} onSaved={(m) => { setSimpleModal(null); toast.show(m); }} />
      )}
      {pickProject && (
        <Modal title="Thêm hạng mục" subtitle="Chọn dự án cần thêm hạng mục" onClose={() => setPickProject(false)} size="sm">
          <select defaultValue="" onChange={e => { if (e.target.value) { setPickProject(false); setCatModal({ projectId: e.target.value }); } }} className={inputCls}>
            <option value="">-- Chọn dự án --</option>
            {visibleProjects.filter(p => p.status !== 'HOAN_THANH' && p.status !== 'HUY').map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
          </select>
        </Modal>
      )}
      {catModal && catModal.projectId && (
        <CategoryFormModal project={projects.find(p => p.id === catModal.projectId)!} category={catModal.item} onClose={() => setCatModal(null)} onSaved={(m) => { setCatModal(null); toast.show(m); }} />
      )}
    </div>
  );
};
