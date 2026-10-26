export type UserRole = 
  | 'QUAN_TRI' 
  | 'QUAN_LY' 
  | 'DOI_TRUONG' 
  | 'BAN_GIAM_DOC'
  | 'admin' 
  | 'manager' 
  | 'team_lead' 
  | 'director';

export interface UserAccount {
  id: string; // number string e.g. "1", "2"
  username?: string; // ten_dang_nhap
  name: string; // ten_hien_thi
  email?: string;
  role: UserRole;
  staffId?: string; // nhan_su_id
  isActive: boolean;
  lockReason?: string;
  lastLogin?: string;
  assignedProjectIds?: string[]; // pham_vi_du_an for QUAN_LY
  scopeGrants?: Record<string, { grantedBy: string; grantedAt: string }>; // người cấp & thời điểm cấp theo dự án
  lockedAt?: string;
  createdAt?: string;
  mustChangePassword?: boolean;
  passwordResetAt?: string;
}

export type StaffRoleTitle = 
  | 'QUAN_LY' 
  | 'DOI_TRUONG' 
  | 'KY_SU' 
  | 'KY_THUAT_VIEN' 
  | 'CONG_NHAN' 
  | 'NHAN_VIEN_THIET_KE'
  | string;

export type StaffSpecialty = string;

export interface Staff {
  id: string; // e.g. "1", "2"
  code: string; // e.g. "NV001"
  name: string; // ho_ten
  roleTitle: StaffRoleTitle; // chuc_danh
  roleTitleDisplay: string;
  teamId?: string; // doi_id (1: DTC1, 2: DTC2, 3: DTC3, 4: TTK)
  teamName?: string;
  department?: string; // alias for team
  phone: string;
  email: string;
  specialty: string;
  isActive: boolean; // DANG_LAM_VIEC / NGUNG_LAM_VIEC
  startDate: string; // ngay_vao_lam
  leaveDate?: string; // ngay_ngung_lam_viec
  notes?: string;
  skills?: StaffSkill[]; // nhan_su_chuyen_mon
}

/** Danh mục Tổ đội (doi_thi_cong) */
export interface Team {
  id: string;
  code: string;
  name: string;
  kind: 'THI_CONG' | 'THIET_KE' | string;
  description?: string;
}

/** Danh mục Chuyên môn (chuyen_mon) */
export interface SkillCatalog {
  id: string;
  code: string;
  name: string;
  description?: string;
}

