/**
 * Cấu hình phân quyền dùng chung (Bảng 3.12, đã điều chỉnh theo góp ý: Quản trị viên có tất cả các quyền – làm tổng).
 * Ma trận ở MH-05 được dựng từ cấu hình này để nội dung hiển thị luôn khớp với quyền thực tế.
 */
export type PermLabel = 'Xem' | 'Tạo' | 'Sửa' | 'Duyệt' | 'Hủy' | 'Khóa' | 'Xem nhật ký';
export type RoleKey = 'QUAN_TRI' | 'QUAN_LY' | 'BAN_GIAM_DOC' | 'DOI_TRUONG';

export interface PermissionRow {
  feature: string;
  perms: Record<RoleKey, { labels: PermLabel[]; note: string }>;
}

export interface PermissionGroup {
  group: string;
  rows: PermissionRow[];
}

export const ROLE_SCOPE: Record<RoleKey, { title: string; scope: string }> = {
  QUAN_TRI: { title: 'Quản trị hệ thống', scope: 'Toàn hệ thống' },
  QUAN_LY: { title: 'Quản lý', scope: 'Dự án được cấp' },
  BAN_GIAM_DOC: { title: 'Ban giám đốc', scope: 'Toàn doanh nghiệp' },
  DOI_TRUONG: { title: 'Đội trưởng', scope: 'Công việc được giao' }
};

const none = (note = 'Không có quyền') => ({ labels: [] as PermLabel[], note });
const all = (note: string) => ({ labels: ['Xem', 'Tạo', 'Sửa', 'Duyệt', 'Hủy'] as PermLabel[], note });

