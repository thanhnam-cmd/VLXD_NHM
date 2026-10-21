import re
import os

with open('/tmp/pdf_texts/03_du_lieu_mau.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = re.split(r'--\s*(\d+)\s+of\s+101\s*--', text)
page_dict = {int(pages[i]): pages[i+1].strip() for i in range(1, len(pages), 2)}

with open('src/data/mockData.ts', 'r', encoding='utf-8') as f:
    mock_src = f.read()

def esc(v):
    if v is None: return 'NULL'
    s = str(v).strip()
    if s == '' or s == 'NULL' or s == '-': return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def norm_ts(ts):
    if not ts: return 'NULL'
    s = re.sub(r'\s+', ' ', str(ts)).strip()
    return f"'{s}'"

out_lines = []
out_lines.append("""-- =========================================================================
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
""")

# Table 1: vai_tro
out_lines.append("""-- Bảng 1: vai_tro
INSERT INTO vai_tro (id, ma, ten, mo_ta) VALUES
(1, 'QUAN_TRI', 'Quản trị hệ thống', 'Quản lý tài khoản, vai trò và phạm vi truy cập'),
(2, 'QUAN_LY', 'Quản lý', 'Quản lý dự án, công việc, nhân sự, lịch nghỉ/bận, phân công, hồ sơ trong phạm vi được cấp; xác nhận hoàn thành'),
(3, 'DOI_TRUONG', 'Đội trưởng đội thi công', 'Xem dự án/công việc được giao, gửi cập nhật kết quả, tra cứu hồ sơ được cấp quyền'),
(4, 'BAN_GIAM_DOC', 'Ban giám đốc', 'Xem báo cáo tổng hợp toàn doanh nghiệp, không thay đổi dữ liệu nghiệp vụ')
ON CONFLICT (id) DO UPDATE SET ma = EXCLUDED.ma, ten = EXCLUDED.ten, mo_ta = EXCLUDED.mo_ta;
""")

# Table 2: doi_thi_cong
out_lines.append("""-- Bảng 2: doi_thi_cong
INSERT INTO doi_thi_cong (id, ma, ten, loai_doi, mo_ta) VALUES
(1, 'DTC1', 'Đội thi công 1 - Hạ tầng mạng và thoại', 'THI_CONG', 'Chuyên tuyến cáp mạng, cáp quang và tổng đài thoại'),
(2, 'DTC2', 'Đội thi công 2 - Camera và kiểm soát ra vào', 'THI_CONG', 'Chuyên camera giám sát, kiểm soát cửa vân tay thẻ từ'),
(3, 'DTC3', 'Đội thi công 3 - Âm thanh, hình ảnh và hội nghị', 'THI_CONG', 'Chuyên âm thanh thông báo PA, hội trường và phòng hội thảo'),
(4, 'TTK', 'Tổ thiết kế', 'THIET_KE', 'Chuyên thiết kế bản vẽ CAD, Shop Drawing và dự toán vật tư')
ON CONFLICT (id) DO NOTHING;
""")

# Table 3: chuyen_mon
out_lines.append("""-- Bảng 3: chuyen_mon
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
""")

# Table 4: nhan_su
out_lines.append("""-- Bảng 4: nhan_su
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
""")

# Table 5: nhan_su_chuyen_mon (42 rows)
p28_lines = [l for l in page_dict[28].split('\n') if l.strip()][1:]
sk_vals = []
for l in p28_lines:
    parts = [x.strip() for x in l.split() if x.strip()]
    if len(parts) >= 4:
        sk_vals.append(f"({parts[0]}, {parts[1]}, '{parts[2]}', {parts[3]})")

out_lines.append("-- Bảng 5: nhan_su_chuyen_mon\nINSERT INTO nhan_su_chuyen_mon (nhan_su_id, chuyen_mon_id, muc_thanh_thao, la_chuyen_mon_chinh) VALUES\n" + ",\n".join(sk_vals) + "\nON CONFLICT (nhan_su_id, chuyen_mon_id) DO NOTHING;\n")

# Table 6: tai_khoan (9 accounts including qly.trung)
out_lines.append("""-- Bảng 6: tai_khoan (9 tài khoản test, mật khẩu chung Nmh@2026)
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
""")

# Table 7: khach_hang (10 rows)
out_lines.append("""-- Bảng 7: khach_hang (10 khách hàng)
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
""")

# Table 8: loai_he_thong (7 rows)
out_lines.append("""-- Bảng 8: loai_he_thong (7 loại)
INSERT INTO loai_he_thong (id, ma, ten) VALUES
(1, 'MANG_THOAI', 'Hạ tầng mạng và thoại'),
(2, 'MANG_KHONG_DAY', 'Mạng không dây'),
(3, 'AM_THANH_THONG_BAO', 'Hệ thống âm thanh thông báo'),
(4, 'AM_THANH_HINH_ANH_HOI_NGHI', 'Âm thanh, hình ảnh và hội nghị trực tuyến'),
(5, 'CAMERA_GIAM_SAT', 'Camera giám sát'),
(6, 'KIEM_SOAT_RA_VAO', 'Kiểm soát ra vào'),
(7, 'NHA_THONG_MINH', 'Hệ thống nhà thông minh')
ON CONFLICT (id) DO NOTHING;
""")

# Table 9: du_an (10 rows)
out_lines.append("""-- Bảng 9: du_an (10 dự án)
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
""")

# Table 10: pham_vi_du_an (10 rows)
out_lines.append("""-- Bảng 10: pham_vi_du_an (Phân quyền dự án theo mã quản lý)
INSERT INTO pham_vi_du_an (tai_khoan_id, du_an_id, nguoi_cap_id) VALUES
(2, 1, 1), (2, 3, 1), (2, 5, 1), (2, 7, 1), (2, 9, 1),
(3, 2, 1), (3, 4, 1), (3, 6, 1), (3, 8, 1), (3, 10, 1)
ON CONFLICT (tai_khoan_id, du_an_id) DO NOTHING;
""")

# Table 11: hang_muc (14 rows)
out_lines.append("""-- Bảng 11: hang_muc (14 hạng mục)
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
""")

# Table 12: cong_viec (42 tasks)
cv_vals = []
for tid in sorted(tasks_dict.keys(), key=lambda x: int(x)):
    t = tasks_dict[tid]
    cv_vals.append(f"({t['id']}, {t['categoryId']}, {t['projectId']}, {esc(t['code'])}, {esc(t['title'])}, {esc(t['desc'])}, {esc(t['loc'])}, {norm_ts(t['start'])}, {norm_ts(t['due'])}, {esc(t['status'])}, {t['assignee']}, {norm_ts(t['completedAt'])}, {'2' if t['completedAt'] else 'NULL'}, {norm_ts(t['cancelledAt'])}, {'2' if t['cancelledAt'] else 'NULL'}, {esc(t['cancelReason'])}, 2)")

out_lines.append("-- Bảng 12: cong_viec (42 công việc)\nINSERT INTO cong_viec (id, hang_muc_id, du_an_id, ma_cong_viec, ten, mo_ta, khu_vuc_trien_khai, bat_dau_du_kien, ket_thuc_du_kien, trang_thai, nhan_su_chinh_id, thoi_diem_hoan_thanh, nguoi_xac_nhan_hoan_thanh_id, thoi_diem_huy, nguoi_huy_id, ly_do_huy, nguoi_tao_id) VALUES\n" + ",\n".join(cv_vals) + "\nON CONFLICT (id) DO NOTHING;\n")

# Table 13: lich_nghi_ban (9 rows)
lv_vals = []
for lv in leaves:
    lv_vals.append(f"({lv['id']}, {lv['nhan_su_id']}, {norm_ts(lv['bat_dau'])}, {norm_ts(lv['ket_thuc'])}, {esc(lv['ly_do'])}, {esc(lv['trang_thai'])}, {lv['nguoi_ghi_nhan_id']})")

out_lines.append("-- Bảng 13: lich_nghi_ban (9 lịch nghỉ/bận)\nINSERT INTO lich_nghi_ban (id, nhan_su_id, thoi_diem_bat_dau, thoi_diem_ket_thuc, ly_do, trang_thai, nguoi_ghi_nhan_id) VALUES\n" + ",\n".join(lv_vals) + "\nON CONFLICT (id) DO NOTHING;\n")

# Table 14: phan_cong (92 rows)
pc_vals = []
for pc in assignments:
    pc_vals.append(f"({pc['id']}, {pc['cong_viec_id']}, {pc['nhan_su_id']}, {norm_ts(pc['bat_dau'])}, {norm_ts(pc['ket_thuc'])}, {esc(pc['trang_thai'])}, 2)")

out_lines.append("-- Bảng 14: phan_cong (92 phân công)\nINSERT INTO phan_cong (id, cong_viec_id, nhan_su_id, thoi_diem_bat_dau, thoi_diem_ket_thuc, trang_thai, nguoi_tao_id) VALUES\n" + ",\n".join(pc_vals) + "\nON CONFLICT (id) DO NOTHING;\n")

# Table 15: doi_ben_ngoai (3 rows)
out_lines.append("""-- Bảng 15: doi_ben_ngoai (3 đội thuê ngoài)
INSERT INTO doi_ben_ngoai (id, ten, nguoi_lien_he, so_dien_thoai, khu_vuc_hoat_dong, trang_thai, ghi_chu) VALUES
(1, 'Đội thi công điện nhẹ Nguyên Khê', 'Anh Hùng', '0900000301', 'Nguyên Khê, Đông Anh', 'HOP_TAC', 'Đội nhận khoán, huy động tối thiểu 4 công nhân'),
(2, 'Đội cáp quang Vân Nội', 'Chị Thu', '0900000302', 'Vân Nội, Đông Anh', 'HOP_TAC', 'Chuyên tuyến cáp quang liên tòa'),
(3, 'Công ty TNHH Lắp đặt Việt Âm', 'Anh Quang', '0900000303', 'Hà Nội', 'NGUNG_HOP_TAC', 'Ngừng hợp tác từ quý 2')
ON CONFLICT (id) DO NOTHING;
""")

# Table 16: phan_cong_ben_ngoai (3 rows)
out_lines.append("""-- Bảng 16: phan_cong_ben_ngoai (3 giao việc ngoài)
INSERT INTO phan_cong_ben_ngoai (id, cong_viec_id, doi_ben_ngoai_id, phan_viec_giao, bat_dau_du_kien, ket_thuc_du_kien, so_nguoi_du_kien, nhan_su_phoi_hop_id, trang_thai, ghi_chu, nguoi_tao_id) VALUES
(1, 25, 1, 'Kéo cáp tín hiệu kiểm soát ra vào nhà A1 (khoảng 600 m cáp, đi ống luồn)', '2026-10-02 08:00:00', '2026-10-15 17:00:00', 4, 3, 'HIEU_LUC', 'Đội trưởng Phạm Văn Cường phối hợp và giám sát', 2),
(2, 22, 2, 'Kéo cáp và lắp camera bãi xe, tầng hầm', '2026-10-13 08:00:00', '2026-10-24 17:00:00', 3, 4, 'HIEU_LUC', 'Đội trưởng Nguyễn Đức Thắng phối hợp', 2),
(3, 38, 1, 'Kéo cáp camera sân trường', '2026-10-12 08:00:00', '2026-10-27 17:00:00', 4, 4, 'HUY', 'Chủ đầu tư tạm hoãn gói sân trường', 2)
ON CONFLICT (id) DO NOTHING;
""")

# Table 17: cap_nhat_ket_qua (40 rows)
wu_vals = []
for wu in work_updates:
    wu_vals.append(f"({wu['id']}, {wu['cong_viec_id']}, NULL, {wu['tai_khoan_gui_id']}, {norm_ts(wu['thoi_diem'])}, {esc(wu['noi_dung'])}, NULL, {wu['de_nghi_hoan_thanh']}, {wu['cap_nhat_dinh_chinh_id']})")

out_lines.append("-- Bảng 17: cap_nhat_ket_qua (40 cập nhật kết quả)\nINSERT INTO cap_nhat_ket_qua (id, cong_viec_id, phan_cong_ben_ngoai_id, tai_khoan_gui_id, thoi_diem_ghi_nhan, noi_dung, kho_khan, de_nghi_hoan_thanh, cap_nhat_dinh_chinh_id) VALUES\n" + ",\n".join(wu_vals) + "\nON CONFLICT (id) DO NOTHING;\n")

# Table 18: tep_minh_chung (38 rows)
att_vals = []
for att in attachments:
    att_vals.append(f"({att['id']}, {att['cap_nhat_id']}, {esc(att['ten_tep_goc'])}, {esc(att['duong_dan_luu'])}, {esc(att['kieu_noi_dung'])}, {att['dung_luong_byte']}, {esc(att['ma_bam'])})")

out_lines.append("-- Bảng 18: tep_minh_chung (38 tệp minh chứng)\nINSERT INTO tep_minh_chung (id, cap_nhat_id, ten_tep_goc, duong_dan_luu, kieu_noi_dung, dung_luong_byte, ma_bam_sha256) VALUES\n" + ",\n".join(att_vals) + "\nON CONFLICT (id) DO NOTHING;\n")

# Table 19: ho_so (14 rows)
doc_vals = []
for d in docs_parsed:
    doc_vals.append(f"({d['id']}, {d['du_an_id']}, {d['cong_viec_id']}, {esc(d['tieu_de'])}, {esc(d['loai_ho_so'])}, {esc(d['pham_vi_su_dung'])}, {esc(d['mo_ta'])}, {d['nguoi_tao_id']})")

out_lines.append("-- Bảng 19: ho_so (14 hồ sơ kỹ thuật)\nINSERT INTO ho_so (id, du_an_id, cong_viec_id, tieu_de, loai_ho_so, pham_vi_su_dung, mo_ta, nguoi_tao_id) VALUES\n" + ",\n".join(doc_vals) + "\nON CONFLICT (id) DO NOTHING;\n")

# Table 20: phien_ban_ho_so (22 rows)
ver_vals = []
for v in versions_parsed:
    ver_vals.append(f"({v['id']}, {v['ho_so_id']}, {v['so_phien_ban']}, {esc(v['nhan_phien_ban'])}, {esc(v['ten_tep_goc'])}, {esc(v['duong_dan_luu'])}, {esc(v['loai_tep'])}, {esc(v['kieu_noi_dung'])}, {v['dung_luong_byte']}, {esc(v['ma_bam_sha256'])}, {esc(v['noi_dung_thay_doi'])}, {v['nguoi_tai_len_id']}, {norm_ts(v['thoi_diem_tai_len'])}, {v['duoc_chon']}, {'2' if v['duoc_chon'] else 'NULL'}, {norm_ts(v['thoi_diem_chon'])})")

out_lines.append("-- Bảng 20: phien_ban_ho_so (22 phiên bản hồ sơ)\nINSERT INTO phien_ban_ho_so (id, ho_so_id, so_phien_ban, nhan_phien_ban, ten_tep_goc, duong_dan_luu, loai_tep, kieu_noi_dung, dung_luong_byte, ma_bam_sha256, noi_dung_thay_doi, nguoi_tai_len_id, thoi_diem_tai_len, duoc_chon, nguoi_chon_id, thoi_diem_chon) VALUES\n" + ",\n".join(ver_vals) + "\nON CONFLICT (id) DO NOTHING;\n")

# Table 21: nhat_ky_thao_tac (14 rows)
audit_vals = []
for a in audit_logs:
    audit_vals.append(f"({a['id']}, {a['tai_khoan_id']}, {esc(a['thao_tac'])}, {esc(a['loai_doi_tuong'])}, {a['doi_tuong_id']}, {esc(a['ly_do'])}, {norm_ts(a['thoi_diem'])})")

out_lines.append("-- Bảng 21: nhat_ky_thao_tac (14 nhật ký audit)\nINSERT INTO nhat_ky_thao_tac (id, tai_khoan_id, thao_tac, loai_doi_tuong, doi_tuong_id, ly_do, thoi_diem_tao) VALUES\n" + ",\n".join(audit_vals) + "\nON CONFLICT (id) DO NOTHING;\n")

# Table 22: cau_hinh (6 rows)
out_lines.append("""-- Bảng 22: cau_hinh (6 tham số hệ thống theo đặc tả)
INSERT INTO cau_hinh (khoa_cau_hinh, gia_tri, mo_ta, thoi_diem_cap_nhat) VALUES
('THOI_DIEM_TRA_CUU', '2026-10-12 09:00:00', 'Thời điểm tra cứu cố định phục vụ chấm điểm và chạy kịch bản thử nghiệm', '2026-10-12 09:00:00'),
('SO_NGAY_CANH_BAO_SAP_DEN_HAN', '7', 'Số ngày trước khi đến hạn để kích hoạt cảnh báo sắp đến hạn', '2026-10-12 09:00:00'),
('THOI_GIAN_HET_PHIEN_PHUT', '30', 'Thời gian tự động kết thúc phiên làm việc khi người dùng không tương tác (phút)', '2026-10-12 09:00:00'),
('DUNG_LUONG_TOI_DA_TEP_MB', '50', 'Dung lượng tải lên tối đa cho một tệp tài liệu hoặc bản vẽ (MB)', '2026-10-12 09:00:00'),
('LOAI_TEP_CHO_PHEP', 'BAN_VE_CAD,PDF,ANH,BANG_TINH,NEN', 'Danh sách các định dạng tệp hồ sơ được phép tải lên hệ thống', '2026-10-12 09:00:00'),
('PHIEN_BAN_HE_THONG', '2.4.0-NMH-PostgreSQL', 'Phiên bản phần mềm chính thức công ty NMH LLC', '2026-10-12 09:00:00')
ON CONFLICT (khoa_cau_hinh) DO UPDATE SET gia_tri = EXCLUDED.gia_tri, mo_ta = EXCLUDED.mo_ta;
""")

# Views
out_lines.append("""-- =========================================================================
-- CÁC VIEW CẢNH BÁO VÀ THỐNG KÊ THEO ĐẶC TẢ KHÓA LUẬN
-- =========================================================================

-- View 1: v_cong_viec_qua_han (Quá hạn tại mốc tra cứu 12/10/2026 09:00)
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

-- View 2: v_cong_viec_sap_den_han (Trong vòng 7 ngày kể từ 12/10/2026 09:00)
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

-- View 3: v_phan_cong_bi_anh_huong (Phân công trùng lịch nghỉ/bận - KB07: đúng 2 dòng #56 và #58)
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
""")

full_sql = "\n".join(out_lines)
with open('database/nmh_postgres_full.sql', 'w', encoding='utf-8') as f:
    f.write(full_sql)

print(f"Generated database/nmh_postgres_full.sql ({len(full_sql)} bytes, {len(out_lines)} blocks)!")
