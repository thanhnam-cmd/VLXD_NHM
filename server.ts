import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';
import { bootstrap, syncEntity, ensureSchemaExtensions, verifyPassword, setPassword } from './server-db.ts';

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const distPath = path.resolve(process.cwd(), 'dist');

app.use(express.json({ limit: '60mb' }));

// Initialize PostgreSQL Pool if DATABASE_URL is configured (e.g. on Render)
const databaseUrl = process.env.DATABASE_URL;
let pool: pg.Pool | null = null;

if (databaseUrl) {
  try {
    // SSL: tắt với máy cục bộ và Internal Database URL của Render (host dạng dpg-xxxx-a, không có tên miền);
    // bật với External Database URL (…render.com) hoặc khi URL ghi rõ sslmode=require
    let host = '';
    try { host = new URL(databaseUrl).hostname; } catch {}
    const isLocalOrInternal = host === 'localhost' || host === '127.0.0.1' || (host !== '' && !host.includes('.'));
    const wantsSsl = /sslmode=(require|verify-ca|verify-full)/.test(databaseUrl);
    const noSsl = /sslmode=disable/.test(databaseUrl);
    // pg ưu tiên sslmode trong URL hơn tùy chọn ssl, nên bỏ tham số này và dùng cấu hình ssl ở dưới
    let connectionString = databaseUrl;
    try { const u = new URL(databaseUrl); u.searchParams.delete('sslmode'); connectionString = u.toString(); } catch {}
    pool = new pg.Pool({
      connectionString,
      ssl: noSsl || (isLocalOrInternal && !wantsSsl) ? false : { rejectUnauthorized: false }
    });
    console.log('[PostgreSQL] Database pool initialized for:', databaseUrl.split('@')[1] || 'PostgreSQL');
  } catch (err) {
    console.error('[PostgreSQL] Failed to initialize pool:', err);
  }
} else {
  console.log('[PostgreSQL] No DATABASE_URL provided. Running with in-memory sync service.');
}

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. Health & Database Status
app.get('/api/database/status', async (req, res) => {
  if (!pool) {
    return res.json({
      connected: false,
      hasDatabaseUrl: Boolean(databaseUrl),
      message: 'Chưa cấu hình DATABASE_URL. Để chạy CSDL thực trên Render, bạn hãy tạo PostgreSQL trên Render và gán biến DATABASE_URL.',
      mode: 'In-Memory / LocalStorage Mode'
    });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as db_name');
    
    // Check if tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tableNames = tablesCheck.rows.map(r => r.table_name);
    const hasCoreTables = tableNames.includes('du_an') && tableNames.includes('nhan_su') && tableNames.includes('cong_viec');

    let rowCount = 0;
    if (hasCoreTables) {
      const pCount = await client.query('SELECT COUNT(*) FROM du_an');
      const nsCount = await client.query('SELECT COUNT(*) FROM nhan_su');
      const cvCount = await client.query('SELECT COUNT(*) FROM cong_viec');
      rowCount = parseInt(pCount.rows[0].count, 10) + parseInt(nsCount.rows[0].count, 10) + parseInt(cvCount.rows[0].count, 10);
    }

    client.release();

    return res.json({
      connected: true,
      hasDatabaseUrl: true,
      databaseName: result.rows[0].db_name,
      serverTime: result.rows[0].now,
      tablesCount: tableNames.length,
      hasCoreTables,
      tableNames,
      totalCoreRows: rowCount,
      mode: 'Real PostgreSQL (Render / Remote Database)'
    });
  } catch (err: any) {
    console.error('[PostgreSQL] Connection check failed:', err.message);
    return res.status(500).json({
      connected: false,
      hasDatabaseUrl: true,
      error: err.message,
      message: 'Không thể kết nối đến PostgreSQL qua DATABASE_URL được cung cấp.'
    });
  }
});

