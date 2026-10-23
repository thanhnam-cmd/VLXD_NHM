import React, { useEffect, useRef, useState } from 'react';
import type { Category, TechDoc, TechDocVersion } from '../types/index.ts';
import { useStore } from '../state/store.tsx';
import { Modal, Drawer, Label, Hint, ErrorBox, inputCls, btnPrimary, btnSecondary, ConfirmDialog } from './ui.tsx';
import { DOC_TYPE_LABEL, formatDateTime, canOperate } from '../utils/domain.ts';
import { MoreVertical, UploadCloud, X } from 'lucide-react';

export const FILE_TYPE_LABEL: Record<string, string> = {
  BAN_VE_CAD: 'Bản vẽ CAD', PDF: 'PDF', ANH: 'Ảnh', BANG_TINH: 'Bảng tính', NEN: 'Bộ hồ sơ nén', KHAC: 'Khác'
};
const FILE_SYMBOL: Record<string, string> = { BAN_VE_CAD: 'CAD', PDF: 'PDF', ANH: 'ẢNH', BANG_TINH: 'XLSX', NEN: 'ZIP', KHAC: 'KHÁC' };

export const detectFileType = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['dwg', 'dxf', 'rvt'].includes(ext)) return 'BAN_VE_CAD';
  if (ext === 'pdf') return 'PDF';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'ANH';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'BANG_TINH';
  if (['zip', 'rar', '7z'].includes(ext)) return 'NEN';
  return 'KHAC';
};

/** Phiên bản đang hiển thị: bản triển khai, nếu chưa chọn thì bản mới nhất */
export const displayVersion = (d: TechDoc): TechDocVersion | undefined => {
  const v = d.versions || [];
  return v.find(x => x.isSelectedForExecution) || [...v].sort((a, b) => b.versionNum - a.versionNum)[0];
};
export const latestUploadAt = (d: TechDoc) => (d.versions || []).reduce((m, v) => (v.uploadedAt > m ? v.uploadedAt : m), d.createdAt || d.date || '');
export const canPreview = (v?: TechDocVersion) => !!v && (v.fileType === 'PDF' || v.fileType === 'ANH');
export const NO_PREVIEW_MSG = 'Định dạng này chưa xem trực tiếp được. Vui lòng tải về.';

type PickedFile = { name: string; size: number; fileType: string; preview?: string };

const FilePicker: React.FC<{ files: PickedFile[]; setFiles: (f: PickedFile[]) => void; multiple?: boolean; maxMB: number }> = ({ files, setFiles, multiple = true, maxMB }) => {
  const ref = useRef<HTMLInputElement>(null);
  const add = (list: FileList | null) => {
    if (!list) return;
    const picked: PickedFile[] = Array.from(list).map(f => ({
      name: f.name, size: f.size, fileType: detectFileType(f.name),
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
    }));
    setFiles(multiple ? [...files, ...picked].slice(0, 20) : picked.slice(0, 1));
  };
  return (
    <div>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); add(e.dataTransfer.files); }}
        className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/40"
      >
        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
        <div className="text-slate-600 font-semibold mt-1">Kéo thả tệp vào đây hoặc bấm để chọn tệp</div>
        <div className="text-[10px] text-slate-400">Tối đa {maxMB} MB mỗi tệp{multiple ? ' · tối đa 20 tệp mỗi lần' : ''}</div>
        <input ref={ref} type="file" multiple={multiple} className="hidden" onChange={e => { add(e.target.files); e.target.value = ''; }} />
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
              {f.preview ? <img src={f.preview} alt="" className="w-8 h-8 object-cover rounded" /> :
                <span className="w-8 h-8 rounded bg-[#152A55] text-amber-300 text-[9px] font-bold flex items-center justify-center">{FILE_SYMBOL[f.fileType]}</span>}
              <span className="flex-1 truncate font-medium">{f.name}</span>
              <span className="text-slate-500 font-mono">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Hộp thoại Tải lên hồ sơ kỹ thuật (MH-13) và Tải hồ sơ, bản vẽ (MH-08b).
 * Khi truyền fixedProjectId: cố định theo dự án, có dòng hạng mục đang mở, không có trường Nội dung thay đổi.
 */
