import React, { useState } from 'react';
import { TechDoc } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { DEMO_QUERY_TIME, isTaskOverdue } from '../utils/progressCalculator.ts';
import { formatDate, formatDateTime, overlaps, isRecordActive, DOC_TYPE_LABEL, daysBetween } from '../utils/domain.ts';
import { StatusBadge, useToast } from '../components/ui.tsx';
import { displayVersion, canPreview, NO_PREVIEW_MSG } from '../components/DocDialogs.tsx';
import { DailyStaffingModal, staffingProgress } from './ExternalTeamsTab.tsx';
import { ChevronLeft, MapPin, Calendar, User, Send } from 'lucide-react';

const addDays = (ymd: string, n: number) => {
  const d = new Date(ymd + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface Props {
  projectId: string;
  onBack: () => void;
  onSendReport: (projectId: string, taskId: string) => void;
  onViewDoc: (doc: TechDoc) => void;
  onDownloadDoc: (doc: TechDoc, versionNum?: number) => void;
}

/** Màn hình Chi tiết dự án của Đội trưởng (MH-17) – chỉ đọc, chỉ dữ liệu thuộc công việc được giao */
export const TeamLeadProjectView: React.FC<Props> = ({ projectId, onBack, onSendReport, onViewDoc, onDownloadDoc }) => {
  const { currentUser, visibleProjects, tasks, categories, staff, assignments, docs, workLogs, externalAssignments, subcontractors, isTaskAssignedToMe } = useStore();
  const toast = useToast();
  const [day, setDay] = useState(DEMO_QUERY_TIME.slice(0, 10));
  const [docType, setDocType] = useState('');
  const [dailyFor, setDailyFor] = useState<string | null>(null);
  const project = visibleProjects.find(p => p.id === projectId);

  if (!project) {
    return <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-600">Bạn không có quyền truy cập dự án này.</div>;
  }

  const myTasks = tasks.filter(t => t.projectId === project.id && t.status !== 'HUY' && isTaskAssignedToMe(t));
  const myCats = categories.filter(c => c.projectId === project.id && myTasks.some(t => t.categoryId === c.id)).sort((a, b) => a.orderNum - b.orderNum);
  const manager = staff.find(s => s.id === project.managerId);
  const latestLog = (taskId: string) => workLogs.filter(w => w.taskId === taskId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

  // Nhân sự được phân công trong ngày đã chọn thuộc công việc được giao
  const dayStart = `${day} 00:00:00`, dayEnd = `${day} 23:59:59`;
  const dayRows = assignments.filter(a => isRecordActive(a) && myTasks.some(t => t.id === a.taskId) && overlaps(a.startDate, a.endDate, dayStart, dayEnd))
    .map(a => {
      const sameStart = a.startDate.slice(0, 10) === day;
      const sameEnd = a.endDate.slice(0, 10) === day;
      return { a, from: sameStart ? a.startDate.slice(11, 16) : '08:00', to: sameEnd ? a.endDate.slice(11, 16) : '17:00' };
    });

  // Hồ sơ: dùng chung của dự án hoặc riêng công việc được giao; chỉ bản triển khai
  const myDocs = docs.filter(d => d.projectId === project.id && (d.scope !== 'RIENG_CONG_VIEC' || myTasks.some(t => t.id === d.taskId)))
    .filter(d => !docType || d.type === docType);

  const myExternals = externalAssignments.filter(e => e.status === 'HIEU_LUC' && e.nmhCoordinatorId === currentUser.staffId && tasks.some(t => t.id === e.taskId && t.projectId === project.id));

  return (
    <div className="space-y-6">
      {toast.node}
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#152A55] hover:underline cursor-pointer">
        <ChevronLeft className="w-4 h-4" /> Quay lại Dự án của tôi
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{project.code}</span>
          <StatusBadge status={project.status} />
        </div>
        <h2 className="text-xl font-bold text-[#0D1A36] mt-1.5">{project.name}</h2>
        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {project.place}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> <span className="font-mono">{formatDate(project.startDate)} – {formatDate(project.dueDate)}</span></span>
          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Quản lý phụ trách: <strong>{manager?.name || project.managerName}</strong></span>
        </div>
      </div>

      {/* 3. Hạng mục và công việc được giao */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#0D1A36]">Hạng mục và công việc được giao</h3>
        {myCats.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-slate-200 font-bold text-sm text-[#0D1A36]">{c.code} · {c.name}</div>
            <div className="divide-y divide-slate-100">
              {myTasks.filter(t => t.categoryId === c.id).map(t => {
                const log = latestLog(t.id);
                const od = isTaskOverdue(t.dueDate, t.status);
                return (
                  <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-slate-500">{t.code}</span>
                        <span className="font-bold text-slate-900">{t.title}</span>
                        {t.locationArea && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{t.locationArea}</span>}
                        <StatusBadge status={t.status} kind="task" />
                      </div>
                      <div className="text-slate-600">Hạn: <span className="font-mono">{formatDate(t.dueDate)}</span> {od && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold ml-1">Quá hạn {Math.max(1, daysBetween(t.dueDate, DEMO_QUERY_TIME))} ngày</span>}</div>
                      <div className="text-slate-500">Kết quả mới nhất: {log ? <>{log.content.slice(0, 100)}{log.content.length > 100 ? '…' : ''} <span className="text-slate-400">({formatDateTime(log.submittedAt)})</span></> : 'Chưa có cập nhật kết quả'}</div>
                    </div>
                    <button type="button" onClick={() => onSendReport(project.id, t.id)} className="px-3 py-1.5 rounded-lg bg-[#152A55] text-white font-semibold hover:bg-[#1E3A75] flex items-center gap-1.5 shrink-0 cursor-pointer">
                      <Send className="w-3.5 h-3.5" /> Gửi báo cáo hiện trường
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Nhân sự được phân công trong ngày */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-[#0D1A36]">Nhân sự được phân công trong ngày</h3>
          <div className="flex items-center gap-1.5 text-xs">
            <button type="button" onClick={() => setDay(addDays(day, -1))} className="px-2 py-1 rounded border border-slate-300 cursor-pointer">‹ Ngày trước</button>
            <input type="date" value={day} onChange={e => setDay(e.target.value)} className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
            <button type="button" onClick={() => setDay(addDays(day, 1))} className="px-2 py-1 rounded border border-slate-300 cursor-pointer">Ngày sau ›</button>
          </div>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
            <tr><th className="py-2 pr-3">Nhân sự</th><th className="py-2 pr-3">Chức danh và chuyên môn</th><th className="py-2 pr-3">Số điện thoại</th><th className="py-2 pr-3">Công việc</th><th className="py-2">Giờ làm việc</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dayRows.length === 0 ? <tr><td colSpan={5} className="py-4 text-center text-slate-400">Không có nhân sự được phân công trong ngày này.</td></tr> : dayRows.map(({ a, from, to }) => {
              const s = staff.find(x => x.id === a.staffId);
              const t = tasks.find(x => x.id === a.taskId);
              return (
                <tr key={a.id}>
                  <td className="py-2 pr-3 font-semibold">{s?.name}</td>
                  <td className="py-2 pr-3">{s?.roleTitleDisplay} · {s?.specialty || 'Chưa cập nhật chuyên môn'}</td>
                  <td className="py-2 pr-3 font-mono">{s?.phone}</td>
                  <td className="py-2 pr-3">{t?.code} · {t?.title}</td>
                  <td className="py-2 font-mono">{from} – {to}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. Hồ sơ kỹ thuật (chỉ bản triển khai) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-[#0D1A36]">Hồ sơ kỹ thuật</h3>
          <select value={docType} onChange={e => setDocType(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
            <option value="">Mọi loại hồ sơ</option>
            {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {myDocs.length === 0 ? <div className="text-xs text-slate-400">Chưa có hồ sơ kỹ thuật dành cho công việc của bạn.</div> : (
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
              <tr><th className="py-2 pr-3">Hồ sơ</th><th className="py-2 pr-3">Loại</th><th className="py-2 pr-3">Phạm vi xem</th><th className="py-2 pr-3">Trạng thái</th><th className="py-2 pr-3">Ngày cập nhật</th><th className="py-2 text-right">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myDocs.map(d => {
                const sel = (d.versions || []).find(v => v.isSelectedForExecution);
                const t = tasks.find(x => x.id === d.taskId);
                return (
                  <tr key={d.id}>
                    <td className="py-2 pr-3 font-semibold">{d.title}</td>
                    <td className="py-2 pr-3">{DOC_TYPE_LABEL[d.type] || d.type}</td>
                    <td className="py-2 pr-3">{d.scope === 'RIENG_CONG_VIEC' ? `Riêng ${t?.code || ''}` : 'Dùng chung'}</td>
                    <td className="py-2 pr-3">
                      {sel ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Bản triển khai · Phiên bản {sel.versionNum}{sel.label ? ` · ${sel.label}` : ''}</span>
                        : <div><span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">Chưa chọn bản triển khai</span><div className="text-[10px] text-amber-700 mt-0.5">Đội thi công chưa biết dùng bản nào, báo Quản lý</div></div>}
                    </td>
                    <td className="py-2 pr-3 font-mono">{formatDate(sel?.selectedAt || displayVersion(d)?.uploadedAt)}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {sel && (
                        <>
                          <button type="button" onClick={() => canPreview(sel) ? onViewDoc(d) : toast.show(NO_PREVIEW_MSG, 'error')} className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded font-semibold cursor-pointer">Xem</button>
                          <button type="button" onClick={() => onDownloadDoc(d, sel.versionNum)} className="px-2 py-1 text-blue-700 hover:bg-blue-50 rounded font-semibold cursor-pointer">Tải về</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 7. Đội thi công ngoài phối hợp (không hiển thị giá trị khoán) */}
      {myExternals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#0D1A36]">Đội thi công ngoài phối hợp</h3>
          {myExternals.map(e => {
            const t = tasks.find(x => x.id === e.taskId);
            const sub = subcontractors.find(s => s.id === e.contractorId);
            const recent = [...(e.dailyStaffing || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
            const prog = staffingProgress(e);
            return (
              <div key={e.id} className="bg-white rounded-xl border border-purple-200 p-4 shadow-xs text-xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{e.contractorName}</div>
                    <div className="text-slate-500">Đầu mối: {sub?.contactPerson} · {sub?.phone} · {t?.code} · <span className="font-mono">{formatDate(e.startDate)} – {formatDate(e.dueDate)}</span> · Đã cập nhật {prog.x}/{prog.y} ngày</div>
                  </div>
                  <button type="button" onClick={() => setDailyFor(e.id)} className="px-3 py-1.5 rounded-lg bg-[#152A55] text-white font-semibold cursor-pointer">Cập nhật nhân sự trong ngày</button>
                </div>
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200"><tr><th className="py-1.5">Ngày</th><th>Có mặt</th><th>Nội dung triển khai</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {recent.length === 0 ? <tr><td colSpan={3} className="py-2 text-slate-400">Chưa có bản ghi.</td></tr> : recent.map(r => (
                      <tr key={r.date}><td className="py-1.5 font-mono">{formatDate(r.date)}</td><td className="font-bold">{r.presentCount}</td><td>{r.content || '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {dailyFor && (() => {
        const ext = externalAssignments.find(x => x.id === dailyFor);
        return ext ? <DailyStaffingModal ext={ext} onClose={() => setDailyFor(null)} onSaved={(m) => { setDailyFor(null); toast.show(m); }} /> : null;
      })()}
    </div>
  );
};
