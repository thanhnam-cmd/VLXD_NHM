import React, { useState } from 'react';
import type { ExternalAssignment, WorkLog } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { formatDate, overlaps, PROJECT_STATUS_LABEL } from '../utils/domain.ts';
import { externalState } from './ExternalTeamsTab.tsx';

/**
 * Phân loại từng ngày làm việc của một phần việc giao ngoài:
 * – Ưu tiên ghi chú của Đội trưởng trong nhật ký hiện trường (Đủ/Thiếu/Thừa; Thừa tính là đủ).
 * – Ngày không có ghi chú: so số người có mặt trong bảng nhân sự theo ngày với số người khoán.
 *   Ngày có 0 người là ngày nghỉ, không tính.
 */
export const staffingDays = (e: ExternalAssignment, workLogs: WorkLog[]) => {
  const byDate = new Map<string, 'DU' | 'THIEU'>();
  (e.dailyStaffing || []).forEach(d => {
    if (d.presentCount <= 0) return;
    if (e.workerCount) byDate.set(d.date, d.presentCount >= e.workerCount ? 'DU' : 'THIEU');
    else byDate.set(d.date, 'DU');
  });
  workLogs
    .filter(w => w.externalStaffingStatus && (w.externalAssignmentId === e.id || (w.taskId === e.taskId && w.externalTeamId === e.contractorId)))
    .forEach(w => byDate.set(w.submittedAt.slice(0, 10), w.externalStaffingStatus === 'THIEU' ? 'THIEU' : 'DU'));
  let du = 0, thieu = 0;
  byDate.forEach(v => (v === 'DU' ? du++ : thieu++));
  const rate = du + thieu > 0 ? Math.round((du / (du + thieu)) * 100) : null;
  return { du, thieu, rate };
};

const rateBadge = (rate: number | null) =>
  rate === null ? <span className="text-slate-400">Chưa có dữ liệu</span>
    : <span className={`font-bold ${rate >= 90 ? 'text-emerald-700' : rate >= 70 ? 'text-amber-700' : 'text-red-700'}`}>{rate}%</span>;

const assessment = (rate: number | null) =>
  rate === null ? '—' : rate >= 90 ? 'Tốt – nên tiếp tục hợp tác' : rate >= 70 ? 'Đạt – cần nhắc đảm bảo nhân sự' : 'Cần cân nhắc khi hợp tác tiếp';

