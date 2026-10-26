import React, { useMemo, useState } from 'react';
import type { TechDoc, TechDocVersion } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { DOC_TYPE_LABEL, formatDate, formatDateTime } from '../utils/domain.ts';
import { renderDocSheet, downloadUrl } from '../utils/fileArt.ts';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, FileImage, FileText } from 'lucide-react';

const FILE_LABEL: Record<string, string> = { BAN_VE_CAD: 'Bản vẽ CAD', PDF: 'PDF', ANH: 'Ảnh', BANG_TINH: 'Bảng tính', NEN: 'Tệp nén', KHAC: 'Khác' };

/** Phiên bản đang xem: theo số phiên bản, nếu không có thì bản triển khai, cuối cùng là bản mới nhất */
export const pickVersion = (doc: TechDoc, versionNum?: number): TechDocVersion | undefined => {
  const v = doc.versions || [];
  return (versionNum !== undefined ? v.find(x => x.versionNum === versionNum) : undefined)
    || v.find(x => x.isSelectedForExecution) || [...v].sort((a, b) => b.versionNum - a.versionNum)[0];
};

/** Tệp gốc có lưu thật trong CSDL hay không */
export const hasStoredFile = (v?: TechDocVersion) => !!v?.storedPath && v.storedPath.startsWith('/api/files/');

const baseName = (s: string) => s.replace(/\.[^.]+$/, '');

/** Ảnh PNG của hồ sơ (dùng khi chưa có tệp gốc hoặc tệp gốc là CAD, bảng tính, tệp nén) */
export const docSheetPng = (doc: TechDoc, v: TechDocVersion | undefined, projectName?: string) => renderDocSheet({
  title: doc.title || doc.name || 'Hồ sơ kỹ thuật',
  projectCode: doc.projectCode, projectName,
  typeLabel: DOC_TYPE_LABEL[doc.type] || doc.type,
  versionLabel: v ? `Phiên bản ${v.versionNum}${v.label ? ' · ' + v.label : ''}${v.isSelectedForExecution ? ' (bản triển khai)' : ''}` : '',
  fileName: v?.originalFileName, date: formatDate(v?.uploadedAt || doc.createdAt), author: v?.uploadedBy || doc.uploadedBy,
  note: v?.changeNotes || doc.description
});

/** Tải về: có tệp gốc thì tải tệp gốc; nếu chưa có tệp (dữ liệu mẫu) thì tải ảnh PNG của bản vẽ */
export const downloadDoc = (doc: TechDoc, versionNum?: number, projectName?: string, asPng = false) => {
  const v = pickVersion(doc, versionNum);
  if (!asPng && hasStoredFile(v)) return downloadUrl(`${v!.storedPath}?download=1`, v!.originalFileName);
  downloadUrl(docSheetPng(doc, v, projectName), `${baseName(v?.originalFileName || doc.title || 'ho-so')}.png`);
};

