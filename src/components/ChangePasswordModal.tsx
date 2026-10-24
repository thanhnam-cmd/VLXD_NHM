import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Check, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useStore } from '../state/store.tsx';
import { dbService } from '../services/db.ts';
import { ROLE_LABEL, normalizeRole } from '../utils/domain.ts';
import { Modal, Label, ErrorBox, inputCls, btnPrimary, btnSecondary } from './ui.tsx';

/** Quy tắc mật khẩu (AUTH-02): tối thiểu 8 ký tự, có chữ hoa, chữ thường, chữ số và khác mật khẩu hiện tại */
export const passwordRules = (next: string, cur: string) => [
  { ok: next.length >= 8, label: 'Tối thiểu 8 ký tự' },
  { ok: /[A-Z]/.test(next), label: 'Có chữ hoa (A–Z)' },
  { ok: /[a-z]/.test(next), label: 'Có chữ thường (a–z)' },
  { ok: /\d/.test(next), label: 'Có chữ số (0–9)' },
  { ok: !!next && next !== cur, label: 'Khác mật khẩu hiện tại' }
];

const PasswordInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean; invalid?: boolean; autoComplete: string }> = ({ value, onChange, placeholder, autoFocus, invalid, autoComplete }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} autoComplete={autoComplete}
        className={`${inputCls} pr-9 ${invalid ? 'border-red-400 focus:ring-red-300' : ''}`} />
      <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)} title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

/** Hộp thoại Đổi mật khẩu của chính mình (AUTH-02, MH-22) – dùng chung cho menu tài khoản và trang Quản trị */
export const ChangePasswordModal: React.FC<{ onClose: () => void; onDone: (m: string) => void; forced?: boolean }> = ({ onClose, onDone, forced }) => {
  const { currentUser, markPasswordChanged } = useStore();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rules = passwordRules(next, cur);
  const passed = rules.filter(r => r.ok).length;
  const strength = !next ? null : passed <= 2 ? { w: '33%', cls: 'bg-red-500', label: 'Yếu' } : passed <= 4 ? { w: '66%', cls: 'bg-amber-500', label: 'Trung bình' } : { w: '100%', cls: 'bg-emerald-500', label: 'Mạnh' };
  const mismatch = !!confirm && confirm !== next;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);
    if (!cur) return setErr('Vui lòng nhập mật khẩu hiện tại.');
    if (passed < rules.length) return setErr('Mật khẩu mới chưa đạt đủ yêu cầu bên dưới.');
    if (next !== confirm) return setErr('Mật khẩu xác nhận không trùng khớp.');
    setBusy(true);
    const r = await dbService.changePassword(cur, next, currentUser.id);
    setBusy(false);
    if (!r.success) return setErr(r.message || 'Mật khẩu hiện tại không đúng.');
    markPasswordChanged();
    onDone('Đã đổi mật khẩu thành công. Lần đăng nhập sau hãy dùng mật khẩu mới.');
  };

  return (
    <Modal title="Đổi mật khẩu" subtitle={`${currentUser.name} · @${currentUser.username} · ${ROLE_LABEL[normalizeRole(currentUser.role)] || ''}`} onClose={onClose} size="sm"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>{forced ? 'Để sau' : 'Hủy bỏ'}</button>
        <button type="button" className={btnPrimary} disabled={busy} onClick={() => submit()}>{busy ? 'Đang lưu…' : 'Lưu mật khẩu'}</button>
      </>}>
      <form onSubmit={submit} className="space-y-3.5">
        {forced && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>Tài khoản đang dùng mật khẩu tạm do Quản trị viên cấp. Vui lòng đổi sang mật khẩu của riêng bạn.</span>
          </div>
        )}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#EEF3FA] border border-blue-100">
          <div className="w-9 h-9 rounded-full bg-[#152A55] text-white flex items-center justify-center shrink-0"><KeyRound className="w-4 h-4" /></div>
          <div className="text-[11px] text-slate-600 leading-relaxed">Sau khi đổi, mật khẩu mới có hiệu lực ngay cho mọi lần đăng nhập tiếp theo.</div>
        </div>
        <div>
          <Label required>Mật khẩu hiện tại</Label>
          <PasswordInput value={cur} onChange={setCur} placeholder="Nhập mật khẩu đang dùng" autoFocus autoComplete="current-password" />
        </div>
        <div>
          <Label required>Mật khẩu mới</Label>
          <PasswordInput value={next} onChange={setNext} placeholder="Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số" autoComplete="new-password" />
          {strength && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className={`h-full ${strength.cls} transition-all`} style={{ width: strength.w }} /></div>
              <span className="text-[10px] font-semibold text-slate-600 w-16 text-right">{strength.label}</span>
            </div>
          )}
        </div>
        <div>
          <Label required>Xác nhận mật khẩu mới</Label>
          <PasswordInput value={confirm} onChange={setConfirm} placeholder="Nhập lại mật khẩu mới" invalid={mismatch} autoComplete="new-password" />
          {mismatch && <div className="text-[10px] text-red-600 mt-1">Mật khẩu xác nhận chưa khớp.</div>}
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
          {rules.map(r => (
            <li key={r.label} className={`flex items-center gap-1.5 ${r.ok ? 'text-emerald-700' : 'text-slate-500'}`}>
              {r.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}{r.label}
            </li>
          ))}
          <li className={`flex items-center gap-1.5 ${confirm && !mismatch ? 'text-emerald-700' : 'text-slate-500'}`}>
            {confirm && !mismatch ? <ShieldCheck className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}Xác nhận trùng khớp
          </li>
        </ul>
        <ErrorBox message={err} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
};
