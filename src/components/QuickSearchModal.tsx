import React, { useState, useEffect, useRef } from 'react';
import { Project, Task, Staff, TechDoc } from '../types/index.ts';
import { Search, FolderKanban, Briefcase, User, FileText, X, ArrowRight } from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  staff: Staff[];
  docs: TechDoc[];
  onSelectProject: (projectId: string) => void;
  onSelectTask: (taskId: string, projectId: string) => void;
  onSelectStaff: (staffId: string) => void;
  onSelectDoc: (doc: TechDoc) => void;
}

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  staff,
  docs,
  onSelectProject,
  onSelectTask,
  onSelectStaff,
  onSelectDoc
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle Ctrl+K shortcut global listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = removeAccents(query.trim());
  const hasMinChars = cleanQuery.length >= 2;

  // Filter groups (max 5 items each)
  const matchedProjects = hasMinChars ? projects.filter(p => 
    removeAccents(p.name).includes(cleanQuery) || 
    removeAccents(p.code).includes(cleanQuery) ||
    (p.clientName && removeAccents(p.clientName).includes(cleanQuery))
  ).slice(0, 5) : [];

  const matchedTasks = hasMinChars ? tasks.filter(t => 
    removeAccents(t.title).includes(cleanQuery) || 
    (t.code && removeAccents(t.code).includes(cleanQuery)) ||
    (t.locationArea && removeAccents(t.locationArea).includes(cleanQuery))
  ).slice(0, 5) : [];

  const matchedStaff = hasMinChars ? staff.filter(s => 
    removeAccents(s.name).includes(cleanQuery) || 
    removeAccents(s.code).includes(cleanQuery) ||
    removeAccents(s.specialty).includes(cleanQuery) ||
    removeAccents(s.phone).includes(cleanQuery)
  ).slice(0, 5) : [];

  const matchedDocs = hasMinChars ? docs.filter(d => 
    (d.title && removeAccents(d.title).includes(cleanQuery)) || 
    (d.name && removeAccents(d.name).includes(cleanQuery)) ||
    (d.projectCode && removeAccents(d.projectCode).includes(cleanQuery)) ||
    (d.description && removeAccents(d.description).includes(cleanQuery))
  ).slice(0, 5) : [];

  const totalResults = matchedProjects.length + matchedTasks.length + matchedStaff.length + matchedDocs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-[640px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-200 p-4 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhanh dự án, công việc, nhân sự, bản vẽ... (gõ từ 2 ký tự)"
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden font-medium"
          />
          {query ? (
            <button 
              type="button" 
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
              ESC để đóng
            </kbd>
          )}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {!hasMinChars ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-medium text-slate-600">Nhập từ 2 ký tự để tìm kiếm toàn hệ thống (COM-02)</p>
              <p className="text-[11px] text-slate-400">Hỗ trợ tìm kiếm không dấu (ví dụ: "nhung", "cuong", "vlan", "hh xanh")</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="font-semibold text-slate-700">Không tìm thấy kết quả nào khớp với "{query}"</p>
              <p className="text-[11px] mt-1">Thử dùng từ khóa khác hoặc kiểm tra lại chính tả.</p>
            </div>
          ) : (
            <>
              {/* Group: Projects */}
              {matchedProjects.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                    Dự án ({matchedProjects.length})
                  </div>
                  {matchedProjects.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p.id);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700">{p.code}</span>
                          <span className="font-bold text-slate-900 truncate">{p.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          Khách hàng: {p.clientName || 'NMH'} · {p.place}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Group: Tasks */}
              {matchedTasks.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                    Công việc ({matchedTasks.length})
                  </div>
                  {matchedTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        onSelectTask(t.id, t.projectId);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-700">{t.code || `CV${t.id}`}</span>
                          <span className="font-bold text-slate-900 truncate">{t.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          Khu vực: {t.locationArea || 'Công trình'} · Hạn: {t.dueDate}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Group: Staff */}
              {matchedStaff.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    Nhân sự ({matchedStaff.length})
                  </div>
                  {matchedStaff.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectStaff(s.id);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-700">{s.code}</span>
                          <span className="font-bold text-slate-900">{s.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{s.roleTitleDisplay || s.roleTitle}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {s.specialty} · ĐT: {s.phone}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Group: Tech Docs */}
              {matchedDocs.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    Hồ sơ bản vẽ ({matchedDocs.length})
                  </div>
                  {matchedDocs.map(d => (
                    <div
                      key={d.id}
                      onClick={() => {
                        onSelectDoc(d);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-200 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-800">{d.projectCode}</span>
                          <span className="font-bold text-slate-900 truncate">{d.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">{d.type}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {d.description || 'Bản vẽ hồ sơ kỹ thuật'}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Phím tắt: <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Ctrl + K</kbd></span>
          <span>Hệ thống Quản lý Dự án NMH</span>
        </div>
      </div>
    </div>
  );
};
