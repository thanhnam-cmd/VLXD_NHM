# HƯỚNG DẪN CHI TIẾT DEPLOY LÊN RENDER VỚI CSDL POSTGRESQL "VLXD"

> **Cam kết hệ thống:** 
> - Chạy **CSDL PostgreSQL thực tế 100%** qua Express.js (`server.ts`) và thư viện `pg`.
> - **Tuyệt đối KHÔNG tạo và KHÔNG sử dụng file giả lập `database.json`**.
> - Đa người dùng (Quản lý, Đội trưởng, Giám đốc) trên nhiều thiết bị cùng truy cập vào CSDL **`VLXD`** đồng bộ tức thì.

---

## BƯỚC 1: TẠO DATABASE POSTGRESQL VỚI TÊN "VLXD" TRÊN RENDER

1. Truy cập và đăng nhập vào: **[https://dashboard.render.com](https://dashboard.render.com)**
2. Nhấn nút **New +** (màu xanh ở góc trên bên phải) > Chọn **PostgreSQL**.
3. Điền các trường thông tin chuẩn xác như sau:
   - **Name**: `VLXD-postgres` *(Tên hiển thị dịch vụ trên Render)*
   - **Database**: `VLXD` *(Chính xác tên CSDL mà bạn yêu cầu)*
   - **User**: `vlxd_admin` *(hoặc để mặc định render)*
   - **Region**: Chọn **Singapore** *(để tốc độ truy cập từ Việt Nam nhanh nhất)* hoặc **Oregon**
   - **PostgreSQL Version**: `16` (hoặc mới nhất)
   - **Plan**: Chọn gói **Free**
4. Cuộn xuống dưới cùng và nhấn **Create Database**.
5. Đợi khoảng 30 - 60 giây để Render khởi tạo xong. Khi trạng thái chuyển sang **Available**:
   - Cuộn xuống phần **Connections**.
   - Tìm mục **Internal Database URL** (dùng khi Web Service cùng nằm trên Render):
     ```text
     postgres://vlxd_admin:MẬT_KHẨU@dpg-xxxxxx-a.singapore-postgres.render.com/VLXD
     ```
   - *Lưu ý:* Nếu bạn cần kết nối từ máy tính cá nhân bằng DBeaver / Navicat / pgAdmin, hãy copy mục **External Database URL**.

---

## BƯỚC 2: TẠO WEB SERVICE TRÊN RENDER ĐỂ CHẠY WEBSITE

1. Trên [Render Dashboard](https://dashboard.render.com), nhấn nút **New +** > Chọn **Web Service**.
2. Chọn **Build and deploy from a Git repository** > Chọn kho chứa mã nguồn GitHub của dự án này.
3. Thiết lập cấu hình Web Service:
   - **Name**: `nmh-elv-vlxd` *(Tên website của bạn)*
   - **Region**: Chọn cùng Region với Database (ví dụ **Singapore**).
   - **Branch**: `main` (hoặc nhánh bạn push code).
   - **Root Directory**: Để trống (mặc định thư mục gốc).
   - **Runtime**: Chọn **Node**.
   - **Build Command**:
     ```bash
     npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: Chọn gói **Free**.

4. **CẤU HÌNH BIẾN MÔI TRƯỜNG (BẮT BUỘC):**
   - Cuộn xuống phần **Environment Variables** > Nhấn **Add Environment Variable**.
   - **Key**: `DATABASE_URL`
   - **Value**: Dán chuỗi **Internal Database URL** của database `VLXD` bạn vừa copy ở Bước 1.
   *(Ví dụ: `postgres://vlxd_admin:password123@dpg-xxxxx/VLXD`)*

5. Nhấn **Create Web Service**. Render sẽ tự động kéo mã nguồn, chạy `npm run build` và khởi động máy chủ bằng `npm start`.

---

## BƯỚC 3: NẠP 22 BẢNG QUAN HỆ & 427 DÒNG DỮ LIỆU VÀO DATABASE "VLXD"

Bạn có thể chọn 1 trong 2 cách sau:

### Cách 1: Nạp 1-Click Tự Động Ngay Trên Giao Diện Web (Khuyên dùng - Rất nhanh)
1. Khi Render build xong, Render sẽ cấp cho bạn một đường link web dạng:
   `https://nmh-elv-vlxd.onrender.com`
2. Mở đường link đó trên trình duyệt.
3. Trên thanh **Header** trên cùng, bạn sẽ thấy nút **CSDL PostgreSQL** (hoặc **PostgreSQL Live**).
4. Nhấn vào nút đó > Cửa sổ **Cơ Sở Dữ Liệu Thực Tế & Cấu Hình Render** sẽ hiện ra.
5. Nhấn nút **"Nạp CSDL Mẫu"**:
   - Hệ thống sẽ tự động đọc file `database/nmh_postgres_full.sql` và thực thi trực tiếp vào CSDL `VLXD` trên Render.
   - Toàn bộ **22 bảng quan hệ**, các khóa ngoại, triggers chống xung đột thời gian (G3) và **427 dòng dữ liệu thực tế** từ `Du_lieu_mau_NHM_test` sẽ được nạp đầy đủ trong 3 giây!

---

### Cách 2: Nạp bằng dòng lệnh `psql` (Từ máy tính của bạn)
Mở Terminal / Command Prompt trên máy tính và chạy lệnh (thay chuỗi URL bằng External Database URL của Render):
```bash
psql "postgres://vlxd_admin:MẬT_KHẨU@dpg-xxxxxx.singapore-postgres.render.com/VLXD?sslmode=require" -f database/nmh_postgres_full.sql
```

---

## BƯỚC 4: KIỂM TRA THAO TÁC THỰC TẾ ĐA NGƯỜI DÙNG

1. Mở trình duyệt trên máy tính 1: Đăng nhập tài khoản **Quản lý** (`Trần Quốc Bảo`). Tạo một dự án mới hoặc tạo một phân công nhân sự.
2. Mở trình duyệt trên điện thoại hoặc máy tính 2: Đăng nhập tài khoản **Đội trưởng** (`Phạm Văn Cường`) hoặc **Quản trị viên**.
3. Bạn sẽ thấy ngay dữ liệu vừa tạo xuất hiện trên thiết bị thứ 2, vì toàn bộ dữ liệu được ghi và đọc trực tiếp từ database **`VLXD`** trên Render!
