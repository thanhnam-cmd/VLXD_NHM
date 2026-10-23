import React, { useState } from 'react';
import { TechDoc } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { UploadCloud, Search } from 'lucide-react';
import { useToast, Pagination } from '../components/ui.tsx';
import { DocsTable, UploadDocModal, latestUploadAt } from '../components/DocDialogs.tsx';
import { DOC_TYPE_LABEL, canOperate } from '../utils/domain.ts';

interface TechnicalDocsViewProps {
  onOpenDocViewer: (doc: TechDoc) => void;
  onDownloadDoc: (doc: TechDoc, versionNum?: number) => void;
}

const PAGE_SIZE = 10;

/** Màn hình Hồ sơ kỹ thuật (MH-13) */
export const TechnicalDocsView: React.FC<TechnicalDocsViewProps> = ({ onOpenDocViewer, onDownloadDoc }) => {
  const { scoped, visibleProjects, tasks, currentUser } = useStore();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [fProject, setFProject] = useState('');
  const [fType, setFType] = useState('');
  const [fTask, setFTask] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);

  const rows = scoped.docs.filter(d => {
    if (fProject && d.projectId !== fProject) return false;
    if (fType && d.type !== fType) return false;
    if (fTask && d.taskId !== fTask) return false;
    if (fFrom && latestUploadAt(d).slice(0, 10) < fFrom) return false;
    if (search) {
      const hay = [d.title, d.name, ...(d.versions || []).flatMap(v => [v.originalFileName, v.label])].join(' ').toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => latestUploadAt(b).localeCompare(latestUploadAt(a)));

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {toast.node}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">Hồ sơ kỹ thuật</h2>
        {canOperate(currentUser) && (
          <button type="button" onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#152A55] text-white hover:bg-[#1E3A75] shadow-xs cursor-pointer">
            <UploadCloud className="w-4 h-4" /> Tải lên hồ sơ kỹ thuật
          </button>
        )}
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap gap-2 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên hồ sơ, tên tệp gốc, nhãn phiên bản" className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg w-72" />
        </div>
        <select value={fProject} onChange={e => { setFProject(e.target.value); setFTask(''); setPage(1); }} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
          <option value="">Tất cả dự án ({visibleProjects.length})</option>
          {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
        </select>
        <select value={fType} onChange={e => { setFType(e.target.value); setPage(1); }} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
          <option value="">Mọi loại hồ sơ</option>
          {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={fTask} onChange={e => { setFTask(e.target.value); setPage(1); }} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
          <option value="">Mọi công việc liên quan</option>
          {tasks.filter(t => (!fProject || t.projectId === fProject) && scoped.docs.some(d => d.taskId === t.id)).map(t => <option key={t.id} value={t.id}>{t.code} · {t.title}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-slate-600">Cập nhật từ
          <input type="date" value={fFrom} onChange={e => { setFFrom(e.target.value); setPage(1); }} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
        </label>
      </div>

      <DocsTable docs={pageRows} onView={onOpenDocViewer} onDownload={onDownloadDoc} onMessage={toast.show} />
      <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} unit="hồ sơ" onChange={setPage} />

      {uploadOpen && <UploadDocModal onClose={() => setUploadOpen(false)} onSaved={(m) => { setUploadOpen(false); toast.show(m); }} />}
    </div>
  );
};