// 2. Initialize PostgreSQL Database from database/nmh_postgres_full.sql
app.post('/api/database/init', async (req, res) => {
  if (!pool) {
    return res.status(400).json({
      success: false,
      message: 'Cần biến môi trường DATABASE_URL để thực thi khởi tạo cơ sở dữ liệu PostgreSQL.'
    });
  }

  try {
    const sqlFilePath = path.resolve(process.cwd(), 'database', 'nmh_postgres_full.sql');
    if (!fs.existsSync(sqlFilePath)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy file database/nmh_postgres_full.sql' });
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    const client = await pool.connect();

    console.log('[PostgreSQL] Executing nmh_postgres_full.sql...');
    // Chạy trong một giao dịch: lỗi ở bất kỳ câu lệnh nào thì không thay đổi gì.
    // Dữ liệu mẫu là dữ liệu lịch sử đã nhất quán (ví dụ phân công lập trước khi nhân sự nghỉ việc),
    // nên các trigger nghiệp vụ do phiên bản cũ tạo được tạm tắt trong giao dịch nạp rồi bật lại trước khi COMMIT.
    let disabledTriggers: string[] = [];
    try {
      await client.query('BEGIN');
      const trg = await client.query(`
        SELECT DISTINCT c.relname AS bang, t.tgname AS trigger
        FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE NOT t.tgisinternal AND n.nspname = 'public'`);
      const tables = Array.from(new Set(trg.rows.map((r: any) => r.bang as string)));
      disabledTriggers = trg.rows.map((r: any) => `${r.bang}.${r.trigger}`);
      for (const t of tables) await client.query(`ALTER TABLE "${t}" DISABLE TRIGGER USER`);
      await client.query(sqlContent);
      for (const t of tables) await client.query(`ALTER TABLE "${t}" ENABLE TRIGGER USER`);
      await client.query('COMMIT');
      if (disabledTriggers.length) console.log('[PostgreSQL] Seed loaded with user triggers temporarily disabled:', disabledTriggers.join(', '));
    } catch (err: any) {
      if (err.where) err.message = `${err.message} | ${err.where}`;
      await client.query('ROLLBACK').catch(() => {});
      // Kèm định nghĩa ràng buộc bị vi phạm để thấy ngay nguyên nhân
      if (err.constraint) {
        const def = await client.query(
          `SELECT conrelid::regclass::text AS bang, pg_get_constraintdef(oid) AS dinh_nghia FROM pg_constraint WHERE conname = $1`,
          [err.constraint]
        ).catch(() => ({ rows: [] as any[] }));
        err.message = `${err.message}${def.rows[0] ? ` | ${def.rows[0].bang}: ${def.rows[0].dinh_nghia}` : ''}`;
      }
      client.release();
      throw err;
    }
    client.release();

    await ensureSchemaExtensions(pool);
    console.log('[PostgreSQL] Database schema & seed data initialized successfully!');
    return res.json({
      success: true,
      message: 'Đã khởi tạo thành công 22 bảng quan hệ và nạp đầy đủ dữ liệu thực tế từ nmh_postgres_full.sql vào PostgreSQL trên Render!',
      triggersTamTatKhiNap: disabledTriggers
    });
  } catch (err: any) {
    console.error('[PostgreSQL] Init SQL failed:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: 'Lỗi khi thực thi khởi tạo CSDL PostgreSQL.'
    });
  }
});

// 3. Nạp toàn bộ dữ liệu nghiệp vụ từ PostgreSQL cho giao diện
app.get('/api/bootstrap', async (req, res) => {
  if (!pool) return res.json({ useClientStorage: true });
  try {
    return res.json(await bootstrap(pool));
  } catch (err: any) {
    console.error('[API] /api/bootstrap error:', err.message);
    return res.status(500).json({ useClientStorage: true, error: err.message });
  }
});