/** Danh mục Loại hệ thống (loai_he_thong) */
export interface SystemType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface StaffSkill {
  name: string;
  level: 'CO_BAN' | 'THANH_THAO' | 'CHUYEN_SAU';
  isPrimary?: boolean;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type ProjectStatus = 
  | 'LAP_KE_HOACH' 
  | 'DANG_THUC_HIEN' 
  | 'TAM_DUNG' 
  | 'HOAN_THANH' 
  | 'HUY'
  | 'planning' 
  | 'in_progress' 
  | 'paused' 
  | 'completed' 
  | 'cancelled';

/** Đội khoán ngoài gắn với dự án và số nhân sự tham gia */
export interface ProjectExternalTeam {
  contractorId: string;
  workerCount: number;
}

export interface Project {
  id: string; // "1", "2"...
  code: string; // "NMH-2026-001"
  name: string;
  clientId?: string;
  clientName?: string;
  client?: string; // alias for clientName
  place: string;
  scopeSummary: string;
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
  managerId: string; // nhan_su_phu_trach_id
  managerName?: string;
  totalFloorArea?: string; // e.g. "2.247 m²"
  completedAt?: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  createdAt?: string;
  externalTeams?: ProjectExternalTeam[]; // du_an_doi_ben_ngoai
}

export interface Category {
  id: string; // hang_muc id
  projectId: string;
  code: string; // "HM01", "HM02"
  name: string;
  systemTypeId: string;
  systemTypeName: string;
  orderNum: number;
  description?: string;
}

export type TaskStage = 'Khảo sát' | 'Thiết kế' | 'Xây dựng' | 'Hoàn thiện' | 'Nghiệm thu' | string;

export type TaskStatus = 
  | 'CHUA_BAT_DAU' 
  | 'DANG_THUC_HIEN' 
  | 'HOAN_THANH' 
  | 'HUY'
  | 'not_started' 
  | 'plan' 
  | 'doing' 
  | 'done' 
  | 'completed' 
  | 'cancelled';

export interface ExternalSubcontractor {
  id: string;
  companyName: string;
  address?: string;
  taxCode?: string;
  contactPerson: string;
  contactTitle?: string;
  phone: string;
  area: string;
  status: 'HOP_TAC' | 'NGUNG_HOP_TAC';
  notes?: string;
  assignedTaskCount?: number;
}

export interface ExternalDailyStaffing {
  date: string; // YYYY-MM-DD
  presentCount: number;
  names?: string;
  content?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ExternalAssignment {
  id: string;
  taskId: string;
  contractorId: string;
  contractorName: string;
  workDescription: string;
  startDate: string;
  dueDate: string;
  workerCount?: number;
  contractValue?: number;
  nmhCoordinatorId: string;
  status: 'HIEU_LUC' | 'HUY' | 'active' | 'cancelled';
  cancelReason?: string;
  cancelledAt?: string;
  notes?: string;
  projectId?: string;
  dailyStaffing?: ExternalDailyStaffing[];
}

export interface Task {
  id: string; // "1", "2"...
  code?: string; // "CV01", "CV02"...
  projectId: string;
  categoryId?: string;
  categoryCode?: string;
  stage?: TaskStage; // stage alias
  title: string;
  description: string;
  locationArea?: string;
  assigneeId: string; // nhan_su_chinh_id
  assigneeName?: string;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  completedAt?: string;
  approvedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  lastUpdated?: string;
  createdAt?: string;
  latestResultSummary?: string;
  resultSummary?: string; // alias
  externalAssignment?: ExternalAssignment;
  externalSubcontractor?: {
    companyName: string;
    contactPerson: string;
    phone: string;
    workerCount?: number;
    scope?: string;
  };
}

export interface Assignment {
  id: string; // "1", "2"...
  taskId: string;
  taskCode?: string;
  taskName?: string;
  projectId: string;
  projectCode?: string;
  staffId: string;
  staffName?: string;
  startDate: string;
  endDate: string;
  status: 'HIEU_LUC' | 'HUY' | 'active' | 'cancelled';
  notes?: string;
  shiftNotes?: string; // alias
  assignedBy?: string;
  createdAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  affectedDeferred?: boolean; // Quản lý chọn "Để sau" khi bị lịch nghỉ/bận ảnh hưởng
}

export interface StaffLeave {
  id: string; // "1", "2"...
  staffId: string;
  staffName?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'HIEU_LUC' | 'HUY' | 'active' | 'cancelled';
  recordedBy?: string;
  recordedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

/** Nhận xét của Quản lý trên một báo cáo hiện trường */
export interface WorkLogComment {
  id: string;
  kind: 'NHAN_XET' | 'PHE_DUYET' | 'YEU_CAU_CAP_NHAT';
  content: string;
  by: string;
  byAccountId?: string;
  at: string;
}

export interface WorkLog {
  id: string; // "1", "2"...
  taskId: string;
  taskCode?: string;
  projectId: string;
  submittedByUsername?: string;
  submittedByStaffName?: string;
  submittedByStaffId?: string;
  submittedAt: string;
  content: string;
  completedVolume?: string;
  issuesFaced?: string;
  requestApproval?: boolean;
  statusVerifiedByManager?: boolean;
  correctionForLogId?: string;
  isCorrected?: boolean;
  submittedByAccountId?: string;
  submittedByRole?: string;
  recordedByManager?: boolean; // Ghi nhận thay hiện trường
  externalAssignmentId?: string;
  photos?: { name: string; dataUrl?: string; url?: string; size?: number }[];
  comments?: WorkLogComment[]; // nhan_xet_cap_nhat: nhận xét, phê duyệt, yêu cầu cập nhật lại của Quản lý
  // Ghi chú đội thi công ngoài (không bắt buộc) – nguồn dữ liệu cho BC-04
  externalTeamId?: string;
  externalTeamCount?: number;
  externalStaffingStatus?: 'DU' | 'THIEU' | 'THUA';
  externalTeamNote?: string;
  proofFile?: {
    originalName: string;
    filePath: string;
    fileSize: number;
    sha256: string;
    mimeType: string;
  };
}

export type TechDocType = 'THIET_KE' | 'THI_CONG' | 'HOAN_CONG' | 'NGHIEM_THU' | 'BAN_GIAO' | string;
export type DocType = TechDocType;

export interface TechDocVersion {
  versionNum: number;
  label: string; // e.g. "Rev A", "Rev B", "v1.0"
  originalFileName: string;
  storedPath: string;
  fileType: 'BAN_VE_CAD' | 'PDF' | 'ANH' | 'BANG_TINH' | 'NEN' | 'KHAC' | string;
  fileSizeByte?: number;
  fileSizeDisplay?: string;
  sha256?: string;
  changeNotes?: string;
  uploadedAt: string;
  isSelectedForExecution: boolean;
  selectedAt?: string;
  selectedBy?: string;
  uploadedBy?: string;
}

export interface TechDoc {
  id: string; // "1", "2"...
  projectId: string;
  projectCode?: string;
  taskId?: string;
  taskCode?: string;
  scope?: 'DUNG_CHUNG_DU_AN' | 'RIENG_CONG_VIEC' | string;
  type: TechDocType;
  title?: string;
  name?: string; // alias
  description?: string;
  version?: string; // alias
  fileFormat?: 'docx' | 'dwg' | 'pdf' | 'xlsx' | 'zip' | string;
  fileSize?: string;
  date?: string;
  floorLevel?: string;
  isOfficialBlueprint?: boolean;
  uploadedByStaffId?: string;
  uploadedBy?: string;
  createdAt?: string;
  versions?: TechDocVersion[];
  floorArea?: string;
  elevation?: string;
  blueprintDetails?: {
    roomList: string[];
    architecturalNotes: string[];
    technicalLayers: Record<string, boolean>;
  };
}

export interface SystemConfig {
  evaluationTimestamp: string; // THOI_DIEM_TRA_CUU – để trống: dùng giờ máy; có giá trị: cố định để nhập dữ liệu mẫu
  upcomingThresholdDays: number; // SO_NGAY_SAP_DEN_HAN (7)
  sessionTimeoutMinutes: number; // THOI_GIAN_HET_PHIEN_PHUT (30)
  maxUploadSizeMB: number; // 50
  allowedFileTypes: string; // BAN_VE_CAD,PDF,ANH,BANG_TINH,NEN
  backupRetentionCount?: number; // SO_NGAY_GIU_SAO_LUU (7)
  updatedAt?: Record<string, string>; // thời điểm cập nhật gần nhất của từng khóa
}

export type AuditAction =
  | 'TAO_MOI'
  | 'DIEU_CHINH'
  | 'DOI_TRANG_THAI'
  | 'HUY'
  | 'XAC_NHAN_HOAN_THANH'
  | 'KET_THUC_SOM'
  | 'TAI_LEN'
  | 'CHON_BAN_TRIEN_KHAI'
  | 'KHOA'
  | 'MO_KHOA';

export interface AuditLog {
  id: string;
  time: string; // YYYY-MM-DD HH:mm:ss
  user: string; // tên đăng nhập hoặc 'Hệ thống'
  action: AuditAction;
  objectType: string; // Dự án, Công việc, Phân công, Lịch nghỉ/bận, Phiên bản hồ sơ, Tài khoản, Nhân sự đội ngoài theo ngày
  objectId: string;
  reason?: string;
  oldVal?: any;
  newVal?: any;
}
