import React, { useState } from 'react';
import type { Category, Project, Task, TaskStatus } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { Modal, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary, btnDanger } from './ui.tsx';
import { SYSTEM_TYPES, nextCode, toDbDateTime, formatDate } from '../utils/domain.ts';

/** Hộp thoại Thêm hạng mục / Sửa hạng mục (MH-08c, Hình 3.22) */
export const CategoryFormModal: React.FC<{ project: Project; category?: Category; onClose: () => void; onSaved: (msg: string) => void }> = ({
  project, category, onClose, onSaved
}) => {
  const { categories, saveCategory } = useStore();
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
      systemTypeId: String(SYSTEM_TYPES.indexOf(systemType) + 1),
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
          {SYSTEM_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
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
  const { categories, tasks, staff, saveTask } = useStore();
  const isEdit = !!task;
  const projCats = categories.filter(c => c.projectId === project.id).sort((a, b) => a.orderNum - b.orderNum);
  const [categoryId, setCategoryId] = useState(task?.categoryId || lockedCategoryId || '');
  const suggestCode = () => nextCode(tasks.filter(t => t.projectId === project.id).map(t => t.code), 'CV', 2);
  const [code, setCode] = useState(task?.code || suggestCode());
  const [title, setTitle] = useState(task?.title || '');
  const [location, setLocation] = useState(task?.locationArea || '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  const [startDate, setStartDate] = useState(task?.startDate?.slice(0, 10) || '');
  const [startTime, setStartTime] = useState(task?.startDate?.slice(11, 16) || '08:00');
  const [endDate, setEndDate] = useState(task?.dueDate?.slice(0, 10) || '');
  const [endTime, setEndTime] = useState(task?.dueDate?.slice(11, 16) || '17:00');
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
      <div>
        <Label required>Người phụ trách chính</Label>
        <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className={inputCls}>
          <option value="">-- Chọn người phụ trách --</option>
          {staff.filter(s => s.isActive || s.id === assigneeId).map(s => <option key={s.id} value={s.id}>{s.name} – {s.roleTitleDisplay}</option>)}
        </select>
        <Hint>Chỉ định người phụ trách không tạo lịch thi công. Hãy vào Phân công để bố trí nhân sự.</Hint>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Bắt đầu dự kiến</Label>
          <div className="flex gap-1.5">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={`${inputCls} font-mono`} />
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={`${inputCls} font-mono w-28`} />
          </div>
        </div>
        <div>
          <Label required>Kết thúc dự kiến</Label>
          <div className="flex gap-1.5">
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={`${inputCls} font-mono`} />
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={`${inputCls} font-mono w-28`} />
          </div>
          <Hint>Là hạn hoàn thành dùng cho chỉ số quá hạn, sắp đến hạn</Hint>
        </div>
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
