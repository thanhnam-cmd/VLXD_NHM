import React, { useState, useMemo } from 'react';
import { Project, Task, Staff, Assignment, StaffLeave, TaskStage } from '../types/index.ts';
import { checkScheduleConflict } from '../utils/conflictChecker.ts';
import { 
  CalendarClock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Trash2, 
  Calendar, 
  Building2, 
  Plus, 
  Coffee, 
  Clock,
  ShieldAlert
} from 'lucide-react';

interface AssignmentViewProps {
  projects: Project[];
  tasks: Task[];
  staff: Staff[];
  assignments: Assignment[];
  leaves: StaffLeave[];
  draftSelection?: { projectId: string; stage?: TaskStage; taskId?: string };
  onAddAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  onCancelAssignment: (assignmentId: string) => void;
  onAddLeave: (leave: Omit<StaffLeave, 'id' | 'recordedAt'>) => void;
  onCancelLeave: (leaveId: string) => void;
}

export const AssignmentView: React.FC<AssignmentViewProps> = ({
  projects,
  tasks,
  staff,
  assignments,
  leaves,
  draftSelection,
  onAddAssignment,
  onCancelAssignment,
  onAddLeave,
  onCancelLeave
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'assignments' | 'leaves' | 'contractor'>('assignments');

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    draftSelection?.projectId || projects[0]?.id || ''
  );
  const availableTasks = tasks.filter(t => t.projectId === selectedProjectId && t.status !== 'cancelled' && t.status !== 'done');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    draftSelection?.taskId || (availableTasks[0]?.id || '')
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || '');
  const [startDate, setStartDate] = useState<string>('2026-10-16');
  const [endDate, setEndDate] = useState<string>('2026-10-28');
  const [notes, setNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Leave form state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveStaffId, setLeaveStaffId] = useState<string>(staff[0]?.id || '');
  const [leaveStart, setLeaveStart] = useState<string>('2026-11-01');
  const [leaveEnd, setLeaveEnd] = useState<string>('2026-11-05');
  const [leaveReason, setLeaveReason] = useState<string>('');

  // Live real-time conflict checking
  const liveConflict = useMemo(() => {
    if (!selectedStaffId || !startDate || !endDate) return { hasConflict: false };
    return checkScheduleConflict(
      selectedStaffId,
      startDate,
      endDate,
      assignments,
      leaves
    );
  }, [selectedStaffId, startDate, endDate, assignments, leaves]);

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (liveConflict.hasConflict) {
      setToastMessage({
        text: liveConflict.message || 'Không thể lưu phân công do có xung đột lịch!',
        type: 'error'
      });
      return;
    }

    const res = onAddAssignment({
      taskId: selectedTaskId,
      projectId: selectedProjectId,
      staffId: selectedStaffId,
      startDate,
      endDate,
      status: 'active',
      shiftNotes: notes.trim(),
      assignedBy: 'Nguyễn Văn Hùng'
    });

    if (res.success) {
      setToastMessage({ text: 'Phân công nhân sự thành công!', type: 'success' });
      setNotes('');
    } else {
      setToastMessage({ text: res.message || 'Lỗi phân công', type: 'error' });
    }

    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;

    onAddLeave({
      staffId: leaveStaffId,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason.trim(),
      status: 'active',
      recordedBy: 'Nguyễn Văn Hùng'
    });

    setIsLeaveModalOpen(false);
    setLeaveReason('');
    setToastMessage({ text: 'Đã ghi nhận lịch nghỉ/bận của nhân sự!', type: 'success' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedStaffObj = staff.find(s => s.id === selectedStaffId);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">
            Phân Công Nhân Sự &amp; Quản Lý Lịch Bận
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cơ chế kiểm soát xung đột lịch xuyên dự án theo quy tắc khoảng [bắt đầu, kết thúc) (UC-06)
          </p>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('assignments')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'assignments' ? 'bg-white text-[#152A55] font-semibold shadow-xs' : 'text-slate-600'
            }`}
          >
            Lập &amp; Tra cứu phân công
          </button>
          <button
            onClick={() => setActiveSubTab('leaves')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'leaves' ? 'bg-white text-[#152A55] font-semibold shadow-xs' : 'text-slate-600'
            }`}
          >
            Lịch nghỉ/bận ({leaves.filter(l => l.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveSubTab('contractor')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'contractor' ? 'bg-white text-[#152A55] font-semibold shadow-xs' : 'text-slate-600'
            }`}
          >
            Đội khoán ngoài (HTC)
          </button>
        </div>
      </div>

      {activeSubTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Assignment Creation Form (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0D1A36] flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#152A55]" />
                Lập Phân Công Công Việc Mới
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kiểm tra tự động trùng lịch với mọi dự án khác &amp; lịch nghỉ phép
              </p>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3.5 text-xs">
              {/* Project Select */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dự án áp dụng</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    const newTasks = tasks.filter(t => t.projectId === e.target.value && t.status !== 'cancelled');
                    if (newTasks[0]) setSelectedTaskId(newTasks[0].id);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              {/* Task Select */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Công việc cần phân công</label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {availableTasks.length === 0 ? (
                    <option value="">Không có công việc mở</option>
                  ) : (
                    availableTasks.map(t => (
                      <option key={t.id} value={t.id}>[{t.stage}] {t.title}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Staff Select */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Kỹ sư / Nhân sự thi công</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
                >
                  {staff.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.roleTitle} ({s.specialty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Bắt đầu từ</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Đến hết ngày</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nội dung ca trực / Lưu ý thi công</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giám sát đo kiểm máy Fluke, phối hợp thợ cáp..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              {/* Live Conflict Banner */}
              {liveConflict.hasConflict ? (
                <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <div className="font-bold">CẢNH BÁO XUNG ĐỘT THỜI GIAN:</div>
                    <div>{liveConflict.message}</div>
                    <div className="text-red-500 font-mono text-[10px] mt-0.5">
                      Hệ thống từ chối lưu phân công này để tránh quá tải hoặc trùng lấn nhân sự.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Khoảng thời gian hợp lệ: Kỹ sư {selectedStaffObj?.name} sẵn sàng!</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={liveConflict.hasConflict || !selectedTaskId}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                  liveConflict.hasConflict || !selectedTaskId
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#152A55] text-white hover:bg-[#1E3A75]'
                }`}
              >
                <Plus className="w-4 h-4" />
                Xác nhận lưu phân công
              </button>
            </form>
          </div>

          {/* Right: Active Assignments by Staff (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0D1A36]">
                    Khối Lượng Phân Công Hiện Tại Của Kỹ Sư
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Theo dõi trực quan các công việc đang mở xuyên suốt mọi dự án
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {assignments.filter(a => a.status === 'active').length} phân công
                </span>
              </div>

              {/* Staff Cards */}
              <div className="space-y-3">
                {staff.map((s) => {
                  const staffAssignments = assignments.filter(a => a.staffId === s.id && a.status === 'active');
                  const staffActiveLeaves = leaves.filter(l => l.staffId === s.id && l.status === 'active');

                  return (
                    <div key={s.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#152A55] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900">{s.name}</div>
                            <div className="text-[11px] text-slate-500">{s.roleTitle} · {s.specialty}</div>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          {staffActiveLeaves.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium mr-2">
                              Có lịch nghỉ
                            </span>
                          )}
                          <span className="font-mono font-bold text-[#152A55]">
                            {staffAssignments.length} việc mở
                          </span>
                        </div>
                      </div>

                      {/* Active Jobs for this engineer */}
                      <div className="space-y-1.5 pt-1">
                        {staffAssignments.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic">
                            Chưa có phân công nào trong thời gian này.
                          </div>
                        ) : (
                          staffAssignments.map(asg => {
                            const prj = projects.find(p => p.id === asg.projectId);
                            const tsk = tasks.find(t => t.id === asg.taskId);
                            return (
                              <div 
                                key={asg.id}
                                className="bg-white p-2.5 rounded-md border border-slate-200 flex items-center justify-between text-xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-semibold text-slate-800 truncate">
                                    {prj?.name} · {tsk?.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                    <span>Hạng mục: {tsk?.stage}</span>
                                    {asg.shiftNotes && <span>· Ghi chú: {asg.shiftNotes}</span>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-mono text-[11px] text-slate-600">
                                    {asg.startDate} → {asg.endDate}
                                  </span>
                                  <button
                                    onClick={() => onCancelAssignment(asg.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                    title="Hủy phân công này"
                                    aria-label="Hủy phân công"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Staff Leaves (Lịch nghỉ/bận) */}
      {activeSubTab === 'leaves' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#0D1A36]">
                Quản Lý Lịch Nghỉ &amp; Bận Của Nhân Sự (UC-05)
              </h3>
              <p className="text-[11px] text-slate-500">
                Khoảng thời gian nghỉ/bận còn hiệu lực sẽ tự động ngăn chặn phân công thi công chồng lấn
              </p>
            </div>
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75]"
            >
              <Plus className="w-3.5 h-3.5" /> Ghi nhận lịch nghỉ mới
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {leaves.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Chưa có lịch nghỉ/bận nào được ghi nhận.</div>
            ) : (
              leaves.map(l => {
                const s = staff.find(x => x.id === l.staffId);
                const isCancelled = l.status === 'cancelled';
                return (
                  <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{s?.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          isCancelled ? 'bg-slate-100 text-slate-400 line-through' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isCancelled ? 'Đã hủy' : 'Hiệu lực'}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-0.5 font-medium">{l.reason}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Ghi nhận bởi {l.recordedBy} ngày {l.recordedAt}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-slate-700">
                        {l.startDate} <span className="text-slate-400">đến</span> {l.endDate}
                      </span>
                      {!isCancelled && (
                        <button
                          onClick={() => onCancelLeave(l.id)}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                        >
                          Hủy lịch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Subtab 3: External Subcontractor (HTC) */}
      {activeSubTab === 'contractor' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Hợp đồng khoán nhân công ngoài
                </span>
                <h3 className="text-base font-bold text-[#0D1A36] mt-1.5">
                  Công ty TNHH Tư vấn và Thương mại HTC (Hải Phòng)
                </h3>
                <p className="text-xs text-slate-500">
                  Địa chỉ: Số 1C190 Bãi Sậy - Hồng Bàng - Hải Phòng · MST: 0201889988
                </p>
              </div>

              <div className="text-right bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="text-[10px] text-purple-700 font-semibold uppercase">Tổng giá trị báo giá</div>
                <div className="text-base font-bold font-mono text-purple-950">1.406.998.000 VNĐ</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Đầu mối thi công</span>
                <span className="font-bold text-slate-800 text-sm">Nguyễn Huy Hảo (Giám đốc)</span>
                <div className="font-mono text-slate-500 mt-0.5">ĐT: 0975 722 896</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Kỹ sư NMH điều phối</span>
                <span className="font-bold text-slate-800 text-sm">Nguyễn Văn Hùng</span>
                <div className="text-slate-500 mt-0.5">Chỉ huy trưởng công trình A1</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Quy mô nhân sự giao khoán</span>
                <span className="font-bold text-slate-800 text-sm">Tối thiểu 4 công nhân</span>
                <div className="text-slate-500 mt-0.5">Lắp máng cáp &amp; kéo cáp Cat6</div>
              </div>
            </div>

            <p className="text-xs text-slate-500 bg-amber-50/60 p-3 rounded-lg border border-amber-200 mt-4 leading-relaxed">
              <strong>Lưu ý nghiệp vụ đề tài:</strong> Các thành viên đội thợ bên ngoài không tạo tài khoản nội bộ NMH. Tiến độ và kết quả thi công của đội thợ được Chỉ huy trưởng Nguyễn Văn Hùng xác nhận và báo cáo lên hệ thống theo phân hệ Nhật ký hiện trường.
            </p>
          </div>
        </div>
      )}

      {/* Modal: Add Leave */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Ghi nhận lịch nghỉ/bận nhân sự</h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nhân sự</label>
                <select
                  value={leaveStaffId}
                  onChange={(e) => setLeaveStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.roleTitle}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Từ ngày</label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Đến ngày</label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Lý do nghỉ/bận</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đào tạo chứng chỉ Fluke, nghỉ phép gia đình..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold bg-[#152A55] text-white rounded-lg hover:bg-[#1E3A75]"
                >
                  Lưu lịch bận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