export const UploadDocModal: React.FC<{ fixedProjectId?: string; contextCategory?: Category; onClose: () => void; onSaved: (msg: string) => void }> = ({
  fixedProjectId, contextCategory, onClose, onSaved
}) => {
  const { visibleProjects, tasks, config, uploadDocs } = useStore();
  const [projectId, setProjectId] = useState(fixedProjectId || '');
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [scope, setScope] = useState<'DUNG_CHUNG_DU_AN' | 'RIENG_CONG_VIEC'>('DUNG_CHUNG_DU_AN');
  const [taskId, setTaskId] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const projectOptions = visibleProjects.filter(p => p.status !== 'HUY');
  const projTasks = tasks
    .filter(t => t.projectId === projectId && t.status !== 'HUY')
    .sort((a, b) => (contextCategory ? (a.categoryId === contextCategory.id ? -1 : 0) - (b.categoryId === contextCategory.id ? -1 : 0) : 0));

  const submit = () => {
    const r = uploadDocs({ projectId, taskId: taskId || undefined, type, title, label: label.trim(), scope, description: desc.trim(), changeNotes: changeNotes.trim() }, files);
    if (!r.ok) return setErr(r.message);
    onSaved(r.message);
  };

  return (
    <Modal
      title={fixedProjectId ? 'Tải hồ sơ, bản vẽ' : 'Tải lên hồ sơ kỹ thuật'}
      onClose={onClose}
      size="lg"
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={submit}>Tải lên</button>
      </>}
    >
      <p className="text-[10px] text-slate-500">(*) Trường bắt buộc</p>
      {contextCategory && (
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500">Hạng mục đang mở: </span><strong>{contextCategory.code} – {contextCategory.name}</strong>
          <Hint>Chỉ dùng làm ngữ cảnh gợi ý công việc, không lưu thành thuộc tính của hồ sơ.</Hint>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Dự án</Label>
          <select value={projectId} disabled={!!fixedProjectId} onChange={e => { setProjectId(e.target.value); setTaskId(''); }} className={inputCls}>
            <option value="">-- Chọn dự án --</option>
            {projectOptions.map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
          </select>
          <Hint>Chỉ dự án trong phạm vi của người dùng</Hint>
        </div>
        <div>
          <Label required>Loại hồ sơ</Label>
          <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
            <option value="">-- Chọn loại hồ sơ --</option>
            {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Hint>Tài liệu khảo sát chọn loại gần nhất và ghi rõ ở Mô tả</Hint>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label required>Tên hồ sơ</Label>
          <input maxLength={255} value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
        </div>
        <div>
          <Label>Nhãn phiên bản</Label>
          <input maxLength={50} value={label} onChange={e => setLabel(e.target.value)} placeholder="Ví dụ: Rev A" className={inputCls} />
        </div>
      </div>
      <div>
        <Label required>Tệp tải lên</Label>
        <FilePicker files={files} setFiles={setFiles} maxMB={config.maxUploadSizeMB} />
        <Hint>Loại tệp cho phép: {config.allowedFileTypes.split(',').map(k => FILE_TYPE_LABEL[k]).join(', ')}. Bộ bản vẽ CAD có tham chiếu ngoài nên nén ZIP trước khi tải lên.</Hint>
      </div>
      <div>
        <Label required>Phạm vi sử dụng</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={scope === 'DUNG_CHUNG_DU_AN'} onChange={() => setScope('DUNG_CHUNG_DU_AN')} /> Dùng chung của dự án
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={scope === 'RIENG_CONG_VIEC'} onChange={() => setScope('RIENG_CONG_VIEC')} /> Riêng công việc
          </label>
        </div>
      </div>
      <div>
        <Label required={scope === 'RIENG_CONG_VIEC'}>Công việc liên quan</Label>
        <select value={taskId} onChange={e => setTaskId(e.target.value)} className={inputCls} disabled={!projectId}>
          <option value="">-- Chọn một công việc --</option>
          {projTasks.map(t => <option key={t.id} value={t.id}>{t.code} · {t.title}</option>)}
        </select>
        <Hint>Khi cần cùng một tệp cho nhiều công việc, tải lên dùng chung của dự án.</Hint>
      </div>
      {!fixedProjectId && (
        <div>
          <Label>Nội dung thay đổi</Label>
          <input maxLength={255} value={changeNotes} onChange={e => setChangeNotes(e.target.value)} placeholder="Có thể để trống với phiên bản đầu tiên" className={inputCls} />
        </div>
      )}
      <div>
        <Label>Mô tả</Label>
        <textarea rows={2} maxLength={500} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tối đa 500 ký tự" className={inputCls} />
      </div>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Hộp thoại Bổ sung phiên bản (MH-13) */
export const AddVersionModal: React.FC<{ doc: TechDoc; onClose: () => void; onSaved: (msg: string) => void }> = ({ doc, onClose, onSaved }) => {
  const { config, addDocVersion, projects, tasks } = useStore();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const p = projects.find(x => x.id === doc.projectId);
  const t = tasks.find(x => x.id === doc.taskId);
  return (
    <Modal title="Bổ sung phiên bản" subtitle={doc.title} onClose={onClose}
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => {
          if (files.length === 0) return setErr('Vui lòng chọn tệp.');
          const r = addDocVersion(doc.id, files[0], label.trim(), notes.trim());
          if (!r.ok) return setErr(r.message);
          onSaved(r.message);
        }}>Tải lên</button>
      </>}>
      <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
        <div>Dự án: <strong>{p?.code}</strong></div>
        <div>Loại hồ sơ: <strong>{DOC_TYPE_LABEL[doc.type] || doc.type}</strong></div>
        <div>Phạm vi: <strong>{doc.scope === 'RIENG_CONG_VIEC' ? `Riêng ${t?.code || ''}` : 'Dùng chung'}</strong></div>
        <div>Công việc: <strong>{t ? `${t.code} · ${t.title}` : '—'}</strong></div>
      </div>
      <div>
        <Label required>Tệp</Label>
        <FilePicker files={files} setFiles={setFiles} multiple={false} maxMB={config.maxUploadSizeMB} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nhãn phiên bản</Label>
          <input maxLength={50} value={label} onChange={e => setLabel(e.target.value)} placeholder="Ví dụ: Rev C" className={inputCls} />
        </div>
        <div>
          <Label>Nội dung thay đổi</Label>
          <input maxLength={255} value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} />
        </div>
      </div>
      <Hint>Phiên bản mới không tự được chọn làm bản triển khai; các phiên bản cũ được giữ nguyên.</Hint>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Hộp thoại Sửa thông tin mô tả (MH-13) */
export const EditDocInfoModal: React.FC<{ doc: TechDoc; onClose: () => void; onSaved: (msg: string) => void }> = ({ doc, onClose, onSaved }) => {
  const { tasks, updateDocInfo } = useStore();
  const [title, setTitle] = useState(doc.title || doc.name || '');
  const [type, setType] = useState(doc.type);
  const [scope, setScope] = useState(doc.scope || 'DUNG_CHUNG_DU_AN');
  const [taskId, setTaskId] = useState(doc.taskId || '');
  const [desc, setDesc] = useState(doc.description || '');
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal title="Sửa thông tin mô tả" subtitle={doc.title} onClose={onClose}
      footer={<>
        <button type="button" className={btnSecondary} onClick={onClose}>Hủy bỏ</button>
        <button type="button" className={btnPrimary} onClick={() => {
          const r = updateDocInfo(doc.id, { title, type, scope, taskId: taskId || undefined, description: desc });
          if (!r.ok) return setErr(r.message);
          onSaved(r.message);
        }}>Lưu thay đổi</button>
      </>}>
      <div>
        <Label required>Tên hồ sơ</Label>
        <input maxLength={255} value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
      </div>
      <div>
        <Label required>Loại hồ sơ</Label>
        <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
          {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" checked={scope === 'DUNG_CHUNG_DU_AN'} onChange={() => setScope('DUNG_CHUNG_DU_AN')} /> Dùng chung của dự án</label>
        <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" checked={scope === 'RIENG_CONG_VIEC'} onChange={() => setScope('RIENG_CONG_VIEC')} /> Riêng công việc</label>
      </div>
      <div>
        <Label required={scope === 'RIENG_CONG_VIEC'}>Công việc liên quan</Label>
        <select value={taskId} onChange={e => setTaskId(e.target.value)} className={inputCls}>
          <option value="">-- Chọn một công việc --</option>
          {tasks.filter(t => t.projectId === doc.projectId && t.status !== 'HUY').map(t => <option key={t.id} value={t.id}>{t.code} · {t.title}</option>)}
        </select>
      </div>
      <div>
        <Label>Mô tả</Label>
        <textarea rows={2} maxLength={500} value={desc} onChange={e => setDesc(e.target.value)} className={inputCls} />
      </div>
      <Hint>Không thay đổi nội dung tệp; muốn đổi nội dung thì bổ sung phiên bản.</Hint>
      <ErrorBox message={err} />
    </Modal>
  );
};

/** Ngăn Danh sách các phiên bản của hồ sơ (MH-13) */
export const VersionsDrawer: React.FC<{
  doc: TechDoc;
  onClose: () => void;
  onView: (doc: TechDoc, v: TechDocVersion) => void;
  onDownload: (doc: TechDoc, versionNum: number) => void;
  onMessage: (msg: string) => void;
}> = ({ doc, onClose, onView, onDownload, onMessage }) => {
  const { docs, projects, tasks, selectDocVersion, currentUser } = useStore();
  const fresh = docs.find(d => d.id === doc.id) || doc;
  const [confirmV, setConfirmV] = useState<TechDocVersion | null>(null);
  const current = (fresh.versions || []).find(v => v.isSelectedForExecution);
  const t = tasks.find(x => x.id === fresh.taskId);
  return (
    <Drawer
      title={fresh.title}
      subtitle={`${projects.find(p => p.id === fresh.projectId)?.code} · ${DOC_TYPE_LABEL[fresh.type] || fresh.type} · ${fresh.scope === 'RIENG_CONG_VIEC' ? `Riêng ${t?.code || ''}` : 'Dùng chung'}`}
      onClose={onClose}
    >
      <div className="space-y-2.5">
        {[...(fresh.versions || [])].sort((a, b) => b.versionNum - a.versionNum).map(v => (
          <div key={v.versionNum} className={`p-3 rounded-xl border ${v.isSelectedForExecution ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-slate-50/50'}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900">Phiên bản {v.versionNum}</span>
              {v.label && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">{v.label}</span>}
              {v.isSelectedForExecution && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Bản triển khai</span>}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">{v.originalFileName} · {FILE_TYPE_LABEL[v.fileType] || v.fileType} · {v.fileSizeDisplay}</div>
            <div className="text-[10px] text-slate-500">Tải bởi {v.uploadedBy || '—'} lúc {formatDateTime(v.uploadedAt)}</div>
            {v.changeNotes && <div className="text-[11px] text-slate-700 mt-1">Thay đổi: {v.changeNotes}</div>}
            {v.isSelectedForExecution && v.selectedAt && (
              <div className="text-[10px] text-emerald-700 mt-0.5">Chọn bởi {v.selectedBy || '—'} lúc {formatDateTime(v.selectedAt)}</div>
            )}
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => canPreview(v) ? onView(fresh, v) : onMessage(NO_PREVIEW_MSG)} className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-semibold hover:bg-slate-100 cursor-pointer">Xem</button>
              <button type="button" onClick={() => onDownload(fresh, v.versionNum)} className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-semibold hover:bg-slate-100 cursor-pointer">Tải về</button>
              {!v.isSelectedForExecution && canOperate(currentUser) && (
                <button type="button" onClick={() => setConfirmV(v)} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100 cursor-pointer">Chọn làm bản triển khai</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {confirmV && (
        <ConfirmDialog
          title="Chọn bản triển khai"
          message={<>Chọn <strong>phiên bản {confirmV.versionNum}{confirmV.label ? ` (${confirmV.label})` : ''}</strong> làm bản triển khai{current ? <> thay cho phiên bản {current.versionNum}</> : null}? Mỗi hồ sơ chỉ có tối đa một bản triển khai; các bản khác vẫn được giữ và xem được.</>}
          onClose={() => setConfirmV(null)}
          onConfirm={() => {
            const r = selectDocVersion(fresh.id, confirmV.versionNum);
            setConfirmV(null);
            onMessage(r.message);
          }}
        />
      )}
    </Drawer>
  );
};

/** Bảng hồ sơ kỹ thuật dùng chung cho MH-13 và tab Hồ sơ kỹ thuật của MH-08 */
export const DocsTable: React.FC<{
  docs: TechDoc[];
  onView: (doc: TechDoc) => void;
  onDownload: (doc: TechDoc, versionNum?: number) => void;
  onMessage: (msg: string, type?: 'success' | 'error') => void;
}> = ({ docs, onView, onDownload, onMessage }) => {
  const { projects, tasks, currentUser, selectDocVersion } = useStore();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [addVersion, setAddVersion] = useState<TechDoc | null>(null);
  const [editInfo, setEditInfo] = useState<TechDoc | null>(null);
  const [versions, setVersions] = useState<TechDoc | null>(null);
  const [confirmSelect, setConfirmSelect] = useState<TechDoc | null>(null);
  const canEdit = canOperate(currentUser);

  useEffect(() => {
    const close = () => setMenuId(null);
    if (menuId) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuId]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
          <tr>
            <th className="p-3">Định dạng</th>
            <th className="p-3">Hồ sơ</th>
            <th className="p-3">Dự án</th>
            <th className="p-3">Loại hồ sơ</th>
            <th className="p-3">Phạm vi xem</th>
            <th className="p-3">Người tải · thời điểm</th>
            <th className="p-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {docs.length === 0 ? (
            <tr><td colSpan={7} className="p-6 text-center text-slate-400">Không có hồ sơ phù hợp.</td></tr>
          ) : docs.map(d => {
            const v = displayVersion(d);
            const t = tasks.find(x => x.id === d.taskId);
            return (
              <tr key={d.id} className="hover:bg-slate-50/60">
                <td className="p-3">
                  <span className="w-10 h-10 rounded-lg bg-[#152A55] text-amber-300 flex items-center justify-center font-mono font-bold text-[10px]">{FILE_SYMBOL[v?.fileType || 'KHAC'] || 'KHÁC'}</span>
                </td>
                <td className="p-3">
                  <div className="font-bold text-[#0D1A36]">{d.title || d.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span>Phiên bản {v?.versionNum ?? 1}{v?.label ? ` · ${v.label}` : ''}{v?.fileSizeDisplay ? ` · ${v.fileSizeDisplay}` : ''}</span>
                    {v?.isSelectedForExecution && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Bản triển khai</span>}
                  </div>
                </td>
                <td className="p-3 font-mono text-slate-700">{projects.find(p => p.id === d.projectId)?.code || d.projectCode}</td>
                <td className="p-3">{DOC_TYPE_LABEL[d.type] || d.type}</td>
                <td className="p-3">{d.scope === 'RIENG_CONG_VIEC' ? `Riêng ${t?.code || d.taskCode || ''}` : 'Dùng chung'}</td>
                <td className="p-3 text-slate-600">
                  <div>{v?.uploadedBy || d.uploadedBy || '—'}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{formatDateTime(v?.uploadedAt || d.date)}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button type="button" onClick={() => canPreview(v) ? onView(d) : onMessage(NO_PREVIEW_MSG, 'error')} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-[#152A55] hover:text-white font-semibold cursor-pointer">Xem</button>
                    <button type="button" onClick={() => onDownload(d)} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer">Tải về</button>
                    {canEdit && (
                      <div className="relative">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setMenuId(menuId === d.id ? null : d.id); }} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuId === d.id && (
                          <div className="absolute right-0 top-7 z-20 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1" onClick={e => e.stopPropagation()}>
                            <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setMenuId(null); setAddVersion(d); }}>Bổ sung phiên bản</button>
                            <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setMenuId(null); setVersions(d); }}>Xem các phiên bản</button>
                            <button type="button" disabled={!!v?.isSelectedForExecution} className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer disabled:opacity-40" onClick={() => { setMenuId(null); setConfirmSelect(d); }}>Chọn làm bản triển khai</button>
                            <button type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => { setMenuId(null); setEditInfo(d); }}>Sửa thông tin mô tả</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {addVersion && <AddVersionModal doc={addVersion} onClose={() => setAddVersion(null)} onSaved={(m) => { setAddVersion(null); onMessage(m); }} />}
      {editInfo && <EditDocInfoModal doc={editInfo} onClose={() => setEditInfo(null)} onSaved={(m) => { setEditInfo(null); onMessage(m); }} />}
      {versions && (
        <VersionsDrawer
          doc={versions}
          onClose={() => setVersions(null)}
          onView={(d) => onView(d)}
          onDownload={(d, n) => onDownload(d, n)}
          onMessage={(m) => onMessage(m, m === NO_PREVIEW_MSG ? 'error' : 'success')}
        />
      )}
      {confirmSelect && (() => {
        const v = displayVersion(confirmSelect)!;
        const cur = (confirmSelect.versions || []).find(x => x.isSelectedForExecution);
        return (
          <ConfirmDialog
            title="Chọn bản triển khai"
            message={<>Chọn <strong>phiên bản {v.versionNum}{v.label ? ` (${v.label})` : ''}</strong> làm bản triển khai{cur ? <> thay cho phiên bản {cur.versionNum}</> : null}?</>}
            onClose={() => setConfirmSelect(null)}
            onConfirm={() => { const r = selectDocVersion(confirmSelect.id, v.versionNum); setConfirmSelect(null); onMessage(r.message); }}
          />
        );
      })()}
    </div>
  );
};