// 4. Ghi các bản ghi vừa thay đổi (thêm mới hoặc cập nhật; không xóa dữ liệu nghiệp vụ – QC-08)
app.post('/api/sync/:entity', async (req, res) => {
  if (!pool) return res.json({ status: 'client_saved' });
  const { rows, actor } = req.body || {};
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'Thiếu danh sách bản ghi.' });
  try {
    await syncEntity(pool, req.params.entity, rows, actor);
    return res.json({ success: true, count: rows.length });
  } catch (err: any) {
    console.error(`[API] /api/sync/${req.params.entity} error:`, err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 11. API Authentication: Login (AUTH-01 & KB01 / KB02)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập.' });
  }

  // 1. If PostgreSQL database pool is active, authenticate against database
  if (pool) {
    try {
      const { rows } = await pool.query(`
        SELECT 
          tk.id::text,
          tk.ten_dang_nhap as username,
          tk.mat_khau_bam as "passwordHash",
          tk.ten_hien_thi as name,
          vt.ma as role,
          tk.nhan_su_id::text as "staffId",
          tk.trang_thai as status,
          tk.ly_do_khoa as "lockReason",
          ARRAY(
            SELECT p.du_an_id::text FROM pham_vi_du_an p WHERE p.tai_khoan_id = tk.id
          ) as "assignedProjectIds"
        FROM tai_khoan tk
        JOIN vai_tro vt ON tk.vai_tro_id = vt.id
        WHERE LOWER(tk.ten_dang_nhap) = LOWER($1);
      `, [username.trim()]);

      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
      }

      const acc = rows[0];

      // Locked account check (AUTH-01 & KB02)
      if (acc.status === 'BI_KHOA') {
        return res.status(403).json({
          success: false,
          isLocked: true,
          lockReason: acc.lockReason || 'Nghỉ việc; khóa theo quy trình bàn giao',
          message: `Tài khoản đã bị khóa. Lý do: ${acc.lockReason || 'Nghỉ việc; khóa theo quy trình bàn giao'}. Vui lòng liên hệ quản trị viên.`
        });
      }

      // Mật khẩu lưu dạng băm scrypt; tài khoản mẫu chưa đổi mật khẩu dùng mật khẩu thử nghiệm chung
      const isValid = verifyPassword(String(password || ''), acc.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
      }

      // Update last login timestamp
      await pool.query(`UPDATE tai_khoan SET thoi_diem_dang_nhap_cuoi = NOW() WHERE id = $1`, [acc.id]).catch(() => {});

      return res.json({
        success: true,
        message: 'Đăng nhập thành công',
        user: {
          id: acc.id,
          username: acc.username,
          name: acc.name,
          role: acc.role,
          staffId: acc.staffId || undefined,
          isActive: true,
          assignedProjectIds: acc.assignedProjectIds || []
        }
      });
    } catch (err: any) {
      console.error('[API] /api/auth/login PostgreSQL error:', err.message);
    }
  }

  // 2. Client / Mock fallback authentication
  const defaultAccounts = [
    { id: '1', username: 'admin', name: 'Quản trị hệ thống', role: 'QUAN_TRI', isActive: true },
    { id: '2', username: 'qly.bao', name: 'Trần Quốc Bảo', role: 'QUAN_LY', staffId: '1', isActive: true, assignedProjectIds: ['1', '3', '5', '7', '9'] },
    { id: '3', username: 'qly.nhung', name: 'Lê Thị Hồng Nhung', role: 'QUAN_LY', staffId: '2', isActive: true, assignedProjectIds: ['2', '4', '6', '8', '10'] },
    { id: '4', username: 'dt.cuong', name: 'Phạm Văn Cường', role: 'DOI_TRUONG', staffId: '3', isActive: true },
    { id: '5', username: 'dt.thang', name: 'Nguyễn Đức Thắng', role: 'DOI_TRUONG', staffId: '4', isActive: true },
    { id: '6', username: 'dt.tuan', name: 'Vũ Minh Tuấn', role: 'DOI_TRUONG', staffId: '5', isActive: true },
    { id: '7', username: 'gd.minh', name: 'Giám đốc (giả lập 1)', role: 'BAN_GIAM_DOC', isActive: true },
    { id: '8', username: 'gd.hoa', name: 'Phó Giám đốc (giả lập 2)', role: 'BAN_GIAM_DOC', isActive: true },
    { id: '9', username: 'qly.trung', name: 'Quản lý cũ (đã nghỉ việc)', role: 'QUAN_LY', isActive: false, lockReason: 'Nghỉ việc; khóa theo quy trình bàn giao' }
  ];

  const matched = defaultAccounts.find(a => a.username.toLowerCase() === username.trim().toLowerCase());
  if (!matched) {
    return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
  }

  if (!matched.isActive) {
    return res.status(403).json({
      success: false,
      isLocked: true,
      lockReason: matched.lockReason,
      message: `Tài khoản đã bị khóa. Lý do: ${matched.lockReason}. Vui lòng liên hệ quản trị viên.`
    });
  }

  if (password !== 'Nmh@2026' && password !== 'admin123' && password !== '123456') {
    return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
  }

  return res.json({
    success: true,
    message: 'Đăng nhập thành công',
    user: matched
  });
});

