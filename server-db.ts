/**
 * Lớp truy cập CSDL PostgreSQL "VLXD" cho giao diện.
 * – bootstrap(): đọc toàn bộ dữ liệu nghiệp vụ, trả về đúng cấu trúc mà giao diện dùng.
 * – syncEntity(): ghi (thêm hoặc cập nhật) các bản ghi vừa thay đổi ở giao diện.
 * – ensureSchemaExtensions(): bổ sung cột/bảng còn thiếu so với đặc tả, không xóa hay đổi cột cũ.
 * Hệ thống không xóa dữ liệu nghiệp vụ (QC-08) nên không có thao tác DELETE trên bảng nghiệp vụ.
 */
import pg from 'pg';
import crypto from 'crypto';

type Row = Record<string, any>;

const TS = (col: string) => `TO_CHAR(${col}, 'YYYY-MM-DD HH24:MI:SS')`;

const ROLE_TITLE_LABEL: Record<string, string> = {
  QUAN_LY: 'Quản lý dự án',
  DOI_TRUONG: 'Đội trưởng',
  KY_SU: 'Kỹ sư kỹ thuật',
  KY_THUAT_VIEN: 'Kỹ thuật viên',
  CONG_NHAN: 'Công nhân thi công',
  NHAN_VIEN_THIET_KE: 'Nhân viên thiết kế'
};

const OBJECT_TYPE_LABEL: Record<string, string> = {
  DuAn: 'Dự án', CongViec: 'Công việc', PhanCong: 'Phân công', LichNghiBan: 'Lịch nghỉ/bận',
  PhienBanHoSo: 'Phiên bản hồ sơ', TaiKhoan: 'Tài khoản', NhanSuNgoaiTheoNgay: 'Nhân sự đội ngoài theo ngày'
};

const LEVEL_FROM_DB: Record<string, string> = { CO_BAN: 'CO_BAN', THANH_THAO: 'THANH_THAO', CHUYEN_SAU: 'CHUYEN_SAU' };

const CONFIG_KEYS: [string, string][] = [
  ['evaluationTimestamp', 'THOI_DIEM_TRA_CUU'],
  ['upcomingThresholdDays', 'SO_NGAY_SAP_DEN_HAN'],
  ['sessionTimeoutMinutes', 'THOI_GIAN_HET_PHIEN_PHUT'],
  ['maxUploadSizeMB', 'DUNG_LUONG_TAI_LEN_TOI_DA_MB'],
  ['allowedFileTypes', 'LOAI_TEP_CHO_PHEP'],
  ['backupRetentionCount', 'SO_NGAY_GIU_SAO_LUU']
];

const toInt = (v: any): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(String(v), 10);
  return isNaN(n) ? null : n;
};
const toTs = (v: any): string | null => (v ? String(v).replace('T', ' ') : null);
const str = (v: any): string | null => (v === undefined || v === null || v === '' ? null : String(v));

// ---------------------------------------------------------------------------
// Mật khẩu: băm scrypt (không lưu dạng rõ). Dữ liệu mẫu dùng mật khẩu chung Nmh@2026.
// ---------------------------------------------------------------------------
export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
};

export const verifyPassword = (password: string, stored: string | null | undefined) => {
  if (!stored) return false;
  if (stored.startsWith('scrypt$')) {
    const [, salt, hash] = stored.split('$');
    const test = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
  }
  // Tài khoản mẫu chưa đổi mật khẩu: chấp nhận mật khẩu thử nghiệm chung
  return password === 'Nmh@2026';
};

