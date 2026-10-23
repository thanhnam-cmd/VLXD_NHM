import React, { useState } from 'react';
import { useStore } from '../state/store.tsx';
import { DEMO_QUERY_TIME, isTaskOverdue, isTaskUpcoming7Days, UPCOMING_DAYS } from '../utils/progressCalculator.ts';
import { formatDate, overlaps, isRecordActive, PROJECT_STATUS_LABEL } from '../utils/domain.ts';
import { StatusBadge } from '../components/ui.tsx';
import { MapPin, Calendar, Search, Users2 } from 'lucide-react';

type CardFilter = '' | 'tasks' | 'doing' | 'upcoming' | 'overdue';

/** Màn hình Dự án của tôi (MH-16) – trang mặc định của Đội trưởng */
export const MyProjectsView: React.FC<{ onOpenProject: (projectId: string) => void }> = ({ onOpenProject }) => {
  const { currentUser, visibleProjects, tasks, categories, assignments, isTaskAssignedToMe } = useStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [cardFilter, setCardFilter] = useState<CardFilter>('');

  if (!currentUser.staffId) {
    return <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-600">Tài khoản của bạn chưa được liên kết với nhân sự. Vui lòng liên hệ Quản trị viên.</div>;
  }

  // Công việc được giao: phụ trách chính hoặc có phân công còn hiệu lực; không tính việc Hủy
  const myTasks = tasks.filter(t => t.status !== 'HUY' && isTaskAssignedToMe(t));
  const inOpenProject = (projectId: string) => ['LAP_KE_HOACH', 'DANG_THUC_HIEN', 'TAM_DUNG'].includes(visibleProjects.find(p => p.id === projectId)?.status || '');
  const doing = myTasks.filter(t => t.status === 'DANG_THUC_HIEN');
  const upcoming = myTasks.filter(t => inOpenProject(t.projectId) && isTaskUpcoming7Days(t.dueDate, t.status));
  const overdue = myTasks.filter(t => inOpenProject(t.projectId) && isTaskOverdue(t.dueDate, t.status));

  const cardTasks = cardFilter === 'doing' ? doing : cardFilter === 'upcoming' ? upcoming : cardFilter === 'overdue' ? overdue : myTasks;
  const projects = visibleProjects.filter(p => {
    if (cardFilter && !cardTasks.some(t => t.projectId === p.id)) return false;
    if (status && p.status !== status) return false;
    if (search && !`${p.code} ${p.name} ${p.place}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const today = DEMO_QUERY_TIME.slice(0, 10);
  const cards: [CardFilter, string, number, string][] = [
    ['', 'Dự án được giao', visibleProjects.length, 'dự án'],
    ['tasks', 'Công việc được giao', myTasks.length, 'công việc'],
    ['doing', 'Đang thực hiện', doing.length, 'công việc'],
    ['upcoming', 'Sắp đến hạn', upcoming.length, `công việc · ${UPCOMING_DAYS} ngày`],
    ['overdue', 'Quá hạn', overdue.length, 'công việc']
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#0D1A36] tracking-tight pb-1 border-b border-slate-200">Dự án của tôi</h1>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {cards.map(([key, label, value, unit]) => (
          <button key={label} type="button" onClick={() => setCardFilter(cardFilter === key ? '' : key)}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${cardFilter === key && key ? 'border-blue-500 bg-blue-50/60' : key === 'overdue' ? 'bg-red-50/70 border-red-200' : key === 'upcoming' ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'} hover:shadow-xs`}>
            <div className={`text-[11px] font-semibold truncate ${key === 'overdue' ? 'text-red-700' : key === 'upcoming' ? 'text-amber-700' : 'text-slate-500'}`}>{label}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl font-bold font-mono ${key === 'overdue' ? 'text-red-700' : key === 'upcoming' ? 'text-amber-700' : 'text-slate-900'}`}>{value}</span>
              <span className="text-[11px] text-slate-500">{unit}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap gap-2 text-xs items-center">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã, tên dự án, địa điểm" className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg w-64" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg">
          <option value="">Mọi trạng thái dự án</option>
          {Object.entries(PROJECT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {cardFilter && <button type="button" onClick={() => setCardFilter('')} className="text-blue-700 font-semibold hover:underline cursor-pointer">Xóa bộ lọc thẻ</button>}
      </div>

      {myTasks.length === 0 ? (
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">Bạn chưa được giao công việc nào. Vui lòng liên hệ Quản lý.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => {
            const mine = myTasks.filter(t => t.projectId === p.id);
            const done = mine.filter(t => t.status === 'HOAN_THANH').length;
            const cats = categories.filter(c => c.projectId === p.id && mine.some(t => t.categoryId === c.id));
            const todayStaff = new Set(assignments.filter(a => isRecordActive(a) && mine.some(t => t.id === a.taskId) && overlaps(a.startDate, a.endDate, `${today} 00:00:00`, `${today} 23:59:59`)).map(a => a.staffId)).size;
            const od = mine.filter(t => inOpenProject(p.id) && isTaskOverdue(t.dueDate, t.status)).length;
            return (
              <div key={p.id} onClick={() => onOpenProject(p.id)} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-700 hover:shadow-md transition-all cursor-pointer space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{p.code}</span>
                  <StatusBadge status={p.status} />
                  {od > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200">{od} công việc quá hạn</span>}
                </div>
                <h3 className="text-sm font-bold text-[#0D1A36]">{p.name}</h3>
                <div className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {p.place}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Hạn hoàn thành: <span className="font-mono">{formatDate(p.dueDate)}</span></div>
                <div className="text-xs text-slate-700">Công việc của tôi: <strong>{mine.length}</strong>, đã hoàn thành <strong>{done}</strong></div>
                <div className="flex flex-wrap gap-1">
                  {cats.map(c => <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{c.code} · {c.name}</span>)}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-100"><Users2 className="w-3.5 h-3.5" /> Hôm nay: <strong>{todayStaff}</strong> nhân sự được phân công</div>
              </div>
            );
          })}
          {projects.length === 0 && <div className="col-span-full p-6 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">Không có dự án phù hợp.</div>}
        </div>
      )}
    </div>
  );
};
