import React from 'react';
import { useStore } from '../state/store.tsx';
import { Drawer, StatusBadge } from './ui.tsx';
import { formatDate, formatDateTime, completionRate } from '../utils/domain.ts';
import { staffingProgress } from '../views/ExternalTeamsTab.tsx';

/**
 * Ngăn xem nhanh chỉ đọc của Ban giám đốc (mục 3.3.5): mở từ nút "Chi tiết" ở Tổng quan
 * và từ một dòng trong báo cáo. Không có nút thao tác.
 */
export const QuickViewDrawer: React.FC<{ projectId: string; taskId?: string; onClose: () => void }> = ({ projectId, taskId, onClose }) => {
  const { projects, tasks, categories, staff, workLogs, externalAssignments } = useStore();
  const p = projects.find(x => x.id === projectId);
  if (!p) return null;
  const projTasks = tasks.filter(t => t.projectId === p.id);
  const focus = taskId ? tasks.find(t => t.id === taskId) : undefined;
  const list = focus ? [focus] : projTasks;
  const logs = workLogs.filter(w => list.some(t => t.id === w.taskId)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 3);
  const exts = externalAssignments.filter(e => list.some(t => t.id === e.taskId));
  const rate = completionRate(projTasks);

  return (
    <Drawer title={`${p.code} · ${p.name}`} subtitle={<span className="flex items-center gap-2"><StatusBadge status={p.status} /> <span className="font-mono">{formatDate(p.startDate)} – {formatDate(p.dueDate)}</span> · Tỷ lệ hoàn thành: {rate === null ? 'Chưa có dữ liệu' : `${rate}%`}</span>} onClose={onClose} width="max-w-xl">
      <div className="space-y-2">
        <div className="font-bold text-slate-800">{focus ? 'Công việc' : `Công việc của dự án (${projTasks.length})`}</div>
        {list.map(t => (
          <div key={t.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="text-[11px] text-slate-500">{categories.find(c => c.id === t.categoryId)?.name || 'Hạng mục'}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-slate-500">{t.code}</span>
              <span className="font-bold text-slate-900">{t.title}</span>
              <StatusBadge status={t.status} kind="task" />
            </div>
            <div className="text-slate-600">Phụ trách chính: {staff.find(s => s.id === t.assigneeId)?.name || '—'} · Hạn: <span className="font-mono">{formatDate(t.dueDate)}</span></div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="font-bold text-slate-800">Ba cập nhật mới nhất từ hiện trường</div>
        {logs.length === 0 ? <div className="text-slate-400">Chưa có cập nhật.</div> : logs.map(l => (
          <div key={l.id} className="p-2.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-[11px] text-slate-500"><span>{l.submittedByStaffName}</span><span className="font-mono">{formatDateTime(l.submittedAt)}</span></div>
            <div className="text-slate-700">{l.content.length > 140 ? l.content.slice(0, 140) + '…' : l.content}</div>
          </div>
        ))}
      </div>
      {exts.length > 0 && (
        <div className="space-y-2">
          <div className="font-bold text-slate-800">Phần việc giao ngoài</div>
          {exts.map(e => {
            const prog = staffingProgress(e);
            return (
              <div key={e.id} className="p-3 rounded-xl border border-purple-200 bg-purple-50/30">
                <div className="font-bold">{e.contractorName} {e.status === 'HUY' && <span className="text-[10px] text-slate-500">(Đã hủy)</span>}</div>
                <div className="text-slate-600 font-mono">{formatDate(e.startDate)} – {formatDate(e.dueDate)}</div>
                <div className="text-slate-600">Số người dự kiến: {e.workerCount ?? '—'} · Giá trị khoán dự kiến: {e.contractValue ? `${e.contractValue.toLocaleString('vi-VN')} đ` : '—'}</div>
                <div className="text-slate-600">Đã cập nhật {prog.x}/{prog.y} ngày</div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};
