import {
  Project,
  Staff,
  Task,
  Assignment,
  StaffLeave,
  WorkLog,
  TechDoc,
  UserAccount,
  ExternalSubcontractor,
  SystemConfig
} from '../types/index.ts';

export const SYSTEM_CONFIG: SystemConfig = {
  evaluationTimestamp: '2026-10-12 09:00:00',
  upcomingThresholdDays: 7,
  sessionTimeoutMinutes: 30,
  maxUploadSizeMB: 50,
  allowedFileTypes: 'BAN_VE_CAD,PDF,ANH,BANG_TINH,NEN'
};

// 8 test accounts (+ 1 locked account qly.trung) from sheet TAI_KHOAN_TEST
export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Quản trị hệ thống',
    role: 'QUAN_TRI',
    isActive: true
  },
  {
    id: '2',
    username: 'qly.bao',
    name: 'Trần Quốc Bảo',
    role: 'QUAN_LY',
    staffId: '1',
    isActive: true,
    assignedProjectIds: ['1', '3', '5', '7', '9'] // NMH-2026-001, 003, 005, 007, 009
  },
  {
    id: '3',
    username: 'qly.nhung',
    name: 'Lê Thị Hồng Nhung',
    role: 'QUAN_LY',
    staffId: '2',
    isActive: true,
    assignedProjectIds: ['2', '4', '6', '8', '10'] // NMH-2026-002, 004, 006, 008, 010
  },
  {
    id: '4',
    username: 'dt.cuong',
    name: 'Phạm Văn Cường',
    role: 'DOI_TRUONG',
    staffId: '3',
    isActive: true
  },
  {
    id: '5',
    username: 'dt.thang',
    name: 'Nguyễn Đức Thắng',
    role: 'DOI_TRUONG',
    staffId: '4',
    isActive: true
  },
  {
    id: '6',
    username: 'dt.tuan',
    name: 'Vũ Minh Tuấn',
    role: 'DOI_TRUONG',
    staffId: '5',
    isActive: true
  },
  {
    id: '7',
    username: 'gd.minh',
    name: 'Giám đốc (giả lập 1)',
    role: 'BAN_GIAM_DOC',
    isActive: true
  },
  {
    id: '8',
    username: 'gd.hoa',
    name: 'Phó Giám đốc (giả lập 2)',
    role: 'BAN_GIAM_DOC',
    isActive: true
  },
  {
    id: '9',
    username: 'qly.trung',
    name: 'Quản lý cũ (đã nghỉ việc)',
    role: 'QUAN_LY',
    isActive: false,
    lockReason: 'Nghỉ việc; khóa theo quy trình bàn giao'
  }
];

// 24 staff members from sheet 04_nhan_su
export const INITIAL_STAFF: Staff[] = [
  { id: '1', code: 'NV001', name: 'Trần Quốc Bảo', roleTitle: 'QUAN_LY', roleTitleDisplay: 'Quản lý dự án', phone: '0900000101', email: 'nv001@example.com', specialty: 'Khảo sát và nghiệm thu', isActive: true, startDate: '2019-03-01' },
  { id: '2', code: 'NV002', name: 'Lê Thị Hồng Nhung', roleTitle: 'QUAN_LY', roleTitleDisplay: 'Quản lý dự án', phone: '0900000102', email: 'nv002@example.com', specialty: 'Khảo sát và nghiệm thu', isActive: true, startDate: '2020-06-15' },
  { id: '3', code: 'NV003', name: 'Phạm Văn Cường', roleTitle: 'DOI_TRUONG', roleTitleDisplay: 'Đội trưởng đội thi công 1', teamId: '1', teamName: 'Đội thi công 1 - Hạ tầng mạng và thoại', phone: '0900000103', email: 'nv003@example.com', specialty: 'Kéo cáp và máng cáp', isActive: true, startDate: '2018-09-10' },
  { id: '4', code: 'NV004', name: 'Nguyễn Đức Thắng', roleTitle: 'DOI_TRUONG', roleTitleDisplay: 'Đội trưởng đội thi công 2', teamId: '2', teamName: 'Đội thi công 2 - Camera và kiểm soát ra vào', phone: '0900000104', email: 'nv004@example.com', specialty: 'Camera giám sát', isActive: true, startDate: '2019-01-07' },
  { id: '5', code: 'NV005', name: 'Vũ Minh Tuấn', roleTitle: 'DOI_TRUONG', roleTitleDisplay: 'Đội trưởng đội thi công 3', teamId: '3', teamName: 'Đội thi công 3 - Âm thanh, hình ảnh và hội nghị', phone: '0900000105', email: 'nv005@example.com', specialty: 'Âm thanh hình ảnh hội trường', isActive: true, startDate: '2019-05-20' },
  { id: '6', code: 'NV006', name: 'Đặng Hoài Nam', roleTitle: 'KY_SU', roleTitleDisplay: 'Kỹ sư kỹ thuật', teamId: '1', teamName: 'Đội thi công 1', phone: '0900000106', email: 'nv006@example.com', specialty: 'Cấu hình mạng, VLAN, WiFi', isActive: true, startDate: '2021-02-01' },
  { id: '7', code: 'NV007', name: 'Bùi Thanh Hà', roleTitle: 'KY_SU', roleTitleDisplay: 'Kỹ sư kỹ thuật', teamId: '3', teamName: 'Đội thi công 3', phone: '0900000107', email: 'nv007@example.com', specialty: 'Âm thanh hình ảnh hội nghị', isActive: true, startDate: '2021-08-16' },
  { id: '8', code: 'NV008', name: 'Hoàng Văn Long', roleTitle: 'KY_THUAT_VIEN', roleTitleDisplay: 'Kỹ thuật viên', teamId: '1', teamName: 'Đội thi công 1', phone: '0900000108', email: 'nv008@example.com', specialty: 'Cấu hình mạng, VLAN', isActive: true, startDate: '2021-10-04' },
  { id: '9', code: 'NV009', name: 'Ngô Quang Huy', roleTitle: 'KY_THUAT_VIEN', roleTitleDisplay: 'Kỹ thuật viên', teamId: '2', teamName: 'Đội thi công 2', phone: '0900000109', email: 'nv009@example.com', specialty: 'Camera giám sát', isActive: true, startDate: '2022-03-14' },
  { id: '10', code: 'NV010', name: 'Phan Thanh Sơn', roleTitle: 'KY_THUAT_VIEN', roleTitleDisplay: 'Kỹ thuật viên', teamId: '2', teamName: 'Đội thi công 2', phone: '0900000110', email: 'nv010@example.com', specialty: 'Kiểm soát ra vào', isActive: true, startDate: '2022-04-11' },
  { id: '11', code: 'NV011', name: 'Đỗ Mạnh Dũng', roleTitle: 'KY_THUAT_VIEN', roleTitleDisplay: 'Kỹ thuật viên', teamId: '2', teamName: 'Đội thi công 2', phone: '0900000111', email: 'nv011@example.com', specialty: 'Kéo cáp và máng cáp', isActive: true, startDate: '2022-07-18' },
  { id: '12', code: 'NV012', name: 'Lý Thành Công', roleTitle: 'KY_THUAT_VIEN', roleTitleDisplay: 'Kỹ thuật viên', teamId: '2', teamName: 'Đội thi công 2', phone: '0900000112', email: 'nv012@example.com', specialty: 'Kiểm soát ra vào', isActive: true, startDate: '2022-09-05' },
  { id: '13', code: 'NV013', name: 'Trịnh Xuân Trường', roleTitle: 'KY_THUAT_VIEN', roleTitleDisplay: 'Kỹ thuật viên', teamId: '3', teamName: 'Đội thi công 3', phone: '0900000113', email: 'nv013@example.com', specialty: 'Âm thanh thông báo PA', isActive: true, startDate: '2022-11-21' },
  { id: '14', code: 'NV014', name: 'Cao Văn Bình', roleTitle: 'KY_THUAT_VIEN', roleTitleDisplay: 'Kỹ thuật viên', teamId: '3', teamName: 'Đội thi công 3', phone: '0900000114', email: 'nv014@example.com', specialty: 'Âm thanh hội trường', isActive: true, startDate: '2023-01-09' },
  { id: '15', code: 'NV015', name: 'Mai Đức Anh', roleTitle: 'KY_THUAT_VIEN', roleTitleDisplay: 'Kỹ thuật viên', teamId: '1', teamName: 'Đội thi công 1', phone: '0900000115', email: 'nv015@example.com', specialty: 'Hạ tầng thoại', isActive: true, startDate: '2023-02-13' },
  { id: '16', code: 'NV016', name: 'Tạ Văn Hải', roleTitle: 'CONG_NHAN', roleTitleDisplay: 'Công nhân thi công', teamId: '1', teamName: 'Đội thi công 1', phone: '0900000116', email: 'nv016@example.com', specialty: 'Kéo cáp', isActive: true, startDate: '2023-05-02' },
  { id: '17', code: 'NV017', name: 'Lương Văn Sơn', roleTitle: 'CONG_NHAN', roleTitleDisplay: 'Công nhân thi công', teamId: '1', teamName: 'Đội thi công 1', phone: '0900000117', email: 'nv017@example.com', specialty: 'Kéo cáp', isActive: true, startDate: '2023-06-12' },
  { id: '18', code: 'NV018', name: 'Đinh Công Hậu', roleTitle: 'CONG_NHAN', roleTitleDisplay: 'Công nhân thi công', teamId: '2', teamName: 'Đội thi công 2', phone: '0900000118', email: 'nv018@example.com', specialty: 'Lắp camera', isActive: true, startDate: '2023-08-07' },
  { id: '19', code: 'NV019', name: 'Võ Văn Tâm', roleTitle: 'CONG_NHAN', roleTitleDisplay: 'Công nhân thi công', teamId: '2', teamName: 'Đội thi công 2', phone: '0900000119', email: 'nv019@example.com', specialty: 'Lắp camera', isActive: true, startDate: '2023-09-18' },
  { id: '20', code: 'NV020', name: 'Chu Văn Khánh', roleTitle: 'CONG_NHAN', roleTitleDisplay: 'Công nhân thi công', teamId: '3', teamName: 'Đội thi công 3', phone: '0900000120', email: 'nv020@example.com', specialty: 'Âm thanh thông báo', isActive: true, startDate: '2024-01-08' },
  { id: '21', code: 'NV021', name: 'Nguyễn Thu Trang', roleTitle: 'NHAN_VIEN_THIET_KE', roleTitleDisplay: 'Nhân viên thiết kế', teamId: '4', teamName: 'Tổ thiết kế', phone: '0900000121', email: 'nv021@example.com', specialty: 'Bản vẽ CAD, Shop drawing', isActive: true, startDate: '2021-04-05' },
  { id: '22', code: 'NV022', name: 'Lê Hải Yến', roleTitle: 'NHAN_VIEN_THIET_KE', roleTitleDisplay: 'Nhân viên thiết kế', teamId: '4', teamName: 'Tổ thiết kế', phone: '0900000122', email: 'nv022@example.com', specialty: 'Bản vẽ CAD, Shop drawing', isActive: true, startDate: '2022-10-10' },
  { id: '23', code: 'NV023', name: 'Phạm Văn Đạt', roleTitle: 'KY_THUAT_VIEN', roleTitleDisplay: 'Kỹ thuật viên (Đã nghỉ)', teamId: '2', teamName: 'Đội thi công 2', phone: '0900000123', email: 'nv023@example.com', specialty: 'Kéo cáp', isActive: false, startDate: '2022-02-14', leaveDate: '2026-09-22', notes: 'Nghỉ việc chuyển công tác' },
  { id: '24', code: 'NV024', name: 'Nguyễn Văn Kiên', roleTitle: 'CONG_NHAN', roleTitleDisplay: 'Công nhân thi công', teamId: '2', teamName: 'Đội thi công 2', phone: '0900000124', email: 'nv024@example.com', specialty: 'Kéo cáp', isActive: true, startDate: '2026-09-01' }
];