// ---------------------------------------------------------------------------
// Migration bổ sung (idempotent)
// ---------------------------------------------------------------------------
export async function ensureSchemaExtensions(pool: pg.Pool) {
  const exists = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='du_an'`);
  if (exists.rowCount === 0) return;
  await pool.query(`
    ALTER TABLE tai_khoan ADD COLUMN IF NOT EXISTS phai_doi_mat_khau INT DEFAULT 0;
    ALTER TABLE phan_cong ADD COLUMN IF NOT EXISTS de_xu_ly_sau INT DEFAULT 0;
    ALTER TABLE doi_ben_ngoai ADD COLUMN IF NOT EXISTS dia_chi TEXT;
    ALTER TABLE doi_ben_ngoai ADD COLUMN IF NOT EXISTS ma_so_thue VARCHAR(20);
    ALTER TABLE doi_ben_ngoai ADD COLUMN IF NOT EXISTS chuc_vu_lien_he VARCHAR(100);
    ALTER TABLE phan_cong_ben_ngoai ADD COLUMN IF NOT EXISTS gia_tri_khoan BIGINT;
    CREATE TABLE IF NOT EXISTS nhan_su_ngoai_theo_ngay (
      phan_cong_ben_ngoai_id INT REFERENCES phan_cong_ben_ngoai(id),
      ngay DATE NOT NULL,
      so_co_mat INT NOT NULL DEFAULT 0,
      ho_ten TEXT,
      noi_dung TEXT,
      nguoi_cap_nhat VARCHAR(150),
      thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (phan_cong_ben_ngoai_id, ngay)
    );
  `);
  // Đồng bộ tên khóa cấu hình theo MH-20
  await pool.query(`
    UPDATE cau_hinh SET khoa_cau_hinh = 'SO_NGAY_SAP_DEN_HAN'
      WHERE khoa_cau_hinh = 'SO_NGAY_CANH_BAO_SAP_DEN_HAN' AND NOT EXISTS (SELECT 1 FROM cau_hinh WHERE khoa_cau_hinh = 'SO_NGAY_SAP_DEN_HAN');
    UPDATE cau_hinh SET khoa_cau_hinh = 'DUNG_LUONG_TAI_LEN_TOI_DA_MB'
      WHERE khoa_cau_hinh = 'DUNG_LUONG_TOI_DA_TEP_MB' AND NOT EXISTS (SELECT 1 FROM cau_hinh WHERE khoa_cau_hinh = 'DUNG_LUONG_TAI_LEN_TOI_DA_MB');
    INSERT INTO cau_hinh (khoa_cau_hinh, gia_tri, mo_ta) VALUES ('SO_NGAY_GIU_SAO_LUU', '7', 'Số bản sao lưu hằng ngày được giữ')
      ON CONFLICT (khoa_cau_hinh) DO NOTHING;
  `);
}

// ---------------------------------------------------------------------------
// Đọc toàn bộ dữ liệu
// ---------------------------------------------------------------------------
export async function bootstrap(pool: pg.Pool) {
  const q = async (sql: string) => (await pool.query(sql)).rows;

  const accountsRaw = await q(`
    SELECT tk.id::text, tk.ten_dang_nhap AS username, tk.ten_hien_thi AS name, vt.ma AS role,
      tk.nhan_su_id::text AS "staffId", (tk.trang_thai = 'HOAT_DONG') AS "isActive", tk.ly_do_khoa AS "lockReason",
      ${TS('tk.thoi_diem_khoa')} AS "lockedAt", ${TS('tk.thoi_diem_dang_nhap_cuoi')} AS "lastLogin",
      ${TS('tk.thoi_diem_tao')} AS "createdAt", COALESCE(tk.phai_doi_mat_khau, 0) = 1 AS "mustChangePassword"
    FROM tai_khoan tk JOIN vai_tro vt ON tk.vai_tro_id = vt.id ORDER BY tk.id`);
  const scopes = await q(`
    SELECT p.tai_khoan_id::text AS aid, p.du_an_id::text AS pid, ${TS('p.thoi_diem_cap')} AS at, nc.ten_dang_nhap AS by
    FROM pham_vi_du_an p LEFT JOIN tai_khoan nc ON p.nguoi_cap_id = nc.id`);
  const accounts = accountsRaw.map(a => {
    const mine = scopes.filter(s => s.aid === a.id);
    const grants: Row = {};
    mine.forEach(s => { grants[s.pid] = { grantedBy: s.by || 'admin', grantedAt: s.at }; });
    return { ...a, staffId: a.staffId || undefined, lockReason: a.lockReason || undefined, assignedProjectIds: mine.map(s => s.pid), scopeGrants: grants };
  });

  const staffRaw = await q(`
    SELECT ns.id::text, ns.ma_nhan_su AS code, ns.ho_ten AS name, ns.chuc_danh AS "roleTitle", ns.doi_id::text AS "teamId",
      dtc.ten AS "teamName", ns.so_dien_thoai AS phone, ns.email, (ns.trang_thai = 'DANG_LAM_VIEC') AS "isActive",
      TO_CHAR(ns.ngay_vao_lam, 'YYYY-MM-DD') AS "startDate", TO_CHAR(ns.ngay_ngung_lam_viec, 'YYYY-MM-DD') AS "leaveDate", ns.ghi_chu AS notes
    FROM nhan_su ns LEFT JOIN doi_thi_cong dtc ON ns.doi_id = dtc.id ORDER BY ns.id`);
  const skills = await q(`
    SELECT nscm.nhan_su_id::text AS sid, cm.ten AS name, nscm.muc_thanh_thao AS level, nscm.la_chuyen_mon_chinh AS primary
    FROM nhan_su_chuyen_mon nscm JOIN chuyen_mon cm ON nscm.chuyen_mon_id = cm.id`);
  const staff = staffRaw.map(s => {
    const sk = skills.filter(k => k.sid === s.id).map(k => ({ name: k.name, level: LEVEL_FROM_DB[k.level] || 'THANH_THAO', isPrimary: k.primary === 1 }));
    return {
      ...s,
      teamId: s.teamId || undefined,
      roleTitleDisplay: ROLE_TITLE_LABEL[s.roleTitle] || s.roleTitle,
      specialty: sk.find(k => k.isPrimary)?.name || sk[0]?.name || '',
      skills: sk,
      leaveDate: s.leaveDate || undefined,
      notes: s.notes || undefined
    };
  });

  const customers = await q(`
    SELECT id::text, ma_khach_hang AS code, ten AS name, nguoi_lien_he AS "contactPerson", so_dien_thoai AS phone,
      email, dia_chi AS address, ghi_chu AS notes FROM khach_hang ORDER BY id`);

  const projects = await q(`
    SELECT d.id::text, d.ma_du_an AS code, d.ten AS name, d.khach_hang_id::text AS "clientId", kh.ten AS "clientName", kh.ten AS client,
      d.dia_diem_thi_cong AS place, d.mo_ta_pham_vi AS "scopeSummary", ${TS('d.bat_dau_du_kien')} AS "startDate",
      ${TS('d.ket_thuc_du_kien')} AS "dueDate", d.trang_thai AS status, d.nhan_su_phu_trach_id::text AS "managerId",
      ns.ho_ten AS "managerName", ${TS('d.thoi_diem_hoan_thanh')} AS "completedAt", xn.ten_hien_thi AS "completedBy",
      ${TS('d.thoi_diem_huy')} AS "cancelledAt", nh.ten_hien_thi AS "cancelledBy", d.ly_do_huy AS "cancelReason",
      ${TS('d.thoi_diem_tao')} AS "createdAt"
    FROM du_an d LEFT JOIN khach_hang kh ON d.khach_hang_id = kh.id LEFT JOIN nhan_su ns ON d.nhan_su_phu_trach_id = ns.id
    LEFT JOIN tai_khoan xn ON d.nguoi_xac_nhan_hoan_thanh_id = xn.id LEFT JOIN tai_khoan nh ON d.nguoi_huy_id = nh.id
    ORDER BY d.id`);

  const categories = (await q(`
    SELECT hm.id::text, hm.du_an_id::text AS "projectId", hm.ma_hang_muc AS code, hm.ten AS name,
      hm.loai_he_thong_id::text AS "systemTypeId", lht.ten AS "systemTypeName", hm.thu_tu AS "orderNum", hm.mo_ta AS description
    FROM hang_muc hm LEFT JOIN loai_he_thong lht ON hm.loai_he_thong_id = lht.id ORDER BY hm.du_an_id, hm.thu_tu`))
    .map(c => ({ ...c, systemTypeName: c.systemTypeName === 'Hệ thống nhà thông minh' ? 'Nhà thông minh' : c.systemTypeName }));

  const tasks = await q(`
    SELECT cv.id::text, cv.ma_cong_viec AS code, cv.du_an_id::text AS "projectId", cv.hang_muc_id::text AS "categoryId",
      hm.ma_hang_muc AS "categoryCode", cv.ten AS title, COALESCE(cv.mo_ta, '') AS description, cv.khu_vuc_trien_khai AS "locationArea",
      cv.nhan_su_chinh_id::text AS "assigneeId", ns.ho_ten AS "assigneeName", ${TS('cv.bat_dau_du_kien')} AS "startDate",
      ${TS('cv.ket_thuc_du_kien')} AS "dueDate", cv.trang_thai AS status, ${TS('cv.thoi_diem_hoan_thanh')} AS "completedAt",
      xn.ten_hien_thi AS "approvedBy", ${TS('cv.thoi_diem_huy')} AS "cancelledAt", nh.ten_hien_thi AS "cancelledBy",
      cv.ly_do_huy AS "cancelReason", ${TS('cv.thoi_diem_tao')} AS "createdAt", ${TS('cv.thoi_diem_cap_nhat')} AS "lastUpdated"
    FROM cong_viec cv LEFT JOIN hang_muc hm ON cv.hang_muc_id = hm.id LEFT JOIN nhan_su ns ON cv.nhan_su_chinh_id = ns.id
    LEFT JOIN tai_khoan xn ON cv.nguoi_xac_nhan_hoan_thanh_id = xn.id LEFT JOIN tai_khoan nh ON cv.nguoi_huy_id = nh.id
    ORDER BY cv.id`);

  const assignments = await q(`
    SELECT pc.id::text, pc.cong_viec_id::text AS "taskId", cv.ma_cong_viec AS "taskCode", cv.ten AS "taskName",
      cv.du_an_id::text AS "projectId", d.ma_du_an AS "projectCode", pc.nhan_su_id::text AS "staffId", ns.ho_ten AS "staffName",
      ${TS('pc.thoi_diem_bat_dau')} AS "startDate", ${TS('pc.thoi_diem_ket_thuc')} AS "endDate", pc.trang_thai AS status,
      pc.ghi_chu AS notes, tt.ten_hien_thi AS "assignedBy", ${TS('pc.thoi_diem_tao')} AS "createdAt",
      ${TS('pc.thoi_diem_huy')} AS "cancelledAt", nh.ten_hien_thi AS "cancelledBy", pc.ly_do_huy AS "cancelReason",
      COALESCE(pc.de_xu_ly_sau, 0) = 1 AS "affectedDeferred"
    FROM phan_cong pc JOIN cong_viec cv ON pc.cong_viec_id = cv.id JOIN du_an d ON cv.du_an_id = d.id
    JOIN nhan_su ns ON pc.nhan_su_id = ns.id LEFT JOIN tai_khoan tt ON pc.nguoi_tao_id = tt.id LEFT JOIN tai_khoan nh ON pc.nguoi_huy_id = nh.id
    ORDER BY pc.id DESC`);

  const leaves = await q(`
    SELECT l.id::text, l.nhan_su_id::text AS "staffId", ns.ho_ten AS "staffName", ${TS('l.thoi_diem_bat_dau')} AS "startDate",
      ${TS('l.thoi_diem_ket_thuc')} AS "endDate", l.ly_do AS reason, l.trang_thai AS status, gn.ten_hien_thi AS "recordedBy",
      ${TS('l.thoi_diem_tao')} AS "recordedAt", ${TS('l.thoi_diem_huy')} AS "cancelledAt", l.ly_do_huy AS "cancelReason"
    FROM lich_nghi_ban l JOIN nhan_su ns ON l.nhan_su_id = ns.id LEFT JOIN tai_khoan gn ON l.nguoi_ghi_nhan_id = gn.id
    ORDER BY l.id DESC`);

  const logsRaw = await q(`
    SELECT c.id::text, c.cong_viec_id::text AS "taskId", cv.ma_cong_viec AS "taskCode", cv.du_an_id::text AS "projectId",
      tk.id::text AS "submittedByAccountId", tk.ten_dang_nhap AS "submittedByUsername", tk.nhan_su_id::text AS "submittedByStaffId",
      COALESCE(ns.ho_ten, tk.ten_hien_thi) AS "submittedByStaffName", ns.chuc_danh AS chuc_danh, vt.ma AS role,
      ${TS('c.thoi_diem_ghi_nhan')} AS "submittedAt", c.noi_dung AS content, c.kho_khan AS "issuesFaced",
      c.de_nghi_hoan_thanh AS de_nghi, c.cap_nhat_dinh_chinh_id::text AS "correctionForLogId",
      c.phan_cong_ben_ngoai_id::text AS "externalAssignmentId", cv.trang_thai AS task_status
    FROM cap_nhat_ket_qua c JOIN cong_viec cv ON c.cong_viec_id = cv.id
    LEFT JOIN tai_khoan tk ON c.tai_khoan_gui_id = tk.id LEFT JOIN vai_tro vt ON tk.vai_tro_id = vt.id
    LEFT JOIN nhan_su ns ON tk.nhan_su_id = ns.id ORDER BY c.thoi_diem_ghi_nhan DESC`);
  const files = await q(`SELECT cap_nhat_id::text AS lid, ten_tep_goc AS name, duong_dan_luu AS path, dung_luong_byte AS size FROM tep_minh_chung ORDER BY id`);
  const workLogs = logsRaw.map(l => ({
    id: l.id, taskId: l.taskId, taskCode: l.taskCode, projectId: l.projectId,
    submittedByAccountId: l.submittedByAccountId, submittedByUsername: l.submittedByUsername,
    submittedByStaffId: l.submittedByStaffId || undefined, submittedByStaffName: l.submittedByStaffName,
    submittedByRole: ROLE_TITLE_LABEL[l.chuc_danh] || undefined,
    submittedAt: l.submittedAt, content: l.content, issuesFaced: l.issuesFaced || undefined,
    requestApproval: l.de_nghi === 1, statusVerifiedByManager: l.de_nghi === 1 && l.task_status === 'HOAN_THANH',
    correctionForLogId: l.correctionForLogId || undefined, externalAssignmentId: l.externalAssignmentId || undefined,
    recordedByManager: l.role === 'QUAN_LY' || l.role === 'QUAN_TRI',
    photos: files.filter(f => f.lid === l.id).map(f => ({ name: f.name, size: Number(f.size) || undefined, dataUrl: String(f.path || '').startsWith('data:') ? f.path : undefined }))
  }));

  const docsRaw = await q(`
    SELECT h.id::text, h.du_an_id::text AS "projectId", d.ma_du_an AS "projectCode", h.cong_viec_id::text AS "taskId",
      cv.ma_cong_viec AS "taskCode", h.tieu_de AS title, h.loai_ho_so AS type, h.pham_vi_su_dung AS scope, h.mo_ta AS description,
      tk.ten_hien_thi AS "uploadedBy", ${TS('h.thoi_diem_tao')} AS "createdAt"
    FROM ho_so h JOIN du_an d ON h.du_an_id = d.id LEFT JOIN cong_viec cv ON h.cong_viec_id = cv.id LEFT JOIN tai_khoan tk ON h.nguoi_tao_id = tk.id
    ORDER BY h.id`);
  const versions = await q(`
    SELECT p.ho_so_id::text AS did, p.so_phien_ban AS "versionNum", p.nhan_phien_ban AS label, p.ten_tep_goc AS "originalFileName",
      p.duong_dan_luu AS "storedPath", p.loai_tep AS "fileType", p.dung_luong_byte AS "fileSizeByte", p.ma_bam_sha256 AS sha256,
      p.noi_dung_thay_doi AS "changeNotes", ${TS('p.thoi_diem_tai_len')} AS "uploadedAt", tl.ten_hien_thi AS "uploadedBy",
      p.duoc_chon AS selected, ${TS('p.thoi_diem_chon')} AS "selectedAt", nc.ten_hien_thi AS "selectedBy"
    FROM phien_ban_ho_so p LEFT JOIN tai_khoan tl ON p.nguoi_tai_len_id = tl.id LEFT JOIN tai_khoan nc ON p.nguoi_chon_id = nc.id
    ORDER BY p.ho_so_id, p.so_phien_ban`);
  const docs = docsRaw.map(d => ({
    ...d,
    taskId: d.taskId || undefined,
    versions: versions.filter(v => v.did === d.id).map(v => {
      const { did, selected, ...rest } = v;
      const bytes = Number(v.fileSizeByte) || 0;
      return { ...rest, fileSizeByte: bytes, fileSizeDisplay: `${(bytes / 1024 / 1024).toFixed(2)} MB`, isSelectedForExecution: selected === 1 };
    })
  }));

  const subcontractors = await q(`
    SELECT id::text, ten AS "companyName", dia_chi AS address, ma_so_thue AS "taxCode", nguoi_lien_he AS "contactPerson",
      chuc_vu_lien_he AS "contactTitle", so_dien_thoai AS phone, khu_vuc_hoat_dong AS area, trang_thai AS status, ghi_chu AS notes
    FROM doi_ben_ngoai ORDER BY id`);

  const extRaw = await q(`
    SELECT e.id::text, e.cong_viec_id::text AS "taskId", cv.du_an_id::text AS "projectId", e.doi_ben_ngoai_id::text AS "contractorId",
      dbn.ten AS "contractorName", e.phan_viec_giao AS "workDescription", ${TS('e.bat_dau_du_kien')} AS "startDate",
      ${TS('e.ket_thuc_du_kien')} AS "dueDate", e.so_nguoi_du_kien AS "workerCount", e.gia_tri_khoan AS "contractValue",
      e.nhan_su_phoi_hop_id::text AS "nmhCoordinatorId", e.trang_thai AS status, e.ghi_chu AS notes,
      ${TS('e.thoi_diem_huy')} AS "cancelledAt", e.ly_do_huy AS "cancelReason"
    FROM phan_cong_ben_ngoai e JOIN cong_viec cv ON e.cong_viec_id = cv.id JOIN doi_ben_ngoai dbn ON e.doi_ben_ngoai_id = dbn.id
    ORDER BY e.id`);
  const daily = await q(`
    SELECT phan_cong_ben_ngoai_id::text AS eid, TO_CHAR(ngay, 'YYYY-MM-DD') AS date, so_co_mat AS "presentCount", ho_ten AS names,
      noi_dung AS content, nguoi_cap_nhat AS "updatedBy", ${TS('thoi_diem_cap_nhat')} AS "updatedAt"
    FROM nhan_su_ngoai_theo_ngay ORDER BY ngay`);
  const externalAssignments = extRaw.map(e => ({
    ...e,
    contractValue: e.contractValue ? Number(e.contractValue) : undefined,
    dailyStaffing: daily.filter(d => d.eid === e.id).map(({ eid, ...rest }) => rest)
  }));

  const auditLogs = (await q(`
    SELECT n.id::text, ${TS('n.thoi_diem_tao')} AS time, COALESCE(tk.ten_dang_nhap, 'Hệ thống') AS "user", n.thao_tac AS action,
      n.loai_doi_tuong AS "objectType", n.doi_tuong_id::text AS "objectId", n.ly_do AS reason, n.gia_tri_cu AS old, n.gia_tri_moi AS new
    FROM nhat_ky_thao_tac n LEFT JOIN tai_khoan tk ON n.tai_khoan_id = tk.id ORDER BY n.thoi_diem_tao DESC`)).map(l => {
    const parse = (v: string | null) => { if (!v) return null; try { return JSON.parse(v); } catch { return v; } };
    return { id: l.id, time: l.time, user: l.user, action: l.action, objectType: OBJECT_TYPE_LABEL[l.objectType] || l.objectType, objectId: l.objectId, reason: l.reason || undefined, oldVal: parse(l.old), newVal: parse(l.new) };
  });

  const cfgRows = await q(`SELECT khoa_cau_hinh AS k, gia_tri AS v, ${TS('thoi_diem_cap_nhat')} AS at FROM cau_hinh`);
  const cfg = (k: string) => cfgRows.find(r => r.k === k);
  const config: Row = { updatedAt: {} };
  CONFIG_KEYS.forEach(([field, key]) => {
    const r = cfg(key);
    if (!r) return;
    config.updatedAt[key] = r.at;
    config[field] = field === 'evaluationTimestamp' || field === 'allowedFileTypes' ? r.v : parseInt(r.v, 10);
  });

  return { accounts, staff, customers, projects, categories, tasks, assignments, leaves, workLogs, docs, subcontractors, externalAssignments, auditLogs, config };
}

// ---------------------------------------------------------------------------
// Ghi dữ liệu
// ---------------------------------------------------------------------------
async function accountLookup(client: pg.PoolClient) {
  const rows = (await client.query(`SELECT id, ten_dang_nhap, ten_hien_thi FROM tai_khoan`)).rows;
  return {
    byName: (name?: string | null) => (name ? rows.find(r => r.ten_hien_thi === name)?.id ?? null : null),
    byUsername: (u?: string | null) => (u ? rows.find(r => r.ten_dang_nhap === u)?.id ?? null : null)
  };
}

const upsert = async (client: pg.PoolClient, table: string, key: string[], data: Row, insertOnly: Row = {}) => {
  const cols = Object.keys(data);
  const allCols = [...cols, ...Object.keys(insertOnly)];
  const values = [...cols.map(c => data[c]), ...Object.keys(insertOnly).map(c => insertOnly[c])];
  const placeholders = allCols.map((_, i) => `$${i + 1}`).join(', ');
  const updates = cols.filter(c => !key.includes(c)).map(c => `${c} = EXCLUDED.${c}`);
  const sql = `INSERT INTO ${table} (${allCols.join(', ')}) VALUES (${placeholders})
    ON CONFLICT (${key.join(', ')}) DO ${updates.length ? `UPDATE SET ${updates.join(', ')}` : 'NOTHING'}`;
  await client.query(sql, values);
};

export async function syncEntity(pool: pg.Pool, entity: string, rows: Row[], actor?: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const acc = await accountLookup(client);
    const actorId = acc.byUsername(actor) ?? 1;

    for (const r of rows) {
      switch (entity) {
        case 'customers':
          await upsert(client, 'khach_hang', ['id'], {
            id: toInt(r.id), ma_khach_hang: r.code, ten: r.name, nguoi_lien_he: str(r.contactPerson), so_dien_thoai: str(r.phone),
            email: str(r.email), dia_chi: str(r.address), ghi_chu: str(r.notes), thoi_diem_cap_nhat: new Date()
          });
          break;

        case 'projects':
          await upsert(client, 'du_an', ['id'], {
            id: toInt(r.id), ma_du_an: r.code, ten: r.name, khach_hang_id: toInt(r.clientId), dia_diem_thi_cong: str(r.place),
            mo_ta_pham_vi: str(r.scopeSummary), bat_dau_du_kien: toTs(r.startDate), ket_thuc_du_kien: toTs(r.dueDate), trang_thai: r.status,
            nhan_su_phu_trach_id: toInt(r.managerId), thoi_diem_hoan_thanh: toTs(r.completedAt), nguoi_xac_nhan_hoan_thanh_id: acc.byName(r.completedBy),
            thoi_diem_huy: toTs(r.cancelledAt), nguoi_huy_id: acc.byName(r.cancelledBy), ly_do_huy: str(r.cancelReason), thoi_diem_cap_nhat: new Date()
          }, { nguoi_tao_id: actorId });
          break;

        case 'categories':
          await upsert(client, 'hang_muc', ['id'], {
            id: toInt(r.id), du_an_id: toInt(r.projectId), ma_hang_muc: r.code, ten: r.name, loai_he_thong_id: toInt(r.systemTypeId),
            mo_ta: str(r.description), thu_tu: toInt(r.orderNum) ?? 1, thoi_diem_cap_nhat: new Date()
          });
          break;

        case 'tasks':
          await upsert(client, 'cong_viec', ['id'], {
            id: toInt(r.id), hang_muc_id: toInt(r.categoryId), du_an_id: toInt(r.projectId), ma_cong_viec: r.code || '', ten: r.title,
            mo_ta: str(r.description), khu_vuc_trien_khai: str(r.locationArea), bat_dau_du_kien: toTs(r.startDate), ket_thuc_du_kien: toTs(r.dueDate),
            trang_thai: r.status, nhan_su_chinh_id: toInt(r.assigneeId), thoi_diem_hoan_thanh: toTs(r.completedAt),
            nguoi_xac_nhan_hoan_thanh_id: acc.byName(r.approvedBy), thoi_diem_huy: toTs(r.cancelledAt), nguoi_huy_id: acc.byName(r.cancelledBy),
            ly_do_huy: str(r.cancelReason), thoi_diem_cap_nhat: new Date()
          }, { nguoi_tao_id: actorId });
          break;

        case 'assignments':
          await upsert(client, 'phan_cong', ['id'], {
            id: toInt(r.id), cong_viec_id: toInt(r.taskId), nhan_su_id: toInt(r.staffId), thoi_diem_bat_dau: toTs(r.startDate),
            thoi_diem_ket_thuc: toTs(r.endDate), trang_thai: r.status, ghi_chu: str(r.notes), nguoi_huy_id: acc.byName(r.cancelledBy),
            thoi_diem_huy: toTs(r.cancelledAt), ly_do_huy: str(r.cancelReason), de_xu_ly_sau: r.affectedDeferred ? 1 : 0, thoi_diem_cap_nhat: new Date()
          }, { nguoi_tao_id: acc.byName(r.assignedBy) ?? actorId, thoi_diem_tao: toTs(r.createdAt) || new Date() });
          break;

        case 'leaves':
          await upsert(client, 'lich_nghi_ban', ['id'], {
            id: toInt(r.id), nhan_su_id: toInt(r.staffId), thoi_diem_bat_dau: toTs(r.startDate), thoi_diem_ket_thuc: toTs(r.endDate),
            ly_do: r.reason, trang_thai: r.status, thoi_diem_huy: toTs(r.cancelledAt), ly_do_huy: str(r.cancelReason),
            nguoi_huy_id: r.status === 'HUY' ? actorId : null, thoi_diem_cap_nhat: new Date()
          }, { nguoi_ghi_nhan_id: acc.byName(r.recordedBy) ?? actorId, thoi_diem_tao: toTs(r.recordedAt) || new Date() });
          break;

        case 'staff': {
          await upsert(client, 'nhan_su', ['id'], {
            id: toInt(r.id), ma_nhan_su: r.code, ho_ten: r.name, so_dien_thoai: str(r.phone), email: str(r.email),
            chuc_danh: r.roleTitle, doi_id: toInt(r.teamId), trang_thai: r.isActive ? 'DANG_LAM_VIEC' : 'NGUNG_LAM_VIEC',
            ngay_vao_lam: r.startDate || new Date().toISOString().slice(0, 10), ngay_ngung_lam_viec: r.isActive ? null : str(r.leaveDate),
            ghi_chu: str(r.notes), thoi_diem_cap_nhat: new Date()
          });
          if (Array.isArray(r.skills)) {
            await client.query(`DELETE FROM nhan_su_chuyen_mon WHERE nhan_su_id = $1`, [toInt(r.id)]);
            for (const k of r.skills) {
              let cm = (await client.query(`SELECT id FROM chuyen_mon WHERE ten = $1`, [k.name])).rows[0];
              if (!cm) {
                const next = (await client.query(`SELECT COALESCE(MAX(id), 0) + 1 AS id FROM chuyen_mon`)).rows[0].id;
                await client.query(`INSERT INTO chuyen_mon (id, ma, ten) VALUES ($1, $2, $3)`, [next, `CM${next}`, k.name]);
                cm = { id: next };
              }
              await client.query(`INSERT INTO nhan_su_chuyen_mon (nhan_su_id, chuyen_mon_id, muc_thanh_thao, la_chuyen_mon_chinh) VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING`, [toInt(r.id), cm.id, k.level || 'THANH_THAO', k.isPrimary ? 1 : 0]);
            }
          }
          break;
        }

        case 'accounts': {
          const role = (await client.query(`SELECT id FROM vai_tro WHERE ma = $1`, [r.role])).rows[0]?.id ?? 2;
          await upsert(client, 'tai_khoan', ['id'], {
            id: toInt(r.id), ten_dang_nhap: r.username, ten_hien_thi: r.name, vai_tro_id: role, nhan_su_id: toInt(r.staffId),
            trang_thai: r.isActive ? 'HOAT_DONG' : 'BI_KHOA', ly_do_khoa: str(r.lockReason), thoi_diem_khoa: toTs(r.lockedAt),
            thoi_diem_dang_nhap_cuoi: toTs(r.lastLogin), phai_doi_mat_khau: r.mustChangePassword ? 1 : 0, thoi_diem_cap_nhat: new Date()
          }, { mat_khau_bam: '!' });
          // Mật khẩu tạm gửi kèm khi cấp mới / đặt lại: chỉ lưu dạng băm
          if (r._password) await client.query(`UPDATE tai_khoan SET mat_khau_bam = $1 WHERE id = $2`, [hashPassword(String(r._password)), toInt(r.id)]);
          const pids: number[] = (r.assignedProjectIds || []).map(toInt).filter((x: number | null) => x !== null);
          await client.query(`DELETE FROM pham_vi_du_an WHERE tai_khoan_id = $1 AND NOT (du_an_id = ANY($2::int[]))`, [toInt(r.id), pids]);
          for (const pid of pids) {
            const g = r.scopeGrants?.[String(pid)];
            await client.query(`INSERT INTO pham_vi_du_an (tai_khoan_id, du_an_id, nguoi_cap_id, thoi_diem_cap) VALUES ($1, $2, $3, $4)
              ON CONFLICT (tai_khoan_id, du_an_id) DO NOTHING`, [toInt(r.id), pid, acc.byUsername(g?.grantedBy) ?? actorId, toTs(g?.grantedAt) || new Date()]);
          }
          break;
        }

        case 'subcontractors':
          await upsert(client, 'doi_ben_ngoai', ['id'], {
            id: toInt(r.id), ten: r.companyName, dia_chi: str(r.address), ma_so_thue: str(r.taxCode), nguoi_lien_he: str(r.contactPerson),
            chuc_vu_lien_he: str(r.contactTitle), so_dien_thoai: str(r.phone), khu_vuc_hoat_dong: str(r.area), trang_thai: r.status,
            ghi_chu: str(r.notes), thoi_diem_cap_nhat: new Date()
          });
          break;

        case 'externalAssignments': {
          await upsert(client, 'phan_cong_ben_ngoai', ['id'], {
            id: toInt(r.id), cong_viec_id: toInt(r.taskId), doi_ben_ngoai_id: toInt(r.contractorId), phan_viec_giao: r.workDescription,
            bat_dau_du_kien: toTs(r.startDate), ket_thuc_du_kien: toTs(r.dueDate), so_nguoi_du_kien: toInt(r.workerCount),
            gia_tri_khoan: r.contractValue ?? null, nhan_su_phoi_hop_id: toInt(r.nmhCoordinatorId), trang_thai: r.status,
            ghi_chu: str(r.notes), thoi_diem_huy: toTs(r.cancelledAt), ly_do_huy: str(r.cancelReason), thoi_diem_cap_nhat: new Date()
          }, { nguoi_tao_id: actorId });
          for (const d of r.dailyStaffing || []) {
            await upsert(client, 'nhan_su_ngoai_theo_ngay', ['phan_cong_ben_ngoai_id', 'ngay'], {
              phan_cong_ben_ngoai_id: toInt(r.id), ngay: d.date, so_co_mat: d.presentCount, ho_ten: str(d.names),
              noi_dung: str(d.content), nguoi_cap_nhat: str(d.updatedBy), thoi_diem_cap_nhat: toTs(d.updatedAt)
            });
          }
          break;
        }

        case 'workLogs': {
          await upsert(client, 'cap_nhat_ket_qua', ['id'], {
            id: toInt(r.id), cong_viec_id: toInt(r.taskId), phan_cong_ben_ngoai_id: toInt(r.externalAssignmentId),
            tai_khoan_gui_id: toInt(r.submittedByAccountId) ?? acc.byUsername(r.submittedByUsername) ?? actorId,
            thoi_diem_ghi_nhan: toTs(r.submittedAt), noi_dung: r.content, kho_khan: str(r.issuesFaced),
            de_nghi_hoan_thanh: r.requestApproval ? 1 : 0, cap_nhat_dinh_chinh_id: toInt(r.correctionForLogId)
          });
          const exists = (await client.query(`SELECT COUNT(*)::int AS n FROM tep_minh_chung WHERE cap_nhat_id = $1`, [toInt(r.id)])).rows[0].n;
          if (exists === 0) {
            for (const p of r.photos || []) {
              const next = (await client.query(`SELECT COALESCE(MAX(id), 0) + 1 AS id FROM tep_minh_chung`)).rows[0].id;
              await client.query(`INSERT INTO tep_minh_chung (id, cap_nhat_id, ten_tep_goc, duong_dan_luu, kieu_noi_dung, dung_luong_byte) VALUES ($1, $2, $3, $4, $5, $6)`,
                [next, toInt(r.id), p.name, p.dataUrl || `minh_chung/${r.id}/${p.name}`, /\.png$/i.test(p.name) ? 'image/png' : 'image/jpeg', p.size ?? null]);
            }
          }
          break;
        }

        case 'docs': {
          await upsert(client, 'ho_so', ['id'], {
            id: toInt(r.id), du_an_id: toInt(r.projectId), cong_viec_id: toInt(r.taskId), tieu_de: r.title, loai_ho_so: r.type,
            pham_vi_su_dung: r.scope || 'DUNG_CHUNG_DU_AN', mo_ta: str(r.description), thoi_diem_cap_nhat: new Date()
          }, { nguoi_tao_id: acc.byName(r.uploadedBy) ?? actorId });
          for (const v of r.versions || []) {
            const found = (await client.query(`SELECT id FROM phien_ban_ho_so WHERE ho_so_id = $1 AND so_phien_ban = $2`, [toInt(r.id), v.versionNum])).rows[0];
            const vals = [v.label || '', v.originalFileName, v.storedPath || v.originalFileName, v.fileType, v.fileSizeByte ?? null, str(v.sha256),
              str(v.changeNotes), acc.byName(v.uploadedBy) ?? actorId, toTs(v.uploadedAt), v.isSelectedForExecution ? 1 : 0, acc.byName(v.selectedBy), toTs(v.selectedAt)];
            if (found) {
              await client.query(`UPDATE phien_ban_ho_so SET nhan_phien_ban=$1, ten_tep_goc=$2, duong_dan_luu=$3, loai_tep=$4, dung_luong_byte=$5, ma_bam_sha256=$6,
                noi_dung_thay_doi=$7, nguoi_tai_len_id=$8, thoi_diem_tai_len=$9, duoc_chon=$10, nguoi_chon_id=$11, thoi_diem_chon=$12 WHERE id=$13`, [...vals, found.id]);
            } else {
              const next = (await client.query(`SELECT COALESCE(MAX(id), 0) + 1 AS id FROM phien_ban_ho_so`)).rows[0].id;
              await client.query(`INSERT INTO phien_ban_ho_so (nhan_phien_ban, ten_tep_goc, duong_dan_luu, loai_tep, dung_luong_byte, ma_bam_sha256,
                noi_dung_thay_doi, nguoi_tai_len_id, thoi_diem_tai_len, duoc_chon, nguoi_chon_id, thoi_diem_chon, id, ho_so_id, so_phien_ban)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`, [...vals, next, toInt(r.id), v.versionNum]);
            }
          }
          break;
        }

        case 'auditLogs':
          await upsert(client, 'nhat_ky_thao_tac', ['id'], {
            id: toInt(r.id), tai_khoan_id: acc.byUsername(r.user), thao_tac: r.action, loai_doi_tuong: r.objectType,
            doi_tuong_id: parseInt(String(r.objectId), 10) || 0, gia_tri_cu: r.oldVal == null ? null : JSON.stringify(r.oldVal),
            gia_tri_moi: r.newVal == null ? null : JSON.stringify(r.newVal), ly_do: str(r.reason), thoi_diem_tao: toTs(r.time)
          });
          break;

        case 'config':
          for (const [field, key] of CONFIG_KEYS) {
            if (r[field] === undefined) continue;
            await client.query(`INSERT INTO cau_hinh (khoa_cau_hinh, gia_tri, thoi_diem_cap_nhat) VALUES ($1, $2, $3)
              ON CONFLICT (khoa_cau_hinh) DO UPDATE SET gia_tri = EXCLUDED.gia_tri, thoi_diem_cap_nhat = EXCLUDED.thoi_diem_cap_nhat`,
              [key, String(r[field] ?? ''), toTs(r.updatedAt?.[key]) || new Date()]);
          }
          break;

        default:
          throw new Error(`Không hỗ trợ đồng bộ đối tượng ${entity}`);
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function setPassword(pool: pg.Pool, accountId: string, password: string) {
  await pool.query(`UPDATE tai_khoan SET mat_khau_bam = $1, thoi_diem_cap_nhat = NOW() WHERE id = $2`, [hashPassword(password), toInt(accountId)]);
}
