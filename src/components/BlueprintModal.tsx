import React, { useState } from 'react';
import { TechDoc } from '../types/index.ts';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Layers, 
  Info, 
  Compass, 
  CheckCircle2, 
  FileCode,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

interface BlueprintModalProps {
  doc: TechDoc;
  onClose: () => void;
  onDownload: (doc: TechDoc) => void;
}

export const BlueprintModal: React.FC<BlueprintModalProps> = ({ doc, onClose, onDownload }) => {
  const [zoom, setZoom] = useState(1);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    architecture: true,
    cableTray: true,
    networkLan: true,
    paSound: true,
    dimensions: true
  });

  const toggleLayer = (layerKey: string) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleZoomIn = () => setZoom(z => Math.min(2.5, +(z + 0.2).toFixed(1)));
  const handleZoomOut = () => setZoom(z => Math.max(0.6, +(z - 0.2).toFixed(1)));
  const handleResetZoom = () => setZoom(1);

  const isExcel = doc.fileFormat?.toLowerCase() === 'xlsx';
  const isFloorPlan = Boolean(doc.floorLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-doc-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#152A55] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
              {(doc.fileFormat || 'pdf').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="modal-doc-title" className="text-base font-semibold text-[#0D1A36] truncate">
                  {doc.name || doc.title || 'Hồ sơ thiết kế kỹ thuật'}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono font-medium">
                  {doc.version}
                </span>
                {doc.isOfficialBlueprint && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Bản vẽ phát hành thi công
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {doc.type} · Cập nhật ngày {doc.date} · Dung lượng {doc.fileSize}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(doc)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] transition-colors"
              title="Tải tệp về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải xuống</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Đóng cửa sổ xem"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 min-h-[500px]">
          {/* Main Visualizer Area (3 cols) */}
          <div className="lg:col-span-3 bg-slate-900 relative flex flex-col overflow-hidden select-none">
            {/* Viewport Toolbar */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-slate-800/90 backdrop-blur-xs p-1 rounded-lg border border-slate-700 text-white shadow-md">
              <button 
                onClick={handleZoomIn} 
                className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                title="Phóng to"
                aria-label="Phóng to bản vẽ"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={handleZoomOut} 
                className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                title="Thu nhỏ"
                aria-label="Thu nhỏ bản vẽ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button 
                onClick={handleResetZoom} 
                className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                title="Về tỉ lệ chuẩn (100%)"
                aria-label="Đặt lại kích thước chuẩn"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono px-2 text-slate-300 border-l border-slate-700">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Quick Layer Controls for Blueprint */}
            {isFloorPlan && (
              <div className="absolute top-3 right-3 z-20 flex flex-wrap gap-1 bg-slate-800/90 backdrop-blur-xs p-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 shadow-md max-w-xs">
                <span className="flex items-center gap-1 px-1.5 font-medium text-amber-400">
                  <Layers className="w-3 h-3" /> Lớp CAD:
                </span>
                <button
                  onClick={() => toggleLayer('architecture')}
                  className={`px-2 py-0.5 rounded transition-colors ${activeLayers.architecture ? 'bg-slate-600 text-white font-medium' : 'text-slate-400 line-through'}`}
                >
                  Kiến trúc
                </button>
                <button
                  onClick={() => toggleLayer('cableTray')}
                  className={`px-2 py-0.5 rounded transition-colors ${activeLayers.cableTray ? 'bg-amber-600/80 text-white font-medium' : 'text-slate-400 line-through'}`}
                >
                  Máng cáp
                </button>
                <button
                  onClick={() => toggleLayer('networkLan')}
                  className={`px-2 py-0.5 rounded transition-colors ${activeLayers.networkLan ? 'bg-blue-600/80 text-white font-medium' : 'text-slate-400 line-through'}`}
                >
                  Mạng LAN
                </button>
                <button
                  onClick={() => toggleLayer('dimensions')}
                  className={`px-2 py-0.5 rounded transition-colors ${activeLayers.dimensions ? 'bg-emerald-600/80 text-white font-medium' : 'text-slate-400 line-through'}`}
                >
                  Trục X-Y
                </button>
              </div>
            )}

            {/* Canvas / Visualizer Render Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[#0B132B]">
              <div 
                className="transition-transform duration-100 origin-center"
                style={{ transform: `scale(${zoom})` }}
              >
                {isFloorPlan ? (
                  /* Interactive CAD Blueprint Render */
                  <svg 
                    viewBox="0 0 1000 700" 
                    className="w-[880px] h-[610px] bg-[#0A1124] rounded-lg border border-slate-700 shadow-2xl"
                  >
                    {/* Grid Pattern */}
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#172548" strokeWidth="0.5"/>
                      </pattern>
                      <pattern id="subgrid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#131F3D" strokeWidth="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="1000" height="700" fill="#0A1124" />
                    <rect width="1000" height="700" fill="url(#subgrid)" />
                    <rect width="1000" height="700" fill="url(#grid)" />

                    {/* Dimensions & Axis X1..X10, Y1..Y10 */}
                    {activeLayers.dimensions && (
                      <g stroke="#3B82F6" strokeWidth="0.8" opacity="0.85">
                        {/* Top X Axis Labels */}
                        {['X1','X2','X3','X4','X5','X6','X7','X8','X9','X10'].map((label, idx) => {
                          const x = 120 + idx * 80;
                          return (
                            <g key={label}>
                              <circle cx={x} cy="45" r="12" fill="#0A1124" stroke="#60A5FA" strokeWidth="1" />
                              <text x={x} y="49" textAnchor="middle" fill="#93C5FD" fontSize="10" fontFamily="monospace">{label}</text>
                              <line x1={x} y1="60" x2={x} y2="640" stroke="#1E3A8A" strokeDasharray="3 3" strokeWidth="0.5" />
                            </g>
                          );
                        })}
                        {/* Left Y Axis Labels */}
                        {['Y1','Y2','Y3','Y4','Y5','Y6','Y7','Y8','Y9','Y10'].map((label, idx) => {
                          const y = 80 + idx * 56;
                          return (
                            <g key={label}>
                              <circle cx="55" cy={y} r="12" fill="#0A1124" stroke="#60A5FA" strokeWidth="1" />
                              <text x="55" y={y + 4} textAnchor="middle" fill="#93C5FD" fontSize="10" fontFamily="monospace">{label}</text>
                              <line x1="70" y1={y} x2="900" y2={y} stroke="#1E3A8A" strokeDasharray="3 3" strokeWidth="0.5" />
                            </g>
                          );
                        })}
                      </g>
                    )}

                    {/* Architecture Outline */}
                    {activeLayers.architecture && (
                      <g stroke="#94A3B8" strokeWidth="1.5" fill="none">
                        {/* Outer Perimeter Building Wall */}
                        <polygon points="120,80 840,80 840,600 120,600" stroke="#CBD5E1" strokeWidth="2.5" />
                        
                        {/* Inner Courtyard / Atrium */}
                        <polygon points="360,200 600,200 600,480 360,480" stroke="#64748B" strokeWidth="1.5" fill="#0E1A33" strokeDasharray="4 2" />
                        <text x="480" y="340" fill="#64748B" fontSize="12" textAnchor="middle" fontFamily="monospace">
                          GIẾNG TRỜI / ATRIUM THÔNG TẦNG
                        </text>

                        {/* Rooms Layout */}
                        {/* North Wing CBCS Offices */}
                        <rect x="140" y="95" width="200" height="90" stroke="#94A3B8" strokeWidth="1" fill="#132142" />
                        <text x="240" y="145" fill="#E2E8F0" fontSize="11" textAnchor="middle" fontWeight="bold">P. LÀM VIỆC CBCS (79m²)</text>

                        <rect x="620" y="95" width="200" height="90" stroke="#94A3B8" strokeWidth="1" fill="#132142" />
                        <text x="720" y="145" fill="#E2E8F0" fontSize="11" textAnchor="middle" fontWeight="bold">P. LÀM VIỆC CBCS (79m²)</text>

                        {/* West Wing */}
                        <rect x="140" y="210" width="180" height="120" stroke="#94A3B8" strokeWidth="1" fill="#132142" />
                        <text x="230" y="270" fill="#E2E8F0" fontSize="11" textAnchor="middle" fontWeight="bold">P. CBCS (125m²)</text>

                        <rect x="140" y="350" width="180" height="120" stroke="#94A3B8" strokeWidth="1" fill="#132142" />
                        <text x="230" y="410" fill="#E2E8F0" fontSize="11" textAnchor="middle" fontWeight="bold">KT ĐIỆN NHẸ / P1-P6</text>

                        {/* East Wing */}
                        <rect x="640" y="210" width="180" height="120" stroke="#94A3B8" strokeWidth="1" fill="#132142" />
                        <text x="730" y="270" fill="#E2E8F0" fontSize="11" textAnchor="middle" fontWeight="bold">P. CHUYÊN GIA / ĐỐI TÁC</text>

                        <rect x="640" y="350" width="180" height="120" stroke="#94A3B8" strokeWidth="1" fill="#132142" />
                        <text x="730" y="410" fill="#E2E8F0" fontSize="11" textAnchor="middle" fontWeight="bold">THANG MÁY TM PCCC &gt;650KG</text>

                        {/* South Wing */}
                        <rect x="140" y="495" width="320" height="90" stroke="#94A3B8" strokeWidth="1" fill="#132142" />
                        <text x="300" y="545" fill="#E2E8F0" fontSize="11" textAnchor="middle" fontWeight="bold">
                          {doc.floorLevel === 'Mặt Bằng Tầng 8' ? 'BẾP ĂN CBCS (236m²)' : 'P. LÀM VIỆC CBCS (91m²) + P. NGHỈ (35m²)'}
                        </text>

                        <rect x="500" y="495" width="320" height="90" stroke="#94A3B8" strokeWidth="1" fill="#132142" />
                        <text x="660" y="545" fill="#E2E8F0" fontSize="11" textAnchor="middle" fontWeight="bold">
                          {doc.floorLevel === 'Mặt Bằng Tầng 7' ? 'TT. TÁC CHIẾN ĐIỆN TỬ & PHÒNG HỌP' : 'KHU VỰC PHỐI HỢP KỸ THUẬT'}
                        </text>

                        {/* Columns / Cột bê tông X-Y */}
                        {[
                          [200, 140], [400, 140], [600, 140], [780, 140],
                          [200, 260], [780, 260],
                          [200, 420], [780, 420],
                          [200, 540], [400, 540], [600, 540], [780, 540]
                        ].map(([cx, cy], i) => (
                          <rect key={i} x={cx - 6} y={cy - 6} width="12" height="12" fill="#E2E8F0" stroke="#000" strokeWidth="0.5" />
                        ))}
                      </g>
                    )}

                    {/* Cable Tray Layer (Máng cáp 500x100) */}
                    {activeLayers.cableTray && (
                      <g stroke="#D97706" strokeWidth="4" strokeLinecap="square">
                        {/* Corridor Perimeter Máng Cáp */}
                        <line x1="335" y1="185" x2="625" y2="185" stroke="#D97706" strokeWidth="5" />
                        <line x1="625" y1="185" x2="625" y2="490" stroke="#D97706" strokeWidth="5" />
                        <line x1="625" y1="490" x2="335" y2="490" stroke="#D97706" strokeWidth="5" />
                        <line x1="335" y1="490" x2="335" y2="185" stroke="#D97706" strokeWidth="5" />
                        {/* Hatch marks for cable tray */}
                        <text x="480" y="180" fill="#FBBF24" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          MÁNG CÁP TRỤC CHÍNH 500x100 SƠN TĨNH ĐIỆN
                        </text>
                      </g>
                    )}

                    {/* Network LAN Outlets Layer */}
                    {activeLayers.networkLan && (
                      <g>
                        {[
                          [180, 120], [220, 120], [260, 120], [300, 120],
                          [660, 120], [700, 120], [740, 120], [780, 120],
                          [180, 240], [220, 240], [260, 240],
                          [180, 520], [220, 520], [260, 520], [300, 520], [340, 520],
                          [540, 520], [580, 520], [620, 520], [660, 520], [700, 520]
                        ].map(([x, y], i) => (
                          <g key={i} transform={`translate(${x}, ${y})`}>
                            <rect x="-6" y="-6" width="12" height="12" fill="#2563EB" rx="2" />
                            <circle cx="0" cy="0" r="2.5" fill="#FFFFFF" />
                          </g>
                        ))}
                        {/* Tủ mạng Rack TABĐ */}
                        <g transform="translate(325, 400)">
                          <rect x="-15" y="-20" width="30" height="40" fill="#1E40AF" stroke="#60A5FA" strokeWidth="1.5" />
                          <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">RACK</text>
                          <text x="0" y="32" textAnchor="middle" fill="#93C5FD" fontSize="8">TABĐ TẦNG</text>
                        </g>
                      </g>
                    )}

                    {/* Blueprint Title Block (Khung Tên Kỹ Thuật Tiêu Chuẩn) */}
                    <g transform="translate(620, 580)">
                      <rect x="0" y="0" width="220" height="65" fill="#0F172A" stroke="#475569" strokeWidth="1" />
                      <line x1="0" y1="22" x2="220" y2="22" stroke="#334155" strokeWidth="0.8" />
                      <line x1="120" y1="22" x2="120" y2="65" stroke="#334155" strokeWidth="0.8" />
                      
                      <text x="10" y="15" fill="#E2E8F0" fontSize="10" fontWeight="bold">
                        NMH DATA CENTER NETWORK
                      </text>
                      <text x="10" y="38" fill="#94A3B8" fontSize="8">BẢN VẼ SHOP DRAWING</text>
                      <text x="10" y="52" fill="#F8FAFC" fontSize="10" fontWeight="bold">{doc.floorLevel || doc.name}</text>
                      
                      <text x="130" y="36" fill="#94A3B8" fontSize="8">DIỆN TÍCH: <tspan fill="#F8FAFC">{doc.floorArea || '2.247 m²'}</tspan></text>
                      <text x="130" y="52" fill="#94A3B8" fontSize="8">CAO ĐỘ: <tspan fill="#F8FAFC">{doc.elevation || '+14.000'}</tspan></text>
                    </g>
                  </svg>
                ) : isExcel ? (
                  /* Excel Material Takeoff Table Preview */
                  <div className="bg-white rounded-lg p-5 shadow-xl text-slate-800 w-[840px] text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-sm text-slate-900">BẢNG BÓC TÁCH KHỐI LƯỢNG VẬT TƯ THI CÔNG - NHÀ A1</span>
                      </div>
                      <span className="font-mono text-slate-500">Đơn vị: VNĐ</span>
                    </div>

                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-700">
                          <th className="py-2 px-3 w-10">STT</th>
                          <th className="py-2 px-3">Hạng mục / Quy cách vật tư</th>
                          <th className="py-2 px-3 text-center">ĐVT</th>
                          <th className="py-2 px-3 text-right">Khối lượng</th>
                          <th className="py-2 px-3 text-right">Đơn giá</th>
                          <th className="py-2 px-3 text-right">Thành tiền (VNĐ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                        <tr className="bg-slate-50/70 font-sans font-bold text-slate-800">
                          <td colSpan={6} className="py-1.5 px-3">I. HỆ THỐNG MẠNG LAN &amp; CÁP QUANG TẦNG 4–9</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 text-center">1</td>
                          <td className="py-1.5 px-3 font-sans">Cáp mạng Cat 6 UTP 4-pair 23AWG LSZH chống cháy</td>
                          <td className="py-1.5 px-3 text-center">Mét</td>
                          <td className="py-1.5 px-3 text-right font-bold">97.135,0</td>
                          <td className="py-1.5 px-3 text-right">2.500</td>
                          <td className="py-1.5 px-3 text-right font-bold text-blue-900">242.837.500</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 text-center">2</td>
                          <td className="py-1.5 px-3 font-sans">Cáp quang Single mode 4 Core LSZH ngoài trời/trong nhà</td>
                          <td className="py-1.5 px-3 text-center">Mét</td>
                          <td className="py-1.5 px-3 text-right font-bold">3.390,0</td>
                          <td className="py-1.5 px-3 text-right">2.500</td>
                          <td className="py-1.5 px-3 text-right font-bold text-blue-900">8.475.000</td>
                        </tr>
                        <tr className="bg-slate-50/70 font-sans font-bold text-slate-800">
                          <td colSpan={6} className="py-1.5 px-3">II. HỆ THỐNG MÁNG CÁP &amp; ỐNG LUỒN DÂY</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 text-center">3</td>
                          <td className="py-1.5 px-3 font-sans">Máng cáp 500x100 bao gồm nắp, sơn tĩnh điện, dày 1.5mm</td>
                          <td className="py-1.5 px-3 text-center">Mét</td>
                          <td className="py-1.5 px-3 text-right font-bold">1.465,0</td>
                          <td className="py-1.5 px-3 text-right">50.000</td>
                          <td className="py-1.5 px-3 text-right font-bold text-blue-900">73.250.000</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 text-center">4</td>
                          <td className="py-1.5 px-3 font-sans">Máng cáp 200x100 bao gồm nắp, sơn tĩnh điện, dày 1.5mm</td>
                          <td className="py-1.5 px-3 text-center">Mét</td>
                          <td className="py-1.5 px-3 text-right font-bold">225,0</td>
                          <td className="py-1.5 px-3 text-right">50.000</td>
                          <td className="py-1.5 px-3 text-right font-bold text-blue-900">11.250.000</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 text-center">5</td>
                          <td className="py-1.5 px-3 font-sans">Ống luồn dây PVC D20 chống cháy đi âm tường</td>
                          <td className="py-1.5 px-3 text-center">Mét</td>
                          <td className="py-1.5 px-3 text-right font-bold">26.550,0</td>
                          <td className="py-1.5 px-3 text-right">12.000</td>
                          <td className="py-1.5 px-3 text-right font-bold text-blue-900">318.600.000</td>
                        </tr>
                        <tr className="bg-slate-50/70 font-sans font-bold text-slate-800">
                          <td colSpan={6} className="py-1.5 px-3">III. HỆ THỐNG ÂM THANH THÔNG BÁO (PA)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 text-center">6</td>
                          <td className="py-1.5 px-3 font-sans">Cáp tín hiệu âm thanh chống cháy 2Cx1.5mm²</td>
                          <td className="py-1.5 px-3 text-center">Mét</td>
                          <td className="py-1.5 px-3 text-right font-bold">7.050,0</td>
                          <td className="py-1.5 px-3 text-right">2.500</td>
                          <td className="py-1.5 px-3 text-right font-bold text-blue-900">17.625.000</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-400 font-bold bg-amber-50/60">
                          <td colSpan={5} className="py-2 px-3 text-right font-sans text-xs">TỔNG CỘNG VẬT TƯ TẠM TÍNH:</td>
                          <td className="py-2 px-3 text-right font-mono text-sm text-blue-950">672.037.500 VNĐ</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  /* Standard Document Preview (PDF / Report) */
                  <div className="bg-white rounded-lg p-6 shadow-xl text-slate-800 w-[640px] text-xs">
                    <div className="border-b-2 border-[#152A55] pb-3 mb-4 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-[#152A55]">CÔNG TY TNHH ĐẦU TƯ VÀ PHÁT TRIỂN NMH</div>
                        <div className="text-[11px] text-slate-500">Phòng Quản lý dự án &amp; Kỹ thuật điện nhẹ</div>
                      </div>
                      <FileText className="w-8 h-8 text-[#152A55]" />
                    </div>

                    <h4 className="text-center font-bold text-base text-slate-900 my-4 uppercase">
                      {(doc.name || doc.title || 'Hồ sơ tài liệu kỹ thuật').replace(/\.[^.]+$/, '')}
                    </h4>

                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2 mb-4 font-mono text-[11px]">
                      <div><strong>Mã tài liệu:</strong> {doc.id}</div>
                      <div><strong>Phiên bản hiệu lực:</strong> {doc.version || 'v1.0'}</div>
                      <div><strong>Ngày ban hành:</strong> {doc.date || '2026-10-12'}</div>
                      <div><strong>Người lập / Phụ trách:</strong> {doc.uploadedByStaffId || 'NMH-ENG'}</div>
                    </div>

                    <div className="space-y-2 text-slate-700 leading-relaxed font-sans text-xs">
                      {doc.blueprintDetails?.architecturalNotes.map((note, i) => (
                        <p key={i} className="flex items-start gap-2">
                          <span className="text-[#152A55] font-bold">·</span>
                          <span>{note}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Technical Specs & Metadata Sidebar (1 col) */}
          <div className="bg-white border-l border-slate-200 p-5 overflow-y-auto space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Info className="w-3.5 h-3.5" /> Thông số hồ sơ
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Định dạng</span>
                  <span className="font-mono font-semibold text-slate-800">{(doc.fileFormat || 'PDF').toUpperCase()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Phiên bản</span>
                  <span className="font-mono font-semibold text-amber-700">{doc.version}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Kích thước tệp</span>
                  <span className="font-mono text-slate-800">{doc.fileSize}</span>
                </div>
                {doc.floorArea && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Diện tích sàn</span>
                    <span className="font-mono font-semibold text-[#152A55]">{doc.floorArea}</span>
                  </div>
                )}
                {doc.elevation && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Cao độ</span>
                    <span className="font-mono font-semibold text-emerald-700">{doc.elevation}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Ngày lưu trữ</span>
                  <span className="text-slate-800">{doc.date}</span>
                </div>
              </div>
            </div>

            {/* Room / Functional Areas List */}
            {doc.blueprintDetails?.roomList && doc.blueprintDetails.roomList.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Compass className="w-3.5 h-3.5" /> Khu vực &amp; Phòng chức năng
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {doc.blueprintDetails.roomList.map((room, i) => (
                    <li key={i} className="flex items-center gap-2 py-1 px-2 rounded bg-slate-50 border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#152A55] shrink-0" />
                      <span className="truncate">{room}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Engineering Notes from Thesis PDF */}
            {doc.blueprintDetails?.architecturalNotes && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <FileCode className="w-3.5 h-3.5" /> Ghi chú thiết kế kỹ thuật
                </div>
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {doc.blueprintDetails.architecturalNotes.map((note, i) => (
                    <p key={i} className="leading-relaxed">
                      {note}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Download CTA */}
            <div className="pt-2">
              <button
                onClick={() => onDownload(doc)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#152A55] text-white hover:bg-[#1E3A75] text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                Tải tệp {(doc.fileFormat || 'PDF').toUpperCase()} ({doc.fileSize || 'Đính kèm'})
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                Bảo toàn lịch sử phiên bản và dấu vết cập nhật
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