// 10 projects from sheet 09_du_an
export const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    code: 'NMH-2026-001',
    name: 'Hạ tầng mạng và camera giám sát tòa chung cư HH Xanh',
    clientId: '1',
    clientName: 'Ban quản lý tòa chung cư HH Xanh',
    place: 'Tòa chung cư HH Xanh, Đông Anh, Hà Nội',
    scopeSummary: 'Cáp mạng, cáp quang, tủ mạng và camera hành lang tầng 1-10',
    startDate: '2026-06-14 08:00:00',
    dueDate: '2026-09-07 17:00:00',
    status: 'HOAN_THANH',
    managerId: '1',
    managerName: 'Trần Quốc Bảo',
    completedAt: '2026-09-08 15:00:00'
  },
  {
    id: '2',
    code: 'NMH-2026-002',
    name: 'Hệ thống âm thanh thông báo Trường THCS Ánh Dương',
    clientId: '2',
    clientName: 'Trường THCS Ánh Dương',
    place: 'Trường THCS Ánh Dương, Hà Đông, Hà Nội',
    scopeSummary: 'Loa, bộ khuếch đại và phân vùng phát thông báo toàn trường',
    startDate: '2026-07-04 08:00:00',
    dueDate: '2026-08-28 17:00:00',
    status: 'HOAN_THANH',
    managerId: '2',
    managerName: 'Lê Thị Hồng Nhung',
    completedAt: '2026-08-29 16:00:00'
  },
  {
    id: '3',
    code: 'NMH-2026-003',
    name: 'Mạng LAN và WiFi văn phòng Công ty An Bình',
    clientId: '3',
    clientName: 'Công ty CP Sản xuất An Bình',
    place: 'Văn phòng Công ty An Bình, Long Biên, Hà Nội',
    scopeSummary: 'Mạng LAN tầng 2-3, tủ mạng, VLAN, firewall và WiFi',
    startDate: '2026-09-12 08:00:00',
    dueDate: '2026-11-06 17:00:00',
    status: 'DANG_THUC_HIEN',
    managerId: '1',
    managerName: 'Trần Quốc Bảo'
  },
  {
    id: '4',
    code: 'NMH-2026-004',
    name: 'Âm thanh hình ảnh hội trường Trung tâm Hội nghị Sao Mai',
    clientId: '4',
    clientName: 'Trung tâm Hội nghị Sao Mai',
    place: 'Trung tâm Hội nghị Sao Mai, Cầu Giấy, Hà Nội',
    scopeSummary: 'Loa, micro, màn hình LED, hội nghị trực tuyến cho hội trường lớn',
    startDate: '2026-09-02 08:00:00',
    dueDate: '2026-10-22 17:00:00',
    status: 'DANG_THUC_HIEN',
    managerId: '2',
    managerName: 'Lê Thị Hồng Nhung'
  },
  {
    id: '5',
    code: 'NMH-2026-005',
    name: 'Camera giám sát và kiểm soát ra vào khách sạn Hồ Tây View',
    clientId: '5',
    clientName: 'Khách sạn Hồ Tây View',
    place: 'Khách sạn Hồ Tây View, Tây Hồ, Hà Nội',
    scopeSummary: 'Camera hành lang, bãi xe, khóa từ khu nhân viên; có phần việc giao đội ngoài',
    startDate: '2026-09-22 08:00:00',
    dueDate: '2026-11-21 17:00:00',
    status: 'DANG_THUC_HIEN',
    managerId: '1',
    managerName: 'Trần Quốc Bảo'
  },
  {
    id: '6',
    code: 'NMH-2026-006',
    name: 'Hạ tầng thoại tòa nhà văn phòng Minh Phát',
    clientId: '6',
    clientName: 'Công ty TNHH Tòa nhà Minh Phát',
    place: 'Tòa nhà Minh Phát, Cầu Giấy, Hà Nội',
    scopeSummary: 'Cáp thoại tầng 5-8, tổng đài và đấu nối',
    startDate: '2026-09-17 08:00:00',
    dueDate: '2026-11-11 17:00:00',
    status: 'TAM_DUNG',
    managerId: '2',
    managerName: 'Lê Thị Hồng Nhung',
    cancelReason: 'Khách hàng chậm thanh toán đợt 2'
  },
  {
    id: '7',
    code: 'NMH-2026-007',
    name: 'Nhà thông minh căn hộ mẫu Green Park',
    clientId: '7',
    clientName: 'Công ty CP Địa ốc Green Park',
    place: 'Căn hộ mẫu Green Park, Thanh Xuân, Hà Nội',
    scopeSummary: 'Khảo sát, kéo cáp, thiết bị điều khiển và kịch bản nhà thông minh',
    startDate: '2026-10-22 08:00:00',
    dueDate: '2026-12-06 17:00:00',
    status: 'LAP_KE_HOACH',
    managerId: '1',
    managerName: 'Trần Quốc Bảo'
  },
  {
    id: '8',
    code: 'NMH-2026-008',
    name: 'Hạ tầng mạng nhà xưởng Quang Minh',
    clientId: '8',
    clientName: 'Công ty TNHH Cơ khí Quang Minh',
    place: 'KCN Quang Minh, Mê Linh, Hà Nội',
    scopeSummary: 'Cáp quang liên tòa, tủ mạng và hạ tầng mạng nhà xưởng',
    startDate: '2026-11-01 08:00:00',
    dueDate: '2026-12-21 17:00:00',
    status: 'LAP_KE_HOACH',
    managerId: '2',
    managerName: 'Lê Thị Hồng Nhung'
  },
  {
    id: '9',
    code: 'NMH-2026-009',
    name: 'WiFi và camera trường mầm non Sao Nhi',
    clientId: '9',
    clientName: 'Trường Mầm non Sao Nhi',
    place: 'Trường Mầm non Sao Nhi, Hoàng Mai, Hà Nội',
    scopeSummary: 'Access point các phòng học và camera sân trường',
    startDate: '2026-09-27 08:00:00',
    dueDate: '2026-11-01 17:00:00',
    status: 'HUY',
    managerId: '1',
    managerName: 'Trần Quốc Bảo',
    cancelledAt: '2026-10-09 16:00:00',
    cancelReason: 'Khách hàng dừng đầu tư; thỏa thuận chấm dứt thi công'
  },
  {
    id: '10',
    code: 'NMH-2026-010',
    name: 'Hội nghị trực tuyến phòng họp Công ty Bình Minh',
    clientId: '10',
    clientName: 'Công ty TNHH Bình Minh Logistics',
    place: 'Công ty Bình Minh Logistics, Long Biên, Hà Nội',
    scopeSummary: 'Camera, micro và cấu hình hệ thống hội nghị trực tuyến phòng họp',
    startDate: '2026-09-30 08:00:00',
    dueDate: '2026-10-30 17:00:00',
    status: 'DANG_THUC_HIEN',
    managerId: '2',
    managerName: 'Lê Thị Hồng Nhung'
  }
];

// 3 external subcontractor teams from sheet 15_doi_ben_ngoai
export const INITIAL_SUBCONTRACTORS: ExternalSubcontractor[] = [
  { id: '1', companyName: 'Đội thi công điện nhẹ Nguyên Khê', contactPerson: 'Anh Hùng', phone: '0900000301', area: 'Nguyên Khê, Đông Anh', status: 'HOP_TAC', assignedTaskCount: 2 },
  { id: '2', companyName: 'Đội cáp quang Vân Nội', contactPerson: 'Chị Thu', phone: '0900000302', area: 'Vân Nội, Đông Anh', status: 'HOP_TAC', assignedTaskCount: 1 },
  { id: '3', companyName: 'Công ty TNHH Lắp đặt Việt Âm', contactPerson: 'Anh Quang', phone: '0900000303', area: 'Hà Nội', status: 'NGUNG_HOP_TAC', assignedTaskCount: 0 }
];

