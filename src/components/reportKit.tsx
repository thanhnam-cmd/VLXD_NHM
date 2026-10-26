import React from 'react';
import { DEMO_QUERY_TIME } from '../utils/progressCalculator.ts';
import { formatDateTime } from '../utils/domain.ts';

export const COMPANY = {
  name: 'CÔNG TY TNHH ĐẦU TƯ VÀ PHÁT TRIỂN NMH',
  address: 'Số nhà 47 ngõ 207 đường Xuân Đỉnh, phường Xuân Đỉnh, thành phố Hà Nội',
  system: 'Hệ thống Quản lý Dự án & Phân công Thi công'
};

type Tone = 'navy' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
const TONE: Record<Tone, { bar: string; label: string; bg: string }> = {
  navy: { bar: 'border-t-[#152A55]', label: 'text-[#152A55]', bg: 'bg-white' },
  blue: { bar: 'border-t-blue-600', label: 'text-blue-700', bg: 'bg-white' },
  green: { bar: 'border-t-emerald-600', label: 'text-emerald-700', bg: 'bg-white' },
  amber: { bar: 'border-t-amber-500', label: 'text-amber-700', bg: 'bg-white' },
  red: { bar: 'border-t-red-600', label: 'text-red-700', bg: 'bg-red-50/40' },
  purple: { bar: 'border-t-purple-600', label: 'text-purple-700', bg: 'bg-white' },
  slate: { bar: 'border-t-slate-400', label: 'text-slate-600', bg: 'bg-white' }
};

