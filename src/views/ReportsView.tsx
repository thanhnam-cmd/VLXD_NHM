import React, { useState } from 'react';
import { ExternalTeamReport } from './ExternalTeamReport.tsx';
import { Project, Task, Assignment, StaffLeave, Staff, UserAccount, WorkLog } from '../types/index.ts';
import { DEMO_QUERY_TIME, UPCOMING_DAYS, isTaskOverdue, isTaskUpcoming7Days } from '../utils/progressCalculator.ts';
import { formatDate, formatDateTime, overlaps, daysBetween, toTime, PROJECT_STATUS_LABEL, TASK_STATUS_LABEL } from '../utils/domain.ts';
import { 
  BarChart3, 
  Calendar, 
  Printer, 
  RotateCw, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Users2,
  FileSpreadsheet
} from 'lucide-react';

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

const REPORT_TITLES = {
  'BC-01': 'BC-01: Tình hình thực hiện dự án',
  'BC-02': 'BC-02: Tình hình phân công nhân sự',
  'BC-03': 'BC-03: Công việc quá hạn, sắp đến hạn',
  'BC-04': 'BC-04: Tình hình thi công của đội thi công ngoài'
} as const;

export const ReportsView: React.FC<ReportsViewProps> = ({
  projects,
  tasks,
  staff,
  assignments,
  leaves,
  workLogs,
  currentUser,
  initialTab = 'BC-01',
  initialFilter = 'all',
  onSelectProject
}) => {
  const [selectedReport, setSelectedReport] = useState<'BC-01' | 'BC-02' | 'BC-03' | 'BC-04'>(initialTab);
  
  // BC-01 Filters
  const [bc1Project, setBc1Project] = useState<string>('all');
  const [bc1Status, setBc1Status] = useState<string>(initialTab === 'BC-01' && initialFilter && initialFilter !== 'all' ? initialFilter : 'all');
  const [bc1From, setBc1From] = useState('');
  const [bc1To, setBc1To] = useState('');
  const queryLabel = formatDateTime(DEMO_QUERY_TIME);

  // BC-02 Filters
  const [bc2From, setBc2From] = useState<string>(DEMO_QUERY_TIME.slice(0, 10));
  const [bc2To, setBc2To] = useState<string>(() => { const d = new Date(DEMO_QUERY_TIME.slice(0, 10) + 'T00:00:00'); d.setDate(d.getDate() + 6); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [bc2Staff, setBc2Staff] = useState<string>('all');
  const [bc2Project, setBc2Project] = useState<string>('all');
  const [bc2Status, setBc2Status] = useState<string>('HIEU_LUC');

  // BC-03 Filters
  const [bc3Group, setBc3Group] = useState<'overdue' | 'upcoming' | 'both'>(initialTab === 'BC-03' && (initialFilter === 'overdue' || initialFilter === 'upcoming') ? initialFilter : 'both');
  const [bc3Project, setBc3Project] = useState<string>('all');
  const [bc3Staff, setBc3Staff] = useState<string>('all');

  // 1. BC-01: Tình hình thực hiện dự án (Hình 3.36)
  const filteredBc1Projects = projects.filter(p => {
    if (bc1Project !== 'all' && p.id !== bc1Project) return false;
    if (bc1Status !== 'all' && p.status !== bc1Status) return false;
    if ((bc1From || bc1To) && !overlaps(p.startDate, p.dueDate, `${bc1From || '1900-01-01'} 00:00:00`, `${bc1To || '2999-12-31'} 23:59:59`)) return false;
    return true;
  });

  const bc1OverdueProjects = filteredBc1Projects.filter(p => {
    if (p.status === 'HOAN_THANH' || p.status === 'HUY') return false;
    const due = new Date(p.dueDate).getTime();
    const ref = new Date(DEMO_QUERY_TIME).getTime();
    return due < ref;
  });

  // 2. BC-02: Tình hình phân công nhân sự (Hình 3.37)
  const bc2RangeError = !bc2From || !bc2To ? 'Vui lòng chọn khoảng thời gian.' : bc2To < bc2From ? 'Ngày kết thúc không được trước ngày bắt đầu.' : null;
  const rS = `${bc2From} 00:00:00`;
  const rE = `${bc2To} 23:59:59`;

  const filteredBc2Assignments = assignments.filter(a => {
    if (bc2Status !== 'all') {
      const isMatch = bc2Status === 'HIEU_LUC' ? (a.status === 'HIEU_LUC' || a.status === 'active') : (a.status === 'HUY' || a.status === 'cancelled');
      if (!isMatch) return false;
    }
    if (bc2Staff !== 'all' && a.staffId !== bc2Staff) return false;
    if (bc2Project !== 'all') {
      const task = tasks.find(t => t.id === a.taskId);
      if (!task || task.projectId !== bc2Project) return false;
    }
    if (bc2RangeError) return false;
    return overlaps(a.startDate, a.endDate, rS, rE);
  });

  const bc2UniqueStaff = [...new Set(filteredBc2Assignments.map(a => a.staffId))];
  const bc2Leaves = bc2RangeError ? [] : leaves.filter(l => l.status === 'HIEU_LUC' && overlaps(l.startDate, l.endDate, rS, rE) && (bc2Staff === 'all' || l.staffId === bc2Staff));
  const bc2LeaveStaff = [...new Set(bc2Leaves.map(l => l.staffId))];

  const bc2AffectedAssignments = filteredBc2Assignments.filter(a => {
    if (a.status !== 'HIEU_LUC') return false;
    return bc2Leaves.some(l => l.staffId === a.staffId && overlaps(a.startDate, a.endDate, l.startDate, l.endDate));
  });

  // 3. BC-03: Công việc quá hạn, sắp đến hạn (Hình 3.38)
  const activeProjIds = projects
    .filter(p => p.status === 'LAP_KE_HOACH' || p.status === 'DANG_THUC_HIEN' || p.status === 'TAM_DUNG')
    .map(p => p.id);

  const bc3Tasks = tasks.filter(t => {
    if (!activeProjIds.includes(t.projectId)) return false;
    if (t.status === 'HOAN_THANH' || t.status === 'HUY') return false;
    if (bc3Project !== 'all' && t.projectId !== bc3Project) return false;
    if (bc3Staff !== 'all' && t.assigneeId !== bc3Staff) return false;

    const isOver = isTaskOverdue(t.dueDate, t.status);
    const isUp = isTaskUpcoming7Days(t.dueDate, t.status);

    if (bc3Group === 'overdue') return isOver;
    if (bc3Group === 'upcoming') return isUp;
    return isOver || isUp;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const bc3OverdueCount = bc3Tasks.filter(t => isTaskOverdue(t.dueDate, t.status)).length;
  const bc3UpcomingCount = bc3Tasks.filter(t => isTaskUpcoming7Days(t.dueDate, t.status)).length;
  const bc3PausedCount = bc3Tasks.filter(t => {
    const proj = projects.find(p => p.id === t.projectId);
    return proj?.status === 'TAM_DUNG';
  }).length;

  return (
    <div className="space-y-4">
      {/* 1. Tiêu đề trang & Thanh chuyển Báo cáo (MH-14 Thành phần 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="hidden print:block text-[10px] text-slate-600 mb-1">CÔNG TY NMH · HỆ THỐNG QUẢN LÝ DỰ ÁN &amp; PHÂN CÔNG THI CÔNG ĐIỆN NHẸ</div>
          <h1 className="text-xl font-bold text-[#0D1A36] tracking-tight print:hidden">
            Báo cáo và thống kê
          </h1>
          <h1 className="hidden print:block text-lg font-bold text-[#0D1A36] uppercase">
            {REPORT_TITLES[selectedReport]}
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Thời điểm tra cứu: <strong>{queryLabel}</strong> · Bộ lọc: {
              selectedReport === 'BC-01' ? [bc1Project !== 'all' ? projects.find(p => p.id === bc1Project)?.code : 'Tất cả dự án', bc1Status !== 'all' ? PROJECT_STATUS_LABEL[bc1Status] : null, bc1From || bc1To ? `${formatDate(bc1From) || '…'} – ${formatDate(bc1To) || '…'}` : null].filter(Boolean).join(', ')
              : selectedReport === 'BC-02' ? `${formatDate(bc2From)} – ${formatDate(bc2To)}, ${bc2Status === 'HIEU_LUC' ? 'Hiệu lực' : bc2Status === 'HUY' ? 'Đã hủy' : 'Tất cả'}`
              : selectedReport === 'BC-04' ? 'xem bên dưới'
              : bc3Group === 'both' ? 'Cả hai' : bc3Group === 'overdue' ? 'Quá hạn' : 'Sắp đến hạn'
            }
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          {/* Nút In báo cáo (QC-10 & MH-14) */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* 2. Ba Tab chọn Báo cáo (BC-01, BC-02, BC-03) */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto print:hidden">
        <button
          type="button"
          onClick={() => setSelectedReport('BC-01')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            selectedReport === 'BC-01'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          BC-01 Tình hình thực hiện dự án
        </button>
        <button
          type="button"
          onClick={() => setSelectedReport('BC-02')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            selectedReport === 'BC-02'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          BC-02 Phân công nhân sự
        </button>
        <button
          type="button"
          onClick={() => setSelectedReport('BC-03')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            selectedReport === 'BC-03'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          BC-03 Quá hạn, sắp đến hạn
        </button>
        <button
          type="button"
          onClick={() => setSelectedReport('BC-04')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            selectedReport === 'BC-04'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          BC-04 Đội thi công ngoài
        </button>
      </div>

      {selectedReport === 'BC-04' && <ExternalTeamReport onSelectProject={onSelectProject} />}

      {/* ======================================================== */}
      {/* NỘI DUNG BÁO CÁO BC-01: TÌNH HÌNH THỰC HIỆN DỰ ÁN */}
      {/* ======================================================== */}
      {selectedReport === 'BC-01' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Bộ lọc BC-01 */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Dự án:</span>
              <select
                value={bc1Project}
                onChange={(e) => setBc1Project(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-blue-500 font-medium"
              >
                <option value="all">Tất cả dự án ({projects.length})</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Trạng thái:</span>
              <select
                value={bc1Status}
                onChange={(e) => setBc1Status(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-blue-500 font-medium"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="LAP_KE_HOACH">Lập kế hoạch</option>
                <option value="DANG_THUC_HIEN">Đang triển khai</option>
                <option value="TAM_DUNG">Tạm dừng</option>
                <option value="HOAN_THANH">Hoàn thành</option>
                <option value="HUY">Hủy</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Từ ngày:</span>
              <input type="date" value={bc1From} onChange={(e) => setBc1From(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
              <span className="text-slate-500 font-medium">Đến ngày:</span>
              <input type="date" value={bc1To} onChange={(e) => setBc1To(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
            </div>

            <button
              type="button"
              onClick={() => { setBc1Project('all'); setBc1Status('all'); setBc1From(''); setBc1To(''); }}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-auto cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>

          {/* Bảy thẻ tóm tắt BC-01 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500">Số dự án</div>
              <div className="text-xl font-bold font-mono text-slate-900">{filteredBc1Projects.length}</div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500">Lập kế hoạch</div>
              <div className="text-xl font-bold font-mono text-slate-800">{filteredBc1Projects.filter(p => p.status === 'LAP_KE_HOACH').length}</div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] text-blue-600">Đang triển khai</div>
              <div className="text-xl font-bold font-mono text-blue-700">{filteredBc1Projects.filter(p => p.status === 'DANG_THUC_HIEN').length}</div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] text-amber-600">Tạm dừng</div>
              <div className="text-xl font-bold font-mono text-amber-600">{filteredBc1Projects.filter(p => p.status === 'TAM_DUNG').length}</div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] text-emerald-600">Hoàn thành</div>
              <div className="text-xl font-bold font-mono text-emerald-600">{filteredBc1Projects.filter(p => p.status === 'HOAN_THANH').length}</div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400">Hủy</div>
              <div className="text-xl font-bold font-mono text-slate-600">{filteredBc1Projects.filter(p => p.status === 'HUY').length}</div>
            </div>
            <div className="p-2.5 bg-red-50/70 rounded-xl border border-red-200">
              <div className="text-[10px] text-red-600 font-bold">Dự án quá hạn</div>
              <div className="text-xl font-bold font-mono text-red-700">{bc1OverdueProjects.length}</div>
            </div>
          </div>

          {/* Bảng kết quả BC-01 (Hình 3.36) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                  <tr>
                    <th className="p-3">Mã dự án</th>
                    <th className="p-3">Tên dự án</th>
                    <th className="p-3">Phụ trách</th>
                    <th className="p-3">Thời gian kế hoạch</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-center">Chưa BĐ</th>
                    <th className="p-3 text-center">Đang TH</th>
                    <th className="p-3 text-center">Xong</th>
                    <th className="p-3 text-center">Hủy</th>
                    <th className="p-3 text-center">Tỷ lệ HT</th>
                    <th className="p-3">Quá hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBc1Projects.map(p => {
                    const pTasks = tasks.filter(t => t.projectId === p.id);
                    const notStarted = pTasks.filter(t => t.status === 'CHUA_BAT_DAU').length;
                    const doing = pTasks.filter(t => t.status === 'DANG_THUC_HIEN').length;
                    const done = pTasks.filter(t => t.status === 'HOAN_THANH').length;
                    const canceled = pTasks.filter(t => t.status === 'HUY').length;
                    const validTasks = pTasks.filter(t => t.status !== 'HUY');
                    const progress = validTasks.length > 0 ? Math.round((done / validTasks.length) * 100) : null;
                    const isOver = p.status !== 'HOAN_THANH' && p.status !== 'HUY' && toTime(p.dueDate) < toTime(DEMO_QUERY_TIME);
                    const overDays = isOver ? Math.max(1, daysBetween(p.dueDate, DEMO_QUERY_TIME)) : 0;

                    return (
                      <tr 
                        key={p.id}
                        onClick={() => onSelectProject && onSelectProject(p.id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="p-3 font-mono font-bold text-blue-700">{p.code}</td>
                        <td className="p-3 font-semibold text-slate-900 max-w-xs">{p.name}</td>
                        <td className="p-3 text-slate-700">{p.managerName || staff.find(s => s.id === p.managerId)?.name}</td>
                        <td className="p-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {formatDate(p.startDate)} – {formatDate(p.dueDate)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'HOAN_THANH' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'DANG_THUC_HIEN' ? 'bg-blue-100 text-blue-800' :
                            p.status === 'TAM_DUNG' ? 'bg-amber-100 text-amber-800' :
                            p.status === 'HUY' ? 'bg-slate-200 text-slate-600 line-through' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {p.status === 'HOAN_THANH' ? 'Hoàn thành' :
                             p.status === 'DANG_THUC_HIEN' ? 'Đang triển khai' :
                             p.status === 'TAM_DUNG' ? 'Tạm dừng' :
                             p.status === 'HUY' ? 'Hủy' : 'Lập kế hoạch'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600">{notStarted}</td>
                        <td className="p-3 text-center font-mono text-blue-600 font-bold">{doing}</td>
                        <td className="p-3 text-center font-mono text-emerald-600 font-bold">{done}</td>
                        <td className="p-3 text-center font-mono text-slate-400">{canceled}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-900">
                          {progress !== null ? `${progress}%` : <span className="text-[10px] font-normal text-slate-500">Chưa có dữ liệu để tính tỷ lệ</span>}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {isOver ? (
                            <span className="text-red-600 font-bold text-[10px]">Quá {overDays} ngày</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBc1Projects.length === 0 && (
                    <tr><td colSpan={11} className="p-6 text-center text-slate-500">Không có dữ liệu theo bộ lọc đã chọn.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Biểu đồ cột ngang chồng: số công việc theo trạng thái của từng dự án */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-bold text-slate-800">Công việc theo trạng thái của từng dự án</div>
              <div className="flex gap-3 text-[10px] text-slate-600">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Chưa bắt đầu</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Đang thực hiện</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Hoàn thành</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300" /> Hủy</span>
              </div>
            </div>
            {(() => {
              const max = Math.max(1, ...filteredBc1Projects.map(p => tasks.filter(t => t.projectId === p.id).length));
              return filteredBc1Projects.map(p => {
                const pt = tasks.filter(t => t.projectId === p.id);
                const segs: [string, number][] = [['bg-slate-400', pt.filter(t => t.status === 'CHUA_BAT_DAU').length], ['bg-blue-600', pt.filter(t => t.status === 'DANG_THUC_HIEN').length], ['bg-emerald-500', pt.filter(t => t.status === 'HOAN_THANH').length], ['bg-slate-200', pt.filter(t => t.status === 'HUY').length]];
                return (
                  <div key={p.id} className="flex items-center gap-2 text-[11px]">
                    <span className="w-28 font-mono text-slate-600 shrink-0">{p.code}</span>
                    <div className="flex-1 flex h-3.5 rounded overflow-hidden bg-slate-50">
                      {segs.map(([c, n], i) => n > 0 && <div key={i} className={c} style={{ width: `${(n / max) * 100}%` }} title={`${n} công việc`} />)}
                    </div>
                    <span className="w-8 text-right font-mono font-bold">{pt.length}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* NỘI DUNG BÁO CÁO BC-02: PHÂN CÔNG NHÂN SỰ */}
      {/* ======================================================== */}
      {selectedReport === 'BC-02' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Bộ lọc BC-02 */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Khoảng thời gian <span className="text-red-500">(*)</span>:</span>
              <input type="date" value={bc2From} onChange={(e) => setBc2From(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
              <span>–</span>
              <input type="date" value={bc2To} onChange={(e) => setBc2To(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Nhân sự:</span>
              <select value={bc2Staff} onChange={(e) => setBc2Staff(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
                <option value="all">Tất cả nhân sự</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Dự án:</span>
              <select value={bc2Project} onChange={(e) => setBc2Project(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
                <option value="all">Tất cả dự án ({projects.length})</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Trạng thái:</span>
              <select
                value={bc2Status}
                onChange={(e) => setBc2Status(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-blue-500 font-medium"
              >
                <option value="HIEU_LUC">Hiệu lực</option>
                <option value="HUY">Đã hủy</option>
                <option value="all">Tất cả</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => { setBc2Staff('all'); setBc2Project('all'); setBc2Status('HIEU_LUC'); }}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-auto cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>

          {/* Bốn thẻ tóm tắt BC-02 (Hình 3.37 / Phụ lục B.3) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500">Nhân sự tham gia</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{bc2UniqueStaff.length} <span className="text-xs font-normal text-slate-500">người</span></div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500">Bản ghi phân công</div>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-1">{filteredBc2Assignments.length} <span className="text-xs font-normal text-slate-500">lượt</span></div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[11px] text-amber-600">Nhân sự có lịch nghỉ/bận</div>
              <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{bc2LeaveStaff.length} <span className="text-xs font-normal text-slate-500">người</span></div>
            </div>
            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
              <div className="text-[11px] text-purple-700 font-bold">Phân công bị ảnh hưởng</div>
              <div className="text-2xl font-bold font-mono text-purple-800 mt-1">{bc2AffectedAssignments.length} <span className="text-xs font-normal text-purple-600">phân công</span></div>
            </div>
          </div>

          {/* Bảng phân công chi tiết BC-02 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                  <tr>
                    <th className="p-3">Nhân sự</th>
                    <th className="p-3">Công việc</th>
                    <th className="p-3">Dự án</th>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Người phân công</th>
                    <th className="p-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bc2RangeError && <tr><td colSpan={7} className="p-4 text-center text-red-600 font-semibold">{bc2RangeError}</td></tr>}
                  {!bc2RangeError && filteredBc2Assignments.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">Không có dữ liệu theo bộ lọc đã chọn.</td></tr>}
                  {[...filteredBc2Assignments].sort((a, b) => a.startDate.localeCompare(b.startDate)).map(asg => {
                    const task = tasks.find(t => t.id === asg.taskId);
                    const proj = projects.find(p => p.id === task?.projectId);
                    const isAff = bc2AffectedAssignments.some(a => a.id === asg.id);

                    return (
                      <tr key={asg.id} onClick={() => onSelectProject && onSelectProject(asg.projectId, asg.taskId)} className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                        <td className="p-3 font-semibold text-slate-900">{staff.find(s => s.id === asg.staffId)?.name || asg.staffName}</td>
                        <td className="p-3 font-medium text-slate-800 max-w-xs truncate">{task?.code} · {task?.title || 'Công việc'}</td>
                        <td className="p-3 font-mono text-blue-700">{proj?.code || ''}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {formatDateTime(asg.startDate)} – {formatDateTime(asg.endDate)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            asg.status === 'HIEU_LUC' || asg.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600 line-through'
                          }`}>
                            {asg.status === 'HIEU_LUC' || asg.status === 'active' ? 'Hiệu lực' : 'Đã hủy'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{asg.assignedBy || '—'}</td>
                        <td className="p-3">
                          {isAff ? (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                              Bị ảnh hưởng bởi lịch nghỉ/bận
                            </span>
                          ) : (
                            <span className="text-slate-600">{asg.notes || '—'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bảng lịch nghỉ/bận Hiệu lực trong kỳ */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">Lịch nghỉ/bận trong kỳ</div>
            <table className="w-full text-left text-xs">
              <thead className="text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                <tr><th className="p-3">Nhân sự</th><th className="p-3">Thời gian</th><th className="p-3">Lý do</th><th className="p-3 text-center">Số phân công bị ảnh hưởng</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bc2Leaves.length === 0 ? <tr><td colSpan={4} className="p-4 text-center text-slate-500">Không có lịch nghỉ/bận trong kỳ.</td></tr> : bc2Leaves.map(l => (
                  <tr key={l.id}>
                    <td className="p-3 font-semibold">{staff.find(s => s.id === l.staffId)?.name || l.staffName}</td>
                    <td className="p-3 font-mono text-[11px]">{formatDateTime(l.startDate)} – {formatDateTime(l.endDate)}</td>
                    <td className="p-3">{l.reason}</td>
                    <td className="p-3 text-center font-mono font-bold">{assignments.filter(a => a.status === 'HIEU_LUC' && a.staffId === l.staffId && overlaps(a.startDate, a.endDate, l.startDate, l.endDate)).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* NỘI DUNG BÁO CÁO BC-03: CÔNG VIỆC QUÁ HẠN, SẮP ĐẾN HẠN */}
      {/* ======================================================== */}
      {selectedReport === 'BC-03' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Bộ lọc BC-03 */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Nhóm công việc:</span>
              <select
                value={bc3Group}
                onChange={(e) => setBc3Group(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-blue-500 font-medium"
              >
                <option value="both">Cả hai</option>
                <option value="overdue">Quá hạn</option>
                <option value="upcoming">Sắp đến hạn</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Dự án:</span>
              <select
                value={bc3Project}
                onChange={(e) => setBc3Project(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-blue-500 font-medium"
              >
                <option value="all">Tất cả dự án ({projects.length})</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Phụ trách chính:</span>
              <select value={bc3Staff} onChange={(e) => setBc3Staff(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
                <option value="all">Tất cả</option>
                {staff.filter(s => tasks.some(t => t.assigneeId === s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <button
              type="button"
              onClick={() => { setBc3Group('both'); setBc3Project('all'); setBc3Staff('all'); }}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-auto cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>

          {/* Ba thẻ tóm tắt BC-03 (Hình 3.38 / Phụ lục B.3) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-red-50/70 rounded-xl border border-red-200">
              <div className="text-[11px] text-red-600 font-bold">Số công việc quá hạn</div>
              <div className="text-2xl font-bold font-mono text-red-700 mt-1">{bc3OverdueCount} <span className="text-xs font-normal text-red-600">công việc</span></div>
            </div>
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
              <div className="text-[11px] text-amber-700 font-bold">Số công việc sắp đến hạn ({UPCOMING_DAYS} ngày)</div>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{bc3UpcomingCount} <span className="text-xs font-normal text-amber-600">công việc</span></div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-600 font-medium">Thuộc dự án Tạm dừng</div>
              <div className="text-2xl font-bold font-mono text-slate-700 mt-1">{bc3PausedCount} <span className="text-xs font-normal text-slate-500">công việc</span></div>
            </div>
          </div>

          {/* Bảng công việc quá hạn / sắp đến hạn BC-03 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                  <tr>
                    <th className="p-3">Dự án</th>
                    <th className="p-3">Công việc</th>
                    <th className="p-3">Phụ trách chính</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Hạn hoàn thành</th>
                    <th className="p-3">Tình trạng</th>
                    <th className="p-3">Cập nhật gần nhất</th>
                    <th className="p-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bc3Tasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500">
                        Không có dữ liệu theo bộ lọc đã chọn.
                      </td>
                    </tr>
                  ) : (
                    bc3Tasks.map(t => {
                      const proj = projects.find(p => p.id === t.projectId);
                      const isOver = isTaskOverdue(t.dueDate, t.status);
                      const daysDiff = Math.max(isOver ? 1 : 0, Math.abs(daysBetween(t.dueDate, DEMO_QUERY_TIME)));
                      const lastLog = workLogs.filter(w => w.taskId === t.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

                      return (
                        <tr key={t.id} onClick={() => onSelectProject && onSelectProject(t.projectId, t.id)} className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                          <td className="p-3 font-mono font-bold text-blue-700 whitespace-nowrap">{proj?.code}</td>
                          <td className="p-3 font-semibold text-slate-900 max-w-xs">{t.code ? `${t.code} · ` : ''}{t.title}</td>
                          <td className="p-3 text-slate-700">{staff.find(s => s.id === t.assigneeId)?.name || t.assigneeName || '—'}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'DANG_THUC_HIEN' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                              {TASK_STATUS_LABEL[t.status]}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">{formatDateTime(t.dueDate)}</td>
                          <td className="p-3 whitespace-nowrap">
                            {isOver ? (
                              <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold text-[10px]">
                                Quá {daysDiff} ngày
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                                Còn {daysDiff} ngày
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 max-w-xs truncate">
                            {lastLog ? `${formatDateTime(lastLog.submittedAt)} · ${lastLog.submittedByStaffName || ''}` : 'Chưa có cập nhật'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {proj?.status === 'TAM_DUNG' && (
                              <span className="text-[10px] text-amber-600 font-semibold">Dự án tạm dừng</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