// 42 tasks from sheet 12_cong_viec
export const INITIAL_TASKS: Task[] = [
  { id: '1', code: 'CV01', projectId: '1', categoryId: '1', categoryCode: 'HM01', title: 'Khảo sát hiện trạng và chốt tuyến cáp tầng 1-10', description: 'Đo đạc trục kỹ thuật, xác định vị trí máng cáp', locationArea: 'Tầng 1-10', assigneeId: '6', assigneeName: 'Đặng Hoài Nam', startDate: '2026-06-14 08:00:00', dueDate: '2026-06-24 17:00:00', status: 'HOAN_THANH', completedAt: '2026-06-25 15:00:00', approvedBy: 'Trần Quốc Bảo' },
  { id: '2', code: 'CV02', projectId: '1', categoryId: '1', categoryCode: 'HM01', title: 'Kéo cáp mạng Cat6 và cáp quang tầng 1-10', description: 'Rải cáp trong máng cáp và ống luồn PVC D20', locationArea: 'Tầng 1-10', assigneeId: '3', assigneeName: 'Phạm Văn Cường', startDate: '2026-06-26 08:00:00', dueDate: '2026-07-19 17:00:00', status: 'HOAN_THANH', completedAt: '2026-07-20 15:00:00', approvedBy: 'Trần Quốc Bảo' },
  { id: '3', code: 'CV03', projectId: '1', categoryId: '1', categoryCode: 'HM01', title: 'Lắp tủ mạng, patch panel và đấu nối', description: 'Đấu nối thanh quản lý cáp và bấm hạt mạng', locationArea: 'Phòng kỹ thuật các tầng', assigneeId: '3', assigneeName: 'Phạm Văn Cường', startDate: '2026-07-20 08:00:00', dueDate: '2026-08-03 17:00:00', status: 'HOAN_THANH', completedAt: '2026-08-04 15:00:00', approvedBy: 'Trần Quốc Bảo' },
  { id: '4', code: 'CV04', projectId: '1', categoryId: '2', categoryCode: 'HM02', title: 'Lắp camera sảnh và hành lang tầng 1-10', description: 'Gắn giá treo và cân chỉnh góc nhìn', locationArea: 'Tầng 1-10', assigneeId: '4', assigneeName: 'Nguyễn Đức Thắng', startDate: '2026-07-29 08:00:00', dueDate: '2026-08-18 17:00:00', status: 'HOAN_THANH', completedAt: '2026-08-19 15:00:00', approvedBy: 'Trần Quốc Bảo' },
  { id: '5', code: 'CV05', projectId: '1', categoryId: '2', categoryCode: 'HM02', title: 'Cấu hình đầu ghi NVR và nghiệm thu camera', description: 'Cài đặt IP tĩnh, phân quyền xem qua mạng', locationArea: 'Phòng bảo vệ', assigneeId: '6', assigneeName: 'Đặng Hoài Nam', startDate: '2026-08-19 08:00:00', dueDate: '2026-09-02 17:00:00', status: 'HOAN_THANH', completedAt: '2026-09-03 15:00:00', approvedBy: 'Trần Quốc Bảo' },
  { id: '6', code: 'CV06', projectId: '1', categoryId: '2', categoryCode: 'HM02', title: 'Lắp camera khu vực hầm B2', description: 'Chủ đầu tư cắt giảm hạng mục', locationArea: 'Hầm B2', assigneeId: '4', assigneeName: 'Nguyễn Đức Thắng', startDate: '2026-08-23 08:00:00', dueDate: '2026-09-02 17:00:00', status: 'HUY', cancelledAt: '2026-08-22 11:00:00', cancelReason: 'Chủ đầu tư bỏ hạng mục hầm B2 khỏi phạm vi' },
  
  // Project 2 (NMH-2026-002) - All Done
  { id: '7', code: 'CV07', projectId: '2', categoryId: '3', categoryCode: 'HM01', title: 'Khảo sát và thiết kế phương án âm thanh', description: 'Tính toán công suất loa phòng học và sân trường', locationArea: 'Toàn trường', assigneeId: '7', assigneeName: 'Bùi Thanh Hà', startDate: '2026-07-04 08:00:00', dueDate: '2026-07-14 17:00:00', status: 'HOAN_THANH', completedAt: '2026-07-15 15:00:00', approvedBy: 'Lê Thị Hồng Nhung' },
  { id: '8', code: 'CV08', projectId: '2', categoryId: '3', categoryCode: 'HM01', title: 'Kéo cáp tín hiệu và lắp loa các phòng học', description: 'Đi ống ghen và gắn loa hộp 6W', locationArea: 'Khối lớp học', assigneeId: '5', assigneeName: 'Vũ Minh Tuấn', startDate: '2026-07-16 08:00:00', dueDate: '2026-08-08 17:00:00', status: 'HOAN_THANH', completedAt: '2026-08-09 15:00:00', approvedBy: 'Lê Thị Hồng Nhung' },
  { id: '9', code: 'CV09', projectId: '2', categoryId: '3', categoryCode: 'HM01', title: 'Lắp bộ khuếch đại, cấu hình vùng phát và nghiệm thu', description: 'Lắp amply trung tâm và bàn chọn vùng phát', locationArea: 'Phòng bảo vệ', assigneeId: '7', assigneeName: 'Bùi Thanh Hà', startDate: '2026-08-09 08:00:00', dueDate: '2026-08-27 17:00:00', status: 'HOAN_THANH', completedAt: '2026-08-28 15:00:00', approvedBy: 'Lê Thị Hồng Nhung' },

  // Project 3 (NMH-2026-003) - In progress
  { id: '10', code: 'CV10', projectId: '3', categoryId: '4', categoryCode: 'HM01', title: 'Kéo cáp mạng khu văn phòng tầng 2', description: 'Rải cáp Cat6 và lắp mặt nạ âm sàn', locationArea: 'Tầng 2', assigneeId: '3', assigneeName: 'Phạm Văn Cường', startDate: '2026-09-14 08:00:00', dueDate: '2026-09-30 17:00:00', status: 'HOAN_THANH', completedAt: '2026-10-01 15:00:00', approvedBy: 'Trần Quốc Bảo' },
  { id: '11', code: 'CV11', projectId: '3', categoryId: '4', categoryCode: 'HM01', title: 'Lắp tủ mạng và đấu nối switch', description: 'Gắn tủ rack 27U và patch panel', locationArea: 'Phòng server tầng 2', assigneeId: '3', assigneeName: 'Phạm Văn Cường', startDate: '2026-09-28 08:00:00', dueDate: '2026-10-10 17:00:00', status: 'HOAN_THANH', completedAt: '2026-10-11 15:00:00', approvedBy: 'Trần Quốc Bảo' },
  { id: '12', code: 'CV12', projectId: '3', categoryId: '4', categoryCode: 'HM01', title: 'Cấu hình VLAN, firewall và định tuyến', description: 'Phân tách mạng nội bộ và mạng khách', locationArea: 'Phòng server tầng 2', assigneeId: '6', assigneeName: 'Đặng Hoài Nam', startDate: '2026-10-09 08:00:00', dueDate: '2026-10-22 17:00:00', status: 'DANG_THUC_HIEN' },
  { id: '13', code: 'CV13', projectId: '3', categoryId: '5', categoryCode: 'HM02', title: 'Lắp access point tầng 2-3', description: 'Gắn 14 bộ phát WiFi công suất cao', locationArea: 'Tầng 2-3', assigneeId: '4', assigneeName: 'Nguyễn Đức Thắng', startDate: '2026-10-10 08:00:00', dueDate: '2026-10-20 17:00:00', status: 'DANG_THUC_HIEN' },
  { id: '14', code: 'CV14', projectId: '3', categoryId: '5', categoryCode: 'HM02', title: 'Khảo sát và tinh chỉnh vùng phủ sóng', description: 'Đo kiểm độ suy hao sóng bằng Heatmap', locationArea: 'Tầng 2-3', assigneeId: '6', assigneeName: 'Đặng Hoài Nam', startDate: '2026-10-21 08:00:00', dueDate: '2026-11-01 17:00:00', status: 'CHUA_BAT_DAU' },
  { id: '15', code: 'CV15', projectId: '3', categoryId: '4', categoryCode: 'HM01', title: 'Nghiệm thu và bàn giao hạ tầng mạng', description: 'Bàn giao sơ đồ logic và mật khẩu quản trị', locationArea: 'Toàn văn phòng', assigneeId: '1', assigneeName: 'Trần Quốc Bảo', startDate: '2026-11-02 08:00:00', dueDate: '2026-11-06 17:00:00', status: 'CHUA_BAT_DAU' },

  // Project 4 (NMH-2026-004) - In progress. NOTE: CV16 is OVERDUE!
  { id: '16', code: 'CV16', projectId: '4', categoryId: '6', categoryCode: 'HM01', title: 'Lắp hệ thống loa và micro hội trường lớn', description: 'Treo loa line array và lắp cụm micro cổ ngỗng', locationArea: 'Hội trường lớn', assigneeId: '5', assigneeName: 'Vũ Minh Tuấn', startDate: '2026-09-04 08:00:00', dueDate: '2026-10-07 17:00:00', status: 'DANG_THUC_HIEN', latestResultSummary: 'Còn micro bàn chủ tọa chưa lắp do chờ phụ kiện' },
  { id: '17', code: 'CV17', projectId: '4', categoryId: '6', categoryCode: 'HM01', title: 'Lắp bộ xử lý tín hiệu và khuếch đại', description: 'Đấu nối DSP và amply công suất cao', locationArea: 'Phòng kỹ thuật', assigneeId: '7', assigneeName: 'Bùi Thanh Hà', startDate: '2026-09-22 08:00:00', dueDate: '2026-10-06 17:00:00', status: 'HOAN_THANH', completedAt: '2026-10-07 15:00:00', approvedBy: 'Lê Thị Hồng Nhung' },
  { id: '18', code: 'CV18', projectId: '4', categoryId: '6', categoryCode: 'HM01', title: 'Lắp màn hình LED và thiết bị hội nghị trực tuyến', description: 'Lắp cabinet LED P2.5 và camera hội nghị PTZ', locationArea: 'Sân khấu', assigneeId: '7', assigneeName: 'Bùi Thanh Hà', startDate: '2026-10-04 08:00:00', dueDate: '2026-10-16 17:00:00', status: 'DANG_THUC_HIEN' },
  { id: '19', code: 'CV19', projectId: '4', categoryId: '6', categoryCode: 'HM01', title: 'Cấu hình, hiệu chỉnh âm thanh và chạy thử', description: 'Cân chỉnh pha âm thanh, triệt tiêu tiếng hú rít', locationArea: 'Hội trường lớn', assigneeId: '5', assigneeName: 'Vũ Minh Tuấn', startDate: '2026-10-17 08:00:00', dueDate: '2026-10-21 17:00:00', status: 'CHUA_BAT_DAU' },
  { id: '20', code: 'CV20', projectId: '4', categoryId: '6', categoryCode: 'HM01', title: 'Nghiệm thu và bàn giao hội trường', description: 'Lập biên bản đo kiểm âm học và bàn giao hướng dẫn', locationArea: 'Hội trường lớn', assigneeId: '2', assigneeName: 'Lê Thị Hồng Nhung', startDate: '2026-10-21 08:00:00', dueDate: '2026-10-22 17:00:00', status: 'CHUA_BAT_DAU' },

  // Project 5 (NMH-2026-005) - In progress
  { id: '21', code: 'CV21', projectId: '5', categoryId: '7', categoryCode: 'HM01', title: 'Lắp camera sảnh và hành lang các tầng khách', description: 'Gắn 64 camera dome hồng ngoại', locationArea: 'Tầng 2-9', assigneeId: '4', assigneeName: 'Nguyễn Đức Thắng', startDate: '2026-09-24 08:00:00', dueDate: '2026-10-17 17:00:00', status: 'DANG_THUC_HIEN' },
  { id: '22', code: 'CV22', projectId: '5', categoryId: '7', categoryCode: 'HM01', title: 'Lắp camera bãi xe và khu vực kỹ thuật', description: 'Có phần việc giao khoán ngoài', locationArea: 'Bãi xe, tầng hầm', assigneeId: '4', assigneeName: 'Nguyễn Đức Thắng', startDate: '2026-10-13 08:00:00', dueDate: '2026-10-24 17:00:00', status: 'CHUA_BAT_DAU', externalAssignment: { id: '2', taskId: '22', contractorId: '2', contractorName: 'Đội cáp quang Vân Nội', workDescription: 'Kéo cáp và lắp camera bãi xe, tầng hầm', startDate: '2026-10-13 08:00:00', dueDate: '2026-10-24 17:00:00', workerCount: 3, nmhCoordinatorId: '4', status: 'HIEU_LUC' } },
  { id: '23', code: 'CV23', projectId: '5', categoryId: '7', categoryCode: 'HM01', title: 'Cấu hình đầu ghi và hệ thống lưu trữ', description: 'Lưu trữ hình ảnh 30 ngày chuẩn khách sạn', locationArea: 'Phòng bảo vệ', assigneeId: '6', assigneeName: 'Đặng Hoài Nam', startDate: '2026-10-22 08:00:00', dueDate: '2026-10-30 17:00:00', status: 'CHUA_BAT_DAU' },
  { id: '24', code: 'CV24', projectId: '5', categoryId: '8', categoryCode: 'HM02', title: 'Lắp đầu đọc thẻ và khóa từ khu vực nhân viên', description: 'Kiểm soát cửa phân quyền nhân sự khách sạn', locationArea: 'Khu nhân viên', assigneeId: '4', assigneeName: 'Nguyễn Đức Thắng', startDate: '2026-10-07 08:00:00', dueDate: '2026-10-26 17:00:00', status: 'DANG_THUC_HIEN' },
  { id: '25', code: 'CV25', projectId: '5', categoryId: '8', categoryCode: 'HM02', title: 'Kéo cáp tín hiệu kiểm soát ra vào (nhà A1)', description: 'Giao khoán cho Đội thi công Nguyên Khê', locationArea: 'Nhà A1', assigneeId: '4', assigneeName: 'Nguyễn Đức Thắng', startDate: '2026-10-02 08:00:00', dueDate: '2026-10-15 17:00:00', status: 'DANG_THUC_HIEN', externalAssignment: { id: '1', taskId: '25', contractorId: '1', contractorName: 'Đội thi công điện nhẹ Nguyên Khê', workDescription: 'Kéo cáp tín hiệu kiểm soát ra vào nhà A1 (khoảng 600 m cáp, đi ống luồn)', startDate: '2026-10-02 08:00:00', dueDate: '2026-10-15 17:00:00', workerCount: 4, nmhCoordinatorId: '4', status: 'HIEU_LUC' } },
  { id: '26', code: 'CV26', projectId: '5', categoryId: '8', categoryCode: 'HM02', title: 'Cấu hình phần mềm và phân quyền thẻ', description: 'Phân quyền ra vào khu bếp, kho và văn phòng', locationArea: 'Phòng bảo vệ', assigneeId: '6', assigneeName: 'Đặng Hoài Nam', startDate: '2026-10-27 08:00:00', dueDate: '2026-11-11 17:00:00', status: 'CHUA_BAT_DAU' },
  { id: '27', code: 'CV27', projectId: '5', categoryId: '7', categoryCode: 'HM01', title: 'Nghiệm thu và bàn giao', description: 'Kiểm tra hoạt động toàn hệ thống an ninh', locationArea: 'Toàn khách sạn', assigneeId: '1', assigneeName: 'Trần Quốc Bảo', startDate: '2026-11-16 08:00:00', dueDate: '2026-11-21 17:00:00', status: 'CHUA_BAT_DAU' },

  // Project 6 (NMH-2026-006) - TAM_DUNG
  { id: '28', code: 'CV28', projectId: '6', categoryId: '9', categoryCode: 'HM01', title: 'Kéo cáp thoại tầng 5-8', description: 'Tuyến cáp 50 đôi đi trong trục kỹ thuật', locationArea: 'Tầng 5-8', assigneeId: '3', assigneeName: 'Phạm Văn Cường', startDate: '2026-09-20 08:00:00', dueDate: '2026-10-16 17:00:00', status: 'DANG_THUC_HIEN' },
  { id: '29', code: 'CV29', projectId: '6', categoryId: '9', categoryCode: 'HM01', title: 'Lắp tổng đài và đấu nối', description: 'Đấu phiến thoại Krone và gắn tổng đài IP', locationArea: 'Phòng kỹ thuật', assigneeId: '6', assigneeName: 'Đặng Hoài Nam', startDate: '2026-10-17 08:00:00', dueDate: '2026-10-27 17:00:00', status: 'CHUA_BAT_DAU' },
  { id: '30', code: 'CV30', projectId: '6', categoryId: '9', categoryCode: 'HM01', title: 'Nghiệm thu và bàn giao', description: 'Đo kiểm tín hiệu thoại nội bộ', locationArea: 'Tầng 5-8', assigneeId: '2', assigneeName: 'Lê Thị Hồng Nhung', startDate: '2026-11-06 08:00:00', dueDate: '2026-11-11 17:00:00', status: 'CHUA_BAT_DAU' },

  // Project 7 (NMH-2026-007) - LAP_KE_HOACH
  { id: '31', code: 'CV31', projectId: '7', categoryId: '10', categoryCode: 'HM01', title: 'Khảo sát căn hộ mẫu và lập phương án', description: 'Khảo sát vị trí công tắc, cảm biến và rèm tự động', locationArea: 'Căn hộ mẫu', assigneeId: '7', assigneeName: 'Bùi Thanh Hà', startDate: '2026-10-22 08:00:00', dueDate: '2026-10-28 17:00:00', status: 'CHUA_BAT_DAU' },
  { id: '32', code: 'CV32', projectId: '7', categoryId: '10', categoryCode: 'HM01', title: 'Kéo cáp và lắp thiết bị điều khiển', description: 'Kéo dây bus điều khiển và lắp công tắc cảm ứng', locationArea: 'Căn hộ mẫu', assigneeId: '3', assigneeName: 'Phạm Văn Cường', startDate: '2026-10-29 08:00:00', dueDate: '2026-11-16 17:00:00', status: 'CHUA_BAT_DAU' },
  { id: '33', code: 'CV33', projectId: '7', categoryId: '10', categoryCode: 'HM01', title: 'Cấu hình kịch bản và bàn giao', description: 'Lập trình ngữ cảnh tiếp khách, nghỉ ngơi trên app', locationArea: 'Căn hộ mẫu', assigneeId: '6', assigneeName: 'Đặng Hoài Nam', startDate: '2026-11-17 08:00:00', dueDate: '2026-12-06 17:00:00', status: 'CHUA_BAT_DAU' },

  // Project 8 (NMH-2026-008) - LAP_KE_HOACH
  { id: '34', code: 'CV34', projectId: '8', categoryId: '11', categoryCode: 'HM01', title: 'Khảo sát nhà xưởng', description: 'Đo khoảng cách giữa các phân xưởng', locationArea: 'Nhà xưởng 1-3', assigneeId: '6', assigneeName: 'Đặng Hoài Nam', startDate: '2026-11-01 08:00:00', dueDate: '2026-11-06 17:00:00', status: 'CHUA_BAT_DAU' },
  { id: '35', code: 'CV35', projectId: '8', categoryId: '11', categoryCode: 'HM01', title: 'Kéo cáp quang liên tòa', description: 'Treo cáp quang luồn cống bể', locationArea: 'Liên tòa', assigneeId: '3', assigneeName: 'Phạm Văn Cường', startDate: '2026-11-07 08:00:00', dueDate: '2026-12-01 17:00:00', status: 'CHUA_BAT_DAU' },
  { id: '36', code: 'CV36', projectId: '8', categoryId: '11', categoryCode: 'HM01', title: 'Lắp tủ mạng', description: 'Lắp tủ rack công nghiệp chống bụi IP55', locationArea: 'Nhà xưởng 1-3', assigneeId: '3', assigneeName: 'Phạm Văn Cường', startDate: '2026-11-26 08:00:00', dueDate: '2026-12-16 17:00:00', status: 'CHUA_BAT_DAU' },

  // Project 9 (NMH-2026-009) - HUY
  { id: '37', code: 'CV37', projectId: '9', categoryId: '12', categoryCode: 'HM01', title: 'Lắp access point các phòng học', description: 'Đã dừng theo dự án', locationArea: 'Khối lớp học', assigneeId: '4', assigneeName: 'Nguyễn Đức Thắng', startDate: '2026-09-28 08:00:00', dueDate: '2026-10-11 17:00:00', status: 'HUY', cancelledAt: '2026-10-09 16:00:00', cancelReason: 'Hủy theo dự án (khách hàng dừng đầu tư)' },
  { id: '38', code: 'CV38', projectId: '9', categoryId: '13', categoryCode: 'HM02', title: 'Lắp camera sân trường', description: 'Đã dừng theo dự án', locationArea: 'Sân trường', assigneeId: '4', assigneeName: 'Nguyễn Đức Thắng', startDate: '2026-10-12 08:00:00', dueDate: '2026-10-27 17:00:00', status: 'HUY', cancelledAt: '2026-10-09 16:00:00', cancelReason: 'Hủy theo dự án (khách hàng dừng đầu tư)', externalAssignment: { id: '3', taskId: '38', contractorId: '1', contractorName: 'Đội thi công điện nhẹ Nguyên Khê', workDescription: 'Kéo cáp camera sân trường', startDate: '2026-10-12 08:00:00', dueDate: '2026-10-27 17:00:00', workerCount: 2, nmhCoordinatorId: '4', status: 'HUY', cancelReason: 'Hủy theo dự án (khách hàng dừng đầu tư)' } },
  { id: '39', code: 'CV39', projectId: '9', categoryId: '12', categoryCode: 'HM01', title: 'Khảo sát hiện trạng', description: 'Đã hoàn thành trước khi dự án bị hủy', locationArea: 'Toàn trường', assigneeId: '6', assigneeName: 'Đặng Hoài Nam', startDate: '2026-09-27 08:00:00', dueDate: '2026-09-30 17:00:00', status: 'HOAN_THANH', completedAt: '2026-10-01 09:00:00', approvedBy: 'Trần Quốc Bảo' },

  // Project 10 (NMH-2026-010) - In progress
  { id: '40', code: 'CV40', projectId: '10', categoryId: '14', categoryCode: 'HM01', title: 'Lắp camera và micro phòng họp', description: 'Lắp camera Tracking tự động bắt người phát biểu', locationArea: 'Phòng họp lớn', assigneeId: '5', assigneeName: 'Vũ Minh Tuấn', startDate: '2026-10-02 08:00:00', dueDate: '2026-10-18 17:00:00', status: 'DANG_THUC_HIEN' },
  { id: '41', code: 'CV41', projectId: '10', categoryId: '14', categoryCode: 'HM01', title: 'Cấu hình hệ thống hội nghị trực tuyến', description: 'Kết nối nền tảng họp trực tuyến MS Teams, Zoom', locationArea: 'Phòng họp lớn', assigneeId: '7', assigneeName: 'Bùi Thanh Hà', startDate: '2026-10-06 08:00:00', dueDate: '2026-10-14 17:00:00', status: 'HOAN_THANH', completedAt: '2026-10-08 10:00:00', approvedBy: 'Lê Thị Hồng Nhung' },
  { id: '42', code: 'CV42', projectId: '10', categoryId: '14', categoryCode: 'HM01', title: 'Chạy thử và đào tạo người dùng', description: 'Hướng dẫn cán bộ kỹ thuật vận hành phòng họp', locationArea: 'Phòng họp lớn', assigneeId: '2', assigneeName: 'Lê Thị Hồng Nhung', startDate: '2026-10-15 08:00:00', dueDate: '2026-10-24 17:00:00', status: 'CHUA_BAT_DAU' }
];

