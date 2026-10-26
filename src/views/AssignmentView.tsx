import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DateInput, SearchSelect } from '../components/inputs.tsx';
import { Field, ctlCls } from '../components/reportKit.tsx';
import { Assignment, StaffLeave, Staff } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';
import {
  formatDate, formatDateTime, toDbDateTime, toTime, overlaps, isRecordActive, projectAcceptsAssignments, isTaskOpen, isProjectOpen
} from '../utils/domain.ts';
import { CalendarClock, AlertCircle, CheckCircle2, Plus, ShieldAlert, Search, AlertTriangle, ChevronDown, X, Building2 } from 'lucide-react';
import { useToast, Modal, Drawer, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary, ConfirmDialog, StatusBadge } from '../components/ui.tsx';
import { EditAssignmentModal, CancelAssignmentDialog } from '../components/AssignmentDialogs.tsx';
import { ExternalTeamsTab } from './ExternalTeamsTab.tsx';

export interface AssignmentDraft {
  projectId: string;
  taskId?: string;
}

interface AssignmentViewProps {
  initialTab?: 'assignments' | 'leaves' | 'contractor';
  initialFilter?: 'unassigned' | 'affected';
  draft?: AssignmentDraft;
}

const PROJECT_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-lime-600', 'bg-orange-500', 'bg-teal-500'];

