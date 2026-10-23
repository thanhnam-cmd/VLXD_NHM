import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

/** Thông báo nổi dùng chung (QC-02: thông báo tiếng Việt) */
export const useToast = () => {
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const show = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);
  const node = toast ? (
    <div className={`fixed top-16 right-6 z-[70] p-3 rounded-xl text-xs flex items-center gap-2 shadow-2xl max-w-md ${
      toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
    }`}>
      {toast.type === 'success'
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        : <AlertCircle className="w-4 h-4 text-white shrink-0" />}
      <span>{toast.text}</span>
      <button type="button" onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white cursor-pointer">✕</button>
    </div>
  ) : null;
  return { show, node };
};

interface ModalProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/** Hộp thoại theo mẫu của các biểu mẫu sẵn có (nền mờ, bo góc 2xl) */
export const Modal: React.FC<ModalProps> = ({ title, subtitle, onClose, children, footer, size = 'md' }) => {
  const width = size === 'sm' ? 'max-w-md' : size === 'md' ? 'max-w-lg' : size === 'lg' ? 'max-w-2xl' : 'max-w-4xl';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className={`bg-white rounded-2xl shadow-2xl ${width} w-full border border-slate-200 text-xs max-h-[92vh] flex flex-col`}>
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-slate-200 gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-[#0D1A36]">{title}</h3>
            {subtitle && <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-3.5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

/** Ngăn trượt bên phải (ngăn chi tiết, ngăn xử lý, ngăn xem nhanh) */
export const Drawer: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; onClose: () => void; children: React.ReactNode; width?: string }> = ({
  title, subtitle, onClose, children, width = 'max-w-lg'
}) => (
  <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-2xs" onClick={onClose}>
    <div className={`w-full ${width} bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-5 text-xs`} onClick={e => e.stopPropagation()}>
      <div className="flex items-start justify-between pb-3 border-b border-slate-200 gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-[#0D1A36]">{title}</h3>
          {subtitle && <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
      </div>
      {children}
    </div>
  </div>
);

export const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-slate-700 font-semibold mb-1">
    {children} {required && <span className="text-red-500">(*)</span>}
  </label>
);

export const Hint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] text-slate-500 mt-1">{children}</p>
);

export const ErrorBox: React.FC<{ message?: string | null }> = ({ message }) =>
  message ? (
    <div className="p-2.5 bg-red-100 border border-red-300 text-red-700 rounded-lg font-semibold text-[11px]">{message}</div>
  ) : null;

export const inputCls = 'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 disabled:opacity-60';
export const btnPrimary = 'px-4 py-2 font-bold bg-[#152A55] text-white rounded-lg hover:bg-[#1E3A75] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
export const btnSecondary = 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer';
export const btnDanger = 'px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer disabled:opacity-50';

/** Hộp xác nhận có thể kèm ô lý do bắt buộc (tối đa 255 ký tự) */
export const ConfirmDialog: React.FC<{
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onConfirm: (reason: string) => string | void | null; // trả về chuỗi lỗi nếu thất bại
  onClose: () => void;
}> = ({ title, message, confirmLabel = 'Xác nhận', danger, requireReason, reasonLabel = 'Lý do', reasonPlaceholder, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
          <button
            type="button"
            className={danger ? btnDanger : btnPrimary}
            onClick={() => {
              if (requireReason && !reason.trim()) { setErr(`Vui lòng nhập ${reasonLabel.toLowerCase()}.`); return; }
              const r = onConfirm(reason.trim());
              if (typeof r === 'string' && r) setErr(r);
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-slate-700 leading-relaxed">{message}</div>
      {requireReason && (
        <div>
          <Label required>{reasonLabel}</Label>
          <textarea rows={2} maxLength={255} value={reason} onChange={e => setReason(e.target.value)} placeholder={reasonPlaceholder || 'Tối đa 255 ký tự'} className={inputCls} />
        </div>
      )}
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Thanh phân trang với dòng "Hiển thị a–b trên tổng số n ..." (QC-11) */
export const Pagination: React.FC<{ page: number; pageSize: number; total: number; unit: string; onChange: (p: number) => void }> = ({
  page, pageSize, total, unit, onChange
}) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 flex-wrap gap-2">
      <span>Hiển thị {from}–{to} trên tổng số {total} {unit}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-2 py-0.5 rounded border border-slate-300 disabled:opacity-40 cursor-pointer">‹</button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} className={`px-2 py-0.5 rounded border cursor-pointer ${n === page ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'}`}>{n}</button>
        ))}
        <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="px-2 py-0.5 rounded border border-slate-300 disabled:opacity-40 cursor-pointer">›</button>
      </div>
    </div>
  );
};

/** Nhãn trạng thái dự án/công việc theo Bảng 3.10 */
export const StatusBadge: React.FC<{ status: string; kind?: 'project' | 'task' | 'record' }> = ({ status, kind = 'project' }) => {
  const map: Record<string, [string, string]> = kind === 'project' ? {
    LAP_KE_HOACH: ['Lập kế hoạch', 'bg-slate-100 text-slate-700 border-slate-200'],
    DANG_THUC_HIEN: ['Đang triển khai', 'bg-blue-100 text-blue-800 border-blue-200'],
    TAM_DUNG: ['Tạm dừng', 'bg-amber-100 text-amber-800 border-amber-200'],
    HOAN_THANH: ['Hoàn thành', 'bg-emerald-100 text-emerald-800 border-emerald-200'],
    HUY: ['Hủy', 'bg-slate-200 text-slate-600 border-slate-300']
  } : kind === 'task' ? {
    CHUA_BAT_DAU: ['Chưa bắt đầu', 'bg-slate-100 text-slate-700 border-slate-200'],
    DANG_THUC_HIEN: ['Đang thực hiện', 'bg-blue-100 text-blue-800 border-blue-200'],
    HOAN_THANH: ['Hoàn thành', 'bg-emerald-100 text-emerald-800 border-emerald-200'],
    HUY: ['Hủy', 'bg-slate-200 text-slate-600 border-slate-300']
  } : {
    HIEU_LUC: ['Hiệu lực', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
    HUY: ['Đã hủy', 'bg-slate-100 text-slate-500 border-slate-200']
  };
  const [label, cls] = map[status] || [status, 'bg-slate-100 text-slate-600 border-slate-200'];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border whitespace-nowrap ${cls}`}>{label}</span>;
};
