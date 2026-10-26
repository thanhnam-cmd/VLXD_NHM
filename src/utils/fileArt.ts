/**
 * Tệp hiển thị được cho dữ liệu chưa có tệp gốc (dữ liệu mẫu hoặc định dạng trình duyệt không mở được như .dwg, .zip):
 * – renderDocSheet: bản vẽ khổ A3 ngang có khung tên, xuất PNG để xem và tải về.
 * – renderSamplePhoto: ảnh hiện trường minh họa cho bản ghi mẫu chỉ có tên tệp.
 * Kết quả được lưu đệm theo khóa để không vẽ lại.
 */
const cache = new Map<string, string>();

const seedOf = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed: number) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const FONT = "'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif";

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxW: number) => {
  const words = text.split(' '); const lines: string[] = []; let cur = '';
  words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
  if (cur) lines.push(cur);
  return lines;
};

export type SheetInfo = {
  title: string; projectCode?: string; projectName?: string; typeLabel?: string; versionLabel?: string;
  fileName?: string; date?: string; author?: string; note?: string;
};

export function renderDocSheet(info: SheetInfo): string {
  const key = 'sheet:' + JSON.stringify(info);
  if (cache.has(key)) return cache.get(key)!;
  const W = 2000, H = 1414;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  const r = rng(seedOf(info.title + (info.projectCode || '')));
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  // Khung bản vẽ
  ctx.strokeStyle = '#111'; ctx.lineWidth = 6; ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 2; ctx.strokeRect(60, 60, W - 120, H - 120);
  // Lưới trục
  const gx0 = 120, gy0 = 120, gx1 = W - 560, gy1 = H - 120;
  ctx.strokeStyle = '#c8d0dc'; ctx.lineWidth = 1; ctx.setLineDash([12, 8]);
  const cols = 6, rows = 4;
  for (let i = 0; i <= cols; i++) { const x = gx0 + (gx1 - gx0) * i / cols; ctx.beginPath(); ctx.moveTo(x, gy0 - 30); ctx.lineTo(x, gy1); ctx.stroke(); }
  for (let j = 0; j <= rows; j++) { const y = gy0 + (gy1 - gy0) * j / rows; ctx.beginPath(); ctx.moveTo(gx0 - 30, y); ctx.lineTo(gx1, y); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.fillStyle = '#334155'; ctx.font = `bold 22px ${FONT}`; ctx.textAlign = 'center';
  for (let i = 0; i <= cols; i++) { const x = gx0 + (gx1 - gx0) * i / cols; ctx.beginPath(); ctx.arc(x, gy0 - 52, 20, 0, Math.PI * 2); ctx.strokeStyle = '#334155'; ctx.stroke(); ctx.fillText(String(i + 1), x, gy0 - 44); }
  for (let j = 0; j <= rows; j++) { const y = gy0 + (gy1 - gy0) * j / rows; ctx.beginPath(); ctx.arc(gx0 - 52, y, 20, 0, Math.PI * 2); ctx.stroke(); ctx.fillText(String.fromCharCode(65 + j), gx0 - 52, y + 8); }
  // Phòng (tường)
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 5;
  const cw = (gx1 - gx0) / cols, rh = (gy1 - gy0) / rows;
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; ) {
    const span = Math.min(cols - i, 1 + Math.floor(r() * 3));
    const room = { x: gx0 + i * cw, y: gy0 + j * rh, w: span * cw, h: rh };
    rooms.push(room); ctx.strokeRect(room.x, room.y, room.w, room.h); i += span;
  }
  // Tuyến cáp và thiết bị
  const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea'];
  ctx.lineWidth = 3;
  for (let k = 0; k < 4; k++) {
    ctx.strokeStyle = colors[k]; ctx.setLineDash(k % 2 ? [16, 10] : []);
    ctx.beginPath(); let x = gx0 + 20, y = gy0 + 30 + k * 18; ctx.moveTo(x, y);
    for (let s = 0; s < 6; s++) { x = Math.min(gx1 - 20, x + 120 + r() * 220); ctx.lineTo(x, y); y = gy0 + 30 + r() * (gy1 - gy0 - 60); ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  rooms.forEach((rm, idx) => {
    const n = 1 + Math.floor(r() * 3);
    for (let d = 0; d < n; d++) {
      const cx = rm.x + 30 + r() * (rm.w - 60), cy = rm.y + 30 + r() * (rm.h - 60);
      ctx.fillStyle = colors[(idx + d) % 4]; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#475569'; ctx.font = `18px ${FONT}`; ctx.textAlign = 'left';
    ctx.fillText(`P.${String(idx + 101)}`, rm.x + 10, rm.y + rm.h - 12);
  });
  // Chú giải
  const lx = W - 520, ly = 120;
  ctx.textAlign = 'left'; ctx.fillStyle = '#0f172a'; ctx.font = `bold 26px ${FONT}`; ctx.fillText('CHÚ GIẢI', lx, ly);
  [['Cáp mạng Cat6', colors[0]], ['Cáp camera / tín hiệu', colors[1]], ['Cáp âm thanh', colors[2]], ['Cáp điều khiển', colors[3]]].forEach(([t, col], i) => {
    const y = ly + 40 + i * 40;
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.setLineDash(i % 2 ? [16, 10] : []); ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx + 70, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx + 100, y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.font = `22px ${FONT}`; ctx.fillText(t, lx + 125, y + 8);
  });
  if (info.note) {
    ctx.fillStyle = '#334155'; ctx.font = `20px ${FONT}`;
    wrap(ctx, 'Ghi chú: ' + info.note, 440).slice(0, 8).forEach((l, i) => ctx.fillText(l, lx, ly + 230 + i * 30));
  }
  // Khung tên
  const tx = W - 540, ty = H - 520, tw = 480, th = 460;
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.strokeRect(tx, ty, tw, th);
  const rowsTB: [string, string][] = [
    ['Đơn vị', 'CÔNG TY TNHH ĐẦU TƯ VÀ PHÁT TRIỂN NMH'],
    ['Dự án', `${info.projectCode || ''} ${info.projectName ? '– ' + info.projectName : ''}`.trim()],
    ['Tên bản vẽ', info.title],
    ['Loại hồ sơ', info.typeLabel || ''],
    ['Phiên bản', info.versionLabel || ''],
    ['Tệp gốc', info.fileName || ''],
    ['Ngày', info.date || ''],
    ['Người lập', info.author || '']
  ];
  let yy = ty;
  rowsTB.forEach(([k, v], i) => {
    ctx.font = `20px ${FONT}`;
    const lines = wrap(ctx, v || '—', tw - 150).slice(0, i === 1 || i === 2 ? 3 : 2);
    const h = Math.max(46, 18 + lines.length * 26);
    if (yy + h > ty + th) return;
    ctx.beginPath(); ctx.moveTo(tx, yy + h); ctx.lineTo(tx + tw, yy + h); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx + 130, yy); ctx.lineTo(tx + 130, yy + h); ctx.stroke();
    ctx.fillStyle = '#475569'; ctx.font = `bold 18px ${FONT}`; ctx.fillText(k, tx + 10, yy + 30);
    ctx.fillStyle = '#0f172a'; ctx.font = `${i === 2 ? 'bold ' : ''}20px ${FONT}`;
    lines.forEach((l, li) => ctx.fillText(l, tx + 142, yy + 30 + li * 26));
    yy += h;
  });
  const url = c.toDataURL('image/png');
  cache.set(key, url);
  return url;
}

export function renderSamplePhoto(name: string, caption?: string): string {
  const key = 'photo:' + name + '|' + (caption || '');
  if (cache.has(key)) return cache.get(key)!;
  const W = 1200, H = 900;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  const r = rng(seedOf(name));
  // Tường, trần, sàn
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#d9dee5'); g.addColorStop(0.55, '#eef1f4'); g.addColorStop(1, '#9aa3ad');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(80,90,100,.35)'; ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (x - W / 2) * 0.15, 260); ctx.stroke(); }
  for (let y = 40; y < 260; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // Máng cáp
  ctx.fillStyle = '#8a929b'; ctx.fillRect(0, 300, W, 26);
  ctx.fillStyle = '#6b737c'; ctx.fillRect(0, 326, W, 8);
  const cableCols = ['#1d4ed8', '#e5e7eb', '#f59e0b', '#16a34a', '#dc2626'];
  for (let k = 0; k < 9; k++) {
    ctx.strokeStyle = cableCols[k % cableCols.length]; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 304 + k * 2.4);
    for (let x = 0; x <= W; x += 100) ctx.lineTo(x, 304 + k * 2.4 + (r() - 0.5) * 6);
    ctx.stroke();
  }
  // Tủ rack / thiết bị
  const rx = 120 + r() * 600, rw = 260, rtop = 380;
  ctx.fillStyle = '#1f2937'; ctx.fillRect(rx, rtop, rw, 440);
  for (let u = 0; u < 10; u++) {
    ctx.fillStyle = u % 3 === 0 ? '#374151' : '#111827'; ctx.fillRect(rx + 16, rtop + 20 + u * 40, rw - 32, 30);
    for (let p = 0; p < 12; p++) { ctx.fillStyle = r() > 0.4 ? '#22c55e' : '#f59e0b'; ctx.fillRect(rx + 26 + p * 18, rtop + 30 + u * 40, 6, 6); }
  }
  // Camera / loa
  for (let k = 0; k < 3; k++) {
    const cx = 200 + r() * 800, cy = 120 + r() * 100;
    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  }
  // Nhãn
  ctx.fillStyle = 'rgba(15,23,42,.78)'; ctx.fillRect(0, H - 110, W, 110);
  ctx.fillStyle = '#fbbf24'; ctx.font = `bold 30px ${FONT}`; ctx.textAlign = 'left';
  ctx.fillText('ẢNH HIỆN TRƯỜNG (DỮ LIỆU MẪU)', 30, H - 66);
  ctx.fillStyle = '#fff'; ctx.font = `24px ${FONT}`;
  ctx.fillText(`${name}${caption ? ' · ' + caption : ''}`.slice(0, 90), 30, H - 28);
  const url = c.toDataURL('image/jpeg', 0.85);
  cache.set(key, url);
  return url;
}

/** Nén ảnh chụp trước khi tải lên: cạnh dài tối đa 1600 px, JPEG chất lượng 0,82 */
export function compressImage(file: File, maxSide = 1600): Promise<{ dataUrl: string; size: number; name: string }> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Không đọc được tệp ảnh.'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Tệp ảnh bị lỗi hoặc không đúng định dạng.'));
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL('image/jpeg', 0.82);
        const name = file.name.replace(/\.(png|jpe?g)$/i, '') + '.jpg';
        resolve({ dataUrl, size: Math.round((dataUrl.length - 23) * 0.75), name });
      };
      img.src = String(fr.result);
    };
    fr.readAsDataURL(file);
  });
}

export function downloadUrl(url: string, fileName: string) {
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
