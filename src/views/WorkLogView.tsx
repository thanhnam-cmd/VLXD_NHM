import React, { useState } from 'react';
import { WorkLog } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { ClipboardCheck, Search } from 'lucide-react';
import { useToast, Modal } from '../components/ui.tsx';
import { isTeamLeadRole, isDirectorRole, canOperate } from '../utils/domain.ts';
import { WorkLogForm, WorkLogCard, WorkLogDetailDrawer, ApproveModal, RecordResultModal, getLogLabel, reporterOf } from '../components/WorkLogDialogs.tsx';

interface WorkLogViewProps {
  initialStatus?: string;
  initialTaskId?: string;
  initialProjectId?: string;
}

/**
 * Nhật ký hiện trường theo vai trò:
 * – Quản lý / Quản trị viên: MH-12 (danh sách, Xem, Phê duyệt, Ghi nhận kết quả)
 * – Ban giám đốc: MH-15 (chỉ danh sách và nút Xem)
 * – Đội trưởng: MH-18 (biểu mẫu gửi báo cáo + Nhật ký của tôi)
 */
export const WorkLogView: React.FC<WorkLogViewProps> = ({ initialStatus, initialTaskId, initialProjectId }) => {
  const store = useStore();
  const { currentUser, scoped, workLogs, tasks, visibleProjects } = store;
  const toast = useToast();
  const isLead = isTeamLeadRole(currentUser);
  const isDirector = isDirectorRole(currentUser);
  const canManage = canOperate(currentUser);

  const initialTaskProject = tasks.find(t => t.id === initialTaskId)?.projectId;
  const [search, setSearch] = useState('');
  const [fProject, setFProject] = useState(isLead ? '' : initialTaskProject || '');
  const [fTask, setFTask] = useState(isLead ? '' : initialTaskId || '');
  const [fSender, setFSender] = useState('');
  const [fStatus, setFStatus] = useState(initialStatus || 'all');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [viewLog, setViewLog] = useState<WorkLog | null>(null);
  const [approveLog, setApproveLog] = useState<WorkLog | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [followUp, setFollowUp] = useState<WorkLog | null>(null);

  // Đội trưởng chỉ thấy báo cáo do chính mình gửi (kể cả của công việc về sau bị Hủy)
  const baseLogs = isLead
    ? workLogs.filter(w => w.submittedByAccountId === currentUser.id || (!!currentUser.username && w.submittedByUsername === currentUser.username))
    : scoped.workLogs;

  const senders = Array.from(new Set(baseLogs.map(w => reporterOf(w, store).name)));
  const rows = baseLogs.filter(w => {
    const t = tasks.find(x => x.id === w.taskId);
    if (fProject && (w.projectId || t?.projectId) !== fProject) return false;
    if (fTask && w.taskId !== fTask) return false;
    if (fSender && reporterOf(w, store).name !== fSender) return false;
    if (fFrom && w.submittedAt.slice(0, 10) < fFrom) return false;
    if (fTo && w.submittedAt.slice(0, 10) > fTo) return false;
    if (search) {
      const hay = `${w.content} ${t?.title || ''}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    const lbl = getLogLabel(w, t).key;
    if (fStatus === 'pending' && lbl !== 'CHO_XAC_NHAN') return false;
    if (fStatus === 'confirmed' && lbl !== 'DA_XAC_NHAN') return false;
    if (fStatus === 'issues' && !w.issuesFaced) return false;
    return true;
  }).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const filterBar = (
    <div className="flex flex-wrap gap-2 text-xs items-center">
      {!isLead && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nội dung, tên công việc" className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg w-56" />
        </div>
      )}
      <select value={fProject} onChange={e => { setFProject(e.target.value); setFTask(''); }} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
        <option value="">Mọi dự án</option>
        {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
      </select>
      <select value={fTask} disabled={!fProject} onChange={e => setFTask(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-50">
        <option value="">Mọi công việc</option>
        {tasks.filter(t => t.projectId === fProject).map(t => <option key={t.id} value={t.id}>{t.code} · {t.title}</option>)}
      </select>
      {!isLead && (
        <>
          <select value={fSender} onChange={e => setFSender(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
            <option value="">Mọi người gửi</option>
            {senders.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
            <option value="all">Tất cả</option>
            <option value="pending">Chờ Quản lý xác nhận</option>
            <option value="confirmed">Quản lý đã xác nhận hoàn thành</option>
            <option value="issues">Có vướng mắc</option>
          </select>
        </>
      )}
      <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
      <input type="date" value={fTo} onChange={e => setFTo(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
      <span className="ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{rows.length} bản ghi</span>
    </div>
  );

  const list = (
    <div className="space-y-3">
      {rows.length === 0 ? <div className="p-6 text-center text-xs text-slate-400">Không có báo cáo phù hợp.</div> : rows.map(log => (
        <WorkLogCard
          key={log.id}
          log={log}
          onView={() => setViewLog(log)}
          onApprove={canManage && !isDirector ? () => setApproveLog(log) : undefined}
          onFollowUp={isLead ? () => setFollowUp(log) : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {toast.node}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">Nhật ký thi công hiện trường</h2>
        {canManage && !isDirector && (
          <button type="button" onClick={() => setRecordOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 shadow-2xs cursor-pointer">
            <ClipboardCheck className="w-3.5 h-3.5" /> Ghi nhận kết quả
          </button>
        )}
      </div>

      {isLead ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0D1A36] flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-[#152A55]" /> Gửi báo cáo nhật ký hiện trường</h3>
            </div>
            <WorkLogForm initialProjectId={initialProjectId} initialTaskId={initialTaskId} onSaved={(m) => toast.show(m)} />
          </div>
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#0D1A36] pb-3 border-b border-slate-100">Nhật ký của tôi</h3>
            {filterBar}
            {list}
          </div>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          {filterBar}
          {list}
        </div>
      )}

      {viewLog && <WorkLogDetailDrawer log={viewLog} allowFollowUp={canManage && !isDirector} onClose={() => setViewLog(null)} onMessage={toast.show} />}
      {approveLog && <ApproveModal log={approveLog} onClose={() => setApproveLog(null)} onDone={(m) => { setApproveLog(null); toast.show(m); }} />}
      {recordOpen && <RecordResultModal initialProjectId={fProject || undefined} initialTaskId={fTask || undefined} onClose={() => setRecordOpen(false)} onSaved={(m) => { setRecordOpen(false); toast.show(m); }} />}
      {followUp && (
        <Modal title="Gửi bổ sung / đính chính" subtitle="Bản ghi mới liên kết với bản gốc và mang nhãn Đính chính" onClose={() => setFollowUp(null)} size="lg">
          <WorkLogForm correctionOf={followUp} onSaved={(m) => { setFollowUp(null); toast.show(m); }} onCancel={() => setFollowUp(null)} />
        </Modal>
      )}
    </div>
  );
};
