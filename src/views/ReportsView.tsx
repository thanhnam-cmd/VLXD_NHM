import React, { useState } from 'react';
import { DateInput, SearchSelect } from '../components/inputs.tsx';
import { ExternalTeamReport } from './ExternalTeamReport.tsx';
import { Project, Task, Assignment, StaffLeave, Staff, UserAccount, WorkLog } from '../types/index.ts';
import { DEMO_QUERY_TIME, UPCOMING_DAYS, isTaskOverdue, isTaskUpcoming7Days } from '../utils/progressCalculator.ts';
import { formatDate, formatDateTime, overlaps, daysBetween, toTime, PROJECT_STATUS_LABEL, TASK_STATUS_LABEL } from '../utils/domain.ts';
import { StatCard, Field, PrintSheet, filterBoxCls, ctlCls, tableWrapCls, thCls, tdCls } from '../components/reportKit.tsx';
import { Printer } from 'lucide-react';

interface ReportsViewProps {
  projects: Project[];
  tasks: Task[];
  staff: Staff[];
  assignments: Assignment[];
  leaves: StaffLeave[];
  workLogs: WorkLog[];
  currentUser: UserAccount;
  initialTab?: 'BC-01' | 'BC-02' | 'BC-03' | 'BC-04';
  initialFilter?: string;
  onSelectProject?: (projectId: string, taskId?: string) => void;
}

