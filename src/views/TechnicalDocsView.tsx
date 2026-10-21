import React, { useState } from 'react';
import { TechDoc, Project, DocType } from '../types/index.ts';
import { 
  FileBox, 
  UploadCloud, 
  Search, 
  Download, 
  Layers, 
  Eye, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Building,
  Filter
} from 'lucide-react';

interface TechnicalDocsViewProps {
  docs: TechDoc[];
  projects: Project[];
  onOpenDocViewer: (doc: TechDoc) => void;
  onDownloadDoc: (doc: TechDoc) => void;
  onUploadDoc: (doc: Omit<TechDoc, 'id' | 'date'>) => void;
}

export const TechnicalDocsView: React.FC<TechnicalDocsViewProps> = ({
  docs,
  projects,
  onOpenDocViewer,
  onDownloadDoc,
  onUploadDoc
}) => {
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Upload modal state
  const [uploadProject, setUploadProject] = useState<string>(projects[0]?.id || '');
  const [uploadType, setUploadType] = useState<DocType>('Bản vẽ thiết kế');
  const [uploadName, setUploadName] = useState<string>('');
  const [uploadVersion, setUploadVersion] = useState<string>('v1.0');
  const [uploadFormat, setUploadFormat] = useState<'dwg' | 'pdf' | 'xlsx' | 'docx' | 'zip'>('pdf');
  const [uploadFloorLevel, setUploadFloorLevel] = useState<string>('');

  const docTypes: DocType[] = [
    'Bản vẽ thiết kế',
    'Dự toán',
    'Hợp đồng',
    'Biên bản nghiệm thu',
    'Nhật ký thi công',
    'Chứng chỉ vật liệu',
    'Báo cáo khảo sát'
  ];

  const filteredDocs = docs.filter(doc => {
    if (selectedProjectFilter !== 'all' && doc.projectId !== selectedProjectFilter) return false;
    if (selectedTypeFilter !== 'all' && doc.type !== selectedTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const docTitle = doc.name || doc.title || '';
      return (
        docTitle.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q) ||
        Boolean(doc.floorLevel && doc.floorLevel.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) return;

    const docTitle = uploadName.trim().endsWith(`.${uploadFormat}`) ? uploadName.trim() : `${uploadName.trim()}.${uploadFormat}`;
    onUploadDoc({
      projectId: uploadProject,
      type: uploadType,
      title: docTitle,
      name: docTitle,
      version: uploadVersion.trim(),
      uploadedByStaffId: 's3',
      fileSize: '3.5 MB',
      fileFormat: uploadFormat,
      isOfficialBlueprint: uploadType === 'Bản vẽ thiết kế',
      floorLevel: uploadFloorLevel.trim() || undefined
    });

    setIsUploadOpen(false);
    setUploadName('');
    setUploadFloorLevel('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D1A36] tracking-tight">
            Kho Hồ Sơ Kỹ Thuật &amp; Bản Vẽ Bản Thảo (Shop Drawing)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu trữ bản vẽ CAD Tầng 4–9, bóc tách khối lượng vật tư và hợp đồng thi công ngoài (UC-04)
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] shadow-xs transition-colors self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" /> Tải lên hồ sơ kỹ thuật
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên bản vẽ, tầng, định dạng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#152A55]/20"
          />
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 w-full"
          >
            <option value="all">Tất cả dự án ({docs.length} tệp)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 w-full"
          >
            <option value="all">Tất cả loại hồ sơ</option>
            {docTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 bg-[#F8FAFC] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Danh sách hồ sơ kỹ thuật ({filteredDocs.length})
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Bảo toàn phiên bản và không ghi đè dữ liệu
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredDocs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Không tìm thấy hồ sơ kỹ thuật phù hợp với bộ lọc.
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const project = projects.find(p => p.id === doc.projectId);

              return (
                <div 
                  key={doc.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      doc.fileFormat === 'dwg' ? 'bg-[#152A55] text-amber-300' :
                      doc.fileFormat === 'xlsx' ? 'bg-emerald-700 text-white' :
                      doc.fileFormat === 'pdf' ? 'bg-red-700 text-white' :
                      'bg-slate-700 text-white'
                    }`}>
                      {(doc.fileFormat || 'PDF').toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-[#0D1A36] truncate hover:text-[#152A55]">
                          {doc.name || doc.title || 'Hồ sơ kỹ thuật'}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {doc.version || 'v1.0'}
                        </span>
                        {doc.isOfficialBlueprint && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                            Phát hành thi công
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="font-medium text-slate-700">{project?.name}</span>
                        <span>·</span>
                        <span className="text-slate-600">{doc.type}</span>
                        {doc.floorArea && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-[#152A55] font-semibold">{doc.floorArea}</span>
                          </>
                        )}
                        {doc.elevation && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-slate-600">Cao độ {doc.elevation}</span>
                          </>
                        )}
                        <span>·</span>
                        <span className="font-mono">{doc.date}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-400">{doc.fileSize}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => onOpenDocViewer(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] transition-colors shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{doc.floorLevel ? 'Mở bản vẽ CAD' : 'Xem nội dung'}</span>
                    </button>

                    <button
                      onClick={() => onDownloadDoc(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      title="Tải tệp về máy tính"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tải về</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Upload Tech Doc */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Tải lên hồ sơ kỹ thuật / Bản vẽ mới</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dự án công trình</label>
                <select
                  value={uploadProject}
                  onChange={(e) => setUploadProject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Loại hồ sơ</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as DocType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  >
                    {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Định dạng file</label>
                  <select
                    value={uploadFormat}
                    onChange={(e) => setUploadFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800"
                  >
                    <option value="dwg">AutoCAD (.dwg)</option>
                    <option value="pdf">Tài liệu PDF (.pdf)</option>
                    <option value="xlsx">Bảng tính Excel (.xlsx)</option>
                    <option value="zip">Gói nén ZIP (.zip)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tên hồ sơ / Bản vẽ</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: MB-TANG-04-CBCS.dwg hoặc Du-toan-dien-nhe.xlsx"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nhãn phiên bản</label>
                  <input
                    type="text"
                    required
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800"
                    placeholder="v1.0"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tầng / Khu vực (nếu có)</label>
                  <input
                    type="text"
                    value={uploadFloorLevel}
                    onChange={(e) => setUploadFloorLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="Ví dụ: Mặt Bằng Tầng 4"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Lưu ý: Hệ thống lưu phiên bản riêng biệt và không ghi đè các tệp cùng tên trước đó để bảo toàn lịch sử tra cứu kỹ thuật.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold bg-[#152A55] text-white rounded-lg hover:bg-[#1E3A75]"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
