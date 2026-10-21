import React, { useState } from 'react';
import { Staff, StaffSpecialty, Assignment } from '../types/index.ts';
import { 
  Users2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Briefcase, 
  CheckCircle2, 
  XCircle,
  Filter
} from 'lucide-react';

interface StaffViewProps {
  staff: Staff[];
  assignments: Assignment[];
  onAddStaff: (newStaff: Omit<Staff, 'id'>) => void;
  onToggleStaffStatus: (staffId: string) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staff,
  assignments,
  onAddStaff,
  onToggleStaffStatus
}) => {
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New staff form state
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Kỹ sư điện nhẹ');
  const [department, setDepartment] = useState('Phòng Quản lý dự án & Kỹ thuật');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState<StaffSpecialty>('Hạ tầng mạng LAN & Thoại');

  const specialties: StaffSpecialty[] = [
    'Hạ tầng mạng LAN & Thoại',
    'Cáp quang & Thiết bị mạng',
    'Hệ thống âm thanh thông báo PA',
    'Camera giám sát & An ninh',
    'Kiến trúc & Shop Drawing',
    'Giám sát thi công & Nghiệm thu',
    'Điện nhẹ tổng hợp'
  ];

  const filtered = staff.filter(s => {
    if (specialtyFilter !== 'all' && s.specialty !== specialtyFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.roleTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddStaff({
      code: `NMH-ENG-0${staff.length + 1}`,
      name: name.trim(),
      roleTitle: roleTitle.trim(),
      roleTitleDisplay: roleTitle.trim(),
      department: department.trim(),
      phone: phone.trim() || '0912 345 699',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@nmh.vn`,
      specialty,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0]
    });

    setIsModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">
            Hồ Sơ Nhân Sự &amp; Kỹ Sư Thi Công NMH
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý thông tin kỹ sư, chuyên môn điện nhẹ và tải công việc hiện trường (UC-03)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm nhân sự mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên kỹ sư, điện thoại, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#152A55]/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 w-full sm:w-auto"
          >
            <option value="all">Tất cả chuyên môn ({staff.length})</option>
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const activeJobs = assignments.filter(a => a.staffId === s.id && a.status === 'active');

          return (
            <div 
              key={s.id}
              className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                s.isActive ? 'border-slate-200 hover:border-[#152A55]' : 'border-slate-200 bg-slate-50/60 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#152A55] text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0D1A36]">{s.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{s.roleTitle}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    s.isActive 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {s.isActive ? 'Đang làm việc' : 'Ngừng làm việc'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-[#152A55] truncate">{s.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{s.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-500 truncate">{s.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="font-mono">
                  <span className="text-slate-400">Việc đang mở: </span>
                  <span className="font-bold text-[#152A55]">{activeJobs.length}</span>
                </div>

                <button
                  onClick={() => onToggleStaffStatus(s.id)}
                  className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors ${
                    s.isActive 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {s.isActive ? 'Tạm dừng điều phối' : 'Kích hoạt lại'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Thêm nhân sự / Kỹ sư thi công mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Đức Thắng..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Chức danh</label>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    placeholder="09xx xxx xxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Chuyên môn điện nhẹ</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value as StaffSpecialty)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {specialties.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email nội bộ</label>
                <input
                  type="email"
                  placeholder="ten@nmh.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold bg-[#152A55] text-white rounded-lg hover:bg-[#1E3A75]"
                >
                  Lưu nhân sự
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