// 9 staff leaves from sheet 13_lich_nghi_ban
export const INITIAL_LEAVES: StaffLeave[] = [
  { id: '1', staffId: '9', staffName: 'Ngô Quang Huy', startDate: '2026-10-06 08:00:00', endDate: '2026-10-07 17:00:00', reason: 'Nghỉ ốm có giấy xác nhận', status: 'HIEU_LUC', recordedBy: 'Trần Quốc Bảo', recordedAt: '2026-10-05 16:00:00' },
  { id: '2', staffId: '16', staffName: 'Tạ Văn Hải', startDate: '2026-09-12 08:00:00', endDate: '2026-09-17 17:00:00', reason: 'Nghỉ phép năm', status: 'HIEU_LUC', recordedBy: 'Trần Quốc Bảo', recordedAt: '2026-09-02 10:00:00' },
  { id: '3', staffId: '20', staffName: 'Chu Văn Khánh', startDate: '2026-10-09 08:00:00', endDate: '2026-10-09 17:00:00', reason: 'Việc gia đình', status: 'HIEU_LUC', recordedBy: 'Trần Quốc Bảo', recordedAt: '2026-10-07 11:00:00' },
  { id: '4', staffId: '14', staffName: 'Cao Văn Bình', startDate: '2026-10-18 08:00:00', endDate: '2026-10-20 17:00:00', reason: 'Đi công tác ngoài tỉnh (đã xin phép)', status: 'HIEU_LUC', recordedBy: 'Trần Quốc Bảo', recordedAt: '2026-10-10 10:00:00' },
  { id: '5', staffId: '8', staffName: 'Hoàng Văn Long', startDate: '2026-10-27 08:00:00', endDate: '2026-10-28 17:00:00', reason: 'Nghỉ phép', status: 'HUY', recordedBy: 'Trần Quốc Bảo', recordedAt: '2026-10-08 10:00:00', cancelledAt: '2026-10-10 11:00:00', cancelReason: 'Nhân sự rút đơn xin nghỉ' },
  { id: '6', staffId: '6', staffName: 'Đặng Hoài Nam', startDate: '2026-11-11 08:00:00', endDate: '2026-11-15 17:00:00', reason: 'Nghỉ phép năm', status: 'HIEU_LUC', recordedBy: 'Trần Quốc Bảo', recordedAt: '2026-10-09 09:30:00' },
  { id: '7', staffId: '24', staffName: 'Nguyễn Văn Kiên', startDate: '2026-11-01 08:00:00', endDate: '2026-11-03 17:00:00', reason: 'Nghỉ phép', status: 'HIEU_LUC', recordedBy: 'Trần Quốc Bảo', recordedAt: '2026-10-11 10:00:00' },
  { id: '8', staffId: '12', staffName: 'Lý Thành Công', startDate: '2026-10-14 08:00:00', endDate: '2026-10-15 17:00:00', reason: 'Việc gia đình (đã xin phép)', status: 'HIEU_LUC', recordedBy: 'Trần Quốc Bảo', recordedAt: '2026-10-11 15:00:00' },
  { id: '9', staffId: '11', staffName: 'Đỗ Mạnh Dũng', startDate: '2026-10-13 08:00:00', endDate: '2026-10-13 12:00:00', reason: 'Khám sức khỏe định kỳ', status: 'HIEU_LUC', recordedBy: 'Trần Quốc Bảo', recordedAt: '2026-10-11 15:30:00' }
];