const addDays = (ymd: string, n: number) => {
  const d = new Date(ymd + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const mondayOf = (ymd: string) => {
  const d = new Date(ymd + 'T00:00:00');
  const wd = (d.getDay() + 6) % 7;
  return addDays(ymd, -wd);
};

export const AssignmentView: React.FC<AssignmentViewProps> = ({ initialTab, initialFilter, draft }) => {
  const store = useStore();
  const { visibleProjects, tasks, staff, assignments, leaves, categories, visibleProjectIds, findConflicts, createAssignments, subcontractors, saveExternalAssignment, teams } = store;
  const toast = useToast();
  const activeSubTab: 'assignments' | 'leaves' | 'contractor' = initialTab || 'assignments';
  const q = DEMO_QUERY_TIME;
  const today = q.slice(0, 10);

  // ---------- MH-09: biểu mẫu lập phân công ----------
  const assignableProjects = visibleProjects.filter(projectAcceptsAssignments);
  const [projectId, setProjectId] = useState(draft?.projectId || '');
  const [taskId, setTaskId] = useState(draft?.taskId || '');
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [staffQuery, setStaffQuery] = useState('');
  const [sDate, setSDate] = useState('');
  const [eDate, setEDate] = useState('');
  const sTime = '08:00';
  const eTime = '17:00';
  // Đội thi công ngoài hỗ trợ (nếu có): chỉ cần chọn đội và số người
  const [extOn, setExtOn] = useState(false);
  const [extTeamId, setExtTeamId] = useState('');
  const [extCount, setExtCount] = useState('');
  // Danh sách thả xuống chọn nhân sự
  const [staffOpen, setStaffOpen] = useState(false);
  const staffBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (staffBoxRef.current && !staffBoxRef.current.contains(e.target as Node)) setStaffOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const [splitDaily, setSplitDaily] = useState(false);
  const [skipSunday, setSkipSunday] = useState(false);
  const [notes, setNotes] = useState('');
  const [formErr, setFormErr] = useState<string | null>(null);

  const selectedProject = visibleProjects.find(p => p.id === projectId);
  const selectedTask = tasks.find(t => t.id === taskId);
  const projectTasks = tasks.filter(t => t.projectId === projectId && isTaskOpen(t));
  const projCats = categories.filter(c => c.projectId === projectId).sort((a, b) => a.orderNum - b.orderNum);
  const start = sDate && sTime ? toDbDateTime(`${sDate} ${sTime}`) : '';
  const end = eDate && eTime ? toDbDateTime(`${eDate} ${eTime}`) : '';
  const hasTime = !!start && !!end;

  /** Danh sách khoảng cần tạo: một khoảng liên tục hoặc mỗi ngày một bản ghi */
  const intervals = useMemo(() => {
    if (!hasTime) return [] as { s: string; e: string }[];
    if (!splitDaily) return [{ s: start, e: end }];
    const out: { s: string; e: string }[] = [];
    for (let d = sDate; d <= eDate; d = addDays(d, 1)) {
      if (skipSunday && new Date(d + 'T00:00:00').getDay() === 0) continue;
      out.push({ s: toDbDateTime(`${d} ${sTime}`), e: toDbDateTime(`${d} ${eTime}`) });
      if (out.length > 120) break;
    }
    return out;
  }, [start, end, splitDaily, skipSunday]);

  const conflictsByStaff = useMemo(() => {
    const m: Record<string, string[]> = {};
    staffIds.forEach(id => {
      const msgs: string[] = [];
      intervals.forEach(iv => findConflicts(id, iv.s, iv.e).forEach(c => { if (!msgs.includes(c.message)) msgs.push(c.message); }));
      m[id] = msgs;
    });
    return m;
  }, [staffIds, intervals, assignments, leaves]);

  const baseError = (() => {
    if (!projectId || !taskId || (staffIds.length === 0 && !extOn) || !hasTime) return null;
    if (sDate < today) return 'Ngày bắt đầu không được trước ngày hiện tại. Vui lòng kiểm tra lại.';
    if (eDate < sDate) return 'Ngày kết thúc không được trước ngày bắt đầu.';
    if (selectedTask && (toTime(start) < toTime(selectedTask.startDate) || toTime(end) > toTime(selectedTask.dueDate))) {
      return `Khoảng phân công phải nằm trong thời gian của công việc (${formatDate(selectedTask.startDate)} – ${formatDate(selectedTask.dueDate)}).`;
    }
    return null;
  })();
  const anyConflict = Object.values(conflictsByStaff).some(l => l.length > 0);
  // Cảnh báo cam (không chặn): phân công liền sát trước hoặc sau
  const adjacentWarnings = useMemo(() => {
    if (!hasTime) return [] as string[];
    const w: string[] = [];
    staffIds.forEach(id => {
      assignments.filter(a => a.staffId === id && isRecordActive(a)).forEach(a => {
        if (a.endDate === start || a.startDate === end) {
          w.push(`${staff.find(s => s.id === id)?.name} có phân công ${a.taskCode || ''} liền sát (${formatDateTime(a.startDate)} – ${formatDateTime(a.endDate)}).`);
        }
      });
    });
    return w;
  }, [staffIds, start, end, assignments]);
  const extValid = !extOn || (!!extTeamId && /^\d+$/.test(extCount) && +extCount >= 1 && +extCount <= 200);
  const ready = !!projectId && !!taskId && (staffIds.length > 0 || extOn) && hasTime && !baseError && !anyConflict && extValid;

  const resetForm = () => {
    setProjectId(''); setTaskId(''); setStaffIds([]); setSDate(''); setEDate('');
    setSplitDaily(false); setSkipSunday(false); setNotes(''); setFormErr(null);
    setExtOn(false); setExtTeamId(''); setExtCount('');
  };

  const submitAssignment = () => {
    if (!projectId) return setFormErr('Vui lòng chọn dự án.');
    if (!taskId) return setFormErr('Vui lòng chọn công việc.');
    if (staffIds.length === 0 && !extOn) return setFormErr('Vui lòng chọn ít nhất một nhân sự.');
    if (!hasTime) return setFormErr('Vui lòng nhập ngày bắt đầu và ngày kết thúc.');
    if (baseError) return setFormErr(baseError);
    if (extOn && !extTeamId) return setFormErr('Vui lòng chọn đội thi công ngoài.');
    if (extOn && !extValid) return setFormErr('Số người tham gia hỗ trợ phải từ 1 đến 200.');
    const messages: string[] = [];
    if (staffIds.length > 0) {
      const items = staffIds.flatMap(sid => intervals.map(iv => ({ taskId, staffId: sid, startDate: iv.s, endDate: iv.e, notes: notes.trim() || undefined })));
      const r = createAssignments(items);
      if (!r.ok) return setFormErr(r.message);
      messages.push(r.message);
    }
    if (extOn && selectedTask) {
      const team = subcontractors.find(x => x.id === extTeamId);
      const r = saveExternalAssignment({
        contractorId: extTeamId,
        projectId,
        taskId,
        workDescription: notes.trim() || `Hỗ trợ thi công ${selectedTask.code} · ${selectedTask.title}`,
        startDate: start,
        dueDate: end,
        workerCount: +extCount,
        nmhCoordinatorId: selectedTask.assigneeId || staffIds[0] || '',
        notes: 'Lập cùng phân công thi công'
      });
      if (!r.ok) return setFormErr(r.message);
      messages.push(`Đã giao ${team?.companyName} hỗ trợ ${extCount} người.`);
    }
    toast.show(messages.join(' '));
    resetForm();
  };

  // ---------- Bộ lọc & bảng phân công ----------
  const [fProject, setFProject] = useState('');
  const [fStaff, setFStaff] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [fStatus, setFStatus] = useState<'HIEU_LUC' | 'HUY' | 'all'>('HIEU_LUC');
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list');
  const [weekStart, setWeekStart] = useState(mondayOf(today));
  const [editAsg, setEditAsg] = useState<Assignment | null>(null);
  const [cancelAsg, setCancelAsg] = useState<Assignment | null>(null);

  const affectedIds = new Set(store.getAffectedAssignments().map(a => a.id));
  const scopedAssignments = assignments.filter(a => visibleProjectIds.has(a.projectId));
  const tableRows = scopedAssignments.filter(a => {
    if (fStatus !== 'all' && a.status !== fStatus) return false;
    if (fProject && a.projectId !== fProject) return false;
    if (fStaff && a.staffId !== fStaff) return false;
    if (fFrom && a.endDate.slice(0, 10) < fFrom) return false;
    if (fTo && a.startDate.slice(0, 10) > fTo) return false;
    return true;
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));

  const unassignedTasks = tasks.filter(t => {
    const p = visibleProjects.find(x => x.id === t.projectId);
    if (!p || !isProjectOpen(p) || !isTaskOpen(t)) return false;
    return !assignments.some(a => a.taskId === t.id && isRecordActive(a));
  });

  const projectColor = (pid: string) => PROJECT_COLORS[visibleProjects.findIndex(p => p.id === pid) % PROJECT_COLORS.length] || 'bg-slate-400';
  const activeStaff = staff.filter(s => s.isActive);
  // Nhân sự thi công: không gồm cấp quản lý
  const fieldStaff = activeStaff.filter(s => s.roleTitle !== 'QUAN_LY');

  // ---------- MH-10: Lịch nghỉ/bận ----------
  const upcomingLeaves = leaves.filter(l => isRecordActive(l) && toTime(l.endDate) >= toTime(q));
  const [lStaff, setLStaff] = useState('');
  const [lFrom, setLFrom] = useState('');
  const [lTo, setLTo] = useState('');
  const [lStatus, setLStatus] = useState<'upcoming' | 'past' | 'cancelled' | 'all'>('upcoming');
  const [onlyAffected, setOnlyAffected] = useState(initialFilter === 'affected');
  const [leaveModal, setLeaveModal] = useState<{ leave?: StaffLeave } | null>(null);
  const [afterSave, setAfterSave] = useState<{ leave: StaffLeave; affected: Assignment[] } | null>(null);
  const [resolving, setResolving] = useState<StaffLeave | null>(null);
  const [cancelLeave, setCancelLeave] = useState<StaffLeave | null>(null);

  const affectedOfLeave = (l: StaffLeave) =>
    toTime(l.endDate) > toTime(q) && isRecordActive(l)
      ? assignments.filter(a => a.staffId === l.staffId && isRecordActive(a) && overlaps(a.startDate, a.endDate, l.startDate, l.endDate))
      : [];

  const leaveRows = leaves.filter(l => {
    if (lStatus === 'upcoming' && !(isRecordActive(l) && toTime(l.endDate) >= toTime(q))) return false;
    if (lStatus === 'past' && !(isRecordActive(l) && toTime(l.endDate) < toTime(q))) return false;
    if (lStatus === 'cancelled' && l.status !== 'HUY') return false;
    if (lStaff && l.staffId !== lStaff) return false;
    if (lFrom && l.endDate.slice(0, 10) < lFrom) return false;
    if (lTo && l.startDate.slice(0, 10) > lTo) return false;
    if (onlyAffected && affectedOfLeave(l).length === 0) return false;
    return true;
  }).sort((a, b) => a.startDate.localeCompare(b.startDate));

  const staffLabel = (s?: Staff) => s ? `${s.name} – ${s.roleTitleDisplay}` : '—';

  return (
    <div className="space-y-6">
      {toast.node}

      {/* 1. Tiêu đề trang, 2. Ba tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">
            {activeSubTab === 'assignments' ? 'Lập và tra cứu phân công' : activeSubTab === 'leaves' ? `Lịch nghỉ/bận (${upcomingLeaves.length})` : 'Đội thi công ngoài'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Phân công thi công</p>
        </div>
      </div>

      {activeSubTab === 'assignments' && (
        <div className="space-y-6">
          {initialFilter === 'unassigned' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs">
              <div className="font-bold text-amber-900 mb-2">Công việc chưa có nhân sự ({unassignedTasks.length}) – bấm một mục để điền sẵn Dự án và Công việc</div>
              <div className="flex flex-wrap gap-2">
                {unassignedTasks.map(t => {
                  const p = visibleProjects.find(x => x.id === t.projectId);
                  return (
                    <button key={t.id} type="button"
                      onClick={() => { if (projectAcceptsAssignments(p)) { setProjectId(t.projectId); setTaskId(t.id); setFormErr(null); } else setFormErr('Dự án đang tạm dừng, chưa thể lập phân công mới.'); }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 cursor-pointer text-left">
                      <span className="font-mono font-bold text-amber-800">{p?.code} · {t.code}</span> {t.title}
                    </button>
                  );
                })}
                {unassignedTasks.length === 0 && <span className="text-amber-800">Không có công việc nào chưa có nhân sự.</span>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Biểu mẫu lập phân công */}
            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-[#0D1A36] flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-[#152A55]" /> Lập phân công công việc mới
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">(*) Trường bắt buộc</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <Label required>Dự án áp dụng</Label>
                  <select value={projectId} onChange={e => { setProjectId(e.target.value); setTaskId(''); setStaffIds([]); setFormErr(null); }} className={inputCls}>
                    <option value="">-- Chọn dự án --</option>
                    {assignableProjects.map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
                  </select>
                  <Hint>Dự án Tạm dừng, Hoàn thành và Hủy không nhận phân công mới.</Hint>
                </div>

                <div>
                  <Label required>Công việc cần phân công</Label>
                  <select value={taskId} disabled={!projectId} onChange={e => { setTaskId(e.target.value); setFormErr(null); }} className={inputCls}>
                    <option value="">-- Chọn công việc --</option>
                    {projCats.map(c => {
                      const list = projectTasks.filter(t => t.categoryId === c.id);
                      if (list.length === 0) return null;
                      return (
                        <optgroup key={c.id} label={`${c.code} · ${c.name}`}>
                          {list.map(t => <option key={t.id} value={t.id}>{c.name} – {t.code} · {t.title}</option>)}
                        </optgroup>
                      );
                    })}
                  </select>
                  {selectedTask && (
                    <Hint>Thời gian công việc: {formatDateTime(selectedTask.startDate)} – {formatDateTime(selectedTask.dueDate)} · Phụ trách chính: {staff.find(s => s.id === selectedTask.assigneeId)?.name}</Hint>
                  )}
                </div>

                <div>
                  <Label required={!extOn}>Nhân sự thi công</Label>
                  <div className="relative" ref={staffBoxRef}>
                    <button type="button" onClick={() => setStaffOpen(!staffOpen)}
                      className={`${inputCls} flex items-center gap-1.5 flex-wrap min-h-[38px] text-left cursor-pointer`}>
                      {staffIds.length === 0 ? <span className="text-slate-500 flex-1">-- Bấm để chọn nhân sự --</span> : (
                        <span className="flex flex-wrap gap-1 flex-1">
                          {staffIds.map(id => {
                            const p = staff.find(x => x.id === id);
                            return (
                              <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                                {p?.name}
                                <X className="w-3 h-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setStaffIds(staffIds.filter(x => x !== id)); }} />
                              </span>
                            );
                          })}
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-auto" />
                    </button>
                    {staffOpen && (
                      <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl">
                        <div className="p-2 border-b border-slate-100 relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input autoFocus value={staffQuery} onChange={e => setStaffQuery(e.target.value)} placeholder="Tìm theo họ tên, chức danh, chuyên môn" className={`${inputCls} pl-8`} />
                        </div>
                        <div className="px-2 py-1.5 border-b border-slate-100 flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-semibold text-slate-500 mr-1">Chọn cả tổ:</span>
                          {teams.map(t => {
                            const members = fieldStaff.filter(s => s.teamId === t.id).map(s => s.id);
                            if (members.length === 0) return null;
                            const all = members.every(id => staffIds.includes(id));
                            return (
                              <button key={t.id} type="button" title={t.name}
                                onClick={() => setStaffIds(all ? staffIds.filter(id => !members.includes(id)) : Array.from(new Set([...staffIds, ...members])))}
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold cursor-pointer ${all ? 'bg-[#152A55] text-white border-[#152A55]' : 'bg-white text-slate-700 border-slate-300 hover:border-[#152A55]'}`}>
                                {t.code} ({members.length})
                              </button>
                            );
                          })}
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                          {fieldStaff.filter(s => !staffQuery || `${s.name} ${s.roleTitleDisplay} ${s.specialty}`.toLowerCase().includes(staffQuery.toLowerCase())).map(s => {
                            const busy = hasTime ? intervals.some(iv => findConflicts(s.id, iv.s, iv.e).length > 0) : null;
                            const checked = staffIds.includes(s.id);
                            return (
                              <label key={s.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${checked ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}>
                                <input type="checkbox" checked={checked} onChange={e => setStaffIds(e.target.checked ? [...staffIds, s.id] : staffIds.filter(x => x !== s.id))} />
                                <span className="flex-1 min-w-0">
                                  <span className="font-semibold text-slate-900">{s.name}</span>
                                  <span className="block text-[10px] text-slate-500 truncate">{s.roleTitleDisplay} · {s.specialty || 'Chưa cập nhật chuyên môn'}</span>
                                </span>
                                {busy !== null && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${busy ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{busy ? 'Trùng lịch' : 'Rảnh'}</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                        <div className="p-2 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-[11px] text-slate-500">Đã chọn {staffIds.length} nhân sự</span>
                          <button type="button" onClick={() => setStaffOpen(false)} className="px-3 py-1 rounded-lg bg-[#152A55] text-white font-semibold cursor-pointer">Xong</button>
                        </div>
                      </div>
                    )}
                  </div>
                  {!hasTime && <Hint>Chọn ngày trước để thấy nhân sự Rảnh hay Trùng lịch.</Hint>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Từ ngày</Label>
                    <DateInput value={sDate} onChange={e => { setSDate(e.target.value); if (!eDate || eDate < e.target.value) setEDate(e.target.value); }} className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <Label required>Đến ngày</Label>
                    <DateInput value={eDate} min={sDate || undefined} onChange={e => setEDate(e.target.value)} className={`${inputCls} font-mono`} />
                  </div>
                </div>
                <Hint>Phân công tính theo ngày làm việc (08:00–17:00).</Hint>

                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={splitDaily} onChange={e => setSplitDaily(e.target.checked)} />
                    Tạo một phân công riêng cho từng ngày trong khoảng đã chọn
                  </label>
                  {splitDaily && (
                    <label className="flex items-center gap-2 cursor-pointer pl-5">
                      <input type="checkbox" checked={skipSunday} onChange={e => setSkipSunday(e.target.checked)} /> Bỏ qua Chủ nhật
                    </label>
                  )}
                </div>

                <div>
                  <Label>Ghi chú phân công</Label>
                  <textarea rows={2} maxLength={255} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ví dụ: Giám sát đo kiểm máy Fluke, phối hợp thợ cáp" className={inputCls} />
                </div>

                <div className={`rounded-xl border ${extOn ? 'border-purple-200 bg-purple-50/40' : 'border-slate-200'} p-3 space-y-2.5`}>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input type="checkbox" checked={extOn} onChange={e => setExtOn(e.target.checked)} />
                    <Building2 className="w-4 h-4 text-purple-600" /> Có đội thi công ngoài hỗ trợ (nếu có)
                  </label>
                  {extOn && (
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-2">
                        <Label required>Đội thi công ngoài</Label>
                        <select value={extTeamId} onChange={e => {
                          setExtTeamId(e.target.value);
                          const link = (selectedProject?.externalTeams || []).find(x => x.contractorId === e.target.value);
                          if (link && !extCount) setExtCount(String(link.workerCount));
                        }} className={inputCls}>
                          <option value="">-- Chọn đội thi công --</option>
                          {(selectedProject?.externalTeams || []).length > 0 && (
                            <optgroup label="Đội khoán đã gắn với dự án">
                              {(selectedProject?.externalTeams || []).map(l => subcontractors.find(x => x.id === l.contractorId && x.status === 'HOP_TAC')).filter(Boolean).map(x => (
                                <option key={x!.id} value={x!.id}>{x!.companyName} ({selectedProject!.externalTeams!.find(l => l.contractorId === x!.id)!.workerCount} người)</option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="Đội thi công ngoài khác">
                            {subcontractors.filter(x => x.status === 'HOP_TAC' && !(selectedProject?.externalTeams || []).some(l => l.contractorId === x.id)).map(x => <option key={x.id} value={x.id}>{x.companyName}</option>)}
                          </optgroup>
                        </select>
                      </div>
                      <div>
                        <Label required>Số người hỗ trợ</Label>
                        <input type="number" min={1} max={200} value={extCount} onChange={e => setExtCount(e.target.value)} className={`${inputCls} font-mono`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 10. Vùng kiểm tra xung đột */}
                {projectId && taskId && (staffIds.length > 0 || extOn) && hasTime && (
                  baseError || anyConflict ? (
                    <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                      <div className="text-[11px] leading-relaxed space-y-0.5">
                        {baseError && <div>{baseError}</div>}
                        {Object.values(conflictsByStaff).flat().map((m, i) => <div key={i}>{m}</div>)}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2 text-[11px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Khoảng thời gian hợp lệ{staffIds.length > 0 ? `: ${staffIds.map(id => staff.find(s => s.id === id)?.name).join(', ')} sẵn sàng trong khoảng này.` : '.'}</span>
                    </div>
                  )
                )}
                {adjacentWarnings.length > 0 && !anyConflict && (
                  <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <div>{adjacentWarnings.map((w, i) => <div key={i}>{w}</div>)}</div>
                  </div>
                )}
                <ErrorBox message={formErr} />

                <div className="flex gap-2">
                  <button type="button" disabled={!ready} onClick={submitAssignment}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 ${ready ? 'bg-[#152A55] text-white hover:bg-[#1E3A75] cursor-pointer' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                    <Plus className="w-4 h-4" /> Xác nhận lưu phân công
                  </button>
                  <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-lg border border-slate-300 font-semibold text-xs hover:bg-slate-100 cursor-pointer">Làm mới</button>
                </div>
              </div>
            </div>

            {/* 14. Khung khối lượng phân công của nhân sự */}
            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-sm font-bold text-[#0D1A36]">Khối lượng phân công của nhân sự</h3>
                {fStaff && <button type="button" onClick={() => setFStaff('')} className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer">Bỏ lọc nhân sự</button>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[520px] overflow-y-auto">
                {activeStaff.map(s => {
                  const count = assignments.filter(a => a.staffId === s.id && isRecordActive(a) && toTime(a.endDate) > toTime(q)).length;
                  return (
                    <button key={s.id} type="button" onClick={() => setFStaff(s.id)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-left cursor-pointer hover:border-[#152A55] ${fStaff === s.id ? 'border-[#152A55] bg-blue-50/50' : 'border-slate-200 bg-slate-50/40'}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#152A55] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{s.name.split(' ').slice(-1)[0].slice(0, 2).toUpperCase()}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">{s.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{s.roleTitleDisplay} · {s.specialty || 'Chưa cập nhật chuyên môn'}</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#152A55] text-xs shrink-0">{count} việc</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 12. Bộ lọc lịch phân công & 13. Bảng phân công */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap gap-2.5 items-end text-xs p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Field label="Dự án" className="w-full sm:w-56">
                <SearchSelect value={fProject} onChange={setFProject} allLabel="Mọi dự án" className={`${ctlCls} w-full`}
                  options={visibleProjects.map(p => ({ value: p.id, label: `${p.code} – ${p.name}` }))} />
              </Field>
              <Field label="Nhân sự" className="w-full sm:w-52">
                <SearchSelect value={fStaff} onChange={setFStaff} allLabel="Mọi nhân sự" className={`${ctlCls} w-full`}
                  options={staff.map(s => ({ value: s.id, label: s.name, sub: s.roleTitleDisplay }))} />
              </Field>
              <Field label="Từ ngày" className="w-[calc(50%-5px)] sm:w-auto"><DateInput value={fFrom} onChange={e => { setFFrom(e.target.value); }} className={`${ctlCls} w-full sm:w-[140px]`} /></Field>
              <Field label="Đến ngày" className="w-[calc(50%-5px)] sm:w-auto"><DateInput value={fTo} onChange={e => { setFTo(e.target.value); }} className={`${ctlCls} w-full sm:w-[140px]`} /></Field>
              <Field label="Trạng thái" className="w-full sm:w-auto">
                <select value={fStatus} onChange={e => setFStatus(e.target.value as any)} className={`${ctlCls} w-full`}>
                  <option value="HIEU_LUC">Hiệu lực</option>
                  <option value="HUY">Đã hủy</option>
                  <option value="all">Tất cả</option>
                </select>
              </Field>
              <div className="ml-auto flex bg-white p-0.5 rounded-lg border border-slate-200">
                <button type="button" onClick={() => setViewMode('list')} className={`px-2.5 py-1 rounded-md cursor-pointer ${viewMode === 'list' ? 'bg-white font-semibold shadow-xs' : ''}`}>Danh sách</button>
                <button type="button" onClick={() => setViewMode('week')} className={`px-2.5 py-1 rounded-md cursor-pointer ${viewMode === 'week' ? 'bg-white font-semibold shadow-xs' : ''}`}>Lịch tuần</button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200">
                    <tr><th className="py-2 pr-3">Nhân sự</th><th className="py-2 pr-3">Công việc và Dự án</th><th className="py-2 pr-3">Thời gian</th><th className="py-2 pr-3">Trạng thái</th><th className="py-2 text-right">Thao tác</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableRows.length === 0 ? (
                      <tr><td colSpan={5} className="py-4 text-center text-slate-400">Không có phân công theo bộ lọc đã chọn.</td></tr>
                    ) : tableRows.slice(0, 200).map(a => {
                      const t = tasks.find(x => x.id === a.taskId);
                      const p = visibleProjects.find(x => x.id === a.projectId);
                      const canChange = isRecordActive(a) && p && isProjectOpen(p);
                      return (
                        <tr key={a.id}>
                          <td className="py-2 pr-3 font-semibold">{staff.find(s => s.id === a.staffId)?.name || a.staffName}</td>
                          <td className="py-2 pr-3">
                            <div>{t?.code} · {t?.title}</div>
                            <div className="text-[10px] text-slate-500">{p?.code}</div>
                            {affectedIds.has(a.id) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">Bị ảnh hưởng bởi lịch nghỉ/bận</span>}
                          </td>
                          <td className="py-2 pr-3 font-mono">{formatDateTime(a.startDate)} – {formatDateTime(a.endDate)}</td>
                          <td className="py-2 pr-3"><StatusBadge status={a.status} kind="record" /></td>
                          <td className="py-2 text-right whitespace-nowrap">
                            {canChange && (
                              <>
                                <button type="button" onClick={() => setEditAsg(a)} className="px-2 py-1 text-blue-700 hover:bg-blue-50 rounded font-semibold cursor-pointer">Sửa</button>
                                <button type="button" onClick={() => setCancelAsg(a)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded font-semibold cursor-pointer">Hủy phân công</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <button type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} className="px-2 py-1 border border-slate-300 rounded cursor-pointer">‹ Tuần trước</button>
                  <span className="font-semibold">{formatDate(weekStart)} – {formatDate(addDays(weekStart, 6))}</span>
                  <button type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} className="px-2 py-1 border border-slate-300 rounded cursor-pointer">Tuần sau ›</button>
                </div>
                <table className="w-full text-[10px] border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-1.5 text-left border-r border-slate-200 w-40">Nhân sự</th>
                      {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(d => (
                        <th key={d} className={`p-1.5 border-r border-slate-200 ${d === today ? 'bg-amber-50' : ''}`}>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][(new Date(d + 'T00:00:00').getDay() + 6) % 7]} {formatDate(d).slice(0, 5)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(fStaff ? staff.filter(s => s.id === fStaff) : activeStaff).map(s => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="p-1.5 border-r border-slate-200 font-semibold">{s.name}</td>
                        {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(d => {
                          const dayAsg = scopedAssignments.filter(a => a.staffId === s.id && (fStatus === 'all' || a.status === fStatus) && (!fProject || a.projectId === fProject) && overlaps(a.startDate, a.endDate, `${d} 00:00:00`, `${d} 23:59:59`));
                          const dayLeaves = leaves.filter(l => l.staffId === s.id && isRecordActive(l) && overlaps(l.startDate, l.endDate, `${d} 00:00:00`, `${d} 23:59:59`));
                          return (
                            <td key={d} className="p-1 border-r border-slate-100 align-top space-y-0.5 min-w-[80px]">
                              {dayAsg.map(a => (
                                <div key={a.id} title={`${a.taskCode} · ${a.projectCode}`} className={`px-1 py-0.5 rounded text-white truncate ${projectColor(a.projectId)} ${a.status === 'HUY' ? 'opacity-40' : ''}`}>
                                  {visibleProjects.find(p => p.id === a.projectId)?.code.slice(-3)} {a.taskCode}
                                </div>
                              ))}
                              {dayLeaves.map(l => (
                                <div key={l.id} title={l.reason} className="px-1 py-0.5 rounded text-slate-700 truncate" style={{ background: 'repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0 4px,#cbd5e1 4px,#cbd5e1 8px)' }}>Nghỉ/bận</div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MH-10 ===================== */}
      {activeSubTab === 'leaves' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-end justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2.5 items-end text-xs">
              <Field label="Nhân sự" className="w-full sm:w-52">
                <SearchSelect value={lStaff} onChange={setLStaff} allLabel="Mọi nhân sự" className={`${ctlCls} w-full`}
                  options={staff.map(s => ({ value: s.id, label: s.name, sub: s.roleTitleDisplay }))} />
              </Field>
              <Field label="Từ ngày" className="w-[calc(50%-5px)] sm:w-auto"><DateInput value={lFrom} onChange={e => { setLFrom(e.target.value); }} className={`${ctlCls} w-full sm:w-[140px]`} /></Field>
              <Field label="Đến ngày" className="w-[calc(50%-5px)] sm:w-auto"><DateInput value={lTo} onChange={e => { setLTo(e.target.value); }} className={`${ctlCls} w-full sm:w-[140px]`} /></Field>
              <Field label="Tình trạng" className="w-full sm:w-auto">
                <select value={lStatus} onChange={e => setLStatus(e.target.value as any)} className={`${ctlCls} w-full`}>
                  <option value="upcoming">Sắp tới và đang diễn ra</option>
                  <option value="past">Đã qua</option>
                  <option value="cancelled">Đã hủy</option>
                  <option value="all">Tất cả</option>
                </select>
              </Field>
              {onlyAffected && <button type="button" onClick={() => setOnlyAffected(false)} className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 font-semibold cursor-pointer">Đang lọc: có phân công bị ảnh hưởng ✕</button>}
            </div>
            <button onClick={() => setLeaveModal({})} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] cursor-pointer w-full sm:w-auto">
              <Plus className="w-3.5 h-3.5" /> Ghi nhận lịch nghỉ mới
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {leaveRows.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Không có lịch nghỉ/bận theo bộ lọc đã chọn.</div>
            ) : leaveRows.map(l => {
              const s = staff.find(x => x.id === l.staffId);
              const affected = affectedOfLeave(l);
              return (
                <div key={l.id} className="py-3 flex items-center justify-between text-xs gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{s?.name}</span>
                      <span className="text-slate-500">{s?.roleTitleDisplay}</span>
                      <StatusBadge status={l.status} kind="record" />
                    </div>
                    <div className="text-slate-600 mt-0.5 font-medium">{l.reason}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Ghi nhận bởi {l.recordedBy} lúc {formatDateTime(l.recordedAt)}</div>
                    {l.status === 'HUY' && l.cancelReason && <div className="text-[10px] text-slate-500">Lý do hủy: {l.cancelReason}</div>}
                    {affected.length > 0 && (
                      <button type="button" onClick={() => setResolving(l)}
                        className="text-[10px] text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded font-bold border border-red-200 cursor-pointer flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 text-red-500" /> Có {affected.length} phân công bị ảnh hưởng – Xử lý
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-x-3 gap-y-1 flex-wrap min-w-0">
                    <span className="font-mono text-slate-700 text-[11px] sm:text-xs">{formatDateTime(l.startDate)} – {formatDateTime(l.endDate)}</span>
                    {isRecordActive(l) && (
                      <>
                        <button onClick={() => setLeaveModal({ leave: l })} className="px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 rounded font-semibold cursor-pointer">Sửa</button>
                        <button onClick={() => setCancelLeave(l)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded font-semibold cursor-pointer">Hủy lịch</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'contractor' && <ExternalTeamsTab />}

      {/* Hộp thoại dùng chung */}
      {editAsg && <EditAssignmentModal assignment={editAsg} onClose={() => setEditAsg(null)} onSaved={(m) => { setEditAsg(null); toast.show(m); }} />}
      {cancelAsg && <CancelAssignmentDialog assignment={cancelAsg} onClose={() => setCancelAsg(null)} onDone={(m) => { setCancelAsg(null); toast.show(m); }} />}
      {leaveModal && (
        <LeaveFormModal leave={leaveModal.leave} onClose={() => setLeaveModal(null)}
          onSaved={(res) => {
            setLeaveModal(null);
            const name = staff.find(s => s.id === res.leave.staffId)?.name;
            if (res.affected.length === 0) toast.show(`Đã ghi nhận lịch nghỉ/bận của ${name}. Không có phân công bị ảnh hưởng.`);
            else setAfterSave(res);
          }} />
      )}
      {afterSave && (
        <Modal title="Cảnh báo phân công bị ảnh hưởng" onClose={() => setAfterSave(null)} size="lg"
          footer={<>
            <button type="button" className={btnSecondary} onClick={() => { store.deferAffectedAssignments(afterSave.affected.map(a => a.id)); setAfterSave(null); toast.show('Các phân công bị ảnh hưởng được đánh dấu để xử lý sau.'); }}>Để sau</button>
            <button type="button" className={btnPrimary} onClick={() => { setResolving(afterSave.leave); setAfterSave(null); }}>Xử lý phân công ngay</button>
          </>}>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-900 font-semibold">
            Nhân sự {staff.find(s => s.id === afterSave.leave.staffId)?.name} đang có {afterSave.affected.length} phân công trong khoảng nghỉ/bận
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200"><tr><th className="py-1.5">Dự án</th><th>Công việc</th><th>Thời gian</th><th>Phụ trách chính</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {afterSave.affected.map(a => {
                const t = tasks.find(x => x.id === a.taskId);
                return <tr key={a.id}><td className="py-1.5 font-mono">{a.projectCode}</td><td>{t?.code} · {t?.title}</td><td className="font-mono">{formatDateTime(a.startDate)} – {formatDateTime(a.endDate)}</td><td>{staff.find(s => s.id === t?.assigneeId)?.name}</td></tr>;
              })}
            </tbody>
          </table>
        </Modal>
      )}
      {resolving && <ResolveAffectedDrawer leave={resolving} onClose={() => setResolving(null)} onMessage={toast.show} />}
      {cancelLeave && (
        <ConfirmDialog title="Hủy lịch nghỉ/bận" danger requireReason reasonLabel="Lý do hủy"
          message={<>Hủy lịch nghỉ/bận của <strong>{staff.find(s => s.id === cancelLeave.staffId)?.name}</strong> ({formatDateTime(cancelLeave.startDate)} – {formatDateTime(cancelLeave.endDate)})? Các phân công đã hủy trước đó không được tự khôi phục.</>}
          confirmLabel="Xác nhận hủy lịch"
          onClose={() => setCancelLeave(null)}
          onConfirm={(reason) => { const r = store.cancelLeave(cancelLeave.id, reason); if (!r.ok) return r.message; setCancelLeave(null); toast.show(r.message); }} />
      )}
    </div>
  );
};

/** Hộp thoại Ghi nhận / Sửa lịch nghỉ/bận nhân sự (MH-10, Hình 3.25) */
const LeaveFormModal: React.FC<{ leave?: StaffLeave; onClose: () => void; onSaved: (r: { leave: StaffLeave; affected: Assignment[] }) => void }> = ({ leave, onClose, onSaved }) => {
  const { staff, saveLeave } = useStore();
  const [staffId, setStaffId] = useState(leave?.staffId || '');
  const [from, setFrom] = useState(leave?.startDate.slice(0, 10) || '');
  const [to, setTo] = useState(leave?.endDate.slice(0, 10) || '');
  const [allDay, setAllDay] = useState(!leave || (leave.startDate.slice(11, 16) === '08:00' && leave.endDate.slice(11, 16) === '17:00'));
  const [sTime, setSTime] = useState(leave?.startDate.slice(11, 16) || '08:00');
  const [eTime, setETime] = useState(leave?.endDate.slice(11, 16) || '17:00');
  const [reason, setReason] = useState(leave?.reason || '');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal title={leave ? 'Sửa lịch nghỉ/bận nhân sự' : 'Ghi nhận lịch nghỉ/bận nhân sự'} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => {
          if (!staffId) return setErr('Vui lòng chọn nhân sự.');
          if (!from || !to) return setErr('Vui lòng nhập thời gian nghỉ/bận.');
          if (to < from) return setErr('Ngày kết thúc không được trước ngày bắt đầu.');
          const r = saveLeave({
            staffId,
            startDate: toDbDateTime(`${from} ${allDay ? '08:00' : sTime}`),
            endDate: toDbDateTime(`${to} ${allDay ? '17:00' : eTime}`),
            reason
          }, leave?.id);
          if (!r.ok) return setErr(r.message);
          onSaved(r.data!);
        }}>Lưu lịch bận</button>
      </>}>
      <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
      <div>
        <Label required>Nhân sự</Label>
        <select value={staffId} disabled={!!leave} onChange={e => setStaffId(e.target.value)} className={inputCls}>
          <option value="">-- Chọn nhân sự --</option>
          {staff.filter(s => s.isActive || s.id === staffId).map(s => <option key={s.id} value={s.id}>{s.code} – {s.name} – {s.roleTitleDisplay}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Từ ngày</Label><DateInput value={from} onChange={e => setFrom(e.target.value)} className={`${inputCls} font-mono`} /></div>
        <div><Label required>Đến ngày</Label><DateInput value={to} onChange={e => setTo(e.target.value)} className={`${inputCls} font-mono`} /></div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} /> Cả ngày (08:00–17:00)</label>
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Giờ bắt đầu</Label><input type="time" value={sTime} onChange={e => setSTime(e.target.value)} className={`${inputCls} font-mono`} /></div>
          <div><Label>Giờ kết thúc</Label><input type="time" value={eTime} onChange={e => setETime(e.target.value)} className={`${inputCls} font-mono`} /></div>
        </div>
      )}
      <div>
        <Label required>Lý do nghỉ hoặc bận</Label>
        <input maxLength={255} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ví dụ: Nghỉ ốm có giấy xác nhận" className={inputCls} />
      </div>
      <Hint>Từ ngày không sớm hơn 7 ngày trước ngày hiện tại (ghi nhận bù).</Hint>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Ngăn Xử lý phân công bị ảnh hưởng và Bảng chọn nhân sự thay thế (MH-10, Hình 3.26) */
const ResolveAffectedDrawer: React.FC<{ leave: StaffLeave; onClose: () => void; onMessage: (m: string, t?: 'success' | 'error') => void }> = ({ leave, onClose, onMessage }) => {
  const store = useStore();
  const { staff, tasks, assignments, findConflicts, replaceAssignmentStaff } = store;
  const [handled, setHandled] = useState<string[]>([]);
  const [editAsg, setEditAsg] = useState<Assignment | null>(null);
  const [cancelAsg, setCancelAsg] = useState<Assignment | null>(null);
  const [replaceFor, setReplaceFor] = useState<Assignment | null>(null);
  const [initialIds] = useState(() => assignments.filter(a => a.staffId === leave.staffId && isRecordActive(a) && overlaps(a.startDate, a.endDate, leave.startDate, leave.endDate)).map(a => a.id));
  const person = staff.find(s => s.id === leave.staffId);
  const list = initialIds.map(id => assignments.find(a => a.id === id)!).filter(Boolean);
  const isStillAffected = (a: Assignment) => isRecordActive(a) && a.staffId === leave.staffId && overlaps(a.startDate, a.endDate, leave.startDate, leave.endDate);
  const remaining = list.filter(a => isStillAffected(a) && !handled.includes(a.id)).length;

  return (
    <Drawer title="Xử lý phân công bị ảnh hưởng" subtitle={<>Nhân sự <strong>{person?.name}</strong> · {formatDateTime(leave.startDate)} – {formatDateTime(leave.endDate)} · {leave.reason}</>} onClose={onClose}>
      <div className={`p-3 rounded-xl border text-[11px] font-semibold ${remaining > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
        {remaining > 0 ? `Còn ${remaining} phân công chưa xử lý.` : 'Đã xử lý xong các phân công bị ảnh hưởng.'}
      </div>
      <div className="space-y-3">
        {list.map(a => {
          const t = tasks.find(x => x.id === a.taskId);
          const done = !isStillAffected(a) || handled.includes(a.id);
          return (
            <div key={a.id} className={`p-4 rounded-xl border space-y-2 ${done ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">{a.projectCode}</span>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">{t?.code}</span>
                <span className="font-bold text-slate-900">{t?.title}</span>
                {done && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Đã xử lý</span>}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">{formatDateTime(a.startDate)} – {formatDateTime(a.endDate)}</div>
              {!done && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 flex-wrap">
                  <button type="button" onClick={() => setCancelAsg(a)} className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg font-semibold cursor-pointer">Hủy phân công</button>
                  <button type="button" onClick={() => setEditAsg(a)} className="px-2.5 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold cursor-pointer">Đổi thời gian</button>
                  <button type="button" onClick={() => setReplaceFor(a)} className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-semibold cursor-pointer">Thay nhân sự</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button type="button" onClick={onClose} className="w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer">Đóng ngăn xử lý</button>

      {cancelAsg && <CancelAssignmentDialog assignment={cancelAsg} onClose={() => setCancelAsg(null)} onDone={(m) => { setHandled(h => [...h, cancelAsg.id]); setCancelAsg(null); onMessage(m); }} />}
      {editAsg && <EditAssignmentModal assignment={editAsg} title="Đổi thời gian phân công" onClose={() => setEditAsg(null)} onSaved={(m) => { setEditAsg(null); onMessage(m); }} />}
      {replaceFor && (
        <SubstituteModal assignment={replaceFor} onClose={() => setReplaceFor(null)}
          onPick={(sid) => {
            const r = replaceAssignmentStaff(replaceFor.id, sid);
            if (!r.ok) return r.message;
            setHandled(h => [...h, replaceFor.id]);
            setReplaceFor(null);
            onMessage(r.message);
          }} />
      )}
    </Drawer>
  );
};

/** Bảng chọn nhân sự thay thế (MH-10, Hình 3.26 bảng 3) */
function SubstituteModal({ assignment, onClose: close, onPick }: { assignment: Assignment; onClose: () => void; onPick: (staffId: string) => string | void }) {
  const { staff, tasks, assignments, findConflicts } = useStore();
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState('');
  const [picked, setPicked] = useState<Staff | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const t = tasks.find(x => x.id === assignment.taskId);
  const candidates = staff.filter(s => s.isActive && s.id !== assignment.staffId && findConflicts(s.id, assignment.startDate, assignment.endDate, assignment.id).length === 0)
    .filter(s => (!q || s.name.toLowerCase().includes(q.toLowerCase())) && (!spec || s.specialty === spec));
  const specs = Array.from(new Set(staff.map(s => s.specialty).filter(Boolean)));
  return (
    <Modal title="Chọn nhân sự thay thế" subtitle={`${t?.code} · ${formatDateTime(assignment.startDate)} – ${formatDateTime(assignment.endDate)}`} onClose={close}
      footer={picked ? <>
        <button type="button" className={btnSecondary} onClick={() => setPicked(null)}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => { const r = onPick(picked.id); if (typeof r === 'string') setErr(r); }}>Xác nhận</button>
      </> : undefined}>
      {picked ? (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
          Thay <strong>{assignment.staffName}</strong> bằng <strong>{picked.name}</strong> cho {t?.code} · {t?.title} từ {formatDateTime(assignment.startDate)} đến {formatDateTime(assignment.endDate)}?
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm theo tên" className={inputCls} />
            <select value={spec} onChange={e => setSpec(e.target.value)} className={inputCls}>
              <option value="">Mọi chuyên môn</option>
              {specs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {candidates.length === 0 ? <div className="text-slate-500 text-center p-4">Không có nhân sự nào rảnh trong khoảng này. Hãy đổi thời gian hoặc hủy phân công.</div> :
              candidates.map(c => (
                <div key={c.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-blue-500">
                  <div>
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-[11px] text-slate-500">{c.roleTitleDisplay} · {c.specialty || 'Chưa cập nhật chuyên môn'}</div>
                    <div className="text-[10px] text-slate-400">{assignments.filter(a => a.staffId === c.id && isRecordActive(a) && toTime(a.endDate) > toTime(DEMO_QUERY_TIME)).length} việc</div>
                  </div>
                  <button type="button" onClick={() => setPicked(c)} className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold cursor-pointer">Chọn</button>
                </div>
              ))}
          </div>
        </>
      )}
      <ErrorBox message={err} />
    </Modal>
  );
}