// 12. API Change Password (AUTH-02)
app.post('/api/auth/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số.' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
  }
  const { accountId } = req.body || {};
  if (pool && accountId) {
    try {
      const { rows } = await pool.query('SELECT mat_khau_bam FROM tai_khoan WHERE id = $1', [parseInt(accountId, 10)]);
      if (!rows[0] || !verifyPassword(currentPassword, rows[0].mat_khau_bam)) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
      }
      await setPassword(pool, accountId, newPassword);
      await pool.query('UPDATE tai_khoan SET phai_doi_mat_khau = 0 WHERE id = $1', [parseInt(accountId, 10)]).catch(() => {});
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Không đổi được mật khẩu. Vui lòng thử lại.' });
    }
  }
  return res.json({ success: true, message: 'Đã đổi mật khẩu thành công.' });
});

// 13. API Subcontractors
app.get('/api/subcontractors', async (req, res) => {
  if (!pool) return res.json({ useClientStorage: true });
  try {
    const { rows } = await pool.query(`
      SELECT 
        id::text,
        ten as "companyName",
        nguoi_lien_he as "contactPerson",
        so_dien_thoai as phone,
        khu_vuc_hoat_dong as area,
        trang_thai as status,
        ghi_chu as notes
      FROM doi_ben_ngoai
      ORDER BY id ASC;
    `);
    return res.json(rows);
  } catch (err: any) {
    return res.json({ useClientStorage: true, error: err.message });
  }
});

// 14. API System Views & Alerts
app.get('/api/alerts/overdue', async (req, res) => {
  if (!pool) return res.json({ useClientStorage: true });
  try {
    const { rows } = await pool.query(`SELECT * FROM v_cong_viec_qua_han;`);
    return res.json(rows);
  } catch (err: any) {
    return res.json({ useClientStorage: true, error: err.message });
  }
});

app.get('/api/alerts/upcoming', async (req, res) => {
  if (!pool) return res.json({ useClientStorage: true });
  try {
    const { rows } = await pool.query(`SELECT * FROM v_cong_viec_sap_den_han;`);
    return res.json(rows);
  } catch (err: any) {
    return res.json({ useClientStorage: true, error: err.message });
  }
});

app.get('/api/alerts/conflicts', async (req, res) => {
  if (!pool) return res.json({ useClientStorage: true });
  try {
    const { rows } = await pool.query(`SELECT * FROM v_phan_cong_bi_anh_huong;`);
    return res.json(rows);
  } catch (err: any) {
    return res.json({ useClientStorage: true, error: err.message });
  }
});

// Auto-initialize PostgreSQL database schema & seed data if tables are missing
async function autoInitDatabaseIfEmpty() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'du_an';
    `);

    if (tablesCheck.rows.length === 0) {
      console.log('[PostgreSQL] Database is empty. Auto-initializing schema & seed data from nmh_postgres_full.sql...');
      const sqlFilePath = path.resolve(process.cwd(), 'database', 'nmh_postgres_full.sql');
      if (fs.existsSync(sqlFilePath)) {
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
        await client.query(sqlContent);
        console.log('[PostgreSQL] Auto-initialization completed successfully! 22 tables and 427 rows inserted.');
      } else {
        console.warn('[PostgreSQL] Could not find database/nmh_postgres_full.sql');
      }
    } else {
      console.log('[PostgreSQL] Database tables already initialized.');
    }
    client.release();
  } catch (err: any) {
    console.error('[PostgreSQL] Auto-init check/execution error:', err.message);
  }
}

// ==========================================
// VITE & STATIC FILES SETUP
// ==========================================
async function startServer() {
  // Check and auto-initialize database tables if empty
  await autoInitDatabaseIfEmpty();
  if (pool) {
    await ensureSchemaExtensions(pool).catch(err => console.error('[PostgreSQL] Schema extension error:', err.message));
  }
  if (!isProd) {
    // Development mode: mount Vite dev middleware
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted for development.');
  } else {
    // Production mode on Render: serve static dist
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
      console.log('[Server] Serving static production build from dist/');
    } else {
      console.warn('[Server] dist/ not found. Falling back to Vite dev mode.');
      const vite = await createViteServer({
        server: { middlewareMode: true, allowedHosts: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`[NMH ELV Management System] Running on port ${PORT}`);
    console.log(`Database URL: ${databaseUrl ? 'CONFIGURED (PostgreSQL)' : 'NOT CONFIGURED (Using Seed Fallback)'}`);
    console.log(`Mode: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`Deploy on Render ready: Web Service + Render PostgreSQL`);
    console.log(`====================================================`);
  });
}

startServer();
