import React, { useState } from 'react';
import { WorkLog, Project, Task, Staff, UserAccount } from '../types/index.ts';
import { 
  ClipboardCheck, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Check, 
  User, 
  Calendar 
} from 'lucide-react';

interface WorkLogViewProps {
  workLogs: WorkLog[];
  projects: Project[];
  tasks: Task[];
  staff: Staff[];
  currentUser: UserAccount;
  onAddWorkLog: (log: Omit<WorkLog, 'id' | 'submittedAt'>) => void;
  onApproveWorkLog: (logId: string) => void;
}

export const WorkLogView: React.FC<WorkLogViewProps> = ({
  workLogs,
  projects,
  tasks,
  staff,
  currentUser,
  onAddWorkLog,
  onApproveWorkLog
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const activeTasks = tasks.filter(t => t.projectId === selectedProjectId && t.status !== 'cancelled');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTasks[0]?.id || '');
  const [content, setContent] = useState('');
  const [completedVolume, setCompletedVolume] = useState('');
  const [issuesFaced, setIssuesFaced] = useState('');
  const [requestApproval, setRequestApproval] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const canApprove = currentUser.role === 'manager' || currentUser.role === 'admin' || currentUser.role === 'QUAN_LY' || currentUser.role === 'QUAN_TRI';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedTaskId) return;

    onAddWorkLog({
      taskId: selectedTaskId,
      projectId: selectedProjectId,
      submittedByStaffId: currentUser.staffId || 's1',
      content: content.trim(),
      completedVolume: completedVolume.trim() || undefined,
      issuesFaced: issuesFaced.trim() || undefined,
      requestApproval,
      statusVerifiedByManager: false
    });

    setContent('');
    setCompletedVolume('');
    setIssuesFaced('');
    setRequestApproval(false);
    setToast('Đã ghi nhận nhật ký thi công hiện trường!');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="p-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white flex items-center justify-between shadow-md">
          <span>{toast}</span>
          <button onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">
          Nhật Ký Thi Công Hiện Trường &amp; Báo Cáo Kết Quả
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi tiến độ kéo cáp, lắp đặt thiết bị và phê duyệt nghiệm thu từ cấp Quản lý (UC-07)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Worklog Submission Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#0D1A36] flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#152A55]" />
              Gửi Báo Cáo Nhật Ký Hiện Trường
            </h3>
            <p className="text-[11px] text-slate-500">
              Ghi nhận khối lượng thực tế và kiến nghị kỹ thuật
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Dự án công trình</label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  const newTasks = tasks.filter(t => t.projectId === e.target.value && t.status !== 'cancelled');
                  if (newTasks[0]) setSelectedTaskId(newTasks[0].id);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Hạng mục / Công việc</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              >
                {activeTasks.map(t => (
                  <option key={t.id} value={t.id}>[{t.stage}] {t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Khối lượng thực hiện trong ca</label>
              <input
                type="text"
                placeholder="Ví dụ: Kéo 800m cáp Cat6 tầng 5, lắp 12 loa âm trần..."
                value={completedVolume}
                onChange={(e) => setCompletedVolume(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nội dung chi tiết &amp; Tình hình hiện trường</label>
              <textarea
                required
                rows={3}
                placeholder="Mô tả công việc đã hoàn thành, kiểm tra chất lượng đấu nối..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Khó khăn, vướng mắc (nếu có)</label>
              <input
                type="text"
                placeholder="Ví dụ: Chưa có nguồn điện tầng 7, vướng trần thạch cao..."
                value={issuesFaced}
                onChange={(e) => setIssuesFaced(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={requestApproval}
                onChange={(e) => setRequestApproval(e.target.checked)}
                className="rounded border-amber-300 text-[#152A55]"
              />
              <span className="text-amber-900 font-medium">
                Đề nghị Quản lý xác nhận nghiệm thu hoàn thành công việc
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-[#152A55] text-white font-semibold text-xs hover:bg-[#1E3A75] flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Gửi báo cáo hiện trường
            </button>
          </form>
        </div>

        {/* Worklog Audit Trail List (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#0D1A36]">
                Nhật Ký Thi Công &amp; Dòng Thời Gian Báo Cáo
              </h3>
              <p className="text-[11px] text-slate-500">
                Lưu vết toàn bộ các lần báo cáo và biên bản phê duyệt
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {workLogs.length} bản ghi
            </span>
          </div>

          <div className="space-y-3">
            {workLogs.map((log) => {
              const project = projects.find(p => p.id === log.projectId);
              const task = tasks.find(t => t.id === log.taskId);
              const reporter = staff.find(s => s.id === log.submittedByStaffId);

              return (
                <div 
                  key={log.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    log.statusVerifiedByManager 
                      ? 'border-emerald-200 bg-emerald-50/20' 
                      : log.requestApproval 
                        ? 'border-amber-200 bg-amber-50/20' 
                        : 'border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#0D1A36]">
                          {project?.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {task?.stage}
                        </span>
                        {log.statusVerifiedByManager ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Quản lý đã duyệt hoàn thành
                          </span>
                        ) : log.requestApproval ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Chờ Quản lý xác nhận
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mt-0.5">
                        {task?.title}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                      {log.submittedAt}
                    </div>
                  </div>

                  {log.completedVolume && (
                    <div className="text-xs text-[#152A55] font-semibold bg-white p-2 rounded border border-slate-200/60 mb-2">
                      Khối lượng thực hiện: {log.completedVolume}
                    </div>
                  )}

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {log.content}
                  </p>

                  {log.issuesFaced && (
                    <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <strong>Vướng mắc phát sinh:</strong> {log.issuesFaced}
                      </div>
                    </div>
                  )}

                  {/* Footer with reporter and approval button */}
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Báo cáo bởi: <strong>{reporter?.name || 'Kỹ sư hiện trường'}</strong></span>
                    </div>

                    {!log.statusVerifiedByManager && canApprove && (
                      <button
                        onClick={() => onApproveWorkLog(log.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white font-semibold text-xs rounded-md hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        <Check className="w-3 h-3" /> Phê duyệt &amp; Xác nhận xong
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
