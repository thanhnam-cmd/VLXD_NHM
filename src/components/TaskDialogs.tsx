import React, { useState } from 'react';
import { DateInput } from './inputs.tsx';
import type { Category, Project, Task, TaskStatus } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { Modal, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary, btnDanger } from './ui.tsx';
import { nextCode, toDbDateTime, formatDate } from '../utils/domain.ts';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';

/** Hộp thoại Thêm hạng mục / Sửa hạng mục (MH-08c, Hình 3.22) */
export const CategoryFormModal: React.FC<{ project: Project; category?: Category; onClose: () => void; onSaved: (msg: string) => void }> = ({
  project, category, onClose, onSaved
}) => {
  const { categories, saveCategory, systemTypes } = useStore();
  const projCats = categories.filter(c => c.projectId === project.id);
  const isEdit = !!category;
  const [code, setCode] = useState(category?.code || nextCode(projCats.map(c => c.code), 'HM', 2));
  const [name, setName] = useState(category?.name || '');
  const [systemType, setSystemType] = useState(category?.systemTypeName || '');
  const [order, setOrder] = useState<number>(category?.orderNum ?? (projCats.reduce((m, c) => Math.max(m, c.orderNum), 0) + 1));
  const [desc, setDesc] = useState(category?.description || '');
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    if (!code.trim()) return setErr('Vui lòng nhập mã hạng mục.');
    const r = saveCategory({
      projectId: project.id,
      code: code.trim(),
      name: name.trim(),
      systemTypeId: systemTypes.find(s => s.name === systemType)?.id || '',
      systemTypeName: systemType,
      orderNum: order,
      description: desc.trim()
    }, category?.id);
    if (!r.ok) return setErr(r.message);
    onSaved(r.message);
  };

  return (
    <Modal
      title={isEdit ? `Sửa hạng mục ${category!.code}` : `Thêm hạng mục vào ${project.code}`}
      onClose={onClose}
      size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={`${btnPrimary} !bg-emerald-700 hover:!bg-emerald-800`} onClick={submit}>{isEdit ? 'Lưu thay đổi' : 'Lưu hạng mục'}</button>
      </>}
    >
      <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Mã hạng mục</Label>
          <input maxLength={30} value={code} disabled={isEdit} onChange={e => setCode(e.target.value)} className={`${inputCls} font-mono font-bold`} />
          <Hint>Dạng HMnn, không trùng trong dự án</Hint>
        </div>
        <div>
          <Label>Thứ tự hiển thị</Label>
          <input type="number" min={1} value={order} onChange={e => setOrder(parseInt(e.target.value, 10) || 1)} className={`${inputCls} font-mono`} />
        </div>
      </div>
      <div>
        <Label required>Tên hạng mục</Label>
        <input maxLength={200} value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Hệ thống camera giám sát" className={inputCls} />
      </div>
      <div>
        <Label required>Loại hệ thống</Label>
        <select value={systemType} onChange={e => setSystemType(e.target.value)} className={inputCls}>
          <option value="">-- Chọn loại hệ thống --</option>
          {systemTypes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <Label>Mô tả</Label>
        <textarea rows={2} maxLength={500} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tối đa 500 ký tự" className={inputCls} />
      </div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Hộp thoại Thêm công việc mới / Sửa công việc (MH-08a, Hình 3.20) */
export const TaskFormModal: React.FC<{
  project: Project;
  task?: Task;
  lockedCategoryId?: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}> = ({ project, task, lockedCategoryId, onClose, onSaved }) => {
  const { categories, tasks, staff, saveTask, findConflicts } = useStore();
  const isEdit = !!task;
  const projCats = categories.filter(c => c.projectId === project.id).sort((a, b) => a.orderNum - b.orderNum);
  const [categoryId, setCategoryId] = useState(task?.categoryId || lockedCategoryId || '');
  const suggestCode = () => nextCode(tasks.filter(t => t.projectId === project.id).map(t => t.code), 'CV', 2);
  const [code, setCode] = useState(task?.code || suggestCode());
  const [title, setTitle] = useState(task?.title || '');
  const [location, setLocation] = useState(task?.locationArea || '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  // Mặc định: bắt đầu từ hôm nay (hoặc ngày bắt đầu dự án), kết thúc sau 7 ngày, không vượt quá hạn dự án
  const pStart = project.startDate.slice(0, 10), pEnd = project.dueDate.slice(0, 10), today = DEMO_QUERY_TIME.slice(0, 10);
  const defStart = today > pStart ? (today > pEnd ? pEnd : today) : pStart;
  const plus7 = (() => { const d = new Date(defStart + 'T00:00:00'); d.setDate(d.getDate() + 7); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const [startDate, setStartDate] = useState(task?.startDate?.slice(0, 10) || defStart);
  const startTime = task?.startDate?.slice(11, 16) || '08:00';
  const [endDate, setEndDate] = useState(task?.dueDate?.slice(0, 10) || (plus7 < pEnd ? plus7 : pEnd));
  const endTime = task?.dueDate?.slice(11, 16) || '17:00';
  // Chỉ chọn Đội trưởng đội thi công (mỗi tổ một đội trưởng); giữ người cũ khi sửa công việc cũ
  const leaders = staff.filter(s => s.roleTitle === 'DOI_TRUONG' && (s.isActive || s.id === task?.assigneeId));
  const oldNonLeader = task?.assigneeId ? staff.find(s => s.id === task.assigneeId && s.roleTitle !== 'DOI_TRUONG') : undefined;
  const rangeStart = startDate ? toDbDateTime(`${startDate} ${startTime}`) : '';
  const rangeEnd = endDate ? toDbDateTime(`${endDate} ${endTime}`) : '';
  const busyNote = (id: string) => {
    if (!rangeStart || !rangeEnd || rangeEnd < rangeStart) return '';
    const c = findConflicts(id, rangeStart, rangeEnd);
    return c.length ? (c.some(x => /nghỉ|bận/i.test(x.message)) ? 'có lịch nghỉ/bận' : 'đang có việc khác') : 'rảnh';
  };
  const [desc, setDesc] = useState(task?.description || '');
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    if (!code.trim()) return setErr('Vui lòng nhập mã công việc.');
    const r = saveTask({
      projectId: project.id,
      categoryId,
      code: code.trim(),
      title: title.trim(),
      locationArea: location.trim(),
      assigneeId,
      startDate: startDate ? toDbDateTime(`${startDate} ${startTime}`) : '',
      dueDate: endDate ? toDbDateTime(`${endDate} ${endTime}`) : '',
      description: desc.trim()
    }, task?.id);
    if (!r.ok) return setErr(r.message);
    onSaved(r.message);
  };

  return (
    <Modal
      title={isEdit ? `Sửa công việc ${task!.code}` : `Thêm công việc mới vào ${project.code}`}
      subtitle={`Thời gian dự án: ${formatDate(project.startDate)} – ${formatDate(project.dueDate)}`}
      onClose={onClose}
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={submit}>{isEdit ? 'Lưu thay đổi' : 'Lưu công việc'}</button>
      </>}
    >
      <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label required>Hạng mục</Label>
          <select value={categoryId} disabled={!!lockedCategoryId || isEdit} onChange={e => setCategoryId(e.target.value)} className={inputCls}>
            <option value="">-- Chọn hạng mục --</option>
            {projCats.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
          </select>
        </div>
        <div>
          <Label required>Mã công việc</Label>
          <input maxLength={30} value={code} disabled={isEdit} onChange={e => setCode(e.target.value)} className={`${inputCls} font-mono font-bold`} />
        </div>
      </div>
      <div>
        <Label required>Tên công việc</Label>
        <input maxLength={255} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Lắp access point tầng 4" className={inputCls} />
      </div>
      <div>
        <Label>Khu vực hoặc tầng</Label>
        <input maxLength={150} value={location} onChange={e => setLocation(e.target.value)} placeholder="Ví dụ: Tầng 4, Khu A" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Ngày bắt đầu</Label>
          <DateInput value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <Label required>Hạn hoàn thành</Label>
          <DateInput value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
        </div>
      </div>
      <Hint>Trong khoảng thời gian dự án {formatDate(project.startDate)} – {formatDate(project.dueDate)}. Công việc tính từ 08:00 ngày bắt đầu đến 17:00 ngày hoàn thành. Phân công nhân sự và đội khoán ngoài của công việc dùng đúng khoảng ngày này.</Hint>
      <div>
        <Label required>Đội trưởng đội thi công phụ trách</Label>
        <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className={inputCls}>
          <option value="">-- Chọn đội trưởng thi công --</option>
          {leaders.map(s => {
            const note = busyNote(s.id);
            return <option key={s.id} value={s.id}>{s.name} – {s.teamName || 'Chưa gắn tổ'}{note ? ` (${note})` : ''}</option>;
          })}
          {oldNonLeader && <option value={oldNonLeader.id}>{oldNonLeader.name} – {oldNonLeader.roleTitleDisplay} (phụ trách cũ)</option>}
        </select>
        <Hint>Chọn ngày trước để thấy đội trưởng rảnh hay đang có việc. Đội trưởng nhận công việc và báo cáo hiện trường; nhân sự thi công bố trí ở nút Phân công.</Hint>
      </div>
      <div>
        <Label>Mô tả kỹ thuật</Label>
        <textarea rows={3} maxLength={1000} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Nội dung chi tiết…" className={inputCls} />
      </div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Hộp thoại xác nhận Hoàn thành hoặc Hủy công việc (MH-08, luồng đổi trạng thái công việc) */
export const TaskStatusConfirm: React.FC<{ task: Task; target: TaskStatus; onClose: () => void; onDone: (msg: string) => void }> = ({
  task, target, onClose, onDone
}) => {
  const { changeTaskStatus, externalAssignments } = useStore();
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const isCancel = target === 'HUY';
  const hasExternal = externalAssignments.some(e => e.taskId === task.id && e.status === 'HIEU_LUC');

  const confirm = () => {
    const r = changeTaskStatus(task.id, target, reason.trim() || undefined);
    if (!r.ok) return setErr(r.message);
    onDone(r.message);
  };

  return (
    <Modal
      title={isCancel ? `Hủy công việc ${task.title}?` : `Xác nhận hoàn thành công việc ${task.title}?`}
      subtitle={task.code}
      onClose={onClose}
      size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={isCancel ? btnDanger : btnPrimary} onClick={confirm}>{isCancel ? 'Xác nhận hủy' : 'Xác nhận hoàn thành'}</button>
      </>}
    >
      <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${isCancel ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
        <div>• Phân công bắt đầu từ thời điểm xác nhận sẽ bị hủy.</div>
        <div>• Phân công đang diễn ra kết thúc tại thời điểm xác nhận.</div>
        <div>• Phân công đã kết thúc và lịch sử được giữ.</div>
        {isCancel && hasExternal && <div>• Phần việc giao đội ngoài còn hiệu lực của công việc cũng bị hủy.</div>}
        <div>• Thao tác này không hoàn tác.</div>
      </div>
      {isCancel && (
        <div>
          <Label required>Lý do hủy</Label>
          <textarea rows={2} maxLength={255} value={reason} onChange={e => setReason(e.target.value)} placeholder="Tối đa 255 ký tự" className={inputCls} />
        </div>
      )}
      <ErrorBox message={err} />
    </Modal>
  );
};
