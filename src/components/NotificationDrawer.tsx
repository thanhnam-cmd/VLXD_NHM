import React from 'react';
import { Project, Task, Assignment, StaffLeave } from '../types/index.ts';
import { isTaskOverdue, isTaskUpcoming7Days, DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';
import { X, Bell, AlertTriangle, Clock, CalendarX2, ChevronRight, CheckCircle2 } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  assignments: Assignment[];
  leaves: StaffLeave[];
  onSelectTask: (taskId: string, projectId: string) => void;
  onSelectAffectedAssignments: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  assignments,
  leaves,
  onSelectTask,
  onSelectAffectedAssignments
}) => {
  if (!isOpen) return null;

  // 1. Quá hạn
  const overdueTasks = tasks.filter(t => isTaskOverdue(t.dueDate, t.status));

  // 2. Sắp đến hạn trong 7 ngày
  const upcomingTasks = tasks.filter(t => isTaskUpcoming7Days(t.dueDate, t.status));

  // 3. Phân công bị ảnh hưởng bởi lịch nghỉ ghi nhận sau
  const activeLeaves = leaves.filter(l => l.status === 'HIEU_LUC' || l.status === 'active');
  const activeAssignments = assignments.filter(a => a.status === 'HIEU_LUC' || a.status === 'active');

  const affectedAssignments = activeAssignments.filter(asg => {
    return activeLeaves.some(leave => {
      if (leave.staffId !== asg.staffId) return false;
      const sA = new Date(asg.startDate).getTime();
      const eA = new Date(asg.endDate).getTime();
      const sL = new Date(leave.startDate).getTime();
      const eL = new Date(leave.endDate).getTime();
      return sA < eL && sL < eA;
    });
  });

  const totalCount = overdueTasks.length + upcomingTasks.length + affectedAssignments.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div 
        className="w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#0D1A36]">Trung Tâm Cảnh Báo (COM-01)</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                  {totalCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Tính theo mốc: {DEMO_QUERY_TIME}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {totalCount === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <p className="font-medium text-slate-700">Không có cảnh báo nào cần xử lý</p>
              <p className="text-[11px]">Toàn bộ công việc và lịch phân công đều đúng kế hoạch.</p>
            </div>
          ) : (
            <>
              {/* Nhóm 1: Quá hạn */}
              {overdueTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-red-100">
                    <span className="font-bold text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Công việc quá hạn
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                      {overdueTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {overdueTasks.map(task => {
                      const proj = projects.find(p => p.id === task.projectId);
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            onSelectTask(task.id, task.projectId);
                            onClose();
                          }}
                          className="p-3 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-50 transition-colors cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-red-800">
                              {proj?.code} · {task.code || `CV${task.id}`}
                            </span>
                            <span className="text-[10px] text-red-700 font-medium">Hạn: {task.dueDate}</span>
                          </div>
                          <div className="font-bold text-slate-900 line-clamp-1">{task.title}</div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                            <span>Phụ trách: {task.assigneeName || 'Chưa gán'}</span>
                            <span className="text-red-700 font-semibold flex items-center gap-0.5">
                              Xem việc <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nhóm 2: Sắp đến hạn trong 7 ngày */}
              {upcomingTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-amber-100">
                    <span className="font-bold text-amber-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Sắp đến hạn trong 7 ngày
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      {upcomingTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {upcomingTasks.map(task => {
                      const proj = projects.find(p => p.id === task.projectId);
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            onSelectTask(task.id, task.projectId);
                            onClose();
                          }}
                          className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-amber-900">
                              {proj?.code} · {task.code || `CV${task.id}`}
                            </span>
                            <span className="text-[10px] text-amber-800 font-medium">Hạn: {task.dueDate}</span>
                          </div>
                          <div className="font-semibold text-slate-900 line-clamp-1">{task.title}</div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                            <span>Phụ trách: {task.assigneeName || 'Chưa gán'}</span>
                            <span className="text-amber-800 font-semibold flex items-center gap-0.5">
                              Chi tiết <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nhóm 3: Phân công bị ảnh hưởng bởi lịch nghỉ */}
              {affectedAssignments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-purple-100">
                    <span className="font-bold text-purple-800 flex items-center gap-1.5">
                      <CalendarX2 className="w-3.5 h-3.5" />
                      Phân công vướng lịch nghỉ/bận (HR-09)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                      {affectedAssignments.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {affectedAssignments.map(asg => (
                      <div
                        key={asg.id}
                        onClick={() => {
                          onSelectAffectedAssignments();
                          onClose();
                        }}
                        className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition-colors cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-900">{asg.staffName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200/80 text-purple-900 font-mono">
                            Bản ghi #{asg.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Công việc: <strong className="text-slate-800">{asg.taskCode || asg.taskName}</strong>
                        </p>
                        <div className="text-[10px] text-purple-800 flex items-center justify-between pt-0.5">
                          <span>{asg.startDate} đến {asg.endDate}</span>
                          <span className="font-bold underline flex items-center gap-0.5">
                            Xử lý tại HR-09 <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center">
          Nhấn ESC hoặc click ra ngoài để đóng ngăn cảnh báo
        </div>
      </div>
    </div>
  );
};