/** Xem hồ sơ kỹ thuật: PDF và ảnh mở trực tiếp; định dạng khác (CAD, bảng tính, nén) hoặc dữ liệu mẫu xem dạng ảnh PNG */
export const DocViewerModal: React.FC<{ doc: TechDoc; versionNum?: number; onClose: () => void }> = ({ doc, versionNum, onClose }) => {
  const { projects } = useStore();
  const [zoom, setZoom] = useState(1);
  const v = pickVersion(doc, versionNum);
  const project = projects.find(p => p.id === doc.projectId);
  const stored = hasStoredFile(v);
  const native = stored && (v!.fileType === 'PDF' || v!.fileType === 'ANH');
  const png = useMemo(() => (native ? '' : docSheetPng(doc, v, project?.name)), [doc, v, native, project?.name]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200">
          <div className="min-w-0 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-[#152A55] text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">{(v?.originalFileName.split('.').pop() || 'TỆP').toUpperCase().slice(0, 4)}</span>
            <div className="min-w-0">
              <div className="font-bold text-sm text-[#0D1A36] truncate">{doc.title}</div>
              <div className="text-[11px] text-slate-500 truncate">
                {doc.projectCode} · {DOC_TYPE_LABEL[doc.type] || doc.type} · Phiên bản {v?.versionNum}{v?.label ? ` (${v.label})` : ''} · {v?.originalFileName} · {v?.fileSizeDisplay}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {stored && (
              <button type="button" onClick={() => downloadDoc(doc, v?.versionNum, project?.name)} className="px-3 py-1.5 rounded-lg bg-[#152A55] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Tải tệp gốc
              </button>
            )}
            {!native && (
              <button type="button" onClick={() => downloadDoc(doc, v?.versionNum, project?.name, true)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${stored ? 'border border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-[#152A55] text-white'}`}>
                <FileImage className="w-3.5 h-3.5" /> Tải ảnh PNG
              </button>
            )}
            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 relative bg-slate-200 overflow-auto">
            {!native || v!.fileType === 'ANH' ? (
              <>
                <div className="sticky top-3 left-3 z-10 inline-flex items-center gap-1 m-3 p-1 bg-white rounded-lg shadow border border-slate-200 text-xs">
                  <button type="button" onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))} className="p-1.5 hover:bg-slate-100 rounded cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))} className="p-1.5 hover:bg-slate-100 rounded cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setZoom(1)} className="p-1.5 hover:bg-slate-100 rounded cursor-pointer"><RotateCcw className="w-4 h-4" /></button>
                  <span className="px-1.5 font-mono">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="p-4 pt-0 flex justify-center">
                  <img src={native ? v!.storedPath : png} alt={doc.title} style={{ width: `${zoom * 100}%`, maxWidth: 'none' }} className="bg-white shadow-lg rounded" />
                </div>
              </>
            ) : (
              <iframe title={doc.title} src={v!.storedPath} className="w-full h-full bg-white" />
            )}
          </div>
          <aside className="hidden md:block w-72 border-l border-slate-200 p-4 space-y-3 text-xs overflow-y-auto">
            <div className="font-bold text-slate-700 uppercase text-[11px] tracking-wide">Thông số hồ sơ</div>
            {([
              ['Dự án', `${doc.projectCode || ''}${project ? ' – ' + project.name : ''}`],
              ['Loại hồ sơ', DOC_TYPE_LABEL[doc.type] || doc.type],
              ['Định dạng', FILE_LABEL[v?.fileType || ''] || v?.fileType || '—'],
              ['Phiên bản', v ? `${v.versionNum}${v.label ? ' · ' + v.label : ''}` : '—'],
              ['Bản triển khai', v?.isSelectedForExecution ? 'Có' : 'Không'],
              ['Tệp gốc', v?.originalFileName || '—'],
              ['Dung lượng', v?.fileSizeDisplay || '—'],
              ['Tải lên', `${formatDateTime(v?.uploadedAt)}${v?.uploadedBy ? ' · ' + v.uploadedBy : ''}`],
              ['Nội dung thay đổi', v?.changeNotes || '—']
            ] as [string, string][]).map(([k, val]) => (
              <div key={k} className="border-b border-slate-100 pb-2"><div className="text-slate-500">{k}</div><div className="font-semibold text-slate-800 break-words">{val}</div></div>
            ))}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex gap-2">
              <FileText className="w-4 h-4 shrink-0 text-slate-400" />
              <span>{native ? 'Tệp gốc đang hiển thị trực tiếp.'
                : stored ? 'Trình duyệt không mở trực tiếp được định dạng này. Đang hiển thị ảnh PNG của hồ sơ; bấm "Tải tệp gốc" để mở bằng phần mềm chuyên dụng (AutoCAD, Excel…).'
                : 'Hồ sơ trong dữ liệu mẫu chưa có tệp gốc. Đang hiển thị ảnh PNG của hồ sơ; có thể tải về dạng PNG.'}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