// Key 92 assignments from sheet 14_phan_cong
export const INITIAL_ASSIGNMENTS: Assignment[] = [
  { id: '1', taskId: '10', taskCode: 'CV10', taskName: 'Kéo cáp mạng khu văn phòng tầng 2', projectId: '3', projectCode: 'NMH-2026-003', staffId: '23', staffName: 'Phạm Văn Đạt', startDate: '2026-09-14 08:00:00', endDate: '2026-09-19 17:00:00', status: 'HIEU_LUC' },
  { id: '2', taskId: '12', taskCode: 'CV12', taskName: 'Cấu hình VLAN, firewall và định tuyến', projectId: '3', projectCode: 'NMH-2026-003', staffId: '23', staffName: 'Phạm Văn Đạt', startDate: '2026-10-09 08:00:00', endDate: '2026-10-15 17:00:00', status: 'HUY', notes: 'Đã hủy phân công' },
  { id: '3', taskId: '1', taskCode: 'CV01', taskName: 'Khảo sát hiện trạng và chốt tuyến cáp tầng 1-10', projectId: '1', projectCode: 'NMH-2026-001', staffId: '6', staffName: 'Đặng Hoài Nam', startDate: '2026-06-14 08:00:00', endDate: '2026-06-18 17:00:00', status: 'HIEU_LUC' },
  { id: '4', taskId: '1', taskCode: 'CV01', taskName: 'Khảo sát hiện trạng và chốt tuyến cáp tầng 1-10', projectId: '1', projectCode: 'NMH-2026-001', staffId: '21', staffName: 'Nguyễn Thu Trang', startDate: '2026-06-16 08:00:00', endDate: '2026-06-20 17:00:00', status: 'HIEU_LUC' },
  { id: '5', taskId: '1', taskCode: 'CV01', taskName: 'Khảo sát hiện trạng và chốt tuyến cáp tầng 1-10', projectId: '1', projectCode: 'NMH-2026-001', staffId: '3', staffName: 'Phạm Văn Cường', startDate: '2026-06-17 08:00:00', endDate: '2026-06-19 17:00:00', status: 'HIEU_LUC' },
  { id: '6', taskId: '2', taskCode: 'CV02', taskName: 'Kéo cáp mạng Cat6 và cáp quang tầng 1-10', projectId: '1', projectCode: 'NMH-2026-001', staffId: '11', staffName: 'Đỗ Mạnh Dũng', startDate: '2026-06-26 08:00:00', endDate: '2026-07-08 17:00:00', status: 'HIEU_LUC' },
  { id: '7', taskId: '2', taskCode: 'CV02', taskName: 'Kéo cáp mạng Cat6 và cáp quang tầng 1-10', projectId: '1', projectCode: 'NMH-2026-001', staffId: '12', staffName: 'Lý Thành Công', startDate: '2026-06-26 08:00:00', endDate: '2026-07-08 17:00:00', status: 'HIEU_LUC' },
  { id: '8', taskId: '2', taskCode: 'CV02', taskName: 'Kéo cáp mạng Cat6 và cáp quang tầng 1-10', projectId: '1', projectCode: 'NMH-2026-001', staffId: '18', staffName: 'Đinh Công Hậu', startDate: '2026-07-09 08:00:00', endDate: '2026-07-19 17:00:00', status: 'HIEU_LUC' },
  { id: '9', taskId: '2', taskCode: 'CV02', taskName: 'Kéo cáp mạng Cat6 và cáp quang tầng 1-10', projectId: '1', projectCode: 'NMH-2026-001', staffId: '19', staffName: 'Võ Văn Tâm', startDate: '2026-07-09 08:00:00', endDate: '2026-07-19 17:00:00', status: 'HIEU_LUC' },
  { id: '10', taskId: '3', taskCode: 'CV03', taskName: 'Lắp tủ mạng, patch panel và đấu nối', projectId: '1', projectCode: 'NMH-2026-001', staffId: '8', staffName: 'Hoàng Văn Long', startDate: '2026-07-20 08:00:00', endDate: '2026-07-28 17:00:00', status: 'HIEU_LUC' },
  { id: '11', taskId: '3', taskCode: 'CV03', taskName: 'Lắp tủ mạng, patch panel và đấu nối', projectId: '1', projectCode: 'NMH-2026-001', staffId: '15', staffName: 'Mai Đức Anh', startDate: '2026-07-20 08:00:00', endDate: '2026-07-28 17:00:00', status: 'HIEU_LUC' },
  { id: '12', taskId: '3', taskCode: 'CV03', taskName: 'Lắp tủ mạng, patch panel và đấu nối', projectId: '1', projectCode: 'NMH-2026-001', staffId: '17', staffName: 'Lương Văn Sơn', startDate: '2026-07-24 08:00:00', endDate: '2026-08-03 17:00:00', status: 'HIEU_LUC' },
  { id: '13', taskId: '4', taskCode: 'CV04', taskName: 'Lắp camera sảnh và hành lang tầng 1-10', projectId: '1', projectCode: 'NMH-2026-001', staffId: '9', staffName: 'Ngô Quang Huy', startDate: '2026-07-29 08:00:00', endDate: '2026-08-13 17:00:00', status: 'HIEU_LUC' },
  { id: '14', taskId: '4', taskCode: 'CV04', taskName: 'Lắp camera sảnh và hành lang tầng 1-10', projectId: '1', projectCode: 'NMH-2026-001', staffId: '10', staffName: 'Phan Thanh Sơn', startDate: '2026-07-29 08:00:00', endDate: '2026-08-13 17:00:00', status: 'HIEU_LUC' },
  { id: '15', taskId: '5', taskCode: 'CV05', taskName: 'Cấu hình đầu ghi NVR và nghiệm thu camera', projectId: '1', projectCode: 'NMH-2026-001', staffId: '6', staffName: 'Đặng Hoài Nam', startDate: '2026-08-19 08:00:00', endDate: '2026-08-29 17:00:00', status: 'HIEU_LUC' },
  { id: '16', taskId: '5', taskCode: 'CV05', taskName: 'Cấu hình đầu ghi NVR và nghiệm thu camera', projectId: '1', projectCode: 'NMH-2026-001', staffId: '8', staffName: 'Hoàng Văn Long', startDate: '2026-08-19 08:00:00', endDate: '2026-08-29 17:00:00', status: 'HIEU_LUC' },
  { id: '17', taskId: '6', taskCode: 'CV06', taskName: 'Lắp camera khu vực hầm B2', projectId: '1', projectCode: 'NMH-2026-001', staffId: '10', staffName: 'Phan Thanh Sơn', startDate: '2026-08-23 08:00:00', endDate: '2026-08-27 17:00:00', status: 'HUY', notes: 'Đã hủy phân công' },
  { id: '18', taskId: '6', taskCode: 'CV06', taskName: 'Lắp camera khu vực hầm B2', projectId: '1', projectCode: 'NMH-2026-001', staffId: '12', staffName: 'Lý Thành Công', startDate: '2026-08-23 08:00:00', endDate: '2026-08-27 17:00:00', status: 'HUY', notes: 'Đã hủy phân công' },
  { id: '19', taskId: '7', taskCode: 'CV07', taskName: 'Khảo sát và thiết kế phương án âm thanh', projectId: '2', projectCode: 'NMH-2026-002', staffId: '7', staffName: 'Bùi Thanh Hà', startDate: '2026-07-04 08:00:00', endDate: '2026-07-08 17:00:00', status: 'HIEU_LUC' },
  { id: '20', taskId: '7', taskCode: 'CV07', taskName: 'Khảo sát và thiết kế phương án âm thanh', projectId: '2', projectCode: 'NMH-2026-002', staffId: '22', staffName: 'Lê Hải Yến', startDate: '2026-07-06 08:00:00', endDate: '2026-07-10 17:00:00', status: 'HIEU_LUC' },
  { id: '21', taskId: '8', taskCode: 'CV08', taskName: 'Kéo cáp tín hiệu và lắp loa các phòng học', projectId: '2', projectCode: 'NMH-2026-002', staffId: '13', staffName: 'Trịnh Xuân Trường', startDate: '2026-07-16 08:00:00', endDate: '2026-08-01 17:00:00', status: 'HIEU_LUC' },
  { id: '22', taskId: '8', taskCode: 'CV08', taskName: 'Kéo cáp tín hiệu và lắp loa các phòng học', projectId: '2', projectCode: 'NMH-2026-002', staffId: '14', staffName: 'Cao Văn Bình', startDate: '2026-07-16 08:00:00', endDate: '2026-08-01 17:00:00', status: 'HIEU_LUC' },
  { id: '23', taskId: '8', taskCode: 'CV08', taskName: 'Kéo cáp tín hiệu và lắp loa các phòng học', projectId: '2', projectCode: 'NMH-2026-002', staffId: '20', staffName: 'Chu Văn Khánh', startDate: '2026-07-24 08:00:00', endDate: '2026-08-07 17:00:00', status: 'HIEU_LUC' },
  { id: '24', taskId: '9', taskCode: 'CV09', taskName: 'Lắp bộ khuếch đại, cấu hình vùng phát và nghiệm thu', projectId: '2', projectCode: 'NMH-2026-002', staffId: '7', staffName: 'Bùi Thanh Hà', startDate: '2026-08-09 08:00:00', endDate: '2026-08-19 17:00:00', status: 'HIEU_LUC' },
  { id: '25', taskId: '9', taskCode: 'CV09', taskName: 'Lắp bộ khuếch đại, cấu hình vùng phát và nghiệm thu', projectId: '2', projectCode: 'NMH-2026-002', staffId: '13', staffName: 'Trịnh Xuân Trường', startDate: '2026-08-09 08:00:00', endDate: '2026-08-19 17:00:00', status: 'HIEU_LUC' },
  { id: '26', taskId: '9', taskCode: 'CV09', taskName: 'Lắp bộ khuếch đại, cấu hình vùng phát và nghiệm thu', projectId: '2', projectCode: 'NMH-2026-002', staffId: '14', staffName: 'Cao Văn Bình', startDate: '2026-08-09 08:00:00', endDate: '2026-08-19 17:00:00', status: 'HIEU_LUC' },
  { id: '27', taskId: '10', taskCode: 'CV10', taskName: 'Kéo cáp mạng khu văn phòng tầng 2', projectId: '3', projectCode: 'NMH-2026-003', staffId: '18', staffName: 'Đinh Công Hậu', startDate: '2026-09-14 08:00:00', endDate: '2026-09-28 17:00:00', status: 'HIEU_LUC' },
  { id: '28', taskId: '10', taskCode: 'CV10', taskName: 'Kéo cáp mạng khu văn phòng tầng 2', projectId: '3', projectCode: 'NMH-2026-003', staffId: '19', staffName: 'Võ Văn Tâm', startDate: '2026-09-14 08:00:00', endDate: '2026-09-28 17:00:00', status: 'HIEU_LUC' },
  { id: '29', taskId: '11', taskCode: 'CV11', taskName: 'Lắp tủ mạng và đấu nối switch', projectId: '3', projectCode: 'NMH-2026-003', staffId: '8', staffName: 'Hoàng Văn Long', startDate: '2026-09-28 08:00:00', endDate: '2026-10-06 17:00:00', status: 'HIEU_LUC' },
  { id: '30', taskId: '11', taskCode: 'CV11', taskName: 'Lắp tủ mạng và đấu nối switch', projectId: '3', projectCode: 'NMH-2026-003', staffId: '15', staffName: 'Mai Đức Anh', startDate: '2026-09-28 08:00:00', endDate: '2026-10-06 17:00:00', status: 'HIEU_LUC' },
  { id: '31', taskId: '12', taskCode: 'CV12', taskName: 'Cấu hình VLAN, firewall và định tuyến', projectId: '3', projectCode: 'NMH-2026-003', staffId: '6', staffName: 'Đặng Hoài Nam', startDate: '2026-10-09 08:00:00', endDate: '2026-10-16 17:00:00', status: 'HIEU_LUC' },
  { id: '32', taskId: '12', taskCode: 'CV12', taskName: 'Cấu hình VLAN, firewall và định tuyến', projectId: '3', projectCode: 'NMH-2026-003', staffId: '8', staffName: 'Hoàng Văn Long', startDate: '2026-10-09 08:00:00', endDate: '2026-10-12 12:00:00', status: 'HIEU_LUC' },
  { id: '33', taskId: '12', taskCode: 'CV12', taskName: 'Cấu hình VLAN, firewall và định tuyến', projectId: '3', projectCode: 'NMH-2026-003', staffId: '15', staffName: 'Mai Đức Anh', startDate: '2026-10-09 08:00:00', endDate: '2026-10-18 17:00:00', status: 'HIEU_LUC' },
  { id: '34', taskId: '13', taskCode: 'CV13', taskName: 'Lắp access point tầng 2-3', projectId: '3', projectCode: 'NMH-2026-003', staffId: '9', staffName: 'Ngô Quang Huy', startDate: '2026-10-10 08:00:00', endDate: '2026-10-15 17:00:00', status: 'HIEU_LUC' },
  { id: '35', taskId: '13', taskCode: 'CV13', taskName: 'Lắp access point tầng 2-3', projectId: '3', projectCode: 'NMH-2026-003', staffId: '10', staffName: 'Phan Thanh Sơn', startDate: '2026-10-10 08:00:00', endDate: '2026-10-17 17:00:00', status: 'HIEU_LUC' },
  { id: '36', taskId: '13', taskCode: 'CV13', taskName: 'Lắp access point tầng 2-3', projectId: '3', projectCode: 'NMH-2026-003', staffId: '24', staffName: 'Nguyễn Văn Kiên', startDate: '2026-10-12 08:00:00', endDate: '2026-10-17 17:00:00', status: 'HIEU_LUC' },
  { id: '37', taskId: '14', taskCode: 'CV14', taskName: 'Khảo sát và tinh chỉnh vùng phủ sóng', projectId: '3', projectCode: 'NMH-2026-003', staffId: '9', staffName: 'Ngô Quang Huy', startDate: '2026-10-21 08:00:00', endDate: '2026-10-26 17:00:00', status: 'HIEU_LUC' },
  { id: '38', taskId: '14', taskCode: 'CV14', taskName: 'Khảo sát và tinh chỉnh vùng phủ sóng', projectId: '3', projectCode: 'NMH-2026-003', staffId: '6', staffName: 'Đặng Hoài Nam', startDate: '2026-10-21 08:00:00', endDate: '2026-10-28 17:00:00', status: 'HIEU_LUC' },
  { id: '39', taskId: '15', taskCode: 'CV15', taskName: 'Nghiệm thu và bàn giao hạ tầng mạng', projectId: '3', projectCode: 'NMH-2026-003', staffId: '1', staffName: 'Trần Quốc Bảo', startDate: '2026-11-02 08:00:00', endDate: '2026-11-04 17:00:00', status: 'HIEU_LUC' },
  { id: '40', taskId: '16', taskCode: 'CV16', taskName: 'Lắp hệ thống loa và micro hội trường lớn', projectId: '4', projectCode: 'NMH-2026-004', staffId: '13', staffName: 'Trịnh Xuân Trường', startDate: '2026-09-04 08:00:00', endDate: '2026-09-22 17:00:00', status: 'HIEU_LUC' },
  { id: '41', taskId: '16', taskCode: 'CV16', taskName: 'Lắp hệ thống loa và micro hội trường lớn', projectId: '4', projectCode: 'NMH-2026-004', staffId: '14', staffName: 'Cao Văn Bình', startDate: '2026-09-04 08:00:00', endDate: '2026-09-18 17:00:00', status: 'HIEU_LUC' },
  { id: '42', taskId: '16', taskCode: 'CV16', taskName: 'Lắp hệ thống loa và micro hội trường lớn', projectId: '4', projectCode: 'NMH-2026-004', staffId: '20', staffName: 'Chu Văn Khánh', startDate: '2026-09-06 08:00:00', endDate: '2026-09-24 17:00:00', status: 'HIEU_LUC' },
  { id: '43', taskId: '16', taskCode: 'CV16', taskName: 'Lắp hệ thống loa và micro hội trường lớn', projectId: '4', projectCode: 'NMH-2026-004', staffId: '13', staffName: 'Trịnh Xuân Trường', startDate: '2026-09-30 08:00:00', endDate: '2026-10-06 17:00:00', status: 'HIEU_LUC' },
  { id: '44', taskId: '16', taskCode: 'CV16', taskName: 'Lắp hệ thống loa và micro hội trường lớn', projectId: '4', projectCode: 'NMH-2026-004', staffId: '20', staffName: 'Chu Văn Khánh', startDate: '2026-10-02 08:00:00', endDate: '2026-10-07 17:00:00', status: 'HIEU_LUC' },
  { id: '45', taskId: '17', taskCode: 'CV17', taskName: 'Lắp bộ xử lý tín hiệu và khuếch đại', projectId: '4', projectCode: 'NMH-2026-004', staffId: '7', staffName: 'Bùi Thanh Hà', startDate: '2026-09-22 08:00:00', endDate: '2026-09-30 17:00:00', status: 'HIEU_LUC' },
  { id: '46', taskId: '17', taskCode: 'CV17', taskName: 'Lắp bộ xử lý tín hiệu và khuếch đại', projectId: '4', projectCode: 'NMH-2026-004', staffId: '14', staffName: 'Cao Văn Bình', startDate: '2026-09-24 08:00:00', endDate: '2026-09-30 17:00:00', status: 'HIEU_LUC' },
  { id: '47', taskId: '18', taskCode: 'CV18', taskName: 'Lắp màn hình LED và thiết bị hội nghị trực tuyến', projectId: '4', projectCode: 'NMH-2026-004', staffId: '7', staffName: 'Bùi Thanh Hà', startDate: '2026-10-04 08:00:00', endDate: '2026-10-11 17:00:00', status: 'HIEU_LUC' },
  { id: '48', taskId: '18', taskCode: 'CV18', taskName: 'Lắp màn hình LED và thiết bị hội nghị trực tuyến', projectId: '4', projectCode: 'NMH-2026-004', staffId: '14', staffName: 'Cao Văn Bình', startDate: '2026-10-04 08:00:00', endDate: '2026-10-10 17:00:00', status: 'HIEU_LUC' },
  { id: '49', taskId: '19', taskCode: 'CV19', taskName: 'Cấu hình, hiệu chỉnh âm thanh và chạy thử', projectId: '4', projectCode: 'NMH-2026-004', staffId: '5', staffName: 'Vũ Minh Tuấn', startDate: '2026-10-17 08:00:00', endDate: '2026-10-21 17:00:00', status: 'HIEU_LUC' },
  { id: '50', taskId: '19', taskCode: 'CV19', taskName: 'Cấu hình, hiệu chỉnh âm thanh và chạy thử', projectId: '4', projectCode: 'NMH-2026-004', staffId: '13', staffName: 'Trịnh Xuân Trường', startDate: '2026-10-17 08:00:00', endDate: '2026-10-21 17:00:00', status: 'HIEU_LUC' },
  { id: '51', taskId: '19', taskCode: 'CV19', taskName: 'Cấu hình, hiệu chỉnh âm thanh và chạy thử', projectId: '4', projectCode: 'NMH-2026-004', staffId: '7', staffName: 'Bùi Thanh Hà', startDate: '2026-10-17 08:00:00', endDate: '2026-10-21 17:00:00', status: 'HIEU_LUC' },
  { id: '52', taskId: '20', taskCode: 'CV20', taskName: 'Nghiệm thu và bàn giao hội trường', projectId: '4', projectCode: 'NMH-2026-004', staffId: '2', staffName: 'Lê Thị Hồng Nhung', startDate: '2026-10-21 08:00:00', endDate: '2026-10-22 17:00:00', status: 'HIEU_LUC' },
  { id: '53', taskId: '21', taskCode: 'CV21', taskName: 'Lắp camera sảnh và hành lang các tầng khách', projectId: '5', projectCode: 'NMH-2026-005', staffId: '9', staffName: 'Ngô Quang Huy', startDate: '2026-09-24 08:00:00', endDate: '2026-10-04 17:00:00', status: 'HIEU_LUC' },
  { id: '54', taskId: '21', taskCode: 'CV21', taskName: 'Lắp camera sảnh và hành lang các tầng khách', projectId: '5', projectCode: 'NMH-2026-005', staffId: '11', staffName: 'Đỗ Mạnh Dũng', startDate: '2026-09-24 08:00:00', endDate: '2026-09-28 17:00:00', status: 'HIEU_LUC' },
  { id: '55', taskId: '21', taskCode: 'CV21', taskName: 'Lắp camera sảnh và hành lang các tầng khách', projectId: '5', projectCode: 'NMH-2026-005', staffId: '11', staffName: 'Đỗ Mạnh Dũng', startDate: '2026-10-02 08:00:00', endDate: '2026-10-06 17:00:00', status: 'HIEU_LUC' },
  { id: '56', taskId: '21', taskCode: 'CV21', taskName: 'Lắp camera sảnh và hành lang các tầng khách', projectId: '5', projectCode: 'NMH-2026-005', staffId: '11', staffName: 'Đỗ Mạnh Dũng', startDate: '2026-10-13 08:00:00', endDate: '2026-10-17 17:00:00', status: 'HIEU_LUC', notes: 'Trùng lịch nghỉ #9 (13/10/2026: Khám sức khỏe định kỳ)' },
  { id: '57', taskId: '21', taskCode: 'CV21', taskName: 'Lắp camera sảnh và hành lang các tầng khách', projectId: '5', projectCode: 'NMH-2026-005', staffId: '12', staffName: 'Lý Thành Công', startDate: '2026-09-26 08:00:00', endDate: '2026-10-04 17:00:00', status: 'HIEU_LUC' },
  { id: '58', taskId: '21', taskCode: 'CV21', taskName: 'Lắp camera sảnh và hành lang các tầng khách', projectId: '5', projectCode: 'NMH-2026-005', staffId: '12', staffName: 'Lý Thành Công', startDate: '2026-10-13 08:00:00', endDate: '2026-10-16 17:00:00', status: 'HIEU_LUC', notes: 'Trùng lịch nghỉ #8 (14/10/2026: Việc gia đình)' },
  { id: '59', taskId: '21', taskCode: 'CV21', taskName: 'Lắp camera sảnh và hành lang các tầng khách', projectId: '5', projectCode: 'NMH-2026-005', staffId: '24', staffName: 'Nguyễn Văn Kiên', startDate: '2026-09-24 08:00:00', endDate: '2026-10-02 17:00:00', status: 'HIEU_LUC' },
  { id: '60', taskId: '24', taskCode: 'CV24', taskName: 'Lắp đầu đọc thẻ và khóa từ khu vực nhân viên', projectId: '5', projectCode: 'NMH-2026-005', staffId: '19', staffName: 'Võ Văn Tâm', startDate: '2026-10-07 08:00:00', endDate: '2026-10-14 17:00:00', status: 'HIEU_LUC' },
  { id: '61', taskId: '24', taskCode: 'CV24', taskName: 'Lắp đầu đọc thẻ và khóa từ khu vực nhân viên', projectId: '5', projectCode: 'NMH-2026-005', staffId: '8', staffName: 'Hoàng Văn Long', startDate: '2026-10-12 12:00:00', endDate: '2026-10-15 17:00:00', status: 'HIEU_LUC' },
  { id: '62', taskId: '24', taskCode: 'CV24', taskName: 'Lắp đầu đọc thẻ và khóa từ khu vực nhân viên', projectId: '5', projectCode: 'NMH-2026-005', staffId: '17', staffName: 'Lương Văn Sơn', startDate: '2026-10-13 08:00:00', endDate: '2026-10-20 17:00:00', status: 'HIEU_LUC' },
  { id: '63', taskId: '22', taskCode: 'CV22', taskName: 'Lắp camera bãi xe và khu vực kỹ thuật', projectId: '5', projectCode: 'NMH-2026-005', staffId: '16', staffName: 'Tạ Văn Hải', startDate: '2026-10-18 08:00:00', endDate: '2026-10-24 17:00:00', status: 'HIEU_LUC' },
  { id: '64', taskId: '23', taskCode: 'CV23', taskName: 'Cấu hình đầu ghi và hệ thống lưu trữ', projectId: '5', projectCode: 'NMH-2026-005', staffId: '15', staffName: 'Mai Đức Anh', startDate: '2026-10-22 08:00:00', endDate: '2026-10-30 17:00:00', status: 'HIEU_LUC' },
  { id: '65', taskId: '26', taskCode: 'CV26', taskName: 'Cấu hình phần mềm và phân quyền thẻ', projectId: '5', projectCode: 'NMH-2026-005', staffId: '6', staffName: 'Đặng Hoài Nam', startDate: '2026-11-01 08:00:00', endDate: '2026-11-07 17:00:00', status: 'HIEU_LUC' },
  { id: '66', taskId: '27', taskCode: 'CV27', taskName: 'Nghiệm thu và bàn giao', projectId: '5', projectCode: 'NMH-2026-005', staffId: '1', staffName: 'Trần Quốc Bảo', startDate: '2026-11-19 08:00:00', endDate: '2026-11-20 17:00:00', status: 'HIEU_LUC' },
  { id: '67', taskId: '28', taskCode: 'CV28', taskName: 'Kéo cáp thoại tầng 5-8', projectId: '6', projectCode: 'NMH-2026-006', staffId: '3', staffName: 'Phạm Văn Cường', startDate: '2026-09-20 08:00:00', endDate: '2026-10-02 17:00:00', status: 'HIEU_LUC' },
  { id: '68', taskId: '28', taskCode: 'CV28', taskName: 'Kéo cáp thoại tầng 5-8', projectId: '6', projectCode: 'NMH-2026-006', staffId: '16', staffName: 'Tạ Văn Hải', startDate: '2026-09-20 08:00:00', endDate: '2026-10-02 17:00:00', status: 'HIEU_LUC' },
  { id: '69', taskId: '28', taskCode: 'CV28', taskName: 'Kéo cáp thoại tầng 5-8', projectId: '6', projectCode: 'NMH-2026-006', staffId: '18', staffName: 'Đinh Công Hậu', startDate: '2026-10-08 08:00:00', endDate: '2026-10-16 17:00:00', status: 'HIEU_LUC' },
  { id: '70', taskId: '28', taskCode: 'CV28', taskName: 'Kéo cáp thoại tầng 5-8', projectId: '6', projectCode: 'NMH-2026-006', staffId: '16', staffName: 'Tạ Văn Hải', startDate: '2026-10-08 08:00:00', endDate: '2026-10-16 17:00:00', status: 'HIEU_LUC' },
  { id: '71', taskId: '29', taskCode: 'CV29', taskName: 'Lắp tổng đài và đấu nối', projectId: '6', projectCode: 'NMH-2026-006', staffId: '8', staffName: 'Hoàng Văn Long', startDate: '2026-10-17 08:00:00', endDate: '2026-10-24 17:00:00', status: 'HIEU_LUC' },
  { id: '72', taskId: '29', taskCode: 'CV29', taskName: 'Lắp tổng đài và đấu nối', projectId: '6', projectCode: 'NMH-2026-006', staffId: '3', staffName: 'Phạm Văn Cường', startDate: '2026-10-17 08:00:00', endDate: '2026-10-24 17:00:00', status: 'HIEU_LUC' },
  { id: '73', taskId: '31', taskCode: 'CV31', taskName: 'Khảo sát căn hộ mẫu và lập phương án', projectId: '7', projectCode: 'NMH-2026-007', staffId: '7', staffName: 'Bùi Thanh Hà', startDate: '2026-10-22 08:00:00', endDate: '2026-10-26 17:00:00', status: 'HIEU_LUC' },
  { id: '74', taskId: '31', taskCode: 'CV31', taskName: 'Khảo sát căn hộ mẫu và lập phương án', projectId: '7', projectCode: 'NMH-2026-007', staffId: '21', staffName: 'Nguyễn Thu Trang', startDate: '2026-10-23 08:00:00', endDate: '2026-10-27 17:00:00', status: 'HIEU_LUC' },
  { id: '75', taskId: '32', taskCode: 'CV32', taskName: 'Kéo cáp và lắp thiết bị điều khiển', projectId: '7', projectCode: 'NMH-2026-007', staffId: '17', staffName: 'Lương Văn Sơn', startDate: '2026-10-29 08:00:00', endDate: '2026-11-11 17:00:00', status: 'HIEU_LUC' },
  { id: '76', taskId: '32', taskCode: 'CV32', taskName: 'Kéo cáp và lắp thiết bị điều khiển', projectId: '7', projectCode: 'NMH-2026-007', staffId: '16', staffName: 'Tạ Văn Hải', startDate: '2026-10-30 08:00:00', endDate: '2026-11-11 17:00:00', status: 'HIEU_LUC' },
  { id: '77', taskId: '34', taskCode: 'CV34', taskName: 'Khảo sát nhà xưởng', projectId: '8', projectCode: 'NMH-2026-008', staffId: '3', staffName: 'Phạm Văn Cường', startDate: '2026-11-01 08:00:00', endDate: '2026-11-05 17:00:00', status: 'HIEU_LUC' },
  { id: '78', taskId: '34', taskCode: 'CV34', taskName: 'Khảo sát nhà xưởng', projectId: '8', projectCode: 'NMH-2026-008', staffId: '22', staffName: 'Lê Hải Yến', startDate: '2026-11-02 08:00:00', endDate: '2026-11-05 17:00:00', status: 'HIEU_LUC' },
  { id: '79', taskId: '37', taskCode: 'CV37', taskName: 'Lắp access point các phòng học', projectId: '9', projectCode: 'NMH-2026-009', staffId: '10', staffName: 'Phan Thanh Sơn', startDate: '2026-09-28 08:00:00', endDate: '2026-10-09 16:00:00', status: 'HIEU_LUC' },
  { id: '80', taskId: '37', taskCode: 'CV37', taskName: 'Lắp access point các phòng học', projectId: '9', projectCode: 'NMH-2026-009', staffId: '17', staffName: 'Lương Văn Sơn', startDate: '2026-09-28 08:00:00', endDate: '2026-10-09 16:00:00', status: 'HIEU_LUC' },
  { id: '81', taskId: '37', taskCode: 'CV37', taskName: 'Lắp access point các phòng học', projectId: '9', projectCode: 'NMH-2026-009', staffId: '9', staffName: 'Ngô Quang Huy', startDate: '2026-10-10 08:00:00', endDate: '2026-10-11 17:00:00', status: 'HUY', notes: 'Đã hủy phân công' },
  { id: '82', taskId: '38', taskCode: 'CV38', taskName: 'Lắp camera sân trường', projectId: '9', projectCode: 'NMH-2026-009', staffId: '10', staffName: 'Phan Thanh Sơn', startDate: '2026-10-12 08:00:00', endDate: '2026-10-17 17:00:00', status: 'HUY', notes: 'Đã hủy phân công' },
  { id: '83', taskId: '38', taskCode: 'CV38', taskName: 'Lắp camera sân trường', projectId: '9', projectCode: 'NMH-2026-009', staffId: '18', staffName: 'Đinh Công Hậu', startDate: '2026-10-12 08:00:00', endDate: '2026-10-20 17:00:00', status: 'HUY', notes: 'Đã hủy phân công' },
  { id: '84', taskId: '39', taskCode: 'CV39', taskName: 'Khảo sát hiện trạng', projectId: '9', projectCode: 'NMH-2026-009', staffId: '6', staffName: 'Đặng Hoài Nam', startDate: '2026-09-27 08:00:00', endDate: '2026-09-30 17:00:00', status: 'HIEU_LUC' },
  { id: '85', taskId: '39', taskCode: 'CV39', taskName: 'Khảo sát hiện trạng', projectId: '9', projectCode: 'NMH-2026-009', staffId: '22', staffName: 'Lê Hải Yến', startDate: '2026-09-27 08:00:00', endDate: '2026-09-29 17:00:00', status: 'HIEU_LUC' },
  { id: '86', taskId: '41', taskCode: 'CV41', taskName: 'Cấu hình hệ thống hội nghị trực tuyến', projectId: '10', projectCode: 'NMH-2026-010', staffId: '9', staffName: 'Ngô Quang Huy', startDate: '2026-10-06 08:00:00', endDate: '2026-10-08 10:00:00', status: 'HIEU_LUC' },
  { id: '87', taskId: '41', taskCode: 'CV41', taskName: 'Cấu hình hệ thống hội nghị trực tuyến', projectId: '10', projectCode: 'NMH-2026-010', staffId: '12', staffName: 'Lý Thành Công', startDate: '2026-10-06 08:00:00', endDate: '2026-10-07 17:00:00', status: 'HIEU_LUC' },
  { id: '88', taskId: '41', taskCode: 'CV41', taskName: 'Cấu hình hệ thống hội nghị trực tuyến', projectId: '10', projectCode: 'NMH-2026-010', staffId: '19', staffName: 'Võ Văn Tâm', startDate: '2026-10-09 08:00:00', endDate: '2026-10-13 17:00:00', status: 'HUY', notes: 'Đã hủy phân công' },
  { id: '89', taskId: '40', taskCode: 'CV40', taskName: 'Lắp camera và micro phòng họp', projectId: '10', projectCode: 'NMH-2026-010', staffId: '20', staffName: 'Chu Văn Khánh', startDate: '2026-10-09 08:00:00', endDate: '2026-10-18 17:00:00', status: 'HIEU_LUC' },
  { id: '90', taskId: '40', taskCode: 'CV40', taskName: 'Lắp camera và micro phòng họp', projectId: '10', projectCode: 'NMH-2026-010', staffId: '13', staffName: 'Trịnh Xuân Trường', startDate: '2026-10-12 08:00:00', endDate: '2026-10-16 17:00:00', status: 'HIEU_LUC' },
  { id: '91', taskId: '42', taskCode: 'CV42', taskName: 'Chạy thử và đào tạo người dùng', projectId: '10', projectCode: 'NMH-2026-010', staffId: '14', staffName: 'Cao Văn Bình', startDate: '2026-10-21 08:00:00', endDate: '2026-10-24 17:00:00', status: 'HIEU_LUC' },
  { id: '92', taskId: '42', taskCode: 'CV42', taskName: 'Chạy thử và đào tạo người dùng', projectId: '10', projectCode: 'NMH-2026-010', staffId: '20', staffName: 'Chu Văn Khánh', startDate: '2026-10-21 08:00:00', endDate: '2026-10-24 17:00:00', status: 'HIEU_LUC' }
];

