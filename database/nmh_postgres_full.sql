-- =========================================================================
-- HỆ THỐNG QUẢN LÝ DỰ ÁN VÀ PHÂN CÔNG THI CÔNG NMH DATA CENTER NETWORK
-- CƠ SỞ DỮ LIỆU POSTGRESQL THỰC TẾ 100% (22 BẢNG QUAN HỆ & 428 DÒNG DỮ LIỆU GỐC)
-- KHÔNG SỬ DỤNG DATABASE.JSON - CHUẨN POSTGRESQL 14+ / RENDER CLOUD
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. vai_tro
CREATE TABLE IF NOT EXISTS vai_tro (
    id INT PRIMARY KEY,
    ma VARCHAR(50) UNIQUE NOT NULL,
    ten VARCHAR(100) NOT NULL,
    mo_ta TEXT
);

-- 2. doi_thi_cong
CREATE TABLE IF NOT EXISTS doi_thi_cong (
    id INT PRIMARY KEY,
    ma VARCHAR(50) UNIQUE NOT NULL,
    ten VARCHAR(200) NOT NULL,
    loai_doi VARCHAR(50) NOT NULL DEFAULT 'THI_CONG',
    mo_ta TEXT,
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. chuyen_mon
CREATE TABLE IF NOT EXISTS chuyen_mon (
    id INT PRIMARY KEY,
    ma VARCHAR(50) UNIQUE NOT NULL,
    ten VARCHAR(150) NOT NULL,
    mo_ta TEXT
);

-- 4. nhan_su
CREATE TABLE IF NOT EXISTS nhan_su (
    id INT PRIMARY KEY,
    ma_nhan_su VARCHAR(50) UNIQUE NOT NULL,
    ho_ten VARCHAR(150) NOT NULL,
    so_dien_thoai VARCHAR(20),
    email VARCHAR(100),
    chuc_danh VARCHAR(50) NOT NULL,
    doi_id INT REFERENCES doi_thi_cong(id),
    trang_thai VARCHAR(50) DEFAULT 'DANG_LAM_VIEC',
    ngay_vao_lam DATE NOT NULL,
    ngay_ngung_lam_viec DATE,
    ghi_chu TEXT,
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phien_ban INT DEFAULT 0
);

-- 5. nhan_su_chuyen_mon
CREATE TABLE IF NOT EXISTS nhan_su_chuyen_mon (
    nhan_su_id INT REFERENCES nhan_su(id),
    chuyen_mon_id INT REFERENCES chuyen_mon(id),
    muc_thanh_thao VARCHAR(50) DEFAULT 'THANH_THAO',
    la_chuyen_mon_chinh INT DEFAULT 1,
    PRIMARY KEY (nhan_su_id, chuyen_mon_id)
);

-- 6. tai_khoan
CREATE TABLE IF NOT EXISTS tai_khoan (
    id INT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
    mat_khau_bam VARCHAR(255) NOT NULL,
    ten_hien_thi VARCHAR(150) NOT NULL,
    vai_tro_id INT REFERENCES vai_tro(id),
    nhan_su_id INT REFERENCES nhan_su(id),
    trang_thai VARCHAR(50) DEFAULT 'HOAT_DONG',
    thoi_diem_dang_nhap_cuoi TIMESTAMP,
    thoi_diem_khoa TIMESTAMP,
    ly_do_khoa TEXT,
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phien_ban INT DEFAULT 0
);

-- 7. khach_hang
CREATE TABLE IF NOT EXISTS khach_hang (
    id INT PRIMARY KEY,
    ma_khach_hang VARCHAR(50) UNIQUE NOT NULL,
    ten VARCHAR(200) NOT NULL,
    nguoi_lien_he VARCHAR(150),
    so_dien_thoai VARCHAR(20),
    email VARCHAR(100),
    dia_chi TEXT,
    ghi_chu TEXT,
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. loai_he_thong
CREATE TABLE IF NOT EXISTS loai_he_thong (
    id INT PRIMARY KEY,
    ma VARCHAR(50) UNIQUE NOT NULL,
    ten VARCHAR(150) NOT NULL,
    mo_ta TEXT
);

-- 9. du_an
CREATE TABLE IF NOT EXISTS du_an (
    id INT PRIMARY KEY,
    ma_du_an VARCHAR(50) UNIQUE NOT NULL,
    ten VARCHAR(255) NOT NULL,
    khach_hang_id INT REFERENCES khach_hang(id),
    dia_diem_thi_cong TEXT,
    mo_ta_pham_vi TEXT,
    bat_dau_du_kien TIMESTAMP NOT NULL,
    ket_thuc_du_kien TIMESTAMP NOT NULL,
    trang_thai VARCHAR(50) DEFAULT 'LAP_KE_HOACH',
    nhan_su_phu_trach_id INT REFERENCES nhan_su(id),
    thoi_diem_hoan_thanh TIMESTAMP,
    nguoi_xac_nhan_hoan_thanh_id INT REFERENCES tai_khoan(id),
    thoi_diem_huy TIMESTAMP,
    nguoi_huy_id INT REFERENCES tai_khoan(id),
    ly_do_huy TEXT,
    nguoi_tao_id INT REFERENCES tai_khoan(id),
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phien_ban INT DEFAULT 0
);

-- 10. pham_vi_du_an
CREATE TABLE IF NOT EXISTS pham_vi_du_an (
    tai_khoan_id INT REFERENCES tai_khoan(id),
    du_an_id INT REFERENCES du_an(id),
    nguoi_cap_id INT REFERENCES tai_khoan(id),
    thoi_diem_cap TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tai_khoan_id, du_an_id)
);

-- 11. hang_muc
CREATE TABLE IF NOT EXISTS hang_muc (
    id INT PRIMARY KEY,
    du_an_id INT REFERENCES du_an(id),
    ma_hang_muc VARCHAR(50) NOT NULL,
    ten VARCHAR(200) NOT NULL,
    loai_he_thong_id INT REFERENCES loai_he_thong(id),
    mo_ta TEXT,
    thu_tu INT DEFAULT 1,
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. cong_viec
CREATE TABLE IF NOT EXISTS cong_viec (
    id INT PRIMARY KEY,
    hang_muc_id INT REFERENCES hang_muc(id),
    du_an_id INT REFERENCES du_an(id),
    ma_cong_viec VARCHAR(50) NOT NULL,
    ten VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    khu_vuc_trien_khai VARCHAR(200),
    bat_dau_du_kien TIMESTAMP NOT NULL,
    ket_thuc_du_kien TIMESTAMP NOT NULL,
    trang_thai VARCHAR(50) DEFAULT 'CHUA_BAT_DAU',
    nhan_su_chinh_id INT REFERENCES nhan_su(id),
    thoi_diem_hoan_thanh TIMESTAMP,
    nguoi_xac_nhan_hoan_thanh_id INT REFERENCES tai_khoan(id),
    thoi_diem_huy TIMESTAMP,
    nguoi_huy_id INT REFERENCES tai_khoan(id),
    ly_do_huy TEXT,
    nguoi_tao_id INT REFERENCES tai_khoan(id),
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phien_ban INT DEFAULT 0
);

-- 13. lich_nghi_ban
CREATE TABLE IF NOT EXISTS lich_nghi_ban (
    id INT PRIMARY KEY,
    nhan_su_id INT REFERENCES nhan_su(id),
    thoi_diem_bat_dau TIMESTAMP NOT NULL,
    thoi_diem_ket_thuc TIMESTAMP NOT NULL,
    ly_do TEXT NOT NULL,
    trang_thai VARCHAR(50) DEFAULT 'HIEU_LUC',
    nguoi_ghi_nhan_id INT REFERENCES tai_khoan(id),
    nguoi_huy_id INT REFERENCES tai_khoan(id),
    thoi_diem_huy TIMESTAMP,
    ly_do_huy TEXT,
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phien_ban INT DEFAULT 0
);

-- 14. phan_cong
CREATE TABLE IF NOT EXISTS phan_cong (
    id INT PRIMARY KEY,
    cong_viec_id INT REFERENCES cong_viec(id),
    nhan_su_id INT REFERENCES nhan_su(id),
    thoi_diem_bat_dau TIMESTAMP NOT NULL,
    thoi_diem_ket_thuc TIMESTAMP NOT NULL,
    trang_thai VARCHAR(50) DEFAULT 'HIEU_LUC',
    ghi_chu TEXT,
    nguoi_tao_id INT REFERENCES tai_khoan(id),
    nguoi_huy_id INT REFERENCES tai_khoan(id),
    thoi_diem_huy TIMESTAMP,
    ly_do_huy TEXT,
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phien_ban INT DEFAULT 0
);

-- 15. doi_ben_ngoai
CREATE TABLE IF NOT EXISTS doi_ben_ngoai (
    id INT PRIMARY KEY,
    ten VARCHAR(200) NOT NULL,
    nguoi_lien_he VARCHAR(150),
    so_dien_thoai VARCHAR(20),
    khu_vuc_hoat_dong VARCHAR(200),
    trang_thai VARCHAR(50) DEFAULT 'HOP_TAC',
    ghi_chu TEXT,
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. phan_cong_ben_ngoai
CREATE TABLE IF NOT EXISTS phan_cong_ben_ngoai (
    id INT PRIMARY KEY,
    cong_viec_id INT REFERENCES cong_viec(id),
    doi_ben_ngoai_id INT REFERENCES doi_ben_ngoai(id),
    phan_viec_giao TEXT NOT NULL,
    bat_dau_du_kien TIMESTAMP NOT NULL,
    ket_thuc_du_kien TIMESTAMP NOT NULL,
    so_nguoi_du_kien INT DEFAULT 2,
    nhan_su_phoi_hop_id INT REFERENCES nhan_su(id),
    trang_thai VARCHAR(50) DEFAULT 'HIEU_LUC',
    ghi_chu TEXT,
    nguoi_tao_id INT REFERENCES tai_khoan(id),
    thoi_diem_huy TIMESTAMP,
    ly_do_huy TEXT,
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phien_ban INT DEFAULT 0
);

-- 17. cap_nhat_ket_qua
CREATE TABLE IF NOT EXISTS cap_nhat_ket_qua (
    id INT PRIMARY KEY,
    cong_viec_id INT REFERENCES cong_viec(id),
    phan_cong_ben_ngoai_id INT REFERENCES phan_cong_ben_ngoai(id),
    tai_khoan_gui_id INT REFERENCES tai_khoan(id),
    thoi_diem_ghi_nhan TIMESTAMP NOT NULL,
    noi_dung TEXT NOT NULL,
    kho_khan TEXT,
    de_nghi_hoan_thanh INT DEFAULT 0,
    cap_nhat_dinh_chinh_id INT REFERENCES cap_nhat_ket_qua(id),
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. tep_minh_chung
CREATE TABLE IF NOT EXISTS tep_minh_chung (
    id INT PRIMARY KEY,
    cap_nhat_id INT REFERENCES cap_nhat_ket_qua(id),
    ten_tep_goc VARCHAR(255) NOT NULL,
    duong_dan_luu TEXT NOT NULL,
    kieu_noi_dung VARCHAR(100),
    dung_luong_byte BIGINT,
    ma_bam_sha256 VARCHAR(64),
    thoi_diem_tai_len TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. ho_so
CREATE TABLE IF NOT EXISTS ho_so (
    id INT PRIMARY KEY,
    du_an_id INT REFERENCES du_an(id),
    cong_viec_id INT REFERENCES cong_viec(id),
    tieu_de VARCHAR(255) NOT NULL,
    loai_ho_so VARCHAR(50) NOT NULL,
    pham_vi_su_dung VARCHAR(50) DEFAULT 'DUNG_CHUNG_DU_AN',
    mo_ta TEXT,
    nguoi_tao_id INT REFERENCES tai_khoan(id),
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. phien_ban_ho_so
CREATE TABLE IF NOT EXISTS phien_ban_ho_so (
    id INT PRIMARY KEY,
    ho_so_id INT REFERENCES ho_so(id),
    so_phien_ban INT NOT NULL,
    nhan_phien_ban VARCHAR(50) NOT NULL,
    ten_tep_goc VARCHAR(255) NOT NULL,
    duong_dan_luu TEXT NOT NULL,
    loai_tep VARCHAR(50) NOT NULL,
    kieu_noi_dung VARCHAR(100),
    dung_luong_byte BIGINT,
    ma_bam_sha256 VARCHAR(64),
    noi_dung_thay_doi TEXT,
    nguoi_tai_len_id INT REFERENCES tai_khoan(id),
    thoi_diem_tai_len TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duoc_chon INT DEFAULT 0,
    nguoi_chon_id INT REFERENCES tai_khoan(id),
    thoi_diem_chon TIMESTAMP
);

-- 21. nhat_ky_thao_tac
CREATE TABLE IF NOT EXISTS nhat_ky_thao_tac (
    id INT PRIMARY KEY,
    tai_khoan_id INT REFERENCES tai_khoan(id),
    thao_tac VARCHAR(100) NOT NULL,
    loai_doi_tuong VARCHAR(50) NOT NULL,
    doi_tuong_id INT NOT NULL,
    gia_tri_cu TEXT,
    gia_tri_moi TEXT,
    ly_do TEXT,
    thoi_diem_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. cau_hinh
CREATE TABLE IF NOT EXISTS cau_hinh (
    khoa_cau_hinh VARCHAR(100) PRIMARY KEY,
    gia_tri VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    thoi_diem_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 1: vai_tro
INSERT INTO vai_tro (id, ma, ten, mo_ta) VALUES
(1, 'QUAN_TRI', 'Quản trị hệ thống', 'Quản lý tài khoản, vai trò và phạm vi truy cập'),
(2, 'QUAN_LY', 'Quản lý', 'Quản lý dự án, công việc, nhân sự, lịch nghỉ/bận, phân công, hồ sơ trong phạm vi được cấp; xác nhận hoàn thành'),
(3, 'DOI_TRUONG', 'Đội trưởng đội thi công', 'Xem dự án/công việc được giao, gửi cập nhật kết quả, tra cứu hồ sơ được cấp quyền'),
(4, 'BAN_GIAM_DOC', 'Ban giám đốc', 'Xem báo cáo tổng hợp toàn doanh nghiệp, không thay đổi dữ liệu nghiệp vụ')
ON CONFLICT (id) DO UPDATE SET ma = EXCLUDED.ma, ten = EXCLUDED.ten, mo_ta = EXCLUDED.mo_ta;

-- Bảng 2: doi_thi_cong
INSERT INTO doi_thi_cong (id, ma, ten, loai_doi, mo_ta) VALUES
(1, 'DTC1', 'Đội thi công 1 - Hạ tầng mạng và thoại', 'THI_CONG', 'Chuyên tuyến cáp mạng, cáp quang và tổng đài thoại'),
(2, 'DTC2', 'Đội thi công 2 - Camera và kiểm soát ra vào', 'THI_CONG', 'Chuyên camera giám sát, kiểm soát cửa vân tay thẻ từ'),
(3, 'DTC3', 'Đội thi công 3 - Âm thanh, hình ảnh và hội nghị', 'THI_CONG', 'Chuyên âm thanh thông báo PA, hội trường và phòng hội thảo'),
(4, 'TTK', 'Tổ thiết kế', 'THIET_KE', 'Chuyên thiết kế bản vẽ CAD, Shop Drawing và dự toán vật tư')
ON CONFLICT (id) DO NOTHING;

-- Bảng 3: chuyen_mon
INSERT INTO chuyen_mon (id, ma, ten, mo_ta) VALUES
(1, 'KEO_CAP', 'Kéo cáp và lắp máng cáp, ống luồn', 'Triển khai tuyến cáp, máng cáp và ống bảo vệ'),
(2, 'CAU_HINH_MANG', 'Cấu hình mạng, VLAN, WiFi', 'Cấu hình switch, router, firewall và access point'),
(3, 'CAMERA', 'Lắp đặt và cấu hình camera giám sát', 'Camera IP, analog, đầu ghi hình NVR/DVR'),
(4, 'KIEM_SOAT_RA_VAO', 'Kiểm soát ra vào, khóa từ', 'Đầu đọc vân tay, thẻ từ, khóa chốt, barrier'),
(5, 'AM_THANH_THONG_BAO', 'Âm thanh thông báo PA', 'Hệ thống âm thanh tòa nhà, phân vùng phát thông báo'),
(6, 'AM_THANH_HINH_ANH', 'Âm thanh, hình ảnh và hội nghị', 'Màn hình LED, máy chiếu, micro hội thảo, DSP'),
(7, 'THIET_KE_CAD', 'Thiết kế bản vẽ CAD, Shop Drawing', 'Bản vẽ triển khai thi công, mặt bằng, sơ đồ nguyên lý'),
(8, 'KHAO_SAT_NGHIEM_THU', 'Khảo sát và nghiệm thu', 'Đo đạc hiện trạng công trình và kiểm tra nghiệm thu'),
(9, 'TONG_DAI_THOAI', 'Hạ tầng thoại, tổng đài IP/Analog', 'Tổng đài nội bộ, cáp điện thoại nhiều đôi'),
(10, 'QUAN_LY_DU_AN', 'Quản lý dự án thi công', 'Lập kế hoạch, phân công nguồn lực, kiểm soát tiến độ')
ON CONFLICT (id) DO NOTHING;

-- Bảng 4: nhan_su
INSERT INTO nhan_su (id, ma_nhan_su, ho_ten, so_dien_thoai, email, chuc_danh, doi_id, trang_thai, ngay_vao_lam, ngay_ngung_lam_viec, ghi_chu) VALUES
(1, 'NV001', 'Trần Quốc Bảo', '0900000101', 'nv001@example.com', 'QUAN_LY', NULL, 'DANG_LAM_VIEC', '2019-03-01', NULL, 'Chuyên trách dự án mạng và camera'),
(2, 'NV002', 'Lê Thị Hồng Nhung', '0900000102', 'nv002@example.com', 'QUAN_LY', NULL, 'DANG_LAM_VIEC', '2020-06-15', NULL, 'Chuyên trách dự án âm thanh và hội nghị'),
(3, 'NV003', 'Phạm Văn Cường', '0900000103', 'nv003@example.com', 'DOI_TRUONG', 1, 'DANG_LAM_VIEC', '2018-09-10', NULL, 'Đội trưởng đội thi công 1'),
(4, 'NV004', 'Nguyễn Đức Thắng', '0900000104', 'nv004@example.com', 'DOI_TRUONG', 2, 'DANG_LAM_VIEC', '2019-01-07', NULL, 'Đội trưởng đội thi công 2'),
(5, 'NV005', 'Vũ Minh Tuấn', '0900000105', 'nv005@example.com', 'DOI_TRUONG', 3, 'DANG_LAM_VIEC', '2019-05-20', NULL, 'Đội trưởng đội thi công 3'),
(6, 'NV006', 'Đặng Hoài Nam', '0900000106', 'nv006@example.com', 'KY_SU', 1, 'DANG_LAM_VIEC', '2021-02-01', NULL, 'Kỹ sư mạng và truyền dẫn'),
(7, 'NV007', 'Bùi Thanh Hà', '0900000107', 'nv007@example.com', 'KY_SU', 3, 'DANG_LAM_VIEC', '2021-08-16', NULL, 'Kỹ sư âm thanh ánh sáng'),
(8, 'NV008', 'Hoàng Văn Long', '0900000108', 'nv008@example.com', 'KY_THUAT_VIEN', 1, 'DANG_LAM_VIEC', '2021-10-04', NULL, 'Kỹ thuật viên mạng'),
(9, 'NV009', 'Ngô Quang Huy', '0900000109', 'nv009@example.com', 'KY_THUAT_VIEN', 2, 'DANG_LAM_VIEC', '2022-03-14', NULL, 'Kỹ thuật viên camera'),
(10, 'NV010', 'Phan Thanh Sơn', '0900000110', 'nv010@example.com', 'KY_THUAT_VIEN', 2, 'DANG_LAM_VIEC', '2022-04-11', NULL, 'Kỹ thuật viên kiểm soát ra vào'),
(11, 'NV011', 'Đỗ Mạnh Dũng', '0900000111', 'nv011@example.com', 'KY_THUAT_VIEN', 2, 'DANG_LAM_VIEC', '2022-07-18', NULL, 'Kỹ thuật viên camera'),
(12, 'NV012', 'Lý Thành Công', '0900000112', 'nv012@example.com', 'KY_THUAT_VIEN', 2, 'DANG_LAM_VIEC', '2022-09-05', NULL, 'Kỹ thuật viên kiểm soát'),
(13, 'NV013', 'Trịnh Xuân Trường', '0900000113', 'nv013@example.com', 'KY_THUAT_VIEN', 3, 'DANG_LAM_VIEC', '2022-11-21', NULL, 'Kỹ thuật viên âm thanh'),
(14, 'NV014', 'Cao Văn Bình', '0900000114', 'nv014@example.com', 'KY_THUAT_VIEN', 3, 'DANG_LAM_VIEC', '2023-01-09', NULL, 'Kỹ thuật viên hội nghị'),
(15, 'NV015', 'Mai Đức Anh', '0900000115', 'nv015@example.com', 'KY_THUAT_VIEN', 1, 'DANG_LAM_VIEC', '2023-02-13', NULL, 'Kỹ thuật viên thoại'),
(16, 'NV016', 'Tạ Văn Hải', '0900000116', 'nv016@example.com', 'CONG_NHAN', 1, 'DANG_LAM_VIEC', '2023-05-02', NULL, 'Công nhân kéo cáp'),
(17, 'NV017', 'Lương Văn Sơn', '0900000117', 'nv017@example.com', 'CONG_NHAN', 1, 'DANG_LAM_VIEC', '2023-06-12', NULL, 'Công nhân kéo cáp'),
(18, 'NV018', 'Đinh Công Hậu', '0900000118', 'nv018@example.com', 'CONG_NHAN', 2, 'DANG_LAM_VIEC', '2023-08-07', NULL, 'Công nhân lắp camera'),
(19, 'NV019', 'Võ Văn Tâm', '0900000119', 'nv019@example.com', 'CONG_NHAN', 2, 'DANG_LAM_VIEC', '2023-09-18', NULL, 'Công nhân lắp camera'),
(20, 'NV020', 'Chu Văn Khánh', '0900000120', 'nv020@example.com', 'CONG_NHAN', 3, 'DANG_LAM_VIEC', '2024-01-08', NULL, 'Công nhân âm thanh'),
(21, 'NV021', 'Nguyễn Thu Trang', '0900000121', 'nv021@example.com', 'NHAN_VIEN_THIET_KE', 4, 'DANG_LAM_VIEC', '2021-04-05', NULL, 'Kỹ sư thiết kế CAD'),
(22, 'NV022', 'Lê Hải Yến', '0900000122', 'nv022@example.com', 'NHAN_VIEN_THIET_KE', 4, 'DANG_LAM_VIEC', '2022-10-10', NULL, 'Nhân viên thiết kế Shop drawing'),
(23, 'NV023', 'Phạm Văn Đạt', '0900000123', 'nv023@example.com', 'KY_THUAT_VIEN', 2, 'NGUNG_LAM_VIEC', '2022-02-14', '2026-09-22', 'Nghỉ việc chuyển công tác'),
(24, 'NV024', 'Nguyễn Văn Kiên', '0900000124', 'nv024@example.com', 'CONG_NHAN', 2, 'DANG_LAM_VIEC', '2026-09-01', NULL, 'Công nhân mới tiếp nhận')
ON CONFLICT (id) DO NOTHING;

-- Bảng 5: nhan_su_chuyen_mon
INSERT INTO nhan_su_chuyen_mon (nhan_su_id, chuyen_mon_id, muc_thanh_thao, la_chuyen_mon_chinh) VALUES
(1, 10, 'THANH_THAO', 1),
(2, 10, 'THANH_THAO', 1),
(2, 6, 'CO_BAN', 0),
(3, 1, 'CHUYEN_SAU', 1),
(3, 2, 'CO_BAN', 0),
(4, 3, 'CHUYEN_SAU', 1),
(4, 4, 'CO_BAN', 0),
(5, 6, 'CHUYEN_SAU', 1),
(5, 5, 'CO_BAN', 0),
(6, 2, 'CHUYEN_SAU', 1),
(6, 7, 'CO_BAN', 0),
(7, 6, 'CHUYEN_SAU', 1),
(7, 5, 'CO_BAN', 0),
(8, 2, 'THANH_THAO', 1),
(8, 1, 'CO_BAN', 0),
(9, 3, 'THANH_THAO', 1),
(9, 2, 'CO_BAN', 0),
(10, 3, 'THANH_THAO', 1),
(10, 4, 'CO_BAN', 0),
(11, 1, 'THANH_THAO', 1),
(11, 3, 'CO_BAN', 0),
(12, 4, 'THANH_THAO', 1),
(12, 3, 'CO_BAN', 0),
(13, 5, 'THANH_THAO', 1),
(13, 6, 'CO_BAN', 0),
(14, 6, 'THANH_THAO', 1),
(14, 5, 'CO_BAN', 0),
(15, 1, 'THANH_THAO', 1),
(15, 7, 'CO_BAN', 0),
(16, 1, 'THANH_THAO', 1),
(17, 1, 'THANH_THAO', 1),
(18, 1, 'THANH_THAO', 1),
(18, 3, 'CO_BAN', 0),
(19, 1, 'THANH_THAO', 1),
(20, 5, 'THANH_THAO', 1),
(20, 1, 'CO_BAN', 0),
(21, 9, 'THANH_THAO', 1),
(22, 9, 'THANH_THAO', 1),
(22, 10, 'CO_BAN', 0),
(23, 1, 'THANH_THAO', 1),
(23, 3, 'CO_BAN', 0),
(24, 1, 'THANH_THAO', 1)
ON CONFLICT (nhan_su_id, chuyen_mon_id) DO NOTHING;

-- Bảng 6: tai_khoan (9 tài khoản test, mật khẩu chung Nmh@2026)
INSERT INTO tai_khoan (id, ten_dang_nhap, mat_khau_bam, ten_hien_thi, vai_tro_id, nhan_su_id, trang_thai, thoi_diem_khoa, ly_do_khoa) VALUES
(1, 'admin', '$argon2id$v=19$m=19456,t=2,p=1$EsZTiWdenhwBywhR3/XpeA$aO9kjWs', 'Quản trị hệ thống', 1, NULL, 'HOAT_DONG', NULL, NULL),
(2, 'qly.bao', '$argon2id$v=19$m=19456,t=2,p=1$Ilpp6mcdOSwVR0HwJTOIEA$StkqfKb/7', 'Trần Quốc Bảo', 2, 1, 'HOAT_DONG', NULL, NULL),
(3, 'qly.nhung', '$argon2id$v=19$m=19456,t=2,p=1$r7k+ntMx5jwC/gqyXcmwvA$h/0bVKkH', 'Lê Thị Hồng Nhung', 2, 2, 'HOAT_DONG', NULL, NULL),
(4, 'dt.cuong', '$argon2id$v=19$m=19456,t=2,p=1$bInpJt6PZkpT/6/dDyZOqg$MeQpXbdad', 'Phạm Văn Cường', 3, 3, 'HOAT_DONG', NULL, NULL),
(5, 'dt.thang', '$argon2id$v=19$m=19456,t=2,p=1$2STKI0dr9Vvq7g0s0huFIw$MGSm6MyB', 'Nguyễn Đức Thắng', 3, 4, 'HOAT_DONG', NULL, NULL),
(6, 'dt.tuan', '$argon2id$v=19$m=19456,t=2,p=1$45dgDHL8VdlumYGQd0dYuQ$T4qs7op', 'Vũ Minh Tuấn', 3, 5, 'HOAT_DONG', NULL, NULL),
(7, 'gd.minh', '$argon2id$v=19$m=19456,t=2,p=1$dcZy/nKLl+LW0uUkYGuM3w$Fnq/rcSp', 'Giám đốc (giả lập 1)', 4, NULL, 'HOAT_DONG', NULL, NULL),
(8, 'gd.hoa', '$argon2id$v=19$m=19456,t=2,p=1$dcZy/nKLl+LW0uUkYGuM3w$Fnq/rcSp', 'Phó Giám đốc (giả lập 2)', 4, NULL, 'HOAT_DONG', NULL, NULL),
(9, 'qly.trung', '$argon2id$v=19$m=19456,t=2,p=1$MacX5FTWz/pbYCFlKJnQOA$oX+Azy8p', 'Quản lý cũ (đã nghỉ việc)', 2, NULL, 'BI_KHOA', '2026-08-28 09:00:00', 'Nghỉ việc; khóa theo quy trình bàn giao')
ON CONFLICT (id) DO UPDATE SET mat_khau_bam = EXCLUDED.mat_khau_bam, trang_thai = EXCLUDED.trang_thai, ly_do_khoa = EXCLUDED.ly_do_khoa;

-- Bảng 7: khach_hang (10 khách hàng)
INSERT INTO khach_hang (id, ma_khach_hang, ten, nguoi_lien_he, so_dien_thoai, email, dia_chi) VALUES
(1, 'KH001', 'Ban quản lý tòa chung cư HH Xanh', 'Lê Văn Phúc', '0900000201', 'kh001@example.com', 'Đông Anh, Hà Nội'),
(2, 'KH002', 'Trường THCS Ánh Dương', 'Trần Thị Mai', '0900000202', 'kh002@example.com', 'Hà Đông, Hà Nội'),
(3, 'KH003', 'Công ty CP Sản xuất An Bình', 'Nguyễn Hữu Thành', '0900000203', 'kh003@example.com', 'Long Biên, Hà Nội'),
(4, 'KH004', 'Trung tâm Hội nghị Sao Mai', 'Phạm Quang Vinh', '0900000204', 'kh004@example.com', 'Cầu Giấy, Hà Nội'),
(5, 'KH005', 'Khách sạn Hồ Tây View', 'Đỗ Thị Hương', '0900000205', 'kh005@example.com', 'Tây Hồ, Hà Nội'),
(6, 'KH006', 'Công ty TNHH Tòa nhà Minh Phát', 'Vũ Đình Khoa', '0900000206', 'kh006@example.com', 'Cầu Giấy, Hà Nội'),
(7, 'KH007', 'Công ty CP Địa ốc Green Park', 'Hoàng Thu Thủy', '0900000207', 'kh007@example.com', 'Thanh Xuân, Hà Nội'),
(8, 'KH008', 'Công ty TNHH Cơ khí Quang Minh', 'Bùi Văn Tiến', '0900000208', 'kh008@example.com', 'Mê Linh, Hà Nội'),
(9, 'KH009', 'Trường Mầm non Sao Nhi', 'Nguyễn Thị Lan', '0900000209', 'kh009@example.com', 'Hoàng Mai, Hà Nội'),
(10, 'KH010', 'Công ty TNHH Bình Minh Logistics', 'Lê Minh Quân', '0900000210', 'kh010@example.com', 'Long Biên, Hà Nội')
ON CONFLICT (id) DO NOTHING;

-- Bảng 8: loai_he_thong (7 loại)
INSERT INTO loai_he_thong (id, ma, ten) VALUES
(1, 'MANG_THOAI', 'Hạ tầng mạng và thoại'),
(2, 'MANG_KHONG_DAY', 'Mạng không dây'),
(3, 'AM_THANH_THONG_BAO', 'Hệ thống âm thanh thông báo'),
(4, 'AM_THANH_HINH_ANH_HOI_NGHI', 'Âm thanh, hình ảnh và hội nghị trực tuyến'),
(5, 'CAMERA_GIAM_SAT', 'Camera giám sát'),
(6, 'KIEM_SOAT_RA_VAO', 'Kiểm soát ra vào'),
(7, 'NHA_THONG_MINH', 'Hệ thống nhà thông minh')
ON CONFLICT (id) DO NOTHING;

-- Bảng 9: du_an (10 dự án)
INSERT INTO du_an (id, ma_du_an, ten, khach_hang_id, dia_diem_thi_cong, mo_ta_pham_vi, bat_dau_du_kien, ket_thuc_du_kien, trang_thai, nhan_su_phu_trach_id, thoi_diem_hoan_thanh, nguoi_xac_nhan_hoan_thanh_id, thoi_diem_huy, nguoi_huy_id, ly_do_huy, nguoi_tao_id) VALUES
(1, 'NMH-2026-001', 'Hạ tầng mạng và camera giám sát tòa chung cư HH Xanh', 1, 'Tòa chung cư HH Xanh, Đông Anh, Hà Nội', 'Cáp mạng, cáp quang, tủ mạng và camera hành lang tầng 1-10', '2026-06-14 08:00:00', '2026-09-07 17:00:00', 'HOAN_THANH', 1, '2026-09-07 16:30:00', 2, NULL, NULL, NULL, 2),
(2, 'NMH-2026-002', 'Hệ thống âm thanh thông báo Trường THCS Ánh Dương', 2, 'Trường THCS Ánh Dương, Hà Đông, Hà Nội', 'Hệ thống âm thanh thông báo các phòng học và sân trường', '2026-07-04 08:00:00', '2026-08-31 17:00:00', 'HOAN_THANH', 2, '2026-08-31 16:00:00', 3, NULL, NULL, NULL, 3),
(3, 'NMH-2026-003', 'Mạng LAN và WiFi văn phòng Công ty An Bình', 3, 'Khu công nghiệp Đài Tư, Long Biên, Hà Nội', 'Hạ tầng mạng nội bộ, WiFi công suất cao văn phòng tầng 2-3', '2026-09-14 08:00:00', '2026-11-06 17:00:00', 'DANG_THUC_HIEN', 1, NULL, NULL, NULL, NULL, NULL, 2),
(4, 'NMH-2026-004', 'Âm thanh hình ảnh hội trường Trung tâm Hội nghị Sao Mai', 4, 'Trung tâm Hội nghị Sao Mai, Cầu Giấy, Hà Nội', 'Hệ thống màn hình LED, âm thanh hội thảo và hội nghị truyền hình', '2026-09-04 08:00:00', '2026-10-28 17:00:00', 'DANG_THUC_HIEN', 2, NULL, NULL, NULL, NULL, NULL, 3),
(5, 'NMH-2026-005', 'Camera và kiểm soát ra vào Khách sạn Hồ Tây View', 5, 'Khách sạn Hồ Tây View, Tây Hồ, Hà Nội', 'Camera khuôn viên, khóa thẻ từ và cổng kiểm soát phân làn', '2026-09-21 08:00:00', '2026-11-20 17:00:00', 'DANG_THUC_HIEN', 1, NULL, NULL, NULL, NULL, NULL, 2),
(6, 'NMH-2026-006', 'Mạng cáp cấu trúc Tòa nhà Minh Phát', 6, 'Tòa nhà văn phòng Minh Phát, Cầu Giấy, Hà Nội', 'Trục cáp quang và cáp thoại tầng 5-8', '2026-09-16 08:00:00', '2026-11-15 17:00:00', 'TAM_DUNG', 2, NULL, NULL, NULL, NULL, NULL, 3),
(7, 'NMH-2026-007', 'Kiểm soát ra vào Tòa chung cư Green Park', 7, 'Khu đô thị Green Park, Thanh Xuân, Hà Nội', 'Lắp barrier bãi đỗ xe và đầu đọc thẻ thang máy', '2026-10-21 08:00:00', '2026-12-05 17:00:00', 'LAP_KE_HOACH', 1, NULL, NULL, NULL, NULL, NULL, 2),
(8, 'NMH-2026-008', 'Hạ tầng mạng và camera Nhà máy Cơ khí Quang Minh', 8, 'Khu công nghiệp Quang Minh, Mê Linh, Hà Nội', 'Tuyến cáp quang liên xưởng và camera quan sát phân xưởng', '2026-10-26 08:00:00', '2026-12-18 17:00:00', 'LAP_KE_HOACH', 2, NULL, NULL, NULL, NULL, NULL, 3),
(9, 'NMH-2026-009', 'Camera an ninh Trường Mầm non Sao Nhi', 9, 'Trường Mầm non Sao Nhi, Hoàng Mai, Hà Nội', 'Lắp 24 camera lớp học và khu vui chơi ngoài trời', '2026-09-28 08:00:00', '2026-10-25 17:00:00', 'HUY', 1, NULL, NULL, '2026-10-05 14:00:00', 2, 'Chủ đầu tư thay đổi kế hoạch tài chính và tạm dừng toàn bộ dự án', 2),
(10, 'NMH-2026-010', 'Âm thanh phòng họp trực tuyến Bình Minh Logistics', 10, 'Khu kho vận Bình Minh, Long Biên, Hà Nội', 'Thiết bị họp trực tuyến 2 phòng họp và âm thanh thông báo kho', '2026-09-25 08:00:00', '2026-10-30 17:00:00', 'DANG_THUC_HIEN', 2, NULL, NULL, NULL, NULL, NULL, 3)
ON CONFLICT (id) DO NOTHING;

-- Bảng 10: pham_vi_du_an (Phân quyền dự án theo mã quản lý)
INSERT INTO pham_vi_du_an (tai_khoan_id, du_an_id, nguoi_cap_id) VALUES
(2, 1, 1), (2, 3, 1), (2, 5, 1), (2, 7, 1), (2, 9, 1),
(3, 2, 1), (3, 4, 1), (3, 6, 1), (3, 8, 1), (3, 10, 1)
ON CONFLICT (tai_khoan_id, du_an_id) DO NOTHING;

-- Bảng 11: hang_muc (14 hạng mục)
INSERT INTO hang_muc (id, du_an_id, ma_hang_muc, ten, loai_he_thong_id, mo_ta, thu_tu) VALUES
(1, 1, 'HM01', 'Hạ tầng mạng và truyền dẫn', 1, 'Tuyến cáp mạng, cáp quang và tủ phân phối', 1),
(2, 1, 'HM02', 'Hệ thống camera giám sát', 5, 'Camera hành lang, sảnh và đầu ghi hình', 2),
(3, 2, 'HM01', 'Hệ thống âm thanh thông báo', 3, 'Loa thông báo phòng học và sân trường', 1),
(4, 3, 'HM01', 'Hạ tầng mạng LAN nội bộ', 1, 'Cáp mạng Cat6, tủ mạng và switch', 1),
(5, 3, 'HM02', 'Mạng không dây WiFi', 2, 'Access point và controller WiFi', 2),
(6, 4, 'HM01', 'Hệ thống âm thanh và hội nghị', 4, 'Loa hội trường, micro và màn hình LED', 1),
(7, 5, 'HM01', 'Hệ thống camera giám sát', 5, 'Camera sảnh, hành lang và khuôn viên', 1),
(8, 5, 'HM02', 'Kiểm soát ra vào và khóa từ', 6, 'Khóa thẻ từ phòng khách và barrier', 2),
(9, 6, 'HM01', 'Hạ tầng cáp cấu trúc và thoại', 1, 'Trục cáp quang và hệ thống thoại nội bộ', 1),
(10, 7, 'HM01', 'Kiểm soát phương tiện và thang máy', 6, 'Barrier bãi xe và đầu đọc thẻ thang máy', 1),
(11, 8, 'HM01', 'Tuyến cáp quang liên xưởng', 1, 'Kéo cáp quang luồn ống ngầm và treo cột', 1),
(12, 8, 'HM02', 'Camera quan sát nhà xưởng', 5, 'Camera thân trụ tầm xa và đầu ghi NVR', 2),
(13, 9, 'HM01', 'Camera an ninh mầm non', 5, 'Camera lớp học và khuôn viên sân chơi', 1),
(14, 10, 'HM01', 'Âm thanh phòng họp trực tuyến', 4, 'Hệ thống micro, loa thanh và camera họp', 1)
ON CONFLICT (id) DO NOTHING;

-- Bảng 12: cong_viec (42 công việc)
INSERT INTO cong_viec (id, hang_muc_id, du_an_id, ma_cong_viec, ten, mo_ta, khu_vuc_trien_khai, bat_dau_du_kien, ket_thuc_du_kien, trang_thai, nhan_su_chinh_id, thoi_diem_hoan_thanh, nguoi_xac_nhan_hoan_thanh_id, thoi_diem_huy, nguoi_huy_id, ly_do_huy, nguoi_tao_id) VALUES
(1, 1, 1, 'CV01', 'Khảo sát hiện trạng và chốt tuyến cáp tầng 1-10', 'Đo đạc trục kỹ thuật, xác định vị trí máng cáp', 'Tầng 1-10', '2026-06-14 08:00:00', '2026-06-24 17:00:00', 'HOAN_THANH', 6, '2026-06-25 15:00:00', 2, NULL, NULL, NULL, 2),
(2, 1, 1, 'CV02', 'Kéo cáp mạng Cat6 và cáp quang tầng 1-10', 'Rải cáp trong máng cáp và ống luồn PVC D20', 'Tầng 1-10', '2026-06-26 08:00:00', '2026-07-19 17:00:00', 'HOAN_THANH', 3, '2026-07-20 15:00:00', 2, NULL, NULL, NULL, 2),
(3, 1, 1, 'CV03', 'Lắp tủ mạng, patch panel và đấu nối', 'Đấu nối thanh quản lý cáp và bấm hạt mạng', 'Phòng kỹ thuật các tầng', '2026-07-20 08:00:00', '2026-08-03 17:00:00', 'HOAN_THANH', 3, '2026-08-04 15:00:00', 2, NULL, NULL, NULL, 2),
(4, 2, 1, 'CV04', 'Lắp camera sảnh và hành lang tầng 1-10', 'Gắn giá treo và cân chỉnh góc nhìn', 'Tầng 1-10', '2026-07-29 08:00:00', '2026-08-18 17:00:00', 'HOAN_THANH', 4, '2026-08-19 15:00:00', 2, NULL, NULL, NULL, 2),
(5, 2, 1, 'CV05', 'Cấu hình đầu ghi NVR và nghiệm thu camera', 'Cài đặt IP tĩnh, phân quyền xem qua mạng', 'Phòng bảo vệ', '2026-08-19 08:00:00', '2026-09-02 17:00:00', 'HOAN_THANH', 6, '2026-09-03 15:00:00', 2, NULL, NULL, NULL, 2),
(6, 2, 1, 'CV06', 'Lắp camera khu vực hầm B2', 'Chủ đầu tư cắt giảm hạng mục', 'Hầm B2', '2026-08-23 08:00:00', '2026-09-02 17:00:00', 'HUY', 4, NULL, NULL, '2026-08-22 11:00:00', 2, 'Chủ đầu tư bỏ hạng mục hầm B2 khỏi phạm vi', 2),
(7, 3, 2, 'CV07', 'Khảo sát và thiết kế phương án âm thanh', 'Tính toán công suất loa phòng học và sân trường', 'Toàn trường', '2026-07-04 08:00:00', '2026-07-14 17:00:00', 'HOAN_THANH', 7, '2026-07-15 15:00:00', 2, NULL, NULL, NULL, 2),
(8, 3, 2, 'CV08', 'Kéo cáp tín hiệu và lắp loa các phòng học', 'Đi ống ghen và gắn loa hộp 6W', 'Khối lớp học', '2026-07-16 08:00:00', '2026-08-08 17:00:00', 'HOAN_THANH', 5, '2026-08-09 15:00:00', 2, NULL, NULL, NULL, 2),
(9, 3, 2, 'CV09', 'Lắp bộ khuếch đại, cấu hình vùng phát và nghiệm thu', 'Lắp amply trung tâm và bàn chọn vùng phát', 'Phòng bảo vệ', '2026-08-09 08:00:00', '2026-08-27 17:00:00', 'HOAN_THANH', 7, '2026-08-28 15:00:00', 2, NULL, NULL, NULL, 2),
(10, 4, 3, 'CV10', 'Kéo cáp mạng khu văn phòng tầng 2', 'Rải cáp Cat6 và lắp mặt nạ âm sàn', 'Tầng 2', '2026-09-14 08:00:00', '2026-09-30 17:00:00', 'HOAN_THANH', 3, '2026-10-01 15:00:00', 2, NULL, NULL, NULL, 2),
(11, 4, 3, 'CV11', 'Lắp tủ mạng và đấu nối switch', 'Gắn tủ rack 27U và patch panel', 'Phòng server tầng 2', '2026-09-28 08:00:00', '2026-10-10 17:00:00', 'HOAN_THANH', 3, '2026-10-11 15:00:00', 2, NULL, NULL, NULL, 2),
(12, 4, 3, 'CV12', 'Cấu hình VLAN, firewall và định tuyến', 'Phân tách mạng nội bộ và mạng khách', 'Phòng server tầng 2', '2026-10-09 08:00:00', '2026-10-22 17:00:00', 'DANG_THUC_HIEN', 6, NULL, NULL, NULL, NULL, NULL, 2),
(13, 5, 3, 'CV13', 'Lắp access point tầng 2-3', 'Gắn 14 bộ phát WiFi công suất cao', 'Tầng 2-3', '2026-10-10 08:00:00', '2026-10-20 17:00:00', 'DANG_THUC_HIEN', 4, NULL, NULL, NULL, NULL, NULL, 2),
(14, 5, 3, 'CV14', 'Khảo sát và tinh chỉnh vùng phủ sóng', 'Đo kiểm độ suy hao sóng bằng Heatmap', 'Tầng 2-3', '2026-10-21 08:00:00', '2026-11-01 17:00:00', 'CHUA_BAT_DAU', 6, NULL, NULL, NULL, NULL, NULL, 2),
(15, 4, 3, 'CV15', 'Nghiệm thu và bàn giao hạ tầng mạng', 'Bàn giao sơ đồ logic và mật khẩu quản trị', 'Toàn văn phòng', '2026-11-02 08:00:00', '2026-11-06 17:00:00', 'CHUA_BAT_DAU', 1, NULL, NULL, NULL, NULL, NULL, 2),
(16, 6, 4, 'CV16', 'Lắp hệ thống loa và micro hội trường lớn', 'Treo loa line array và lắp cụm micro cổ ngỗng', 'Hội trường lớn', '2026-09-04 08:00:00', '2026-10-07 17:00:00', 'DANG_THUC_HIEN', 5, NULL, NULL, NULL, NULL, NULL, 2),
(17, 6, 4, 'CV17', 'Lắp bộ xử lý tín hiệu và khuếch đại', 'Đấu nối DSP và amply công suất cao', 'Phòng kỹ thuật', '2026-09-22 08:00:00', '2026-10-06 17:00:00', 'HOAN_THANH', 7, '2026-10-07 15:00:00', 2, NULL, NULL, NULL, 2),
(18, 6, 4, 'CV18', 'Lắp màn hình LED và thiết bị hội nghị trực tuyến', 'Lắp cabinet LED P2.5 và camera hội nghị PTZ', 'Sân khấu', '2026-10-04 08:00:00', '2026-10-16 17:00:00', 'DANG_THUC_HIEN', 7, NULL, NULL, NULL, NULL, NULL, 2),
(19, 6, 4, 'CV19', 'Cấu hình, hiệu chỉnh âm thanh và chạy thử', 'Cân chỉnh pha âm thanh, triệt tiêu tiếng hú rít', 'Hội trường lớn', '2026-10-17 08:00:00', '2026-10-21 17:00:00', 'CHUA_BAT_DAU', 5, NULL, NULL, NULL, NULL, NULL, 2),
(20, 6, 4, 'CV20', 'Nghiệm thu và bàn giao hội trường', 'Lập biên bản đo kiểm âm học và bàn giao hướng dẫn', 'Hội trường lớn', '2026-10-21 08:00:00', '2026-10-22 17:00:00', 'CHUA_BAT_DAU', 2, NULL, NULL, NULL, NULL, NULL, 2),
(21, 7, 5, 'CV21', 'Lắp camera sảnh và hành lang các tầng khách', 'Gắn 64 camera dome hồng ngoại', 'Tầng 2-9', '2026-09-24 08:00:00', '2026-10-17 17:00:00', 'DANG_THUC_HIEN', 4, NULL, NULL, NULL, NULL, NULL, 2),
(22, 7, 5, 'CV22', 'Lắp camera bãi xe và khu vực kỹ thuật', 'Có phần việc giao khoán ngoài', 'Bãi xe, tầng hầm', '2026-10-13 08:00:00', '2026-10-24 17:00:00', 'CHUA_BAT_DAU', 4, NULL, NULL, NULL, NULL, NULL, 2),
(23, 7, 5, 'CV23', 'Cấu hình đầu ghi và hệ thống lưu trữ', 'Lưu trữ hình ảnh 30 ngày chuẩn khách sạn', 'Phòng bảo vệ', '2026-10-22 08:00:00', '2026-10-30 17:00:00', 'CHUA_BAT_DAU', 6, NULL, NULL, NULL, NULL, NULL, 2),
(24, 8, 5, 'CV24', 'Lắp đầu đọc thẻ và khóa từ khu vực nhân viên', 'Kiểm soát cửa phân quyền nhân sự khách sạn', 'Khu nhân viên', '2026-10-07 08:00:00', '2026-10-26 17:00:00', 'DANG_THUC_HIEN', 4, NULL, NULL, NULL, NULL, NULL, 2),
(25, 8, 5, 'CV25', 'Kéo cáp tín hiệu kiểm soát ra vào (nhà A1)', 'Giao khoán cho Đội thi công Nguyên Khê', 'Nhà A1', '2026-10-02 08:00:00', '2026-10-15 17:00:00', 'DANG_THUC_HIEN', 4, NULL, NULL, NULL, NULL, NULL, 2),
(26, 8, 5, 'CV26', 'Cấu hình phần mềm và phân quyền thẻ', 'Phân quyền ra vào khu bếp, kho và văn phòng', 'Phòng bảo vệ', '2026-10-27 08:00:00', '2026-11-11 17:00:00', 'CHUA_BAT_DAU', 6, NULL, NULL, NULL, NULL, NULL, 2),
(27, 7, 5, 'CV27', 'Nghiệm thu và bàn giao', 'Kiểm tra hoạt động toàn hệ thống an ninh', 'Toàn khách sạn', '2026-11-16 08:00:00', '2026-11-21 17:00:00', 'CHUA_BAT_DAU', 1, NULL, NULL, NULL, NULL, NULL, 2),
(28, 9, 6, 'CV28', 'Kéo cáp thoại tầng 5-8', 'Tuyến cáp 50 đôi đi trong trục kỹ thuật', 'Tầng 5-8', '2026-09-20 08:00:00', '2026-10-16 17:00:00', 'DANG_THUC_HIEN', 3, NULL, NULL, NULL, NULL, NULL, 2),
(29, 9, 6, 'CV29', 'Lắp tổng đài và đấu nối', 'Đấu phiến thoại Krone và gắn tổng đài IP', 'Phòng kỹ thuật', '2026-10-17 08:00:00', '2026-10-27 17:00:00', 'CHUA_BAT_DAU', 6, NULL, NULL, NULL, NULL, NULL, 2),
(30, 9, 6, 'CV30', 'Nghiệm thu và bàn giao', 'Đo kiểm tín hiệu thoại nội bộ', 'Tầng 5-8', '2026-11-06 08:00:00', '2026-11-11 17:00:00', 'CHUA_BAT_DAU', 2, NULL, NULL, NULL, NULL, NULL, 2),
(31, 10, 7, 'CV31', 'Khảo sát căn hộ mẫu và lập phương án', 'Khảo sát vị trí công tắc, cảm biến và rèm tự động', 'Căn hộ mẫu', '2026-10-22 08:00:00', '2026-10-28 17:00:00', 'CHUA_BAT_DAU', 7, NULL, NULL, NULL, NULL, NULL, 2),
(32, 10, 7, 'CV32', 'Kéo cáp và lắp thiết bị điều khiển', 'Kéo dây bus điều khiển và lắp công tắc cảm ứng', 'Căn hộ mẫu', '2026-10-29 08:00:00', '2026-11-16 17:00:00', 'CHUA_BAT_DAU', 3, NULL, NULL, NULL, NULL, NULL, 2),
(33, 10, 7, 'CV33', 'Cấu hình kịch bản và bàn giao', 'Lập trình ngữ cảnh tiếp khách, nghỉ ngơi trên app', 'Căn hộ mẫu', '2026-11-17 08:00:00', '2026-12-06 17:00:00', 'CHUA_BAT_DAU', 6, NULL, NULL, NULL, NULL, NULL, 2),
(34, 11, 8, 'CV34', 'Khảo sát nhà xưởng', 'Đo khoảng cách giữa các phân xưởng', 'Nhà xưởng 1-3', '2026-11-01 08:00:00', '2026-11-06 17:00:00', 'CHUA_BAT_DAU', 6, NULL, NULL, NULL, NULL, NULL, 2),
(35, 11, 8, 'CV35', 'Kéo cáp quang liên tòa', 'Treo cáp quang luồn cống bể', 'Liên tòa', '2026-11-07 08:00:00', '2026-12-01 17:00:00', 'CHUA_BAT_DAU', 3, NULL, NULL, NULL, NULL, NULL, 2),
(36, 11, 8, 'CV36', 'Lắp tủ mạng', 'Lắp tủ rack công nghiệp chống bụi IP55', 'Nhà xưởng 1-3', '2026-11-26 08:00:00', '2026-12-16 17:00:00', 'CHUA_BAT_DAU', 3, NULL, NULL, NULL, NULL, NULL, 2),
(37, 12, 9, 'CV37', 'Lắp access point các phòng học', 'Đã dừng theo dự án', 'Khối lớp học', '2026-09-28 08:00:00', '2026-10-11 17:00:00', 'HUY', 4, NULL, NULL, '2026-10-09 16:00:00', 2, 'Hủy theo dự án (khách hàng dừng đầu tư)', 2),
(38, 13, 9, 'CV38', 'Lắp camera sân trường', 'Đã dừng theo dự án', 'Sân trường', '2026-10-12 08:00:00', '2026-10-27 17:00:00', 'HUY', 4, NULL, NULL, '2026-10-09 16:00:00', 2, 'Hủy theo dự án (khách hàng dừng đầu tư)', 2),
(39, 12, 9, 'CV39', 'Khảo sát hiện trạng', 'Đã hoàn thành trước khi dự án bị hủy', 'Toàn trường', '2026-09-27 08:00:00', '2026-09-30 17:00:00', 'HOAN_THANH', 6, '2026-10-01 09:00:00', 2, NULL, NULL, NULL, 2),
(40, 14, 10, 'CV40', 'Lắp camera và micro phòng họp', 'Lắp camera Tracking tự động bắt người phát biểu', 'Phòng họp lớn', '2026-10-02 08:00:00', '2026-10-18 17:00:00', 'DANG_THUC_HIEN', 5, NULL, NULL, NULL, NULL, NULL, 2),
(41, 14, 10, 'CV41', 'Cấu hình hệ thống hội nghị trực tuyến', 'Kết nối nền tảng họp trực tuyến MS Teams, Zoom', 'Phòng họp lớn', '2026-10-06 08:00:00', '2026-10-14 17:00:00', 'HOAN_THANH', 7, '2026-10-08 10:00:00', 2, NULL, NULL, NULL, 2),
(42, 14, 10, 'CV42', 'Chạy thử và đào tạo người dùng', 'Hướng dẫn cán bộ kỹ thuật vận hành phòng họp', 'Phòng họp lớn', '2026-10-15 08:00:00', '2026-10-24 17:00:00', 'CHUA_BAT_DAU', 2, NULL, NULL, NULL, NULL, NULL, 2)
ON CONFLICT (id) DO NOTHING;

-- Bảng 13: lich_nghi_ban (9 lịch nghỉ/bận)
INSERT INTO lich_nghi_ban (id, nhan_su_id, thoi_diem_bat_dau, thoi_diem_ket_thuc, ly_do, trang_thai, nguoi_ghi_nhan_id, thoi_diem_huy, nguoi_huy_id, ly_do_huy) VALUES
(1, 9, '2026-10-06 08:00:00', '2026-10-07 17:00:00', 'Nghỉ ốm có giấy xác nhận', 'HIEU_LUC', 2, NULL, NULL, NULL),
(2, 16, '2026-09-12 08:00:00', '2026-09-17 17:00:00', 'Nghỉ phép năm', 'HIEU_LUC', 2, NULL, NULL, NULL),
(3, 20, '2026-10-09 08:00:00', '2026-10-09 17:00:00', 'Việc gia đình', 'HIEU_LUC', 2, NULL, NULL, NULL),
(4, 14, '2026-10-18 08:00:00', '2026-10-20 17:00:00', 'Đi công tác ngoài tỉnh (đã xin phép)', 'HIEU_LUC', 2, NULL, NULL, NULL),
(5, 8, '2026-10-27 08:00:00', '2026-10-28 17:00:00', 'Nghỉ phép', 'HUY', 2, '2026-10-10 11:00:00', 2, 'Nhân sự rút đơn xin nghỉ'),
(6, 6, '2026-11-11 08:00:00', '2026-11-15 17:00:00', 'Nghỉ phép năm', 'HIEU_LUC', 2, NULL, NULL, NULL),
(7, 24, '2026-11-01 08:00:00', '2026-11-03 17:00:00', 'Nghỉ phép', 'HIEU_LUC', 2, NULL, NULL, NULL),
(8, 12, '2026-10-14 08:00:00', '2026-10-15 17:00:00', 'Việc gia đình (đã xin phép)', 'HIEU_LUC', 2, NULL, NULL, NULL),
(9, 11, '2026-10-13 08:00:00', '2026-10-13 12:00:00', 'Khám sức khỏe định kỳ', 'HIEU_LUC', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Bảng 14: phan_cong (92 phân công)
INSERT INTO phan_cong (id, cong_viec_id, nhan_su_id, thoi_diem_bat_dau, thoi_diem_ket_thuc, trang_thai, nguoi_tao_id, thoi_diem_huy, nguoi_huy_id, ly_do_huy) VALUES
(1, 10, 23, '2026-09-14 08:00:00', '2026-09-19 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(2, 12, 23, '2026-10-09 08:00:00', '2026-10-15 17:00:00', 'HUY', 2, '2026-09-22 17:00:00', 2, 'Nhân sự ngừng làm việc từ 22/09/2026'),
(3, 1, 6, '2026-06-14 08:00:00', '2026-06-18 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(4, 1, 21, '2026-06-16 08:00:00', '2026-06-20 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(5, 1, 3, '2026-06-17 08:00:00', '2026-06-19 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(6, 2, 11, '2026-06-26 08:00:00', '2026-07-08 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(7, 2, 12, '2026-06-26 08:00:00', '2026-07-08 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(8, 2, 18, '2026-07-09 08:00:00', '2026-07-19 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(9, 2, 19, '2026-07-09 08:00:00', '2026-07-19 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(10, 3, 8, '2026-07-20 08:00:00', '2026-07-28 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(11, 3, 15, '2026-07-20 08:00:00', '2026-07-28 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(12, 3, 17, '2026-07-24 08:00:00', '2026-08-03 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(13, 4, 9, '2026-07-29 08:00:00', '2026-08-13 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(14, 4, 10, '2026-07-29 08:00:00', '2026-08-13 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(15, 5, 6, '2026-08-19 08:00:00', '2026-08-29 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(16, 5, 8, '2026-08-19 08:00:00', '2026-08-29 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(17, 6, 10, '2026-08-23 08:00:00', '2026-08-27 17:00:00', 'HUY', 2, '2026-08-22 11:00:00', 2, 'Hủy theo công việc CV06 (chủ đầu tư bỏ hạng mục hầm B2)'),
(18, 6, 12, '2026-08-23 08:00:00', '2026-08-27 17:00:00', 'HUY', 2, '2026-08-22 11:00:00', 2, 'Hủy theo công việc CV06 (chủ đầu tư bỏ hạng mục hầm B2)'),
(19, 7, 7, '2026-07-04 08:00:00', '2026-07-08 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(20, 7, 22, '2026-07-06 08:00:00', '2026-07-10 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(21, 8, 13, '2026-07-16 08:00:00', '2026-08-01 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(22, 8, 14, '2026-07-16 08:00:00', '2026-08-01 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(23, 8, 20, '2026-07-24 08:00:00', '2026-08-07 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(24, 9, 7, '2026-08-09 08:00:00', '2026-08-19 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(25, 9, 13, '2026-08-09 08:00:00', '2026-08-19 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(26, 9, 14, '2026-08-09 08:00:00', '2026-08-19 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(27, 10, 18, '2026-09-14 08:00:00', '2026-09-28 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(28, 10, 19, '2026-09-14 08:00:00', '2026-09-28 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(29, 11, 8, '2026-09-28 08:00:00', '2026-10-06 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(30, 11, 15, '2026-09-28 08:00:00', '2026-10-06 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(31, 12, 6, '2026-10-09 08:00:00', '2026-10-16 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(32, 12, 8, '2026-10-09 08:00:00', '2026-10-12 12:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(33, 12, 15, '2026-10-09 08:00:00', '2026-10-18 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(34, 13, 9, '2026-10-10 08:00:00', '2026-10-15 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(35, 13, 10, '2026-10-10 08:00:00', '2026-10-17 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(36, 13, 24, '2026-10-12 08:00:00', '2026-10-17 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(37, 14, 9, '2026-10-21 08:00:00', '2026-10-26 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(38, 14, 6, '2026-10-21 08:00:00', '2026-10-28 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(39, 15, 1, '2026-11-02 08:00:00', '2026-11-04 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(40, 16, 13, '2026-09-04 08:00:00', '2026-09-22 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(41, 16, 14, '2026-09-04 08:00:00', '2026-09-18 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(42, 16, 20, '2026-09-06 08:00:00', '2026-09-24 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(43, 16, 13, '2026-09-30 08:00:00', '2026-10-06 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(44, 16, 20, '2026-10-02 08:00:00', '2026-10-07 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(45, 17, 7, '2026-09-22 08:00:00', '2026-09-30 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(46, 17, 14, '2026-09-24 08:00:00', '2026-09-30 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(47, 18, 7, '2026-10-04 08:00:00', '2026-10-11 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(48, 18, 14, '2026-10-04 08:00:00', '2026-10-10 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(49, 19, 5, '2026-10-17 08:00:00', '2026-10-21 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(50, 19, 13, '2026-10-17 08:00:00', '2026-10-21 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(51, 19, 7, '2026-10-17 08:00:00', '2026-10-21 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(52, 20, 2, '2026-10-21 08:00:00', '2026-10-22 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(53, 21, 9, '2026-09-24 08:00:00', '2026-10-04 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(54, 21, 11, '2026-09-24 08:00:00', '2026-09-28 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(55, 21, 11, '2026-10-02 08:00:00', '2026-10-06 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(56, 21, 11, '2026-10-13 08:00:00', '2026-10-17 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(57, 21, 12, '2026-09-26 08:00:00', '2026-10-04 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(58, 21, 12, '2026-10-13 08:00:00', '2026-10-16 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(59, 21, 24, '2026-09-24 08:00:00', '2026-10-02 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(60, 24, 19, '2026-10-07 08:00:00', '2026-10-14 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(61, 24, 8, '2026-10-12 12:00:00', '2026-10-15 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(62, 24, 17, '2026-10-13 08:00:00', '2026-10-20 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(63, 22, 16, '2026-10-18 08:00:00', '2026-10-24 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(64, 23, 15, '2026-10-22 08:00:00', '2026-10-30 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(65, 26, 6, '2026-11-01 08:00:00', '2026-11-07 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(66, 27, 1, '2026-11-19 08:00:00', '2026-11-20 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(67, 28, 3, '2026-09-20 08:00:00', '2026-10-02 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(68, 28, 16, '2026-09-20 08:00:00', '2026-10-02 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(69, 28, 18, '2026-10-08 08:00:00', '2026-10-16 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(70, 28, 16, '2026-10-08 08:00:00', '2026-10-16 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(71, 29, 8, '2026-10-17 08:00:00', '2026-10-24 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(72, 29, 3, '2026-10-17 08:00:00', '2026-10-24 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(73, 31, 7, '2026-10-22 08:00:00', '2026-10-26 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(74, 31, 21, '2026-10-23 08:00:00', '2026-10-27 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(75, 32, 17, '2026-10-29 08:00:00', '2026-11-11 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(76, 32, 16, '2026-10-30 08:00:00', '2026-11-11 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(77, 34, 3, '2026-11-01 08:00:00', '2026-11-05 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(78, 34, 22, '2026-11-02 08:00:00', '2026-11-05 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(79, 37, 10, '2026-09-28 08:00:00', '2026-10-09 16:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(80, 37, 17, '2026-09-28 08:00:00', '2026-10-09 16:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(81, 37, 9, '2026-10-10 08:00:00', '2026-10-11 17:00:00', 'HUY', 2, '2026-10-09 16:00:00', 2, 'Hủy theo dự án NMH-2026-009'),
(82, 38, 10, '2026-10-12 08:00:00', '2026-10-17 17:00:00', 'HUY', 2, '2026-10-09 16:00:00', 2, 'Hủy theo dự án NMH-2026-009'),
(83, 38, 18, '2026-10-12 08:00:00', '2026-10-20 17:00:00', 'HUY', 2, '2026-10-09 16:00:00', 2, 'Hủy theo dự án NMH-2026-009'),
(84, 39, 6, '2026-09-27 08:00:00', '2026-09-30 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(85, 39, 22, '2026-09-27 08:00:00', '2026-09-29 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(86, 41, 9, '2026-10-06 08:00:00', '2026-10-08 10:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(87, 41, 12, '2026-10-06 08:00:00', '2026-10-07 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(88, 41, 19, '2026-10-09 08:00:00', '2026-10-13 17:00:00', 'HUY', 2, '2026-10-08 10:00:00', 3, 'G2: phân công bắt đầu sau thời điểm xác nhận hoàn thành CV41'),
(89, 40, 20, '2026-10-09 08:00:00', '2026-10-18 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(90, 40, 13, '2026-10-12 08:00:00', '2026-10-16 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(91, 42, 14, '2026-10-21 08:00:00', '2026-10-24 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL),
(92, 42, 20, '2026-10-21 08:00:00', '2026-10-24 17:00:00', 'HIEU_LUC', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Bảng 15: doi_ben_ngoai (3 đội thuê ngoài)
INSERT INTO doi_ben_ngoai (id, ten, nguoi_lien_he, so_dien_thoai, khu_vuc_hoat_dong, trang_thai, ghi_chu) VALUES
(1, 'Đội thi công điện nhẹ Nguyên Khê', 'Anh Hùng', '0900000301', 'Nguyên Khê, Đông Anh', 'HOP_TAC', 'Đội nhận khoán, huy động tối thiểu 4 công nhân'),
(2, 'Đội cáp quang Vân Nội', 'Chị Thu', '0900000302', 'Vân Nội, Đông Anh', 'HOP_TAC', 'Chuyên tuyến cáp quang liên tòa'),
(3, 'Công ty TNHH Lắp đặt Việt Âm', 'Anh Quang', '0900000303', 'Hà Nội', 'NGUNG_HOP_TAC', 'Ngừng hợp tác từ quý 2')
ON CONFLICT (id) DO NOTHING;

-- Bảng 16: phan_cong_ben_ngoai (3 giao việc ngoài)
INSERT INTO phan_cong_ben_ngoai (id, cong_viec_id, doi_ben_ngoai_id, phan_viec_giao, bat_dau_du_kien, ket_thuc_du_kien, so_nguoi_du_kien, nhan_su_phoi_hop_id, trang_thai, ghi_chu, nguoi_tao_id, thoi_diem_huy, ly_do_huy) VALUES
(1, 25, 1, 'Kéo cáp tín hiệu kiểm soát ra vào nhà A1 (khoảng 600 m cáp, đi ống luồn)', '2026-10-02 08:00:00', '2026-10-15 17:00:00', 4, 3, 'HIEU_LUC', 'Đội trưởng Phạm Văn Cường phối hợp và giám sát', 2, NULL, NULL),
(2, 22, 2, 'Kéo cáp và lắp camera bãi xe, tầng hầm', '2026-10-13 08:00:00', '2026-10-24 17:00:00', 3, 4, 'HIEU_LUC', 'Đội trưởng Nguyễn Đức Thắng phối hợp', 2, NULL, NULL),
(3, 38, 1, 'Kéo cáp camera sân trường', '2026-10-12 08:00:00', '2026-10-27 17:00:00', 4, 4, 'HUY', 'Chủ đầu tư tạm hoãn gói sân trường', 2, '2026-10-09 16:00:00', 'Hủy theo dự án NMH-2026-009')
ON CONFLICT (id) DO NOTHING;

-- Bảng 17: cap_nhat_ket_qua (40 cập nhật kết quả)
INSERT INTO cap_nhat_ket_qua (id, cong_viec_id, phan_cong_ben_ngoai_id, tai_khoan_gui_id, thoi_diem_ghi_nhan, noi_dung, kho_khan, de_nghi_hoan_thanh, cap_nhat_dinh_chinh_id) VALUES
(1, 1, NULL, 2, '2026-06-19 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(2, 1, NULL, 2, '2026-06-24 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(3, 2, NULL, 4, '2026-07-07 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(4, 2, NULL, 4, '2026-07-19 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(5, 3, NULL, 4, '2026-07-27 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(6, 3, NULL, 4, '2026-08-03 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(7, 4, NULL, 5, '2026-08-08 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(8, 4, NULL, 5, '2026-08-18 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(9, 5, NULL, 2, '2026-08-26 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(10, 5, NULL, 2, '2026-09-02 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(11, 7, NULL, 3, '2026-07-09 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(12, 7, NULL, 3, '2026-07-14 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(13, 8, NULL, 6, '2026-07-27 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(14, 8, NULL, 6, '2026-08-08 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(15, 9, NULL, 3, '2026-08-18 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(16, 9, NULL, 3, '2026-08-27 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(17, 10, NULL, 4, '2026-09-22 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(18, 10, NULL, 4, '2026-09-30 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(19, 11, NULL, 4, '2026-10-04 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(20, 11, NULL, 4, '2026-10-10 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(21, 17, NULL, 3, '2026-09-29 16:30:00', 'Đã triển khai khoảng 60% khối lượng theo kế hoạch; hiện trường thuận lợi.', NULL, 0, NULL),
(22, 17, NULL, 3, '2026-10-06 17:30:00', 'Hoàn tất khối lượng, đã tự kiểm tra; đề nghị Quản lý xác nhận hoàn thành.', NULL, 1, NULL),
(23, 12, NULL, 2, '2026-10-10 17:00:00', 'Đã cấu hình VLAN cho tầng 2; đang thử định tuyến giữa các VLAN.', NULL, 0, NULL),
(24, 12, NULL, 2, '2026-10-11 08:30:00', 'Đính chính: số VLAN đã cấu hình là 6 (không phải 5 như báo cáo ngày -2).', NULL, 0, 23),
(25, 12, NULL, 2, '2026-10-12 08:40:00', 'Firewall chưa nhận được cấu hình mẫu từ khách hàng; tạm dừng một phần.', NULL, 0, NULL),
(26, 13, NULL, 5, '2026-10-11 16:50:00', 'Đã lắp 8/14 access point tầng 2.', NULL, 0, NULL),
(27, 16, NULL, 6, '2026-09-12 17:00:00', 'Hoàn thành lắp loa khu khán phòng phía trước.', NULL, 1, NULL),
(28, 16, NULL, 6, '2026-10-05 17:00:00', 'Vị trí loa cánh trái đã điều chỉnh theo khảo sát âm học; còn micro bàn chủ tọ', NULL, 0, NULL),
(29, 16, NULL, 3, '2026-10-07 17:20:00', 'Còn micro bàn chủ tọa chưa lắp do chờ phụ kiện.', NULL, 0, NULL),
(30, 18, NULL, 3, '2026-10-09 16:40:00', 'Đã lắp khung màn hình LED; chuẩn bị đấu nối bộ điều khiển.', NULL, 0, NULL),
(31, 21, NULL, 5, '2026-10-03 17:10:00', 'Hoàn tất lắp camera tầng 2-5.', NULL, 0, NULL),
(32, 21, NULL, 5, '2026-10-11 17:00:00', 'Đang lắp camera tầng 6-9; còn thiếu 4 camera so với danh mục.', NULL, 0, NULL),
(33, 24, NULL, 5, '2026-10-10 16:50:00', 'Đã lắp 6/12 đầu đọc thẻ khu nhân viên.', NULL, 0, NULL),
(34, 25, NULL, 1, '2026-10-08 17:20:00', 'Đội Nguyên Khê đã kéo xong khoảng 60% tuyến cáp tầng 1-3 nhà A1.', NULL, 0, NULL),
(35, 25, NULL, 1, '2026-10-11 17:05:00', 'Đội Nguyên Khê hoàn thành tuyến cáp tầng 4; còn tầng 5. Đề nghị nghiệm thu khối lượng từng tầng.', NULL, 1, NULL),
(36, 28, NULL, 4, '2026-10-09 16:30:00', 'Đã kéo xong cáp thoại tầng 5-6; dự án chuyển Tạm dừng từ ngày -2.', NULL, 0, NULL),
(37, 40, NULL, 6, '2026-10-10 17:00:00', 'Đã lắp camera phòng họp và 4/6 micro.', NULL, 0, NULL),
(38, 41, NULL, 3, '2026-10-08 09:30:00', 'Đã cấu hình xong hệ thống hội nghị và kiểm tra kết nối; đề nghị xác nhận hoàn thành sớm.', NULL, 1, NULL),
(39, 37, NULL, 5, '2026-10-07 16:00:00', 'Đã lắp 9/20 access point trước khi khách hàng thông báo dừng.', NULL, 0, NULL),
(40, 39, NULL, 2, '2026-09-29 16:00:00', 'Hoàn tất khảo sát hiện trạng trường; đã chụp ảnh phòng học.', NULL, 1, NULL)
ON CONFLICT (id) DO NOTHING;

-- Bảng 18: tep_minh_chung (38 tệp minh chứng)
INSERT INTO tep_minh_chung (id, cap_nhat_id, ten_tep_goc, duong_dan_luu, kieu_noi_dung, dung_luong_byte, ma_bam_sha256) VALUES
(1, 1, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/06/cv01-001.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(2, 2, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/06/cv01-002.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(3, 3, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/07/cv02-003.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(4, 4, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/07/cv02-004.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(5, 5, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/07/cv03-005.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(6, 6, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/08/cv03-006.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(7, 7, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/08/cv04-007.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(8, 8, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/08/cv04-008.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(9, 9, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/08/cv05-009.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(10, 10, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/09/cv05-010.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(11, 11, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/07/cv07-011.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(12, 12, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/07/cv07-012.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(13, 13, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/07/cv08-013.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(14, 14, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/08/cv08-014.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(15, 15, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/08/cv09-015.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(16, 16, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/08/cv09-016.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(17, 17, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/09/cv10-017.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(18, 18, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/09/cv10-018.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(19, 19, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv11-019.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(20, 20, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv11-020.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(21, 21, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/09/cv17-021.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(22, 22, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv17-022.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(23, 26, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv13-023.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(24, 26, 'hien-truong-1.jpg', 'tep_tai_len/cap_nhat/2026/10/cv13-024.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(25, 27, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/09/cv16-025.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(26, 28, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv16-026.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(27, 30, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv18-027.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(28, 30, 'hien-truong-1.jpg', 'tep_tai_len/cap_nhat/2026/10/cv18-028.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(29, 31, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv21-029.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(30, 31, 'hien-truong-1.jpg', 'tep_tai_len/cap_nhat/2026/10/cv21-030.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(31, 32, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv21-031.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(32, 34, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv25-032.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(33, 34, 'hien-truong-1.jpg', 'tep_tai_len/cap_nhat/2026/10/cv25-033.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(34, 37, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv40-034.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(35, 38, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv41-035.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(36, 39, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/10/cv37-036.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(37, 40, 'anh-hien-truong.jpg', 'tep_tai_len/cap_nhat/2026/09/cv39-037.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'),
(38, 40, 'hien-truong-1.jpg', 'tep_tai_len/cap_nhat/2026/09/cv39-038.jpg', 'image/jpeg', 1250000, 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0')
ON CONFLICT (id) DO NOTHING;

-- Bảng 19: ho_so (14 hồ sơ kỹ thuật)
INSERT INTO ho_so (id, du_an_id, cong_viec_id, tieu_de, loai_ho_so, pham_vi_su_dung, mo_ta, nguoi_tao_id) VALUES
(1, 1, NULL, 'Bản vẽ bố trí cáp mạng và camera tầng 1-10', 'THIET_KE', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Bản vẽ bố trí cáp mạng và camera tầng 1-10', 2),
(2, 1, NULL, 'Bản vẽ hoàn công hệ thống mạng và camera', 'HOAN_CONG', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Bản vẽ hoàn công hệ thống mạng và camera', 2),
(3, 1, NULL, 'Biên bản nghiệm thu và bàn giao', 'BAN_GIAO', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Biên bản nghiệm thu và bàn giao', 2),
(4, 2, NULL, 'Sơ đồ phân vùng âm thanh thông báo', 'THIET_KE', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Sơ đồ phân vùng âm thanh thông báo', 2),
(5, 3, NULL, 'Sơ đồ logic mạng LAN và VLAN', 'THIET_KE', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Sơ đồ logic mạng LAN và VLAN', 2),
(6, 3, NULL, 'Bảng khối lượng vật tư mạng văn phòng', 'THI_CONG', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Bảng khối lượng vật tư mạng văn phòng', 2),
(7, 4, NULL, 'Bản vẽ bố trí loa và micro hội trường lớn', 'THIET_KE', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Bản vẽ bố trí loa và micro hội trường lớn', 2),
(9, 5, NULL, 'Bản vẽ bố trí camera hành lang các tầng khách', 'THIET_KE', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Bản vẽ bố trí camera hành lang các tầng khách', 2),
(10, 5, NULL, 'BẢN SHOP khóa từ và đầu đọc thẻ (kèm tham chiếu ngoài)', 'THI_CONG', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật BẢN SHOP khóa từ và đầu đọc thẻ (kèm tham chiếu ngoài)', 2),
(12, 6, NULL, 'Sơ đồ đi cáp thoại tầng 5-8', 'THIET_KE', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Sơ đồ đi cáp thoại tầng 5-8', 2),
(13, 9, NULL, 'Biên bản khảo sát hiện trạng trường mầm non', 'THIET_KE', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Biên bản khảo sát hiện trạng trường mầm non', 2),
(14, 10, NULL, 'Sơ đồ đấu nối thiết bị hội nghị phòng họp', 'THI_CONG', 'DUNG_CHUNG_DU_AN', 'Hồ sơ kỹ thuật Sơ đồ đấu nối thiết bị hội nghị phòng họp', 2)
ON CONFLICT (id) DO NOTHING;

-- Bảng 20: phien_ban_ho_so (22 phiên bản hồ sơ)
INSERT INTO phien_ban_ho_so (id, ho_so_id, so_phien_ban, nhan_phien_ban, ten_tep_goc, duong_dan_luu, loai_tep, kieu_noi_dung, dung_luong_byte, ma_bam_sha256, noi_dung_thay_doi, nguoi_tai_len_id, thoi_diem_tai_len, duoc_chon, nguoi_chon_id, thoi_diem_chon) VALUES
(1, 1, 1, 'Rev A', 'ban-ve-cap-mang-camera.dwg', 'ho_so/2026/NMH-2026-001/ban-ve-cap-mang-camera-001.dwg', 'BAN_VE_CAD', 'application/octet-stream', 4200000, '3093f5fd52eeaf2923f4a226f20dc92ab3708f2373d3467aac1bff5e4b1dba2e', 'Bản vẽ ban đầu sau khảo sát', 2, '2026-06-15 14:00:00', 0, NULL, NULL),
(2, 1, 2, 'Rev B', 'ban-ve-cap-mang-camera.dwg', 'ho_so/2026/NMH-2026-001/ban-ve-cap-mang-camera-002.dwg', 'BAN_VE_CAD', 'application/octet-stream', 4350000, '7c039b245292c743107a27af2f23623f6d7d679a49769377ddfc87d3678fe80', 'Cập nhật vị trí tủ mạng tầng 6', 2, '2026-06-24 14:00:00', 1, 2, '2026-06-24 14:00:00'),
(3, 2, 1, 'v1.0', 'hoan-cong-mang-camera.pdf', 'ho_so/2026/NMH-2026-001/hoan-cong-mang-camera-001.pdf', 'PDF', 'application/pdf', 9800000, 'c24366e9646405f2959b1b1dc19b25c7a34bcd8eb9cc688c2db92efa60caee33', NULL, 2, '2026-09-05 14:00:00', 1, 2, '2026-09-05 14:00:00'),
(4, 3, 1, 'v1.0', 'bien-ban-ban-giao.pdf', 'ho_so/2026/NMH-2026-001/bien-ban-ban-giao-001.pdf', 'PDF', 'application/pdf', 1500000, '39cd6df5109789d106f63d935c6391a96948016399fcb29296341875f42a1a4d', NULL, 2, '2026-09-08 14:00:00', 1, 2, '2026-09-08 14:00:00'),
(5, 4, 1, 'v1', 'so-do-phan-vung-am-thanh.pdf', 'ho_so/2026/NMH-2026-002/so-do-phan-vung-am-thanh-001.pdf', 'PDF', 'application/pdf', 2100000, '198dbb6b9c082858896ad21fb0926be39ab6fccdff03296038eac26e3392ff82', NULL, 2, '2026-07-05 14:00:00', 0, NULL, NULL),
(6, 4, 2, 'v2', 'so-do-phan-vung-am-thanh.pdf', 'ho_so/2026/NMH-2026-002/so-do-phan-vung-am-thanh-002.pdf', 'PDF', 'application/pdf', 2150000, '55981067227b7c5214d7b1d328c0278c60161cb51dc74375f96382ddbbb6a', 'Bổ sung vùng phát sân trường', 2, '2026-07-14 14:00:00', 1, 2, '2026-07-14 14:00:00'),
(7, 5, 1, 'v1', 'so-do-lan-vlan.pdf', 'ho_so/2026/NMH-2026-003/so-do-lan-vlan-001.pdf', 'PDF', 'application/pdf', 1800000, 'e36c716a53ff924df5d6f62697c6e8cbb81c4414e4869dbdab483f058bfc053b', NULL, 2, '2026-09-11 14:00:00', 0, NULL, NULL),
(8, 5, 2, 'v2', 'so-do-lan-vlan.pdf', 'ho_so/2026/NMH-2026-003/so-do-lan-vlan-002.pdf', 'PDF', 'application/pdf', 1850000, '2cfb0cacda4c1a247fc018da3e490c57ae143600a44eba3fdc428c1a4c6cc1bb', 'Tách VLAN khách và VLAN nội bộ', 2, '2026-10-08 14:00:00', 1, 2, '2026-10-08 14:00:00'),
(9, 6, 1, 'Bản nháp', 'khoi-luong-vat-tu.xlsx', 'ho_so/2026/NMH-2026-003/khoi-luong-vat-tu-001.xlsx', 'BANG_TINH', 'application/octet-stream', 95000, 'f673dd765441dd5b2b7ff7d363fc354a8c9e2f68afb2d0a7957b5b3a9f84b355', NULL, 2, '2026-09-11 14:00:00', 0, NULL, NULL),
(10, 6, 2, 'Bản chốt', 'khoi-luong-vat-tu.xlsx', 'ho_so/2026/NMH-2026-003/khoi-luong-vat-tu-002.xlsx', 'BANG_TINH', 'application/octet-stream', 98000, '1171d55cdc6a112de52567795d2e688ff3a2d33147e281da0b8280a964cbf8', 'Cập nhật đơn giá cáp quang', 2, '2026-09-17 14:00:00', 0, NULL, NULL),
(11, 6, 3, 'Bổ sung AP', 'khoi-luong-vat-tu.xlsx', 'ho_so/2026/NMH-2026-003/khoi-luong-vat-tu-003.xlsx', 'BANG_TINH', 'application/octet-stream', 99500, '6dfac8882e74be7ae16388ddc318e845082fde62b045fac4ae3e7b7f3b98da0', 'Thêm 6 access point tầng 3', 2, '2026-10-09 14:00:00', 1, 2, '2026-10-09 14:00:00'),
(12, 7, 1, 'Rev A', 'bo-tri-loa-micro.dwg', 'ho_so/2026/NMH-2026-004/bo-tri-loa-micro-001.dwg', 'BAN_VE_CAD', 'application/octet-stream', 5200000, '2d8552885875b7bb6a1fa6dae0c26d41905a552ab3c2d3bdf874e97a8f8c8fe2', NULL, 2, '2026-09-01 14:00:00', 0, NULL, NULL),
(13, 7, 2, 'Rev B', 'bo-tri-loa-micro.dwg', 'ho_so/2026/NMH-2026-004/bo-tri-loa-micro-002.dwg', 'BAN_VE_CAD', 'application/octet-stream', 5300000, '3a5d0e74e000740e360e23be93b559a09c353ceb1ae56bbacba2b3cff26ca8', 'Điều chỉnh loa cánh trái sau khảo sát âm học', 2, '2026-10-04 14:00:00', 1, 2, '2026-10-04 14:00:00'),
(14, 9, 1, 'Rev A', 'bo-tri-camera-hanh-lang.dwg', 'ho_so/2026/NMH-2026-005/bo-tri-camera-hanh-lang-001.dwg', 'BAN_VE_CAD', 'application/octet-stream', 6100000, '18d28bc2e645c38cb23801d19333ebb25fcacc350766046f354c2983d5f6627a', NULL, 2, '2026-09-21 14:00:00', 0, NULL, NULL),
(15, 9, 2, 'Rev B', 'bo-tri-camera-hanh-lang.dwg', 'ho_so/2026/NMH-2026-005/bo-tri-camera-hanh-lang-002.dwg', 'BAN_VE_CAD', 'application/octet-stream', 6150000, '2bc2e2b785adc5b6fdb3fb4129c4b1fcdf303af42052570776d77bebe236323', 'Thêm camera cầu thang bộ', 2, '2026-09-27 14:00:00', 0, NULL, NULL),
(16, 9, 3, 'Rev C', 'bo-tri-camera-hanh-lang.dwg', 'ho_so/2026/NMH-2026-005/bo-tri-camera-hanh-lang-003.dwg', 'BAN_VE_CAD', 'application/octet-stream', 6180000, '5c3f0d819c90cc8ec387d8598b37c581c5af795b156d76a9622b769820e7ee', 'Dời camera tầng 6 theo hiện trạng', 2, '2026-10-06 14:00:00', 1, 2, '2026-10-06 14:00:00'),
(17, 10, 1, 'Bản gửi lần 1', 'shop-khoa-tu-dau-doc.zip', 'ho_so/2026/NMH-2026-005/shop-khoa-tu-dau-doc-001.zip', 'NEN', 'application/octet-stream', 18500000, '74ef1bd61bd893ffa1894fd0946b6f657a5336ba17d27aa3329e5ab1dc3032da', NULL, 2, '2026-10-01 14:00:00', 0, NULL, NULL),
(18, 12, 1, 'v1.0', 'so-do-cap-thoai.pdf', 'ho_so/2026/NMH-2026-006/so-do-cap-thoai-001.pdf', 'PDF', 'application/pdf', 2200000, 'f691e9c51ede3a9960abb9f1871d0bb37bf68904bbc675c854ce5b9f1d18b993', NULL, 2, '2026-09-16 14:00:00', 1, 2, '2026-09-16 14:00:00'),
(19, 13, 1, 'v1.0', 'khao-sat-mam-non.pdf', 'ho_so/2026/NMH-2026-009/khao-sat-mam-non-001.pdf', 'PDF', 'application/pdf', 3300000, '72d42177ae4f084eaf1ceb7fb0a063e152e509932b84c9f6a89dd7fe829fb67c', NULL, 2, '2026-09-29 14:00:00', 1, 2, '2026-09-29 14:00:00'),
(20, 14, 1, 'v1.0', 'so-do-hoi-nghi.pdf', 'ho_so/2026/NMH-2026-010/so-do-hoi-nghi-001.pdf', 'PDF', 'application/pdf', 1900000, '2e26311efc9d31f43f831022eca315ce9e787eef5cf749208c4dd0bd76359972', NULL, 2, '2026-09-30 14:00:00', 1, 2, '2026-09-30 14:00:00')
ON CONFLICT (id) DO NOTHING;

-- Bảng 21: nhat_ky_thao_tac (14 nhật ký audit)
INSERT INTO nhat_ky_thao_tac (id, tai_khoan_id, thao_tac, loai_doi_tuong, doi_tuong_id, ly_do, thoi_diem_tao) VALUES
(1, 2, 'TAO_MOI', 'DuAn', 1, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:00:00'),
(2, 2, 'TAO_MOI', 'DuAn', 5, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:01:00'),
(3, 3, 'DOI_TRANG_THAI', 'DuAn', 6, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:02:00'),
(6, 3, 'KET_THUC_SOM', 'PhanCong', 86, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:05:00'),
(7, 3, 'HUY', 'PhanCong', 88, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:06:00'),
(8, 2, 'HUY', 'DuAn', 9, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:07:00'),
(9, 2, 'DIEU_CHINH', 'PhanCong', 33, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:08:00'),
(10, 2, 'TAO_MOI', 'LichNghiBan', 8, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:09:00'),
(11, 2, 'HUY', 'LichNghiBan', 5, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:10:00'),
(12, 2, 'CHON_BAN_TRIEN_KHAI', 'PhienBanHoSo', 14, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:11:00'),
(13, 1, 'KHOA', 'TaiKhoan', 9, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:12:00'),
(14, 2, 'TAI_LEN', 'PhienBanHoSo', 14, 'Ghi nhận thao tác hệ thống', '2026-10-11 10:13:00')
ON CONFLICT (id) DO NOTHING;

-- Bảng 22: cau_hinh (6 tham số hệ thống theo đặc tả)
INSERT INTO cau_hinh (khoa_cau_hinh, gia_tri, mo_ta, thoi_diem_cap_nhat) VALUES
('THOI_DIEM_TRA_CUU', '', 'Thời điểm tra cứu; để trống thì dùng giờ máy, nhập giá trị để cố định khi nhập dữ liệu mẫu', '2026-10-12 09:00:00'),
('SO_NGAY_SAP_DEN_HAN', '7', 'Số ngày tính là sắp đến hạn', '2026-10-12 09:00:00'),
('THOI_GIAN_HET_PHIEN_PHUT', '30', 'Thời gian tự động kết thúc phiên làm việc khi người dùng không tương tác (phút)', '2026-10-12 09:00:00'),
('DUNG_LUONG_TAI_LEN_TOI_DA_MB', '50', 'Dung lượng tải lên tối đa cho một tệp tài liệu hoặc bản vẽ (MB)', '2026-10-12 09:00:00'),
('LOAI_TEP_CHO_PHEP', 'BAN_VE_CAD,PDF,ANH,BANG_TINH,NEN', 'Danh sách các định dạng tệp hồ sơ được phép tải lên hệ thống', '2026-10-12 09:00:00'),
('SO_NGAY_GIU_SAO_LUU', '7', 'Số bản sao lưu hằng ngày được giữ', '2026-10-12 09:00:00')
ON CONFLICT (khoa_cau_hinh) DO UPDATE SET gia_tri = EXCLUDED.gia_tri, mo_ta = EXCLUDED.mo_ta;

-- =========================================================================
-- CÁC VIEW CẢNH BÁO VÀ THỐNG KÊ THEO ĐẶC TẢ KHÓA LUẬN
-- =========================================================================

-- View 1: v_cong_viec_qua_han (Quá hạn tại mốc tra cứu 12/10/2026 09:00)
DO $view$ BEGIN
  CREATE OR REPLACE VIEW v_cong_viec_qua_han AS
SELECT 
    cv.id AS cong_viec_id,
    cv.ma_cong_viec,
    cv.ten AS ten_cong_viec,
    d.id AS du_an_id,
    d.ma_du_an,
    d.ten AS ten_du_an,
    ns.ho_ten AS nguoi_phu_trach,
    cv.ket_thuc_du_kien,
    cv.trang_thai
FROM cong_viec cv
JOIN du_an d ON cv.du_an_id = d.id
LEFT JOIN nhan_su ns ON cv.nhan_su_chinh_id = ns.id
WHERE cv.trang_thai IN ('CHUA_BAT_DAU', 'DANG_THUC_HIEN')
  AND cv.ket_thuc_du_kien < '2026-10-12 09:00:00'::TIMESTAMP;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Giữ nguyên view v_cong_viec_qua_han hiện có: %', SQLERRM;
END $view$;

-- View 2: v_cong_viec_sap_den_han (Trong vòng 7 ngày kể từ 12/10/2026 09:00)
DO $view$ BEGIN
  CREATE OR REPLACE VIEW v_cong_viec_sap_den_han AS
SELECT 
    cv.id AS cong_viec_id,
    cv.ma_cong_viec,
    cv.ten AS ten_cong_viec,
    d.id AS du_an_id,
    d.ma_du_an,
    d.ten AS ten_du_an,
    ns.ho_ten AS nguoi_phu_trach,
    cv.ket_thuc_du_kien,
    cv.trang_thai
FROM cong_viec cv
JOIN du_an d ON cv.du_an_id = d.id
LEFT JOIN nhan_su ns ON cv.nhan_su_chinh_id = ns.id
WHERE cv.trang_thai IN ('CHUA_BAT_DAU', 'DANG_THUC_HIEN')
  AND cv.ket_thuc_du_kien >= '2026-10-12 09:00:00'::TIMESTAMP
  AND cv.ket_thuc_du_kien <= '2026-10-19 09:00:00'::TIMESTAMP;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Giữ nguyên view v_cong_viec_sap_den_han hiện có: %', SQLERRM;
END $view$;

-- View 3: v_phan_cong_bi_anh_huong (Phân công trùng lịch nghỉ/bận - KB07: đúng 2 dòng #56 và #58)
DO $view$ BEGIN
  CREATE OR REPLACE VIEW v_phan_cong_bi_anh_huong AS
SELECT 
    pc.id AS phan_cong_id,
    pc.cong_viec_id,
    cv.ma_cong_viec,
    cv.ten AS ten_cong_viec,
    d.id AS du_an_id,
    d.ma_du_an,
    ns.id AS nhan_su_id,
    ns.ho_ten AS ten_nhan_su,
    pc.thoi_diem_bat_dau AS phan_cong_bat_dau,
    pc.thoi_diem_ket_thuc AS phan_cong_ket_thuc,
    lnb.id AS lich_nghi_ban_id,
    lnb.ly_do AS ly_do_nghi,
    lnb.thoi_diem_bat_dau AS nghi_bat_dau,
    lnb.thoi_diem_ket_thuc AS nghi_ket_thuc
FROM phan_cong pc
JOIN cong_viec cv ON pc.cong_viec_id = cv.id
JOIN du_an d ON cv.du_an_id = d.id
JOIN nhan_su ns ON pc.nhan_su_id = ns.id
JOIN lich_nghi_ban lnb ON pc.nhan_su_id = lnb.nhan_su_id
WHERE pc.trang_thai = 'HIEU_LUC'
  AND lnb.trang_thai = 'HIEU_LUC'
  AND pc.thoi_diem_bat_dau < lnb.thoi_diem_ket_thuc
  AND lnb.thoi_diem_bat_dau < pc.thoi_diem_ket_thuc;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Giữ nguyên view v_phan_cong_bi_anh_huong hiện có: %', SQLERRM;
END $view$;