export const PERMISSION_MATRIX: PermissionGroup[] = [
  {
    group: 'Quản trị hệ thống',
    rows: [
      { feature: 'Tài khoản và phạm vi dự án', perms: {
        QUAN_TRI: { labels: ['Xem', 'Tạo', 'Sửa', 'Khóa'], note: 'Toàn hệ thống; không có nút Xóa (QC-08)' },
        QUAN_LY: none(), BAN_GIAM_DOC: none(), DOI_TRUONG: none() } },
      { feature: 'Cấu hình và nhật ký thao tác', perms: {
        QUAN_TRI: { labels: ['Xem', 'Sửa', 'Xem nhật ký'], note: 'Sáu tham số cấu hình; nhật ký chỉ đọc' },
        QUAN_LY: none(), BAN_GIAM_DOC: none(), DOI_TRUONG: none() } },
      { feature: 'Đổi mật khẩu của chính mình', perms: {
        QUAN_TRI: { labels: ['Sửa'], note: 'Tài khoản của chính mình' },
        QUAN_LY: { labels: ['Sửa'], note: 'Tài khoản của chính mình' },
        BAN_GIAM_DOC: { labels: ['Sửa'], note: 'Tài khoản của chính mình' },
        DOI_TRUONG: { labels: ['Sửa'], note: 'Tài khoản của chính mình' } } }
    ]
  },
  {
    group: 'Dự án và công việc',
    rows: [
      { feature: 'Dự án, khách hàng và hạng mục', perms: {
        QUAN_TRI: all('Toàn bộ dự án (làm tổng)'),
        QUAN_LY: { labels: ['Xem', 'Tạo', 'Sửa', 'Hủy'], note: 'Trong phạm vi dự án được cấp' },
        BAN_GIAM_DOC: { labels: ['Xem'], note: 'Xem nhanh từ báo cáo' },
        DOI_TRUONG: { labels: ['Xem'], note: 'Dự án có công việc được giao' } } },
      { feature: 'Công việc và xác nhận hoàn thành', perms: {
        QUAN_TRI: all('Toàn bộ công việc (làm tổng)'),
        QUAN_LY: { labels: ['Xem', 'Tạo', 'Sửa', 'Duyệt', 'Hủy'], note: 'Trong phạm vi dự án được cấp' },
        BAN_GIAM_DOC: none('Chỉ xem qua báo cáo'),
        DOI_TRUONG: { labels: ['Xem'], note: 'Công việc được giao' } } }
    ]
  },
  {
    group: 'Nhân sự, lịch nghỉ/bận và phân công',
    rows: [
      { feature: 'Hồ sơ nhân sự', perms: {
        QUAN_TRI: { labels: ['Xem', 'Tạo', 'Sửa'], note: 'Toàn bộ nhân sự (làm tổng)' },
        QUAN_LY: { labels: ['Xem', 'Tạo', 'Sửa'], note: 'Ghi nhận ngừng làm việc; không xóa' },
        BAN_GIAM_DOC: none(),
        DOI_TRUONG: { labels: ['Xem'], note: 'Thông tin liên hệ nhân sự thuộc công việc được giao' } } },
      { feature: 'Phân công nhân sự', perms: {
        QUAN_TRI: { labels: ['Xem', 'Tạo', 'Sửa', 'Hủy'], note: 'Toàn bộ dự án (làm tổng)' },
        QUAN_LY: { labels: ['Xem', 'Tạo', 'Sửa', 'Hủy'], note: 'Trong phạm vi dự án được cấp' },
        BAN_GIAM_DOC: none(),
        DOI_TRUONG: { labels: ['Xem'], note: 'Nhân sự được phân công trong ngày thuộc công việc của mình' } } },
      { feature: 'Lịch nghỉ/bận', perms: {
        QUAN_TRI: { labels: ['Xem', 'Tạo', 'Sửa', 'Hủy'], note: 'Làm tổng' },
        QUAN_LY: { labels: ['Xem', 'Tạo', 'Sửa', 'Hủy'], note: 'Ghi nhận và xử lý phân công bị ảnh hưởng' },
        BAN_GIAM_DOC: none(), DOI_TRUONG: none() } },
      { feature: 'Đội thi công ngoài', perms: {
        QUAN_TRI: { labels: ['Xem', 'Tạo', 'Sửa', 'Hủy'], note: 'Làm tổng' },
        QUAN_LY: { labels: ['Xem', 'Tạo', 'Sửa', 'Hủy'], note: 'Giao phần việc, cập nhật nhân sự theo ngày' },
        BAN_GIAM_DOC: { labels: ['Xem'], note: 'Ngăn xem nhanh chỉ đọc' },
        DOI_TRUONG: { labels: ['Xem', 'Sửa'], note: 'Phần việc được chỉ định phối hợp; không thấy giá trị khoán' } } }
    ]
  },
  {
    group: 'Kết quả thực hiện',
    rows: [
      { feature: 'Nhật ký hiện trường: gửi báo cáo', perms: {
        QUAN_TRI: { labels: ['Tạo'], note: 'Ghi nhận thay hiện trường (làm tổng)' },
        QUAN_LY: { labels: ['Tạo'], note: 'Ghi nhận kết quả khi tiếp nhận ngoài ứng dụng' },
        BAN_GIAM_DOC: none(),
        DOI_TRUONG: { labels: ['Tạo'], note: 'Gửi báo cáo cho công việc được giao' } } },
      { feature: 'Nhật ký hiện trường: xem và phê duyệt', perms: {
        QUAN_TRI: { labels: ['Xem', 'Duyệt'], note: 'Làm tổng' },
        QUAN_LY: { labels: ['Xem', 'Duyệt'], note: 'Trong phạm vi dự án được cấp' },
        BAN_GIAM_DOC: { labels: ['Xem'], note: 'Toàn doanh nghiệp, chỉ đọc' },
        DOI_TRUONG: { labels: ['Xem'], note: 'Chỉ báo cáo do mình gửi' } } }
    ]
  },
  {
    group: 'Hồ sơ kỹ thuật',
    rows: [
      { feature: 'Hồ sơ kỹ thuật và phiên bản', perms: {
        QUAN_TRI: { labels: ['Xem', 'Tạo', 'Sửa', 'Duyệt'], note: 'Làm tổng' },
        QUAN_LY: { labels: ['Xem', 'Tạo', 'Sửa', 'Duyệt'], note: 'Tải lên, bổ sung phiên bản, chọn bản triển khai' },
        BAN_GIAM_DOC: none(),
        DOI_TRUONG: { labels: ['Xem'], note: 'Chỉ bản triển khai của hồ sơ được cấp quyền' } } }
    ]
  },
  {
    group: 'Báo cáo và thống kê',
    rows: [
      { feature: 'Tổng quan điều hành', perms: {
        QUAN_TRI: { labels: ['Xem'], note: 'Toàn hệ thống' },
        QUAN_LY: { labels: ['Xem'], note: 'Trong phạm vi dự án được cấp' },
        BAN_GIAM_DOC: { labels: ['Xem'], note: 'Toàn doanh nghiệp' },
        DOI_TRUONG: { labels: ['Xem'], note: 'Chỉ số riêng ở Dự án của tôi' } } },
      { feature: 'Báo cáo BC-01, BC-02, BC-03', perms: {
        QUAN_TRI: { labels: ['Xem'], note: 'Toàn hệ thống' },
        QUAN_LY: { labels: ['Xem'], note: 'Trong phạm vi dự án được cấp' },
        BAN_GIAM_DOC: { labels: ['Xem'], note: 'Toàn doanh nghiệp' },
        DOI_TRUONG: none() } }
    ]
  }
];

export const ROLE_DESCRIPTION: Record<RoleKey, string> = {
  QUAN_TRI: 'Toàn hệ thống: tài khoản, phạm vi, cấu hình, nhật ký và toàn bộ nghiệp vụ (làm tổng).',
  QUAN_LY: 'Quản lý dự án, công việc, nhân sự, lịch, hồ sơ trong phạm vi được cấp; xác nhận hoàn thành.',
  BAN_GIAM_DOC: 'Xem tổng quan, báo cáo và nhật ký hiện trường toàn doanh nghiệp; không thay đổi dữ liệu.',
  DOI_TRUONG: 'Xem dự án, công việc được giao; gửi báo cáo hiện trường; xem hồ sơ được cấp quyền.'
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  TAO_MOI: 'Tạo mới',
  DIEU_CHINH: 'Điều chỉnh',
  DOI_TRANG_THAI: 'Đổi trạng thái',
  HUY: 'Hủy',
  XAC_NHAN_HOAN_THANH: 'Xác nhận hoàn thành',
  KET_THUC_SOM: 'Kết thúc sớm',
  TAI_LEN: 'Tải tệp lên',
  CHON_BAN_TRIEN_KHAI: 'Chọn bản triển khai',
  KHOA: 'Khóa tài khoản',
  MO_KHOA: 'Mở khóa tài khoản'
};
