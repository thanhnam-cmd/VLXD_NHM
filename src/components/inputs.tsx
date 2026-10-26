import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Search, X } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');
// Lớp độ rộng cố định (w-36, w-[200px]…): khi có thì khung bọc không giãn hết chiều ngang
const FIXED_W = /\bw-(\d|\[|auto|fit|max|min)/;
const isoToVn = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
const vnToIso = (vn: string) => {
  const m = vn.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
};

type DateInputProps = {
  value: string; // yyyy-mm-dd hoặc ''
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  title?: string;
  placeholder?: string;
};

/**
 * Ô ngày luôn hiển thị theo dd/mm/yyyy (không phụ thuộc ngôn ngữ trình duyệt).
 * Gõ trực tiếp "12102026" hoặc "12/10/2026", hoặc bấm biểu tượng lịch để chọn.
 * onChange trả về giá trị yyyy-mm-dd giống ô <input type="date"> nên dùng thay thế trực tiếp.
 */
export const DateInput: React.FC<DateInputProps> = ({ value, onChange, className = '', min, max, disabled, title, placeholder = 'dd/mm/yyyy' }) => {
  const [text, setText] = useState(isoToVn(value));
  const [bad, setBad] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setText(isoToVn(value)); setBad(false); }, [value]);

  const commit = (raw: string) => {
    if (!raw.trim()) { setBad(false); if (value) onChange({ target: { value: '' } }); return; }
    const iso = vnToIso(raw.trim());
    if (!iso) { setBad(true); return; }
    setBad(false);
    if (iso !== value) onChange({ target: { value: iso } });
  };
  const onType = (raw: string) => {
    // Tự chèn dấu "/" khi gõ số liền
    let v = raw.replace(/[^\d/]/g, '');
    const digits = v.replace(/\//g, '');
    if (!v.includes('/') && digits.length > 2) v = digits.slice(0, 2) + '/' + digits.slice(2, 4) + (digits.length > 4 ? '/' + digits.slice(4, 8) : '');
    setText(v.slice(0, 10));
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) commit(v);
  };
  const openPicker = () => {
    const el = pickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!el || disabled) return;
    try { el.showPicker ? el.showPicker() : el.click(); } catch { el.click(); }
  };

  return (
    <div className={`relative inline-flex items-center ${FIXED_W.test(className) ? '' : 'w-full'}`} title={title}>
      <input
        type="text" inputMode="numeric" value={text} disabled={disabled} placeholder={placeholder}
        onChange={e => onType(e.target.value)} onBlur={e => commit(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
        className={`${className} font-mono pr-8 ${bad ? '!border-red-400 !bg-red-50' : ''}`}
      />
      <button type="button" tabIndex={-1} disabled={disabled} onClick={openPicker} title="Chọn ngày trên lịch"
        className="absolute right-1.5 p-1 text-slate-400 hover:text-[#152A55] cursor-pointer disabled:opacity-40">
        <CalendarDays className="w-4 h-4" />
      </button>
      <input ref={pickerRef} type="date" tabIndex={-1} aria-hidden value={value} min={min} max={max}
        onChange={e => onChange({ target: { value: e.target.value } })}
        className="absolute right-1 bottom-0 w-6 h-px opacity-0 pointer-events-none" />
    </div>
  );
};

export type SelectOption = { value: string; label: string; sub?: string; group?: string };

/**
 * Ô "gõ để tìm rồi bấm chọn" (combobox): thay cho select dài.
 * Gõ chữ chỉ lọc danh sách, không tự nhảy giá trị; bấm vào một dòng mới chọn.
 */
export const SearchSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  allLabel?: string; // có dòng "tất cả" (giá trị '')
  className?: string;
  disabled?: boolean;
  emptyText?: string;
}> = ({ value, onChange, options, placeholder = 'Gõ để tìm…', allLabel, className = '', disabled, emptyText = 'Không tìm thấy kết quả phù hợp.' }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const list = useMemo(() => {
    const k = norm(q.trim());
    return options.filter(o => !k || norm(`${o.label} ${o.sub || ''}`).includes(k));
  }, [options, q]);
  const pick = (v: string) => { onChange(v); setOpen(false); setQ(''); };

  return (
    <div ref={boxRef} className={`relative ${FIXED_W.test(className) ? '' : 'w-full'}`}>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          disabled={disabled}
          value={open ? q : (selected ? selected.label : (value === '' && allLabel ? allLabel : ''))}
          placeholder={selected ? selected.label : placeholder}
          onFocus={() => { setOpen(true); setQ(''); }}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); setQ(''); }
            if (e.key === 'Enter' && list.length > 0) { e.preventDefault(); pick(list[0].value); }
          }}
          className={`${className} pl-8 pr-12 truncate`}
        />
        {value && allLabel !== undefined && !disabled && (
          <button type="button" tabIndex={-1} title="Bỏ chọn" onClick={() => pick('')} className="absolute right-7 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-red-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {open && !disabled && (
        <div className="absolute z-40 left-0 mt-1 min-w-full w-max max-w-[min(90vw,32rem)] bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto py-1 text-xs">
          {allLabel !== undefined && !q && (
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick('')}
              className={`w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer ${value === '' ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-600'}`}>{allLabel}</button>
          )}
          {list.length === 0 ? <div className="px-3 py-2 text-slate-400">{emptyText}</div> : list.map((o, i) => (
            <React.Fragment key={o.value}>
              {o.group && o.group !== list[i - 1]?.group && <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{o.group}</div>}
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick(o.value)}
                className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 cursor-pointer ${o.value === value ? 'bg-blue-50 text-blue-800 font-semibold' : 'text-slate-800'}`}>
                <div className="truncate">{o.label}</div>
                {o.sub && <div className="text-[10px] text-slate-500 truncate font-normal">{o.sub}</div>}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
