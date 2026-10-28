import React, { useState } from 'react';
import type { ExternalAssignment, WorkLog } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';
import { formatDate, overlaps, canOperate } from '../utils/domain.ts';
import { externalState } from './ExternalTeamsTab.tsx';
import { DateInput, SearchSelect } from '../components/inputs.tsx';
import { StatCard, Field, PrintSheet, filterBoxCls, ctlCls, tableWrapCls, thCls, tdCls } from '../components/reportKit.tsx';

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (s: string, n: number) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
const mondayOf = (s: string) => { const d = new Date(s + 'T00:00:00'); return addDays(s, -((d.getDay() + 6) % 7)); };
const daysIn = (from: string, to: string) => { const out: string[] = []; for (let d = from; d <= to && out.length < 62; d = addDays(d, 1)) out.push(d); return out; };
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const wd = (s: string) => WD[new Date(s + 'T00:00:00').getDay()];

export type DayStatus = 'DU' | 'THUA' | 'THIEU' | 'NGHI' | 'CHUA';
export const DAY_LABEL: Record<DayStatus, string> = { DU: 'Đủ', THUA: 'Thừa', THIEU: 'Thiếu', NGHI: 'Nghỉ', CHUA: 'Chưa cập nhật' };
const DAY_CLS: Record<DayStatus, string> = {
  DU: 'bg-emerald-100 text-emerald-800', THUA: 'bg-emerald-50 text-emerald-700', THIEU: 'bg-red-100 text-red-700',
  NGHI: 'bg-slate-100 text-slate-500', CHUA: 'bg-amber-50 text-amber-700'
};

/**
 * Tình trạng nhân sự từng ngày của một phần việc giao ngoài trong khoảng [from, to] (chỉ tính đến hôm nay):
 * – Số người: bảng nhân sự đội ngoài theo ngày (Đội trưởng/Quản lý cập nhật, hoặc tự ghi từ ghi chú trong nhật ký hiện trường).
 * – Đủ/Thiếu/Thừa: theo ghi chú của Đội trưởng nếu có, nếu không thì so số người có mặt với quy mô khoán. 0 người là ngày nghỉ.
 */
export const staffingByDay = (e: ExternalAssignment, workLogs: WorkLog[], from?: string, to?: string) => {
  const today = DEMO_QUERY_TIME.slice(0, 10);
  const s = [e.startDate.slice(0, 10), from || ''].sort().pop()!;
  const end = [e.dueDate.slice(0, 10), to || '9999-12-31', today].sort()[0];
  const notes = workLogs.filter(w => w.externalStaffingStatus && w.externalTeamId === e.contractorId
    && (w.externalAssignmentId ? w.externalAssignmentId === e.id : (e.taskId ? w.taskId === e.taskId : w.projectId === e.projectId)));
  return (s > end ? [] : daysIn(s, end)).map(date => {
    const rec = (e.dailyStaffing || []).find(d => d.date === date);
    const note = notes.filter(w => w.submittedAt.slice(0, 10) === date).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
    const count = rec ? rec.presentCount : note?.externalTeamCount;
    let status: DayStatus = 'CHUA';
    // Chủ nhật không nằm trong ngày làm việc theo kế hoạch: không có số liệu thì coi là nghỉ, không tính "chưa cập nhật"
    const sunday = new Date(date + 'T00:00:00').getDay() === 0;
    if (sunday && count === undefined) status = 'NGHI';
    // Đã xác nhận: số của Quản lý quyết định; chưa xác nhận: theo đội trưởng báo
    const confirmed = !!rec?.confirmed;
    const reportedStatus = rec?.reportedStatus || note?.externalStaffingStatus;
    if (count === 0) status = 'NGHI';
    else if (!confirmed && reportedStatus) status = reportedStatus as DayStatus;
    else if (count !== undefined) status = !e.workerCount || count === e.workerCount ? 'DU' : count > e.workerCount ? 'THUA' : 'THIEU';
    return {
      date, sunday, count, status, confirmed: count !== undefined && confirmed, pending: count !== undefined && !confirmed,
      content: rec?.reportNote || rec?.content || note?.externalTeamNote || '', managerNote: rec?.managerNote || '',
      by: rec?.confirmedBy || rec?.reportedBy || rec?.updatedBy || note?.submittedByStaffName || ''
    };
  });
};