/** Thẻ tóm tắt: màu nằm ở viền trên và nhãn của ô, số liệu màu đậm trung tính */
export const StatCard: React.FC<{ label: string; value: React.ReactNode; unit?: string; tone?: Tone; hint?: string }> = ({ label, value, unit, tone = 'navy', hint }) => {
  const t = TONE[tone];
  const empty = value === null || value === undefined || value === '';
  return (
    <div className={`p-3 rounded-xl border border-slate-300 border-t-4 ${t.bar} ${t.bg} shadow-2xs`}>
      <div className={`text-[11px] font-bold ${t.label}`}>{label}</div>
      {empty
        ? <div className="text-xs text-slate-400 mt-1.5">Chưa có dữ liệu</div>
        : <div className="text-2xl font-bold font-mono text-slate-900 leading-tight mt-0.5">{value}{unit && <span className="text-[11px] font-sans font-normal text-slate-500 ml-1">{unit}</span>}</div>}
      {hint && <div className="text-[10px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
};

/** Ô lọc: nhãn ở trên, điều khiển ở dưới */
export const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; className?: string }> = ({ label, required, children, className = '' }) => (
  <div className={`flex flex-col gap-1 text-xs min-w-0 ${className}`}>
    <span className="font-semibold text-slate-600">{label}{required && <span className="text-red-500"> (*)</span>}</span>
    {children}
  </div>
);
export const filterBoxCls = 'p-3 bg-white rounded-xl border border-slate-300 shadow-2xs flex flex-wrap items-end gap-3 print:hidden';
export const ctlCls = 'px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#152A55]/30';

/** Bảng trên màn hình: kẻ ô rõ ràng */
export const tableWrapCls = 'bg-white rounded-xl border border-slate-300 overflow-hidden shadow-2xs';
export const thCls = 'p-2.5 border-b-2 border-r border-slate-300 last:border-r-0 bg-slate-100 text-slate-700 font-bold text-[11px] align-bottom';
export const tdCls = 'p-2.5 border-b border-r border-slate-200 last:border-r-0 align-top';

export type PrintSection = {
  title: string;
  head: string[];
  rows: (string | number)[][];
  foot?: (string | number)[];
  align?: ('l' | 'c' | 'r')[];
  widths?: string[];
  empty?: string;
};

const vnDateLine = () => {
  const d = DEMO_QUERY_TIME;
  return `Hà Nội, ngày ${d.slice(8, 10)} tháng ${d.slice(5, 7)} năm ${d.slice(0, 4)}`;
};

/** Bản in trắng đen theo mẫu báo cáo: đầu trang công ty, tiêu đề, kỳ báo cáo, các mục bảng, ghi chú, chữ ký */
export const PrintSheet: React.FC<{
  code: string;
  title: string;
  period: string;
  filterText: string;
  summary: [string, string | number][];
  sections: PrintSection[];
  notes?: string[];
  preparedBy?: string;
}> = ({ code, title, period, filterText, summary, sections, notes = [], preparedBy }) => (
  <div className="hidden print:block report-print text-black">
    <div className="flex justify-between items-start">
      <div>
        <div className="font-bold text-[13px]">{COMPANY.name}</div>
        <div className="text-[10px]">{COMPANY.address}</div>
        <div className="text-[10px]">{COMPANY.system}</div>
      </div>
      <div className="text-right text-[10px]"><div className="font-bold text-[12px]">Mẫu {code}</div><div>Lưu hành nội bộ</div></div>
    </div>
    <h1 className="text-center font-bold text-[17px] uppercase mt-3">{title}</h1>
    <div className="text-center text-[11px] mt-0.5">Kỳ báo cáo: {period}</div>
    <div className="text-center text-[10px] italic mt-0.5">{filterText} · Thời điểm tra cứu: {formatDateTime(DEMO_QUERY_TIME)}</div>

    <div className="font-bold text-[12px] mt-3 mb-1">I. Tổng hợp chung</div>
    <table className="w-full border-collapse text-[11px]">
      <tbody>
        <tr>{summary.map(([, v], i) => <td key={i} className="border border-black text-center font-bold text-[14px] pt-1">{v}</td>)}</tr>
        <tr>{summary.map(([l], i) => <td key={i} className="border border-black text-center text-[10px] pb-1">{l}</td>)}</tr>
      </tbody>
    </table>

    {sections.map((sec, si) => (
      <div key={si} className="mt-3">
        <div className="font-bold text-[12px] mb-1">{['II', 'III', 'IV', 'V'][si] || si + 2}. {sec.title}</div>
        <table className="w-full border-collapse text-[10.5px]">
          <thead>
            <tr>{sec.head.map((h, i) => <th key={i} style={sec.widths?.[i] ? { width: sec.widths[i] } : undefined} className="border border-black bg-gray-100 px-1 py-1 font-bold text-center">{h}</th>)}</tr>
          </thead>
          <tbody>
            {sec.rows.length === 0
              ? <tr><td colSpan={sec.head.length} className="border border-black text-center py-2 italic">{sec.empty || 'Không có dữ liệu trong kỳ.'}</td></tr>
              : sec.rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => (
                  <td key={ci} className={`border border-black px-1 py-0.5 ${sec.align?.[ci] === 'c' ? 'text-center' : sec.align?.[ci] === 'r' ? 'text-right' : 'text-left'}`}>{c}</td>
                ))}</tr>
              ))}
            {sec.foot && (
              <tr className="font-bold">{sec.foot.map((c, ci) => (
                <td key={ci} className={`border border-black px-1 py-0.5 ${sec.align?.[ci] === 'c' ? 'text-center' : sec.align?.[ci] === 'r' ? 'text-right' : 'text-left'}`}>{c}</td>
              ))}</tr>
            )}
          </tbody>
        </table>
      </div>
    ))}

    <div className="grid grid-cols-2 gap-6 mt-4 text-[10.5px] break-inside-avoid">
      <div>
        {notes.length > 0 && <>
          <div className="font-bold">Ghi chú</div>
          <ol className="list-decimal pl-4 space-y-0.5">{notes.map((n, i) => <li key={i}>{n}</li>)}</ol>
        </>}
      </div>
      <div className="text-center">
        <div className="italic">{vnDateLine()}</div>
        <div className="grid grid-cols-2 mt-1">
          <div><div className="font-bold">Người lập báo cáo</div><div className="italic text-[9.5px]">(Ký, ghi rõ họ tên)</div><div className="h-14" /><div>{preparedBy}</div></div>
          <div><div className="font-bold">Ban Giám đốc</div><div className="italic text-[9.5px]">(Ký, ghi rõ họ tên, đóng dấu)</div></div>
        </div>
      </div>
    </div>
  </div>
);