export const INITIAL_DOCS: TechDoc[] = [
  {
    id: '1',
    projectId: '1',
    projectCode: 'NMH-2026-001',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'THIET_KE',
    title: 'Bản vẽ bố trí cáp mạng và camera tầng 1-10',
    description: 'Bản vẽ thiết kế mặt bằng toàn khu',
    floorArea: '2.247 m²',
    elevation: '+14.000',
    versions: [
      { versionNum: 1, label: 'Rev A', originalFileName: 'ban-ve-cap-mang-camera.dwg', storedPath: 'ho_so/2026/NMH-2026-001/ban-ve-cap-mang-camera-001.dwg', fileType: 'BAN_VE_CAD', fileSizeByte: 4200000, fileSizeDisplay: '4.2 MB', sha256: '3093f5fd52eeaf2923f4a226f20dc92ab3708f2373d3467aac1bff5e4b1dba2e', changeNotes: 'Bản vẽ ban đầu sau khảo sát', uploadedAt: '2026-06-15 14:00:00', isSelectedForExecution: false },
      { versionNum: 2, label: 'Rev B', originalFileName: 'ban-ve-cap-mang-camera.dwg', storedPath: 'ho_so/2026/NMH-2026-001/ban-ve-cap-mang-camera-002.dwg', fileType: 'BAN_VE_CAD', fileSizeByte: 4350000, fileSizeDisplay: '4.35 MB', sha256: '7c039b245292c743107a27af2f23623f6d7d679a49769377ddfc87d3678fe80', changeNotes: 'Cập nhật vị trí tủ mạng tầng 6', uploadedAt: '2026-06-24 14:00:00', isSelectedForExecution: true, selectedAt: '2026-06-24 16:00:00' }
    ]
  },
  {
    id: '2',
    projectId: '1',
    projectCode: 'NMH-2026-001',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'HOAN_CONG',
    title: 'Bản vẽ hoàn công hệ thống mạng và camera',
    versions: [
      { versionNum: 1, label: 'v1.0', originalFileName: 'hoan-cong-mang-camera.pdf', storedPath: 'ho_so/2026/NMH-2026-001/hoan-cong-mang-camera-001.pdf', fileType: 'PDF', fileSizeByte: 9800000, fileSizeDisplay: '9.8 MB', sha256: 'c24366e9646405f2959b1b1dc19b25c7a34bcd8eb9cc688c2db92efa60caee33', uploadedAt: '2026-09-05 14:00:00', isSelectedForExecution: true, selectedAt: '2026-09-05 16:00:00' }
    ]
  },
  {
    id: '3',
    projectId: '1',
    projectCode: 'NMH-2026-001',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'BAN_GIAO',
    title: 'Biên bản nghiệm thu và bàn giao',
    versions: [
      { versionNum: 1, label: 'v1.0', originalFileName: 'bien-ban-ban-giao.pdf', storedPath: 'ho_so/2026/NMH-2026-001/bien-ban-ban-giao-001.pdf', fileType: 'PDF', fileSizeByte: 1500000, fileSizeDisplay: '1.5 MB', sha256: '39cd6df5109789d106f63d935c6391a96948016399fcb29296341875f42a1a4d', uploadedAt: '2026-09-08 14:00:00', isSelectedForExecution: true, selectedAt: '2026-09-08 16:00:00' }
    ]
  },
  {
    id: '4',
    projectId: '2',
    projectCode: 'NMH-2026-002',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'THIET_KE',
    title: 'Sơ đồ phân vùng âm thanh thông báo',
    versions: [
      { versionNum: 1, label: 'v1', originalFileName: 'so-do-phan-vung-am-thanh.pdf', storedPath: 'ho_so/2026/NMH-2026-002/so-do-phan-vung-am-thanh-001.pdf', fileType: 'PDF', fileSizeByte: 2100000, fileSizeDisplay: '2.1 MB', sha256: '198dbb6b9c082858896ad21fb0926be39ab6fccdff03296038eac26e3392ff82', uploadedAt: '2026-07-05 14:00:00', isSelectedForExecution: false },
      { versionNum: 2, label: 'v2', originalFileName: 'so-do-phan-vung-am-thanh.pdf', storedPath: 'ho_so/2026/NMH-2026-002/so-do-phan-vung-am-thanh-002.pdf', fileType: 'PDF', fileSizeByte: 2150000, fileSizeDisplay: '2.15 MB', sha256: '55981067227b7c5214d7b1d328c0278c60161cb51dc74375f96382ddbbb6a', changeNotes: 'Bổ sung vùng phát sân trường', uploadedAt: '2026-07-14 14:00:00', isSelectedForExecution: true, selectedAt: '2026-07-14 16:00:00' }
    ]
  },
  {
    id: '5',
    projectId: '3',
    projectCode: 'NMH-2026-003',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'THIET_KE',
    title: 'Sơ đồ logic mạng LAN và VLAN',
    versions: [
      { versionNum: 1, label: 'v1', originalFileName: 'so-do-lan-vlan.pdf', storedPath: 'ho_so/2026/NMH-2026-003/so-do-lan-vlan-001.pdf', fileType: 'PDF', fileSizeByte: 1800000, fileSizeDisplay: '1.8 MB', sha256: 'e36c716a53ff924df5d6f62697c6e8cbb81c4414e4869dbdab483f058bfc053b', uploadedAt: '2026-09-11 14:00:00', isSelectedForExecution: false },
      { versionNum: 2, label: 'v2', originalFileName: 'so-do-lan-vlan.pdf', storedPath: 'ho_so/2026/NMH-2026-003/so-do-lan-vlan-002.pdf', fileType: 'PDF', fileSizeByte: 1850000, fileSizeDisplay: '1.85 MB', sha256: '2cfb0cacda4c1a247fc018da3e490c57ae143600a44eba3fdc428c1a4c6cc1bb', changeNotes: 'Tách VLAN khách và VLAN nội bộ', uploadedAt: '2026-10-08 14:00:00', isSelectedForExecution: true, selectedAt: '2026-10-08 16:00:00' }
    ]
  },
  {
    id: '6',
    projectId: '3',
    projectCode: 'NMH-2026-003',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'THI_CONG',
    title: 'Bảng khối lượng vật tư mạng văn phòng',
    versions: [
      { versionNum: 1, label: 'Bản nháp', originalFileName: 'khoi-luong-vat-tu.xlsx', storedPath: 'ho_so/2026/NMH-2026-003/khoi-luong-vat-tu-001.xlsx', fileType: 'BANG_TINH', fileSizeByte: 95000, fileSizeDisplay: '95 KB', sha256: 'f673dd765441dd5b2b7ff7d363fc354a8c9e2f68afb2d0a7957b5b3a9f84b355', uploadedAt: '2026-09-11 14:00:00', isSelectedForExecution: false },
      { versionNum: 2, label: 'Bản chốt', originalFileName: 'khoi-luong-vat-tu.xlsx', storedPath: 'ho_so/2026/NMH-2026-003/khoi-luong-vat-tu-002.xlsx', fileType: 'BANG_TINH', fileSizeByte: 98000, fileSizeDisplay: '98 KB', sha256: '1171d55cdc6a112de52567795d2e688ff3a2d33147e281da0b8280a964cbf8', changeNotes: 'Cập nhật đơn giá cáp quang', uploadedAt: '2026-09-17 14:00:00', isSelectedForExecution: false },
      { versionNum: 3, label: 'Bổ sung AP', originalFileName: 'khoi-luong-vat-tu.xlsx', storedPath: 'ho_so/2026/NMH-2026-003/khoi-luong-vat-tu-003.xlsx', fileType: 'BANG_TINH', fileSizeByte: 99500, fileSizeDisplay: '99.5 KB', sha256: '6dfac8882e74be7ae16388ddc318e845082fde62b045fac4ae3e7b7f3b98da0', changeNotes: 'Thêm 6 access point tầng 3', uploadedAt: '2026-10-09 14:00:00', isSelectedForExecution: true, selectedAt: '2026-10-09 16:00:00' }
    ]
  },
  {
    id: '7',
    projectId: '4',
    projectCode: 'NMH-2026-004',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'THIET_KE',
    title: 'Bản vẽ bố trí loa và micro hội trường lớn',
    floorArea: '1.422 m²',
    elevation: '+30.000',
    versions: [
      { versionNum: 1, label: 'Rev A', originalFileName: 'bo-tri-loa-micro.dwg', storedPath: 'ho_so/2026/NMH-2026-004/bo-tri-loa-micro-001.dwg', fileType: 'BAN_VE_CAD', fileSizeByte: 5200000, fileSizeDisplay: '5.2 MB', sha256: '2d8552885875b7bb6a1fa6dae0c26d41905a552ab3c2d3bdf874e97a8f8c8fe2', uploadedAt: '2026-09-01 14:00:00', isSelectedForExecution: false },
      { versionNum: 2, label: 'Rev B', originalFileName: 'bo-tri-loa-micro.dwg', storedPath: 'ho_so/2026/NMH-2026-004/bo-tri-loa-micro-002.dwg', fileType: 'BAN_VE_CAD', fileSizeByte: 5300000, fileSizeDisplay: '5.3 MB', sha256: '3a5d0e74e000740e360e23be93b559a09c353ceb1ae56bbacba2b3cff26ca8', changeNotes: 'Điều chỉnh loa cánh trái sau khảo sát âm học', uploadedAt: '2026-10-04 14:00:00', isSelectedForExecution: true, selectedAt: '2026-10-04 16:00:00' }
    ]
  },
  {
    id: '8',
    projectId: '4',
    projectCode: 'NMH-2026-004',
    taskId: '18',
    taskCode: 'CV18',
    scope: 'RIENG_CONG_VIEC',
    type: 'THI_CONG',
    title: 'Sơ đồ đấu nối màn hình LED và thiết bị hội nghị',
    versions: [
      { versionNum: 1, label: 'v1.0', originalFileName: 'so-do-dau-noi-led.pdf', storedPath: 'ho_so/2026/NMH-2026-004/so-do-dau-noi-led-001.pdf', fileType: 'PDF', fileSizeByte: 2400000, fileSizeDisplay: '2.4 MB', sha256: '6a5a7bda34805f07daa1a41f9d51c55d5e981f30ea4d4df40b856881b98d61c9', uploadedAt: '2026-10-04 14:00:00', isSelectedForExecution: true, selectedAt: '2026-10-04 16:00:00' }
    ]
  },
  {
    id: '9',
    projectId: '5',
    projectCode: 'NMH-2026-005',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'THIET_KE',
    title: 'Bản vẽ bố trí camera hành lang các tầng khách',
    floorArea: '2.247 m²',
    elevation: '+22.000',
    versions: [
      { versionNum: 1, label: 'Rev A', originalFileName: 'bo-tri-camera-hanh-lang.dwg', storedPath: 'ho_so/2026/NMH-2026-005/bo-tri-camera-hanh-lang-001.dwg', fileType: 'BAN_VE_CAD', fileSizeByte: 6100000, fileSizeDisplay: '6.1 MB', sha256: '18d28bc2e645c38cb23801d19333ebb25fcacc350766046f354c2983d5f6627a', uploadedAt: '2026-09-21 14:00:00', isSelectedForExecution: false },
      { versionNum: 2, label: 'Rev B', originalFileName: 'bo-tri-camera-hanh-lang.dwg', storedPath: 'ho_so/2026/NMH-2026-005/bo-tri-camera-hanh-lang-002.dwg', fileType: 'BAN_VE_CAD', fileSizeByte: 6150000, fileSizeDisplay: '6.15 MB', sha256: '2bc2e2b785adc5b6fdb3fb4129c4b1fcdf303af42052570776d77bebe236323', changeNotes: 'Thêm camera cầu thang bộ', uploadedAt: '2026-09-27 14:00:00', isSelectedForExecution: false },
      { versionNum: 3, label: 'Rev C', originalFileName: 'bo-tri-camera-hanh-lang.dwg', storedPath: 'ho_so/2026/NMH-2026-005/bo-tri-camera-hanh-lang-003.dwg', fileType: 'BAN_VE_CAD', fileSizeByte: 6180000, fileSizeDisplay: '6.18 MB', sha256: '5c3f0d819c90cc8ec387d8598b37c581c5af795b156d76a9622b769820e7ee', changeNotes: 'Dời camera tầng 6 theo hiện trạng', uploadedAt: '2026-10-06 14:00:00', isSelectedForExecution: true, selectedAt: '2026-10-06 16:00:00' }
    ]
  },
  {
    id: '10',
    projectId: '5',
    projectCode: 'NMH-2026-005',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'THI_CONG',
    title: 'BẢN SHOP khóa từ và đầu đọc thẻ (kèm tham chiếu ngoài)',
    description: 'Bộ bản vẽ nén kèm tệp tham chiếu ngoài; chưa chọn bản triển khai',
    versions: [
      { versionNum: 1, label: 'Bản gửi lần 1', originalFileName: 'shop-khoa-tu-dau-doc.zip', storedPath: 'ho_so/2026/NMH-2026-005/shop-khoa-tu-dau-doc-001.zip', fileType: 'NEN', fileSizeByte: 18500000, fileSizeDisplay: '18.5 MB', sha256: '74ef1bd61bd893ffa1894fd0946b6f657a5336ba17d27aa3329e5ab1dc3032da', uploadedAt: '2026-10-01 14:00:00', isSelectedForExecution: false }
      // NOTE: duoc_chon = 0 (Chưa chọn bản triển khai -> KB19/KB21)
    ]
  },
  {
    id: '11',
    projectId: '5',
    projectCode: 'NMH-2026-005',
    taskId: '25',
    taskCode: 'CV25',
    scope: 'RIENG_CONG_VIEC',
    type: 'THI_CONG',
    title: 'Bảng khối lượng cáp tín hiệu nhà A1',
    description: 'Bảng khối lượng gửi đội thi công bên ngoài (đối chiếu nghiệm thu khối lượng)',
    versions: [
      { versionNum: 1, label: 'v1.0', originalFileName: 'khoi-luong-cap-nha-a1.xlsx', storedPath: 'ho_so/2026/NMH-2026-005/khoi-luong-cap-nha-a1-001.xlsx', fileType: 'BANG_TINH', fileSizeByte: 76000, fileSizeDisplay: '76 KB', sha256: '6f1b6d9e206c0e993e3087e6063ae92b2d933870033dbf5494f47c4d3af2ed24', uploadedAt: '2026-10-02 14:00:00', isSelectedForExecution: true, selectedAt: '2026-10-02 16:00:00' }
    ]
  },
  {
    id: '12',
    projectId: '6',
    projectCode: 'NMH-2026-006',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'THIET_KE',
    title: 'Sơ đồ đi cáp thoại tầng 5-8',
    versions: [
      { versionNum: 1, label: 'v1.0', originalFileName: 'so-do-cap-thoai.pdf', storedPath: 'ho_so/2026/NMH-2026-006/so-do-cap-thoai-001.pdf', fileType: 'PDF', fileSizeByte: 2200000, fileSizeDisplay: '2.2 MB', sha256: 'f691e9c51ede3a9960abb9f1871d0bb37bf68904bbc675c854ce5b9f1d18b993', uploadedAt: '2026-09-16 14:00:00', isSelectedForExecution: true, selectedAt: '2026-09-16 16:00:00' }
    ]
  },
  {
    id: '13',
    projectId: '9',
    projectCode: 'NMH-2026-009',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'THIET_KE',
    title: 'Biên bản khảo sát hiện trạng trường mầm non',
    versions: [
      { versionNum: 1, label: 'v1.0', originalFileName: 'khao-sat-mam-non.pdf', storedPath: 'ho_so/2026/NMH-2026-009/khao-sat-mam-non-001.pdf', fileType: 'PDF', fileSizeByte: 3300000, fileSizeDisplay: '3.3 MB', sha256: '72d42177ae4f084eaf1ceb7fb0a063e152e509932b84c9f6a89dd7fe829fb67c', uploadedAt: '2026-09-29 14:00:00', isSelectedForExecution: true, selectedAt: '2026-09-29 16:00:00' }
    ]
  },
  {
    id: '14',
    projectId: '10',
    projectCode: 'NMH-2026-010',
    scope: 'DUNG_CHUNG_DU_AN',
    type: 'THI_CONG',
    title: 'Sơ đồ đấu nối thiết bị hội nghị phòng họp',
    versions: [
      { versionNum: 1, label: 'v1.0', originalFileName: 'so-do-hoi-nghi.pdf', storedPath: 'ho_so/2026/NMH-2026-010/so-do-hoi-nghi-001.pdf', fileType: 'PDF', fileSizeByte: 1900000, fileSizeDisplay: '1.9 MB', sha256: '2e26311efc9d31f43f831022eca315ce9e787eef5cf749208c4dd0bd76359972', uploadedAt: '2026-09-30 14:00:00', isSelectedForExecution: true, selectedAt: '2026-09-30 16:00:00' }
    ]
  }
];