/** BC-04: Tình hình thi công của đội thi công ngoài */
export const ExternalTeamReport: React.FC<{ onSelectProject?: (projectId: string, taskId?: string) => void }> = ({ onSelectProject }) => {
  const { visibleProjects, scoped, tasks, staff, subcontractors, workLogs } = useStore();
  const [fProject, setFProject] = useState('all');
  const [fTeam, setFTeam] = useState('all');
  const [fState, setFState] = useState('all');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');

  const rows = scoped.externalAssignments.map(e => {
    const t = tasks.find(x => x.id === e.taskId);
    const p = visibleProjects.find(x => x.id === (e.projectId || t?.projectId));
    return { e, t, p, st: externalState(e), days: staffingDays(e, workLogs) };
  }).filter(r => {
    if (!r.p) return false;
    if (fProject !== 'all' && r.p.id !== fProject) return false;
    if (fTeam !== 'all' && r.e.contractorId !== fTeam) return false;
    if (fState !== 'all' && r.st.key !== fState) return false;
    if ((fFrom || fTo) && !overlaps(r.e.startDate, r.e.dueDate, `${fFrom || '1900-01-01'} 00:00:00`, `${fTo || '2999-12-31'} 23:59:59`)) return false;
    return true;
  }).sort((a, b) => a.e.startDate.localeCompare(b.e.startDate));

  const sum = (f: (r: typeof rows[number]) => number) => rows.reduce((s, r) => s + f(r), 0);
  const totalDu = sum(r => r.days.du);
  const totalThieu = sum(r => r.days.thieu);
  const totalRate = totalDu + totalThieu > 0 ? Math.round((totalDu / (totalDu + totalThieu)) * 100) : null;

  // Tổng hợp theo đội: cân nhắc các lần hợp tác kế tiếp
  const byTeam = subcontractors.map(s => {
    const mine = rows.filter(r => r.e.contractorId === s.id);
    const du = mine.reduce((x, r) => x + r.days.du, 0);
    const thieu = mine.reduce((x, r) => x + r.days.thieu, 0);
    return { s, count: mine.length, people: mine.reduce((x, r) => x + (r.e.workerCount || 0), 0), du, thieu, rate: du + thieu > 0 ? Math.round((du / (du + thieu)) * 100) : null };
  }).filter(x => x.count > 0);

  const filterLabel = [
    fProject !== 'all' ? visibleProjects.find(p => p.id === fProject)?.code : 'Tất cả dự án',
    fTeam !== 'all' ? subcontractors.find(s => s.id === fTeam)?.companyName : null,
    fState !== 'all' ? { SAP: 'Sắp triển khai', DANG: 'Đang triển khai', KET_THUC: 'Đã kết thúc', HUY: 'Đã hủy' }[fState] : null,
    fFrom || fTo ? `${formatDate(fFrom) || '…'} – ${formatDate(fTo) || '…'}` : null
  ].filter(Boolean).join(', ');

  return (
    <div className="space-y-4">
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Dự án:</span>
          <select value={fProject} onChange={e => setFProject(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium">
            <option value="all">Tất cả dự án ({visibleProjects.length})</option>
            {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Đội thi công:</span>
          <select value={fTeam} onChange={e => setFTeam(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium">
            <option value="all">Tất cả đội</option>
            {subcontractors.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Tình trạng:</span>
          <select value={fState} onChange={e => setFState(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium">
            <option value="all">Tất cả tình trạng</option>
            <option value="SAP">Sắp triển khai</option>
            <option value="DANG">Đang triển khai</option>
            <option value="KET_THUC">Đã kết thúc</option>
            <option value="HUY">Đã hủy</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Từ ngày:</span>
          <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
          <span className="text-slate-500 font-medium">Đến ngày:</span>
          <input type="date" value={fTo} onChange={e => setFTo(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
        </div>
        <button type="button" onClick={() => { setFProject('all'); setFTeam('all'); setFState('all'); setFFrom(''); setFTo(''); }} className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-auto cursor-pointer">
          Xóa bộ lọc
        </button>
      </div>
      <div className="text-[11px] text-slate-500">Bộ lọc: {filterLabel}</div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {([
          ['Số phần việc giao', rows.length, 'phần việc', 'text-slate-900'],
          ['Số đội tham gia', new Set(rows.map(r => r.e.contractorId)).size, 'đội', 'text-purple-700'],
          ['Tổng người khoán', sum(r => r.e.workerCount || 0), 'người', 'text-blue-700'],
          ['Ngày đủ nhân sự', totalDu, 'ngày', 'text-emerald-700'],
          ['Ngày thiếu nhân sự', totalThieu, 'ngày', 'text-red-700']
        ] as [string, number, string, string][]).map(([l, v, u, c]) => (
          <div key={l} className="p-2.5 bg-white rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">{l}</div>
            <div className={`text-xl font-bold font-mono ${c}`}>{v} <span className="text-[10px] font-normal text-slate-500">{u}</span></div>
          </div>
        ))}
        <div className="p-2.5 bg-white rounded-xl border border-slate-200">
          <div className="text-[10px] text-slate-500">Tỷ lệ đủ nhân sự</div>
          <div className="text-xl font-mono">{rateBadge(totalRate)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
              <tr>
                <th className="p-3">Mã dự án</th>
                <th className="p-3">Tên dự án</th>
                <th className="p-3">Đội thi công ngoài</th>
                <th className="p-3">Phụ trách</th>
                <th className="p-3">Thời gian kế hoạch</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Quy mô khoán (người)</th>
                <th className="p-3 text-center">Ngày đủ nhân sự</th>
                <th className="p-3 text-center">Ngày thiếu nhân sự</th>
                <th className="p-3 text-center">Tỷ lệ %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={10} className="p-6 text-center text-slate-500">Không có dữ liệu theo bộ lọc đã chọn.</td></tr>
              ) : rows.map(({ e, t, p, st, days }) => (
                <tr key={e.id} onClick={() => p && onSelectProject?.(p.id, e.taskId)} className="hover:bg-slate-50/80 cursor-pointer break-inside-avoid">
                  <td className="p-3 font-mono font-bold text-blue-700 whitespace-nowrap">{p?.code}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{p?.name}</div>
                    <div className="text-[10px] text-slate-500">{t?.code} · {e.workDescription}</div>
                  </td>
                  <td className="p-3 font-semibold">{e.contractorName}</td>
                  <td className="p-3">{p?.managerName || staff.find(s => s.id === p?.managerId)?.name}</td>
                  <td className="p-3 font-mono text-[11px] whitespace-nowrap">{formatDate(e.startDate)} – {formatDate(e.dueDate)}</td>
                  <td className="p-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${st.cls}`}>{st.label}</span>
                    {p && <div className="text-[10px] text-slate-500 mt-0.5">Dự án: {PROJECT_STATUS_LABEL[p.status]}</div>}
                  </td>
                  <td className="p-3 text-center font-mono font-bold">{e.workerCount ?? '—'}</td>
                  <td className="p-3 text-center font-mono font-bold text-emerald-700">{days.du}</td>
                  <td className="p-3 text-center font-mono font-bold text-red-700">{days.thieu}</td>
                  <td className="p-3 text-center font-mono">{rateBadge(days.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs break-inside-avoid">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">Tổng hợp theo đội – cân nhắc cho các lần hợp tác kế tiếp</div>
        <table className="w-full text-left text-xs">
          <thead className="text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
            <tr><th className="p-3">Đội thi công ngoài</th><th className="p-3">Hợp tác</th><th className="p-3 text-center">Số phần việc</th><th className="p-3 text-center">Tổng người khoán</th><th className="p-3 text-center">Ngày đủ</th><th className="p-3 text-center">Ngày thiếu</th><th className="p-3 text-center">Tỷ lệ %</th><th className="p-3">Đánh giá</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {byTeam.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-slate-500">Không có dữ liệu.</td></tr> : byTeam.map(x => (
              <tr key={x.s.id}>
                <td className="p-3 font-semibold">{x.s.companyName}</td>
                <td className="p-3">{x.s.status === 'HOP_TAC' ? 'Đang hợp tác' : 'Ngừng hợp tác'}</td>
                <td className="p-3 text-center font-mono">{x.count}</td>
                <td className="p-3 text-center font-mono">{x.people}</td>
                <td className="p-3 text-center font-mono text-emerald-700 font-bold">{x.du}</td>
                <td className="p-3 text-center font-mono text-red-700 font-bold">{x.thieu}</td>
                <td className="p-3 text-center font-mono">{rateBadge(x.rate)}</td>
                <td className="p-3">{assessment(x.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-500">
        Ngày đủ/thiếu nhân sự lấy từ ghi chú đội thi công ngoài trong nhật ký hiện trường; ngày không có ghi chú thì so số người có mặt trong bảng nhân sự theo ngày với quy mô khoán (ngày có 0 người là ngày nghỉ, không tính).
      </p>
    </div>
  );
};