type ReportKey = 'BC-01' | 'BC-02' | 'BC-03' | 'BC-04';
const REPORTS: { key: ReportKey; title: string; sub: string }[] = [
  { key: 'BC-01', title: 'Tình hình thực hiện dự án', sub: 'Tiến độ, trạng thái từng dự án' },
  { key: 'BC-02', title: 'Tình hình phân công nhân sự', sub: 'Lịch làm việc, nghỉ/bận trong kỳ' },
  { key: 'BC-03', title: 'Công việc quá hạn, sắp đến hạn', sub: 'Danh sách cần xử lý ngay' },
  { key: 'BC-04', title: 'Thi công của đội thi công ngoài', sub: 'Đủ/thiếu nhân sự theo ngày' }
];

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const STATUS_CHIP: Record<string, string> = {
  HOAN_THANH: 'bg-emerald-100 text-emerald-800', DANG_THUC_HIEN: 'bg-blue-100 text-blue-800', TAM_DUNG: 'bg-amber-100 text-amber-800',
  HUY: 'bg-slate-200 text-slate-600', LAP_KE_HOACH: 'bg-slate-100 text-slate-700'
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  projects, tasks, staff, assignments, leaves, workLogs, currentUser, initialTab = 'BC-01', initialFilter = 'all', onSelectProject
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportKey>(initialTab);

  // BC-01
  const [bc1Project, setBc1Project] = useState('');
  const [bc1Status, setBc1Status] = useState<string>(initialTab === 'BC-01' && initialFilter && initialFilter !== 'all' ? initialFilter : 'all');
  const [bc1From, setBc1From] = useState('');
  const [bc1To, setBc1To] = useState('');
  // BC-02: mặc định một tuần kể từ hôm nay
  const [bc2From, setBc2From] = useState<string>(DEMO_QUERY_TIME.slice(0, 10));
  const [bc2To, setBc2To] = useState<string>(() => { const d = new Date(DEMO_QUERY_TIME.slice(0, 10) + 'T00:00:00'); d.setDate(d.getDate() + 6); return ymd(d); });
  const [bc2Staff, setBc2Staff] = useState('');
  const [bc2Project, setBc2Project] = useState('');
  const [bc2Status, setBc2Status] = useState<string>('HIEU_LUC');
  // BC-03
  const [bc3Group, setBc3Group] = useState<'overdue' | 'upcoming' | 'both'>(initialTab === 'BC-03' && (initialFilter === 'overdue' || initialFilter === 'upcoming') ? initialFilter : 'both');
  const [bc3Project, setBc3Project] = useState('');
  const [bc3Staff, setBc3Staff] = useState('');

  const projectOptions = projects.map(p => ({ value: p.id, label: `${p.code} – ${p.name}` }));
  const staffName = (id?: string) => staff.find(s => s.id === id)?.name || '';

  // ---------------- BC-01 ----------------
  const bc1Rows = projects.filter(p => {
    if (bc1Project && p.id !== bc1Project) return false;
    if (bc1Status !== 'all' && p.status !== bc1Status) return false;
    if ((bc1From || bc1To) && !overlaps(p.startDate, p.dueDate, `${bc1From || '1900-01-01'} 00:00:00`, `${bc1To || '2999-12-31'} 23:59:59`)) return false;
    return true;
  }).map(p => {
    const pt = tasks.filter(t => t.projectId === p.id);
    const done = pt.filter(t => t.status === 'HOAN_THANH').length;
    const valid = pt.filter(t => t.status !== 'HUY').length;
    const isOver = p.status !== 'HOAN_THANH' && p.status !== 'HUY' && toTime(p.dueDate) < toTime(DEMO_QUERY_TIME);
    return {
      p, notStarted: pt.filter(t => t.status === 'CHUA_BAT_DAU').length, doing: pt.filter(t => t.status === 'DANG_THUC_HIEN').length, done,
      canceled: pt.filter(t => t.status === 'HUY').length, total: pt.length, rate: valid > 0 ? Math.round((done / valid) * 100) : null,
      overDays: isOver ? Math.max(1, daysBetween(p.dueDate, DEMO_QUERY_TIME)) : 0
    };
  });
  const bc1Count = (st: string) => bc1Rows.filter(r => r.p.status === st).length;
  const bc1Overdue = bc1Rows.filter(r => r.overDays > 0).length;
  const bc1Filter = [bc1Project ? projects.find(p => p.id === bc1Project)?.code : 'Tất cả dự án', bc1Status !== 'all' ? PROJECT_STATUS_LABEL[bc1Status] : 'mọi trạng thái'].join(', ');

  // ---------------- BC-02 ----------------
  const bc2RangeError = !bc2From || !bc2To ? 'Vui lòng chọn khoảng thời gian.' : bc2To < bc2From ? 'Ngày kết thúc không được trước ngày bắt đầu.' : null;
  const rS = `${bc2From} 00:00:00`, rE = `${bc2To} 23:59:59`;
  const bc2Rows = bc2RangeError ? [] : assignments.filter(a => {
    if (bc2Status !== 'all' && (bc2Status === 'HIEU_LUC') !== (a.status === 'HIEU_LUC' || a.status === 'active')) return false;
    if (bc2Staff && a.staffId !== bc2Staff) return false;
    if (bc2Project && tasks.find(t => t.id === a.taskId)?.projectId !== bc2Project) return false;
    return overlaps(a.startDate, a.endDate, rS, rE);
  }).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const bc2Leaves = bc2RangeError ? [] : leaves.filter(l => l.status === 'HIEU_LUC' && overlaps(l.startDate, l.endDate, rS, rE) && (!bc2Staff || l.staffId === bc2Staff));
  const bc2Affected = bc2Rows.filter(a => a.status === 'HIEU_LUC' && bc2Leaves.some(l => l.staffId === a.staffId && overlaps(a.startDate, a.endDate, l.startDate, l.endDate)));
  const bc2StaffCount = new Set(bc2Rows.map(a => a.staffId)).size;
  const bc2LeaveStaff = new Set(bc2Leaves.map(l => l.staffId)).size;
  const bc2Filter = [bc2Project ? projects.find(p => p.id === bc2Project)?.code : 'Tất cả dự án', bc2Staff ? staffName(bc2Staff) : 'tất cả nhân sự', bc2Status === 'HIEU_LUC' ? 'phân công hiệu lực' : bc2Status === 'HUY' ? 'phân công đã hủy' : 'mọi phân công'].join(', ');

  // ---------------- BC-03 ----------------
  const activeProjIds = new Set(projects.filter(p => ['LAP_KE_HOACH', 'DANG_THUC_HIEN', 'TAM_DUNG'].includes(p.status)).map(p => p.id));
  const bc3Rows = tasks.filter(t => {
    if (!activeProjIds.has(t.projectId) || t.status === 'HOAN_THANH' || t.status === 'HUY') return false;
    if (bc3Project && t.projectId !== bc3Project) return false;
    if (bc3Staff && t.assigneeId !== bc3Staff) return false;
    const o = isTaskOverdue(t.dueDate, t.status), u = isTaskUpcoming7Days(t.dueDate, t.status);
    return bc3Group === 'overdue' ? o : bc3Group === 'upcoming' ? u : o || u;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(t => {
    const isOver = isTaskOverdue(t.dueDate, t.status);
    return {
      t, p: projects.find(p => p.id === t.projectId), isOver,
      days: Math.max(isOver ? 1 : 0, Math.abs(daysBetween(t.dueDate, DEMO_QUERY_TIME))),
      last: workLogs.filter(w => w.taskId === t.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
    };
  });
  const bc3Over = bc3Rows.filter(r => r.isOver).length;
  const bc3Up = bc3Rows.length - bc3Over;
  const bc3Paused = bc3Rows.filter(r => r.p?.status === 'TAM_DUNG').length;
  const bc3Filter = [bc3Group === 'both' ? 'Quá hạn và sắp đến hạn' : bc3Group === 'overdue' ? 'Quá hạn' : 'Sắp đến hạn', bc3Project ? projects.find(p => p.id === bc3Project)?.code : 'tất cả dự án', bc3Staff ? staffName(bc3Staff) : 'mọi người phụ trách'].join(', ');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h1 className="text-xl font-bold text-[#0D1A36] tracking-tight">Báo cáo</h1>
        <button type="button" onClick={() => window.print()}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] shadow-2xs cursor-pointer flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5" /> In báo cáo
        </button>
      </div>

      {/* Chọn báo cáo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 print:hidden">
        {REPORTS.map(r => (
          <button key={r.key} type="button" onClick={() => setSelectedReport(r.key)}
            className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedReport === r.key ? 'border-[#152A55] bg-[#EEF3FA] shadow-sm' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
            <div className={`text-xs font-bold ${selectedReport === r.key ? 'text-[#152A55]' : 'text-slate-800'}`}>{r.key} · {r.title}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{r.sub}</div>
          </button>
        ))}
      </div>

      {selectedReport === 'BC-04' && <ExternalTeamReport onSelectProject={onSelectProject} preparedBy={currentUser.name} />}

      {/* ====================== BC-01 ====================== */}
      {selectedReport === 'BC-01' && (
        <>
          <div className="space-y-3 print:hidden">
            <div className={filterBoxCls}>
              <Field label="Dự án" className="w-72"><SearchSelect value={bc1Project} onChange={setBc1Project} allLabel={`Tất cả dự án (${projects.length})`} options={projectOptions} className={`${ctlCls} w-full`} /></Field>
              <Field label="Trạng thái">
                <select value={bc1Status} onChange={e => setBc1Status(e.target.value)} className={ctlCls}>
                  <option value="all">Tất cả</option>
                  {Object.entries(PROJECT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Từ ngày"><DateInput value={bc1From} onChange={e => setBc1From(e.target.value)} className={`${ctlCls} w-36`} /></Field>
              <Field label="Đến ngày"><DateInput value={bc1To} onChange={e => setBc1To(e.target.value)} className={`${ctlCls} w-36`} /></Field>
              <button type="button" onClick={() => { setBc1Project(''); setBc1Status('all'); setBc1From(''); setBc1To(''); }} className="ml-auto px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer">Xóa bộ lọc</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <StatCard label="Số dự án" value={bc1Rows.length} tone="navy" />
              <StatCard label="Lập kế hoạch" value={bc1Count('LAP_KE_HOACH')} tone="slate" />
              <StatCard label="Đang triển khai" value={bc1Count('DANG_THUC_HIEN')} tone="blue" />
              <StatCard label="Tạm dừng" value={bc1Count('TAM_DUNG')} tone="amber" />
              <StatCard label="Hoàn thành" value={bc1Count('HOAN_THANH')} tone="green" />
              <StatCard label="Hủy" value={bc1Count('HUY')} tone="slate" />
              <StatCard label="Dự án quá hạn" value={bc1Overdue} tone="red" />
            </div>
            <div className={tableWrapCls}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead><tr>
                    {['Mã dự án', 'Tên dự án', 'Phụ trách', 'Thời gian kế hoạch', 'Trạng thái', 'Chưa bắt đầu', 'Đang thực hiện', 'Hoàn thành', 'Hủy', 'Tỷ lệ hoàn thành', 'Quá hạn'].map((h, i) =>
                      <th key={h} className={`${thCls} ${i >= 5 && i <= 9 ? 'text-center' : ''}`}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {bc1Rows.length === 0 ? <tr><td colSpan={11} className={`${tdCls} text-center text-slate-500 py-6`}>Không có dữ liệu theo bộ lọc đã chọn.</td></tr> : bc1Rows.map(r => (
                      <tr key={r.p.id} onClick={() => onSelectProject?.(r.p.id)} className="hover:bg-blue-50/40 cursor-pointer">
                        <td className={`${tdCls} font-mono font-bold text-blue-700 whitespace-nowrap`}>{r.p.code}</td>
                        <td className={`${tdCls} font-semibold text-slate-900`}>{r.p.name}</td>
                        <td className={tdCls}>{r.p.managerName || staffName(r.p.managerId)}</td>
                        <td className={`${tdCls} font-mono text-[11px] whitespace-nowrap`}>{formatDate(r.p.startDate)} – {formatDate(r.p.dueDate)}</td>
                        <td className={tdCls}><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_CHIP[r.p.status]}`}>{PROJECT_STATUS_LABEL[r.p.status]}</span></td>
                        <td className={`${tdCls} text-center font-mono`}>{r.notStarted}</td>
                        <td className={`${tdCls} text-center font-mono font-bold`}>{r.doing}</td>
                        <td className={`${tdCls} text-center font-mono font-bold`}>{r.done}</td>
                        <td className={`${tdCls} text-center font-mono`}>{r.canceled}</td>
                        <td className={`${tdCls} text-center font-mono font-bold`}>{r.rate === null ? <span className="text-[10px] font-normal text-slate-400">—</span> : `${r.rate}%`}</td>
                        <td className={`${tdCls} whitespace-nowrap`}>{r.overDays > 0 && <span className="text-red-700 font-bold text-[11px]">Quá {r.overDays} ngày</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <PrintSheet code="BC-01" title="Báo cáo tình hình thực hiện dự án" preparedBy={currentUser.name}
            period={bc1From || bc1To ? `từ ${formatDate(bc1From) || '…'} đến ${formatDate(bc1To) || '…'}` : 'toàn bộ thời gian'}
            filterText={`Bộ lọc: ${bc1Filter}`}
            summary={[['Số dự án', bc1Rows.length], ['Lập kế hoạch', bc1Count('LAP_KE_HOACH')], ['Đang triển khai', bc1Count('DANG_THUC_HIEN')], ['Tạm dừng', bc1Count('TAM_DUNG')], ['Hoàn thành', bc1Count('HOAN_THANH')], ['Hủy', bc1Count('HUY')], ['Dự án quá hạn', bc1Overdue]]}
            sections={[{
              title: 'Chi tiết dự án',
              head: ['STT', 'Mã dự án', 'Tên dự án', 'Phụ trách', 'Thời gian kế hoạch', 'Trạng thái', 'Tổng CV', 'Chưa BĐ', 'Đang TH', 'Hoàn thành', 'Hủy', 'Tỷ lệ HT', 'Quá hạn'],
              align: ['c', 'l', 'l', 'l', 'c', 'c', 'c', 'c', 'c', 'c', 'c', 'c', 'c'],
              rows: bc1Rows.map((r, i) => [i + 1, r.p.code, r.p.name, r.p.managerName || staffName(r.p.managerId), `${formatDate(r.p.startDate)} – ${formatDate(r.p.dueDate)}`, PROJECT_STATUS_LABEL[r.p.status], r.total, r.notStarted, r.doing, r.done, r.canceled, r.rate === null ? '—' : `${r.rate}%`, r.overDays ? `${r.overDays} ngày` : '—']),
              foot: ['', 'Tổng cộng', '', '', '', '', bc1Rows.reduce((s, r) => s + r.total, 0), bc1Rows.reduce((s, r) => s + r.notStarted, 0), bc1Rows.reduce((s, r) => s + r.doing, 0), bc1Rows.reduce((s, r) => s + r.done, 0), bc1Rows.reduce((s, r) => s + r.canceled, 0), '', '']
            }]}
            notes={['Tỷ lệ hoàn thành = số công việc Hoàn thành / số công việc không bị hủy.', 'Dự án quá hạn: chưa Hoàn thành hoặc Hủy và đã qua ngày kết thúc dự kiến tại thời điểm tra cứu.']} />
        </>
      )}

      {/* ====================== BC-02 ====================== */}
      {selectedReport === 'BC-02' && (
        <>
          <div className="space-y-3 print:hidden">
            <div className={filterBoxCls}>
              <Field label="Từ ngày" required><DateInput value={bc2From} onChange={e => setBc2From(e.target.value)} className={`${ctlCls} w-36`} /></Field>
              <Field label="Đến ngày" required><DateInput value={bc2To} onChange={e => setBc2To(e.target.value)} className={`${ctlCls} w-36`} /></Field>
              <Field label="Nhân sự" className="w-52"><SearchSelect value={bc2Staff} onChange={setBc2Staff} allLabel="Tất cả nhân sự" options={staff.map(s => ({ value: s.id, label: s.name, sub: s.roleTitleDisplay }))} className={`${ctlCls} w-full`} /></Field>
              <Field label="Dự án" className="w-60"><SearchSelect value={bc2Project} onChange={setBc2Project} allLabel="Tất cả dự án" options={projectOptions} className={`${ctlCls} w-full`} /></Field>
              <Field label="Trạng thái">
                <select value={bc2Status} onChange={e => setBc2Status(e.target.value)} className={ctlCls}>
                  <option value="HIEU_LUC">Hiệu lực</option><option value="HUY">Đã hủy</option><option value="all">Tất cả</option>
                </select>
              </Field>
              <button type="button" onClick={() => { setBc2Staff(''); setBc2Project(''); setBc2Status('HIEU_LUC'); }} className="ml-auto px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer">Xóa bộ lọc</button>
            </div>
            {bc2RangeError && <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{bc2RangeError}</div>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard label="Nhân sự tham gia" value={bc2StaffCount} unit="người" tone="navy" />
              <StatCard label="Lượt phân công" value={bc2Rows.length} unit="lượt" tone="blue" />
              <StatCard label="Nhân sự có lịch nghỉ/bận" value={bc2LeaveStaff} unit="người" tone="amber" />
              <StatCard label="Phân công bị ảnh hưởng" value={bc2Affected.length} unit="phân công" tone="red" />
            </div>
            <div className={tableWrapCls}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead><tr>{['Nhân sự', 'Công việc', 'Dự án', 'Thời gian', 'Trạng thái', 'Người phân công', 'Ghi chú'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                  <tbody>
                    {bc2Rows.length === 0 ? <tr><td colSpan={7} className={`${tdCls} text-center text-slate-500 py-6`}>Không có dữ liệu theo bộ lọc đã chọn.</td></tr> : bc2Rows.map(a => {
                      const t = tasks.find(x => x.id === a.taskId);
                      const aff = bc2Affected.some(x => x.id === a.id);
                      return (
                        <tr key={a.id} onClick={() => onSelectProject?.(a.projectId, a.taskId)} className="hover:bg-blue-50/40 cursor-pointer">
                          <td className={`${tdCls} font-semibold`}>{staffName(a.staffId) || a.staffName}</td>
                          <td className={tdCls}>{t?.code} · {t?.title}</td>
                          <td className={`${tdCls} font-mono text-blue-700`}>{projects.find(p => p.id === t?.projectId)?.code}</td>
                          <td className={`${tdCls} font-mono text-[11px] whitespace-nowrap`}>{formatDate(a.startDate)} – {formatDate(a.endDate)}</td>
                          <td className={tdCls}><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'HIEU_LUC' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{a.status === 'HIEU_LUC' ? 'Hiệu lực' : 'Đã hủy'}</span></td>
                          <td className={tdCls}>{a.assignedBy || '—'}</td>
                          <td className={tdCls}>{aff ? <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">Trùng lịch nghỉ/bận</span> : (a.notes || '—')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={tableWrapCls}>
              <div className="px-3 py-2 bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700">Lịch nghỉ/bận trong kỳ</div>
              <table className="w-full text-left text-xs border-collapse">
                <thead><tr>{['Nhân sự', 'Thời gian', 'Lý do', 'Phân công bị ảnh hưởng'].map((h, i) => <th key={h} className={`${thCls} ${i === 3 ? 'text-center' : ''}`}>{h}</th>)}</tr></thead>
                <tbody>
                  {bc2Leaves.length === 0 ? <tr><td colSpan={4} className={`${tdCls} text-center text-slate-500`}>Không có lịch nghỉ/bận trong kỳ.</td></tr> : bc2Leaves.map(l => (
                    <tr key={l.id}>
                      <td className={`${tdCls} font-semibold`}>{staffName(l.staffId) || l.staffName}</td>
                      <td className={`${tdCls} font-mono text-[11px]`}>{formatDateTime(l.startDate)} – {formatDateTime(l.endDate)}</td>
                      <td className={tdCls}>{l.reason}</td>
                      <td className={`${tdCls} text-center font-mono font-bold`}>{bc2Affected.filter(a => a.staffId === l.staffId && overlaps(a.startDate, a.endDate, l.startDate, l.endDate)).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <PrintSheet code="BC-02" title="Báo cáo tình hình phân công nhân sự" preparedBy={currentUser.name}
            period={`từ ${formatDate(bc2From)} đến ${formatDate(bc2To)}`} filterText={`Bộ lọc: ${bc2Filter}`}
            summary={[['Nhân sự tham gia', bc2StaffCount], ['Lượt phân công', bc2Rows.length], ['Nhân sự có lịch nghỉ/bận', bc2LeaveStaff], ['Phân công bị ảnh hưởng', bc2Affected.length]]}
            sections={[
              {
                title: 'Chi tiết phân công', head: ['STT', 'Nhân sự', 'Chức danh', 'Dự án', 'Công việc', 'Thời gian', 'Trạng thái', 'Ghi chú'],
                align: ['c', 'l', 'l', 'c', 'l', 'c', 'c', 'l'],
                rows: bc2Rows.map((a, i) => {
                  const t = tasks.find(x => x.id === a.taskId); const s = staff.find(x => x.id === a.staffId);
                  return [i + 1, s?.name || a.staffName || '', s?.roleTitleDisplay || '', projects.find(p => p.id === t?.projectId)?.code || '', `${t?.code || ''} ${t?.title || ''}`, `${formatDate(a.startDate)} – ${formatDate(a.endDate)}`, a.status === 'HIEU_LUC' ? 'Hiệu lực' : 'Đã hủy', bc2Affected.some(x => x.id === a.id) ? 'Trùng lịch nghỉ/bận' : (a.notes || '')];
                }),
                foot: ['', 'Tổng cộng', `${bc2StaffCount} người`, '', `${bc2Rows.length} lượt`, '', '', '']
              },
              {
                title: 'Lịch nghỉ/bận trong kỳ', head: ['STT', 'Nhân sự', 'Thời gian', 'Lý do', 'Phân công bị ảnh hưởng'], align: ['c', 'l', 'c', 'l', 'c'],
                rows: bc2Leaves.map((l, i) => [i + 1, staffName(l.staffId) || l.staffName || '', `${formatDateTime(l.startDate)} – ${formatDateTime(l.endDate)}`, l.reason, bc2Affected.filter(a => a.staffId === l.staffId && overlaps(a.startDate, a.endDate, l.startDate, l.endDate)).length]),
                empty: 'Không có lịch nghỉ/bận trong kỳ.'
              }
            ]}
            notes={['Phân công bị ảnh hưởng: phân công hiệu lực trùng thời gian với lịch nghỉ/bận của chính nhân sự đó.']} />
        </>
      )}

      {/* ====================== BC-03 ====================== */}
      {selectedReport === 'BC-03' && (
        <>
          <div className="space-y-3 print:hidden">
            <div className={filterBoxCls}>
              <Field label="Nhóm công việc">
                <select value={bc3Group} onChange={e => setBc3Group(e.target.value as any)} className={ctlCls}>
                  <option value="both">Quá hạn và sắp đến hạn</option><option value="overdue">Quá hạn</option><option value="upcoming">Sắp đến hạn</option>
                </select>
              </Field>
              <Field label="Dự án" className="w-64"><SearchSelect value={bc3Project} onChange={setBc3Project} allLabel="Tất cả dự án" options={projectOptions} className={`${ctlCls} w-full`} /></Field>
              <Field label="Phụ trách chính" className="w-52"><SearchSelect value={bc3Staff} onChange={setBc3Staff} allLabel="Tất cả" options={staff.filter(s => tasks.some(t => t.assigneeId === s.id)).map(s => ({ value: s.id, label: s.name, sub: s.roleTitleDisplay }))} className={`${ctlCls} w-full`} /></Field>
              <button type="button" onClick={() => { setBc3Group('both'); setBc3Project(''); setBc3Staff(''); }} className="ml-auto px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer">Xóa bộ lọc</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <StatCard label="Công việc quá hạn" value={bc3Over} unit="công việc" tone="red" />
              <StatCard label={`Sắp đến hạn (${UPCOMING_DAYS} ngày tới)`} value={bc3Up} unit="công việc" tone="amber" />
              <StatCard label="Thuộc dự án tạm dừng" value={bc3Paused} unit="công việc" tone="slate" />
            </div>
            <div className={tableWrapCls}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead><tr>{['Dự án', 'Công việc', 'Phụ trách chính', 'Trạng thái', 'Hạn hoàn thành', 'Tình trạng', 'Cập nhật gần nhất'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                  <tbody>
                    {bc3Rows.length === 0 ? <tr><td colSpan={7} className={`${tdCls} text-center text-slate-500 py-6`}>Không có công việc quá hạn hay sắp đến hạn.</td></tr> : bc3Rows.map(r => (
                      <tr key={r.t.id} onClick={() => onSelectProject?.(r.t.projectId, r.t.id)} className="hover:bg-blue-50/40 cursor-pointer">
                        <td className={`${tdCls} font-mono font-bold text-blue-700 whitespace-nowrap`}>{r.p?.code}{r.p?.status === 'TAM_DUNG' && <div className="text-[10px] font-sans font-semibold text-amber-700">Tạm dừng</div>}</td>
                        <td className={`${tdCls} font-semibold`}>{r.t.code ? `${r.t.code} · ` : ''}{r.t.title}</td>
                        <td className={tdCls}>{staffName(r.t.assigneeId) || r.t.assigneeName || '—'}</td>
                        <td className={tdCls}>{TASK_STATUS_LABEL[r.t.status]}</td>
                        <td className={`${tdCls} font-mono text-[11px] whitespace-nowrap`}>{formatDate(r.t.dueDate)}</td>
                        <td className={`${tdCls} whitespace-nowrap`}>{r.isOver ? <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">Quá {r.days} ngày</span> : <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Còn {r.days} ngày</span>}</td>
                        <td className={`${tdCls} text-[11px] text-slate-600`}>{r.last ? `${formatDateTime(r.last.submittedAt)} · ${r.last.submittedByStaffName || ''}` : 'Chưa có cập nhật'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <PrintSheet code="BC-03" title="Báo cáo công việc quá hạn, sắp đến hạn" preparedBy={currentUser.name}
            period={`tính đến ${formatDateTime(DEMO_QUERY_TIME)}`} filterText={`Bộ lọc: ${bc3Filter}`}
            summary={[['Công việc quá hạn', bc3Over], [`Sắp đến hạn (${UPCOMING_DAYS} ngày)`, bc3Up], ['Thuộc dự án tạm dừng', bc3Paused]]}
            sections={[{
              title: 'Danh sách công việc', head: ['STT', 'Dự án', 'Công việc', 'Phụ trách chính', 'Trạng thái', 'Hạn hoàn thành', 'Tình trạng', 'Cập nhật gần nhất'],
              align: ['c', 'c', 'l', 'l', 'c', 'c', 'c', 'l'],
              rows: bc3Rows.map((r, i) => [i + 1, r.p?.code || '', `${r.t.code || ''} ${r.t.title}`, staffName(r.t.assigneeId) || r.t.assigneeName || '', TASK_STATUS_LABEL[r.t.status], formatDate(r.t.dueDate), r.isOver ? `Quá ${r.days} ngày` : `Còn ${r.days} ngày`, r.last ? formatDateTime(r.last.submittedAt) : 'Chưa có']),
              foot: ['', 'Tổng cộng', `${bc3Rows.length} công việc`, '', '', '', `${bc3Over} quá hạn`, '']
            }]}
            notes={['Chỉ tính công việc chưa Hoàn thành/Hủy thuộc dự án Lập kế hoạch, Đang triển khai hoặc Tạm dừng.', `Sắp đến hạn: hạn hoàn thành trong ${UPCOMING_DAYS} ngày tới kể từ thời điểm tra cứu.`]} />
        </>
      )}
    </div>
  );
};