// Key work updates from sheet 17_cap_nhat_ket_qua (including correction #24 correcting #23 on CV12)
export const INITIAL_WORK_LOGS: WorkLog[] = [
  {
    id: '23',
    taskId: '12',
    taskCode: 'CV12',
    projectId: '3',
    submittedByUsername: 'qly.bao',
    submittedByStaffName: 'Trần Quốc Bảo',
    submittedAt: '2026-10-10 17:00:00',
    content: 'Đã cấu hình VLAN cho tầng 2; đang thử định tuyến giữa các VLAN.',
    requestApproval: false,
    statusVerifiedByManager: true,
    isCorrected: true
  },
  {
    id: '24',
    taskId: '12',
    taskCode: 'CV12',
    projectId: '3',
    submittedByUsername: 'qly.bao',
    submittedByStaffName: 'Trần Quốc Bảo',
    submittedAt: '2026-10-11 08:30:00',
    content: 'Đính chính: số VLAN đã cấu hình là 6 (không phải 5 như báo cáo ngày -2).',
    requestApproval: false,
    statusVerifiedByManager: true,
    correctionForLogId: '23'
  },
  {
    id: '26',
    taskId: '13',
    taskCode: 'CV13',
    projectId: '3',
    submittedByUsername: 'dt.thang',
    submittedByStaffName: 'Nguyễn Đức Thắng',
    submittedAt: '2026-10-11 16:50:00',
    content: 'Đã lắp 8/14 access point tầng 2.',
    requestApproval: false,
    statusVerifiedByManager: true
  },
  {
    id: '29',
    taskId: '16',
    taskCode: 'CV16',
    projectId: '4',
    submittedByUsername: 'dt.tuan',
    submittedByStaffName: 'Vũ Minh Tuấn',
    submittedAt: '2026-10-07 17:20:00',
    content: 'Còn micro bàn chủ tọa chưa lắp do chờ phụ kiện.',
    issuesFaced: 'Chậm do chờ phụ kiện',
    requestApproval: false,
    statusVerifiedByManager: false
  },
  {
    id: '30',
    taskId: '18',
    taskCode: 'CV18',
    projectId: '4',
    submittedByUsername: 'dt.tuan',
    submittedByStaffName: 'Vũ Minh Tuấn',
    submittedAt: '2026-10-09 16:40:00',
    content: 'Đã lắp khung màn hình LED; chuẩn bị đấu nối bộ điều khiển.',
    requestApproval: false,
    statusVerifiedByManager: true
  },
  {
    id: '34',
    taskId: '25',
    taskCode: 'CV25',
    projectId: '5',
    submittedByUsername: 'qly.bao',
    submittedByStaffName: 'Trần Quốc Bảo',
    submittedAt: '2026-10-08 17:20:00',
    content: 'Đội Nguyên Khê đã kéo xong khoảng 60% tuyến cáp tầng 1-3 nhà A1.',
    requestApproval: false,
    statusVerifiedByManager: true
  },
  {
    id: '35',
    taskId: '25',
    taskCode: 'CV25',
    projectId: '5',
    submittedByUsername: 'qly.bao',
    submittedByStaffName: 'Trần Quốc Bảo',
    submittedAt: '2026-10-11 17:05:00',
    content: 'Đội Nguyên Khê hoàn thành tuyến cáp tầng 4; còn tầng 5. Đề nghị nghiệm thu khối lượng từng tầng.',
    requestApproval: false,
    statusVerifiedByManager: true
  },
  {
    id: '36',
    taskId: '28',
    taskCode: 'CV28',
    projectId: '6',
    submittedByUsername: 'dt.cuong',
    submittedByStaffName: 'Phạm Văn Cường',
    submittedAt: '2026-10-09 16:30:00',
    content: 'Đã kéo xong cáp thoại tầng 5-6; dự án chuyển Tạm dừng từ ngày -2.',
    requestApproval: false,
    statusVerifiedByManager: true
  },
  {
    id: '37',
    taskId: '40',
    taskCode: 'CV40',
    projectId: '10',
    submittedByUsername: 'dt.tuan',
    submittedByStaffName: 'Vũ Minh Tuấn',
    submittedAt: '2026-10-10 17:00:00',
    content: 'Đã lắp camera phòng họp và 4/6 micro.',
    requestApproval: false,
    statusVerifiedByManager: true
  },
  {
    id: '38',
    taskId: '41',
    taskCode: 'CV41',
    projectId: '10',
    submittedByUsername: 'dt.tuan',
    submittedByStaffName: 'Vũ Minh Tuấn',
    submittedAt: '2026-10-08 09:30:00',
    content: 'Đã cấu hình xong hệ thống hội nghị và kiểm tra kết nối; đề nghị xác nhận hoàn thành sớm.',
    requestApproval: true,
    statusVerifiedByManager: true
  }
];
