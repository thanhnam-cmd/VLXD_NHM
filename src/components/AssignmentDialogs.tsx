import React, { useMemo, useState } from 'react';
import type { Assignment } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { Modal, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary, ConfirmDialog } from './ui.tsx';
import { formatDate, formatDateTime, toDbDateTime } from '../utils/domain.ts';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

/** Hộp thoại Sửa phân công (MH-09 – Luồng sửa phân công) */
export const EditAssignmentModal: React.FC<{ assignment: Assignment; onClose: () => void; onSaved: (msg: string) => void; title?: string }> = ({
  assignment, onClose, onSaved, title
}) => {
  const { staff, tasks, projects, findConflicts, updateAssignment } = useStore();
  const [staffId, setStaffId] = useState(assignment.staffId);
  const [sDate, setSDate] = useState(assignment.startDate.slice(0, 10));
  const [sTime, setSTime] = useState(assignment.startDate.slice(11, 16));
  const [eDate, setEDate] = useState(assignment.endDate.slice(0, 10));
  const [eTime, setETime] = useState(assignment.endDate.slice(11, 16));
  const [notes, setNotes] = useState(assignment.notes || '');
  const [err, setErr] = useState<string | null>(null);
  const task = tasks.find(t => t.id === assignment.taskId);
  const project = projects.find(p => p.id === assignment.projectId);
  const start = toDbDateTime(`${sDate} ${sTime}`);
  const end = toDbDateTime(`${eDate} ${eTime}`);
  const conflicts = useMemo(() => (sDate && eDate ? findConflicts(staffId, start, end, assignment.id) : []), [staffId, start, end]);

  // Ưu tiên nhân sự chưa có phân công hoặc lịch bận trong khoảng đang sửa
  const staffOptions = staff.filter(s => s.isActive).map(s => ({ s, free: findConflicts(s.id, start, end, assignment.id).length === 0 }))
    .sort((a, b) => Number(b.free) - Number(a.free));

  return (
    <Modal title={title || 'Sửa phân công'} subtitle={`${project?.code} · ${task?.code} ${task?.title} (${formatDate(task?.startDate)} – ${formatDate(task?.dueDate)})`} onClose={onClose}
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} disabled={conflicts.length > 0} onClick={() => {
          const r = updateAssignment(assignment.id, { staffId, startDate: start, endDate: end, notes: notes.trim() });
          if (!r.ok) return setErr(r.message);
          onSaved(r.message);
        }}>Lưu thay đổi</button>
      </>}>
      {project?.status === 'TAM_DUNG' && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">Dự án đang tạm dừng: chỉ được thu hẹp khoảng hiện có hoặc hủy phân công.</div>
      )}
      <div>
        <Label required>Nhân sự thi công</Label>
        <select value={staffId} onChange={e => setStaffId(e.target.value)} className={inputCls}>
          {staffOptions.map(({ s, free }) => <option key={s.id} value={s.id}>{s.name} – {s.roleTitleDisplay} – {s.specialty || 'Chưa cập nhật chuyên môn'} {free ? '(Rảnh)' : '(Trùng lịch)'}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Từ ngày và giờ bắt đầu</Label>
          <div className="flex gap-1.5">
            <input type="date" value={sDate} onChange={e => setSDate(e.target.value)} className={`${inputCls} font-mono`} />
            <input type="time" value={sTime} onChange={e => setSTime(e.target.value)} className={`${inputCls} font-mono w-28`} />
          </div>
        </div>
        <div>
          <Label required>Đến ngày và giờ kết thúc</Label>
          <div className="flex gap-1.5">
            <input type="date" value={eDate} onChange={e => setEDate(e.target.value)} className={`${inputCls} font-mono`} />
            <input type="time" value={eTime} onChange={e => setETime(e.target.value)} className={`${inputCls} font-mono w-28`} />
          </div>
        </div>
      </div>
      <div>
        <Label>Ghi chú phân công</Label>
        <textarea rows={2} maxLength={255} value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} />
      </div>
      {conflicts.length > 0 ? (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="text-[11px] leading-relaxed space-y-0.5">{conflicts.map(c => <div key={c.recordId}>{c.message}</div>)}</div>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2 text-[11px]">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Khoảng thời gian hợp lệ: {staff.find(s => s.id === staffId)?.name} sẵn sàng trong khoảng này.</span>
        </div>
      )}
      <Hint>Khi kiểm tra xung đột, hệ thống loại chính bản ghi đang sửa.</Hint>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Hộp xác nhận Hủy phân công kèm lý do (MH-09) */
export const CancelAssignmentDialog: React.FC<{ assignment: Assignment; onClose: () => void; onDone: (msg: string) => void }> = ({ assignment, onClose, onDone }) => {
  const { cancelAssignment } = useStore();
  return (
    <ConfirmDialog
      title="Hủy phân công"
      danger
      requireReason
      reasonLabel="Lý do hủy"
      message={<>Hủy phân công của <strong>{assignment.staffName}</strong> cho {assignment.taskCode} từ {formatDateTime(assignment.startDate)} đến {formatDateTime(assignment.endDate)}? Bản ghi chuyển sang Đã hủy và được giữ để đối chiếu.</>}
      confirmLabel="Xác nhận hủy"
      onClose={onClose}
      onConfirm={(reason) => {
        const r = cancelAssignment(assignment.id, reason);
        if (!r.ok) return r.message;
        onDone(r.message);
      }}
    />
  );
};
