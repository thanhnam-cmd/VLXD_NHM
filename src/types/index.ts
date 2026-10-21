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
  cancelledAt?: string;
  cancelReason?: string;
}

export interface Category {
  id: string; // hang_muc id
  projectId: string;
  code: string; // "HM01", "HM02"
  name: string;
  systemTypeId: string;
  systemTypeName: string;
  orderNum: number;
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
  contactPerson: string;
  phone: string;
  area: string;
  status: 'HOP_TAC' | 'NGUNG_HOP_TAC';
  assignedTaskCount?: number;
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
  nmhCoordinatorId: string;
  status: 'HIEU_LUC' | 'HUY' | 'active' | 'cancelled';
  cancelReason?: string;
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
  cancelReason?: string;
  lastUpdated?: string;
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
  cancelReason?: string;
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
  evaluationTimestamp: string; // THOI_DIEM_TRA_CUU (fixed 2026-10-12 09:00:00)
  upcomingThresholdDays: number; // SO_NGAY_SAP_DEN_HAN (7)
  sessionTimeoutMinutes: number; // THOI_GIAN_HET_PHIEN_PHUT (30)
  maxUploadSizeMB: number; // 50
  allowedFileTypes: string; // BAN_VE_CAD,PDF,ANH,BANG_TINH,NEN
}
