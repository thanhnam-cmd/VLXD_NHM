import React, { useState } from 'react';
import type { ExternalAssignment, ExternalDailyStaffing } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { formatDate, formatDateTime } from '../utils/domain.ts';
import { Modal, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary } from './ui.tsx';

export const STAFF_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DU: { label: 'Đủ', cls: 'bg-emerald-100 text-emerald-800' },
  THIEU: { label: 'Thiếu', cls: 'bg-red-100 text-red-700' },
  THUA: { label: 'Thừa', cls: 'bg-amber-100 text-amber-800' }
};

/** Khoán theo dự án chỉ để theo dõi (đội nào, bao nhiêu người); nhân sự theo ngày báo theo phần việc giao của công việc */
export const isProjectKhoan = (e: ExternalAssignment) => !e.taskId;

/** Các ngày đội trưởng đã báo chờ Quản lý xác nhận (khoán theo dự án không còn nhận báo nên không tính) */
export const pendingStaffDays = (e: ExternalAssignment) => isProjectKhoan(e) ? [] : (e.dailyStaffing || []).filter(d => !d.confirmed && d.reportedBy);

/** Nhãn trạng thái xác nhận của một ngày */
export const DayConfirmBadge: React.FC<{ d?: ExternalDailyStaffing; closed?: boolean }> = ({ d, closed }) => {
  if (!d) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">Chưa báo</span>;
  if (!d.confirmed && closed) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold whitespace-nowrap" title="Khoán theo dự án không còn nhận báo nhân sự; số người báo theo phần việc giao của công việc">Đã đóng</span>;
  return d.confirmed
    ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold whitespace-nowrap">QL đã xác nhận</span>
    : <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold whitespace-nowrap">Chờ QL xác nhận</span>;
};

/**
 * Quản lý xác nhận nhân sự đội khoán ngoài của một ngày:
 * xem số đội trưởng báo, nhập số người chính thức (có thể điều chỉnh) và nhận xét.
 */
export const ConfirmDailyModal: React.FC<{ ext: ExternalAssignment; date: string; onClose: () => void; onDone: (m: string) => void }> = ({ ext, date, onClose, onDone }) => {
  const { confirmDailyStaffing, externalAssignments } = useStore();
  const fresh = externalAssignments.find(e => e.id === ext.id) || ext;
  const d = (fresh.dailyStaffing || []).find(x => x.date === date);
  const [count, setCount] = useState(String(d?.presentCount ?? d?.reportedCount ?? fresh.workerCount ?? ''));
  const [note, setNote] = useState(d?.managerNote || '');
  const [err, setErr] = useState<string | null>(null);
  if (!d) return null;
  const n = /^\d+$/.test(count) ? +count : NaN;
  const diff = !isNaN(n) && fresh.workerCount ? n - fresh.workerCount : 0;
  return (
    <Modal title="Xác nhận nhân sự đội khoán ngoài" subtitle={`${fresh.contractorName} · ngày ${formatDate(date)}`} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => {
          if (isNaN(n)) return setErr('Vui lòng nhập số người có mặt (0–200).');
          const r = confirmDailyStaffing(fresh.id, date, n, note);
          if (!r.ok) return setErr(r.message);
          onDone(r.message);
        }}>{d.confirmed ? 'Lưu xác nhận' : 'Xác nhận'}</button>
      </>}>
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
        <div className="flex items-center justify-between"><span className="text-slate-500">Quy mô khoán</span><strong>{fresh.workerCount ?? '—'} người</strong></div>
        {d.reportedBy ? <>
          <div className="flex items-center justify-between"><span className="text-slate-500">Đội trưởng báo</span>
            <span><strong>{d.reportedCount ?? d.presentCount} người</strong> {d.reportedStatus && <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded font-bold ${STAFF_STATUS_LABEL[d.reportedStatus]?.cls}`}>{STAFF_STATUS_LABEL[d.reportedStatus]?.label}</span>}</span></div>
          <div className="text-[11px] text-slate-500">{d.reportedBy} · {formatDateTime(d.reportedAt)}</div>
          {(d.reportNote || d.content) && <div className="text-slate-700">“{d.reportNote || d.content}”</div>}
        </> : <div className="text-slate-500">Ngày này do Quản lý nhập trực tiếp.</div>}
        {d.confirmed && <div className="text-[11px] text-emerald-700 pt-1">Đã xác nhận {d.presentCount} người bởi {d.confirmedBy} lúc {formatDateTime(d.confirmedAt)}</div>}
      </div>
      <div>
        <Label required>Số người có mặt (chính thức)</Label>
        <input type="number" min={0} max={200} value={count} onChange={e => setCount(e.target.value)} className={`${inputCls} font-mono`} />
        {!isNaN(n) && fresh.workerCount ? <Hint>{diff === 0 ? 'Đủ so với số khoán.' : diff < 0 ? `Thiếu ${-diff} người so với số khoán.` : `Thừa ${diff} người so với số khoán.`} Số này dùng cho báo cáo BC-04 và tính công.</Hint> : null}
      </div>
      <div>
        <Label>Nhận xét gửi đội trưởng</Label>
        <textarea rows={2} maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder="Không bắt buộc. Ví dụ: chiều chỉ còn 2 người, tính 0,5 công cho 1 người…" className={inputCls} />
      </div>
      <ErrorBox message={err} />
    </Modal>
  );
};