export const summarizeDays = (days: ReturnType<typeof staffingByDay>) => {
  const du = days.filter(d => d.status === 'DU' || d.status === 'THUA').length;
  const thieu = days.filter(d => d.status === 'THIEU').length;
  // Ngày làm việc theo kế hoạch: không tính Chủ nhật (N_kh = số ngày − số Chủ nhật)
  const workDays = days.filter(d => !d.sunday);
  const updated = workDays.filter(d => d.status !== 'CHUA').length;
  const manDays = days.reduce((s, d) => s + (d.count || 0), 0);
  const pending = days.filter(d => d.pending).length;
  return { du, thieu, updated, pending, total: workDays.length, manDays, rate: du + thieu > 0 ? Math.round((du / (du + thieu)) * 100) : null };
};

const assessment = (rate: number | null) =>
  rate === null ? '—' : rate >= 90 ? 'Tốt – nên tiếp tục hợp tác' : rate >= 70 ? 'Đạt – nhắc đảm bảo nhân sự' : 'Cần cân nhắc khi hợp tác tiếp';
const money = (v?: number) => (v ? v.toLocaleString('vi-VN') : '—');

/** BC-04: Tình hình thi công của đội thi công ngoài */
export const ExternalTeamReport: React.FC<{ onSelectProject?: (projectId: string, taskId?: string) => void; preparedBy?: string }> = ({ onSelectProject, preparedBy }) => {
  const { visibleProjects, scoped, tasks, staff, subcontractors, workLogs, currentUser } = useStore();
  const today = DEMO_QUERY_TIME.slice(0, 10);
  const showMoney = canOperate(currentUser);
  // Trả công cho đội ngoài thường theo tuần: mặc định tuần hiện tại (thứ Hai – Chủ nhật)
  const [from, setFrom] = useState(mondayOf(today));
  const [to, setTo] = useState(addDays(mondayOf(today), 6));
  const [fProject, setFProject] = useState('');
  const [fTeam, setFTeam] = useState('');
  const [fState, setFState] = useState('ACTIVE');
  const rangeErr = !from || !to ? 'Vui lòng chọn khoảng thời gian.' : to < from ? 'Ngày kết thúc không được trước ngày bắt đầu.' : daysIn(from, to).length >= 62 ? 'Khoảng thời gian tối đa 62 ngày.' : null;
  const setPreset = (k: 'week' | 'lastweek' | 'month') => {
    if (k === 'week') { setFrom(mondayOf(today)); setTo(addDays(mondayOf(today), 6)); }
    if (k === 'lastweek') { const m = addDays(mondayOf(today), -7); setFrom(m); setTo(addDays(m, 6)); }
    if (k === 'month') { const d = new Date(today + 'T00:00:00'); setFrom(ymd(new Date(d.getFullYear(), d.getMonth(), 1))); setTo(ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0))); }
  };

  const rows = rangeErr ? [] : scoped.externalAssignments.map(e => {
    const t = tasks.find(x => x.id === e.taskId);
    const p = visibleProjects.find(x => x.id === (e.projectId || t?.projectId));
    const days = staffingByDay(e, workLogs, from, to);
    return { e, t, p, st: externalState(e), days, sum: summarizeDays(days), sub: subcontractors.find(s => s.id === e.contractorId) };
  }).filter(r => {
    if (!r.p) return false;
    if (fProject && r.p.id !== fProject) return false;
    if (fTeam && r.e.contractorId !== fTeam) return false;
    if (fState === 'ACTIVE' ? r.st.key === 'HUY' : fState !== 'all' && r.st.key !== fState) return false;
    return overlaps(r.e.startDate, r.e.dueDate, `${from} 00:00:00`, `${to} 23:59:59`);
  }).sort((a, b) => (a.p!.code + a.e.startDate).localeCompare(b.p!.code + b.e.startDate));

  const tot = (f: (r: typeof rows[number]) => number) => rows.reduce((s, r) => s + f(r), 0);
  const totDu = tot(r => r.sum.du), totThieu = tot(r => r.sum.thieu), totUpd = tot(r => r.sum.updated), totDays = tot(r => r.sum.total);
  const totRate = totDu + totThieu > 0 ? Math.round((totDu / (totDu + totThieu)) * 100) : null;
  const notToday = rows.filter(r => r.st.key === 'DANG' && !r.days.some(d => d.date === today && d.status !== 'CHUA')).length;
  const byTeam = subcontractors.map(s => {
    const mine = rows.filter(r => r.e.contractorId === s.id);
    const du = mine.reduce((x, r) => x + r.sum.du, 0), thieu = mine.reduce((x, r) => x + r.sum.thieu, 0);
    return { s, n: mine.length, people: mine.reduce((x, r) => x + (r.e.workerCount || 0), 0), manDays: mine.reduce((x, r) => x + r.sum.manDays, 0), du, thieu, value: mine.reduce((x, r) => x + (r.e.contractValue || 0), 0), rate: du + thieu > 0 ? Math.round((du / (du + thieu)) * 100) : null };
  }).filter(x => x.n > 0);
  const dates = rangeErr ? [] : daysIn(from, to);
  const work = (r: typeof rows[number]) => r.t ? `${r.t.code} ${r.t.title}` : 'Khoán theo dự án';
  const filterText = [fProject ? visibleProjects.find(p => p.id === fProject)?.code : 'Tất cả dự án', fTeam ? subcontractors.find(s => s.id === fTeam)?.companyName : 'tất cả đơn vị',
    fState === 'ACTIVE' ? 'không gồm phần việc đã hủy' : fState === 'all' ? 'mọi tình trạng' : { SAP: 'sắp triển khai', DANG: 'đang triển khai', KET_THUC: 'đã kết thúc', HUY: 'đã hủy' }[fState]].join(', ');

  return (
    <>
      <div className="space-y-3 print:hidden">
        <div className={filterBoxCls}>
          <Field label="Từ ngày" required><DateInput value={from} onChange={e => setFrom(e.target.value)} className={`${ctlCls} w-36`} /></Field>
          <Field label="Đến ngày" required><DateInput value={to} onChange={e => setTo(e.target.value)} className={`${ctlCls} w-36`} /></Field>
          <div className="flex gap-1 pb-0.5">
            {([['week', 'Tuần này'], ['lastweek', 'Tuần trước'], ['month', 'Tháng này']] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setPreset(k)} className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] font-semibold hover:bg-slate-50 cursor-pointer">{l}</button>
            ))}
          </div>
          <Field label="Đơn vị thi công" className="w-56"><SearchSelect value={fTeam} onChange={setFTeam} allLabel="Tất cả đơn vị" options={subcontractors.map(s => ({ value: s.id, label: s.companyName, sub: s.area }))} className={`${ctlCls} w-full`} /></Field>
          <Field label="Dự án" className="w-56"><SearchSelect value={fProject} onChange={setFProject} allLabel="Tất cả dự án" options={visibleProjects.map(p => ({ value: p.id, label: `${p.code} – ${p.name}` }))} className={`${ctlCls} w-full`} /></Field>
          <Field label="Tình trạng">
            <select value={fState} onChange={e => setFState(e.target.value)} className={ctlCls}>
              <option value="ACTIVE">Tất cả (trừ đã hủy)</option><option value="SAP">Sắp triển khai</option><option value="DANG">Đang triển khai</option>
              <option value="KET_THUC">Đã kết thúc</option><option value="HUY">Đã hủy</option><option value="all">Mọi tình trạng</option>
            </select>
          </Field>
        </div>
        {rangeErr && <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{rangeErr}</div>}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <StatCard label="Phần việc giao khoán" value={rows.length} unit="phần việc" tone="navy" />
          <StatCard label="Đang triển khai" value={rows.filter(r => r.st.key === 'DANG').length} unit="phần việc" tone="blue" />
          <StatCard label="Chưa cập nhật hôm nay" value={notToday} unit="phần việc" tone="amber" />
          <StatCard label="Ngày đã cập nhật" value={totDays ? `${totUpd}/${totDays}` : null} unit="ngày" tone="purple" hint={tot(r => r.sum.pending) ? `${tot(r => r.sum.pending)} ngày chờ Quản lý xác nhận` : 'Đã xác nhận đủ'} />
          <StatCard label="Tổng công (người × ngày)" value={tot(r => r.sum.manDays)} unit="công" tone="slate" />
          <StatCard label="Tỷ lệ ngày đủ nhân sự" value={totRate === null ? null : `${totRate}%`} tone={totRate !== null && totRate < 70 ? 'red' : 'green'} hint={totRate === null ? undefined : `${totDu} ngày đủ · ${totThieu} ngày thiếu`} />
        </div>

        <div className={tableWrapCls}>
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700">Chi tiết phần việc giao đội thi công ngoài</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead><tr>
                {['Dự án', 'Phần việc', 'Đơn vị thi công', 'Đầu mối', 'Phụ trách', 'Thời gian', 'Tình trạng', 'Quy mô khoán', 'Ngày đủ', 'Ngày thiếu', 'Tỷ lệ', 'Công', ...(showMoney ? ['Giá trị khoán (đ)'] : [])].map((h, i) =>
                  <th key={h} className={`${thCls} ${i >= 7 ? 'text-center' : ''} ${['min-w-[150px]', 'min-w-[200px]', 'min-w-[150px]', 'min-w-[110px]', 'min-w-[100px]'][i] || ''}`}>{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={showMoney ? 13 : 12} className={`${tdCls} text-center text-slate-500 py-6`}>Không có phần việc giao ngoài trong kỳ theo bộ lọc.</td></tr> : rows.map(r => (
                  <tr key={r.e.id} onClick={() => r.p && onSelectProject?.(r.p.id, r.e.taskId || undefined)} className="hover:bg-blue-50/40 cursor-pointer">
                    <td className={`${tdCls} whitespace-nowrap`}><div className="font-mono font-bold text-blue-700">{r.p?.code}</div><div className="text-[10px] text-slate-500 max-w-[180px] truncate">{r.p?.name}</div></td>
                    <td className={tdCls}><div className="font-semibold">{work(r)}</div><div className="text-[10px] text-slate-500">{r.e.workDescription}</div></td>
                    <td className={`${tdCls} font-semibold`}>{r.e.contractorName}</td>
                    <td className={`${tdCls} text-[11px]`}>{r.sub?.contactPerson}<div className="font-mono text-slate-500">{r.sub?.phone}</div></td>
                    <td className={tdCls}>{r.p?.managerName || staff.find(s => s.id === r.p?.managerId)?.name}</td>
                    <td className={`${tdCls} font-mono text-[11px] whitespace-nowrap`}>{formatDate(r.e.startDate)}<br />{formatDate(r.e.dueDate)}</td>
                    <td className={tdCls}><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${r.st.cls}`}>{r.st.label}</span></td>
                    <td className={`${tdCls} text-center font-mono font-bold`}>{r.e.workerCount ?? '—'}</td>
                    <td className={`${tdCls} text-center font-mono font-bold`}>{r.sum.du}</td>
                    <td className={`${tdCls} text-center font-mono font-bold ${r.sum.thieu ? 'text-red-700' : ''}`}>{r.sum.thieu}</td>
                    <td className={`${tdCls} text-center font-mono`}>{r.sum.rate === null ? <span className="text-[10px] text-slate-400">—</span> : `${r.sum.rate}%`}</td>
                    <td className={`${tdCls} text-center font-mono`}>{r.sum.manDays}</td>
                    {showMoney && <td className={`${tdCls} text-right font-mono`}>{money(r.e.contractValue)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng chấm công theo ngày: căn cứ trả công theo ngày hoặc theo tuần */}
        {rows.length > 0 && (
          <div className={tableWrapCls}>
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700 flex flex-wrap items-center justify-between gap-2">
              <span>Nhân sự có mặt theo ngày ({formatDate(from)} – {formatDate(to)})</span>
              <span className="flex gap-1.5 font-normal text-[10px]">{(['DU', 'THIEU', 'THUA', 'NGHI', 'CHUA'] as DayStatus[]).map(k => <span key={k} className={`px-1.5 py-0.5 rounded ${DAY_CLS[k]}`}>{DAY_LABEL[k]}</span>)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr>
                  <th className={`${thCls} text-left min-w-[200px]`}>Đơn vị · Dự án</th>
                  <th className={`${thCls} text-center`}>Khoán</th>
                  {dates.map(d => <th key={d} className={`${thCls} text-center whitespace-nowrap ${d === today ? '!bg-blue-100' : ''}`}>{wd(d)}<div className="font-mono font-normal">{d.slice(8, 10)}/{d.slice(5, 7)}</div></th>)}
                  <th className={`${thCls} text-center`}>Công</th>
                </tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.e.id}>
                      <td className={tdCls}><div className="font-semibold">{r.e.contractorName}</div><div className="text-[10px] text-slate-500">{r.p?.code} · {work(r)}</div></td>
                      <td className={`${tdCls} text-center font-mono`}>{r.e.workerCount ?? '—'}</td>
                      {dates.map(d => {
                        const day = r.days.find(x => x.date === d);
                        return (
                          <td key={d} className={`${tdCls} text-center p-1`} title={day ? `${DAY_LABEL[day.status]}${day.pending ? ' · CHỜ QUẢN LÝ XÁC NHẬN' : day.confirmed ? ' · đã xác nhận' : ''}${day.content ? ' · ' + day.content : ''}${day.managerNote ? ' · QL: ' + day.managerNote : ''}${day.by ? ' · ' + day.by : ''}` : 'Ngoài thời gian làm việc'}>
                            {day ? <span className={`inline-block min-w-[30px] px-1 py-0.5 rounded font-mono font-bold ${DAY_CLS[day.status]} ${day.pending ? 'outline-2 outline-dashed outline-amber-500' : ''}`}>{day.status === 'CHUA' ? '?' : (day.count ?? 'CN')}</span> : <span className="text-slate-300">·</span>}
                          </td>
                        );
                      })}
                      <td className={`${tdCls} text-center font-mono font-bold`}>{r.sum.manDays}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className={tdCls}>Tổng cộng</td><td className={`${tdCls} text-center font-mono`}>{tot(r => r.e.workerCount || 0)}</td>
                    {dates.map(d => <td key={d} className={`${tdCls} text-center font-mono`}>{rows.reduce((s, r) => s + (r.days.find(x => x.date === d)?.count || 0), 0) || ''}</td>)}
                    <td className={`${tdCls} text-center font-mono`}>{tot(r => r.sum.manDays)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className={tableWrapCls}>
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700">Tổng hợp theo đơn vị – cân nhắc cho các lần hợp tác kế tiếp</div>
          <table className="w-full text-left text-xs border-collapse">
            <thead><tr>{['Đơn vị thi công', 'Số phần việc', 'Tổng quy mô khoán', 'Tổng công', 'Ngày đủ', 'Ngày thiếu', 'Tỷ lệ', ...(showMoney ? ['Giá trị khoán (đ)'] : []), 'Đánh giá'].map((h, i) => <th key={h} className={`${thCls} ${i > 0 && h !== 'Đánh giá' ? 'text-center' : ''}`}>{h}</th>)}</tr></thead>
            <tbody>
              {byTeam.length === 0 ? <tr><td colSpan={9} className={`${tdCls} text-center text-slate-500`}>Không có dữ liệu.</td></tr> : byTeam.map(x => (
                <tr key={x.s.id}>
                  <td className={`${tdCls} font-semibold`}>{x.s.companyName}{x.s.status !== 'HOP_TAC' && <span className="text-[10px] text-slate-500 font-normal"> (ngừng hợp tác)</span>}</td>
                  <td className={`${tdCls} text-center font-mono`}>{x.n}</td>
                  <td className={`${tdCls} text-center font-mono`}>{x.people}</td>
                  <td className={`${tdCls} text-center font-mono`}>{x.manDays}</td>
                  <td className={`${tdCls} text-center font-mono font-bold`}>{x.du}</td>
                  <td className={`${tdCls} text-center font-mono font-bold ${x.thieu ? 'text-red-700' : ''}`}>{x.thieu}</td>
                  <td className={`${tdCls} text-center font-mono`}>{x.rate === null ? '—' : `${x.rate}%`}</td>
                  {showMoney && <td className={`${tdCls} text-right font-mono`}>{money(x.value)}</td>}
                  <td className={tdCls}>{assessment(x.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PrintSheet code="BC-04" title="Báo cáo tình hình thi công của đội thi công ngoài" preparedBy={preparedBy}
        period={`từ ${formatDate(from)} đến ${formatDate(to)}`} filterText={`Đơn vị/Dự án/Tình trạng: ${filterText}`}
        summary={[['Phần việc giao khoán', rows.length], ['Đang triển khai', rows.filter(r => r.st.key === 'DANG').length], ['Chưa cập nhật hôm nay', notToday], ['Ngày đã cập nhật', totDays ? `${totUpd}/${totDays}` : '—'], ['Tổng công (người×ngày)', tot(r => r.sum.manDays)], ['Tỷ lệ ngày đủ nhân sự', totRate === null ? '—' : `${totRate}%`], ...(showMoney ? [['Giá trị khoán (đ)', money(tot(r => r.e.contractValue || 0))] as [string, string]] : [])]}
        sections={[
          {
            title: 'Chi tiết phần việc giao đội thi công ngoài',
            head: ['STT', 'Dự án', 'Phần việc', 'Đơn vị thi công', 'Đầu mối (SĐT)', 'Thời gian làm việc', 'Tình trạng', 'Quy mô (người)', 'Ngày đủ', 'Ngày thiếu', 'Công', ...(showMoney ? ['Giá trị khoán (đ)'] : [])],
            align: ['c', 'l', 'l', 'l', 'l', 'c', 'c', 'c', 'c', 'c', 'c', 'r'],
            rows: rows.map((r, i) => [i + 1, `${r.p?.code} ${r.p?.name}`, work(r), r.e.contractorName, `${r.sub?.contactPerson || ''} ${r.sub?.phone || ''}`, `${formatDate(r.e.startDate)} – ${formatDate(r.e.dueDate)}`, r.st.label, r.e.workerCount ?? '—', r.sum.du, r.sum.thieu, r.sum.manDays, ...(showMoney ? [money(r.e.contractValue)] : [])]),
            foot: ['', 'Tổng cộng', '', '', '', '', '', tot(r => r.e.workerCount || 0), totDu, totThieu, tot(r => r.sum.manDays), ...(showMoney ? [money(tot(r => r.e.contractValue || 0))] : [])]
          },
          {
            title: 'Nhân sự có mặt theo ngày (căn cứ tính công)',
            head: ['Đơn vị · Phần việc', 'Khoán', ...dates.map(d => `${wd(d)} ${d.slice(8, 10)}/${d.slice(5, 7)}`), 'Công'],
            align: ['l', 'c', ...dates.map(() => 'c' as const), 'c'],
            widths: [dates.length > 10 ? '16%' : '26%', '4%'],
            rows: rows.map(r => [`${r.e.contractorName} · ${r.p?.code} ${work(r)}`, r.e.workerCount ?? '—', ...dates.map(d => { const day = r.days.find(x => x.date === d); return !day ? '' : day.status === 'CHUA' ? '?' : `${day.count ?? ''}${day.status === 'THIEU' ? '*' : ''}${day.pending ? '~' : ''}`; }), r.sum.manDays]),
            foot: ['Tổng cộng', tot(r => r.e.workerCount || 0), ...dates.map(d => rows.reduce((s, r) => s + (r.days.find(x => x.date === d)?.count || 0), 0) || ''), tot(r => r.sum.manDays)]
          },
          {
            title: 'Tổng hợp theo đơn vị thi công',
            head: ['STT', 'Đơn vị thi công', 'Số phần việc', 'Tổng quy mô (người)', 'Tổng công', 'Ngày đủ', 'Ngày thiếu', 'Tỷ lệ đủ', ...(showMoney ? ['Giá trị khoán (đ)'] : []), 'Đánh giá'],
            align: ['c', 'l', 'c', 'c', 'c', 'c', 'c', 'c', ...(showMoney ? ['r' as const] : []), 'l'],
            rows: byTeam.map((x, i) => [i + 1, x.s.companyName, x.n, x.people, x.manDays, x.du, x.thieu, x.rate === null ? '—' : `${x.rate}%`, ...(showMoney ? [money(x.value)] : []), assessment(x.rate)])
          }
        ]}
        notes={[
          'Số người có mặt lấy từ bảng nhân sự đội ngoài theo ngày do Đội trưởng/Quản lý cập nhật (kể cả ghi chú đội ngoài trong nhật ký hiện trường).',
          'Số người: số Quản lý đã xác nhận; ngày chưa xác nhận tạm lấy số Đội trưởng báo và đánh dấu "~". Dấu * là ngày thiếu nhân sự, "?" là ngày chưa cập nhật, 0 là ngày nghỉ.',
          'Công = tổng số người có mặt của các ngày trong kỳ (người × ngày), dùng làm căn cứ trả công theo ngày hoặc theo tuần.',
          'Giá trị khoán chỉ để tham khảo, hệ thống không hạch toán thanh toán.'
        ]} />
    </>
  );
};
