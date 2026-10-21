import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Server, Shield, Layers, ExternalLink, X, Terminal, Check } from 'lucide-react';
import { DatabaseStatus, dbService } from '../services/db.ts';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DatabaseStatus | null;
  onRefreshStatus: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus
}) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedVar, setCopiedVar] = useState(false);

  if (!isOpen) return null;

  const handleInitDB = async () => {
    setIsInitializing(true);
    setInitResult(null);
    try {
      const res = await dbService.initPostgresDatabase();
      setInitResult(res);
      onRefreshStatus();
    } catch (err: any) {
      setInitResult({ success: false, message: err.message || 'Lỗi khi khởi tạo CSDL.' });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText('DATABASE_URL=postgres://USER:PASSWORD@HOST/DATABASE?sslmode=require');
    setCopiedVar(true);
    setTimeout(() => setCopiedVar(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0D1A36] to-[#152A55] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-amber-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Cơ Sở Dữ Liệu Thực Tế &amp; Cấu Hình Render</h2>
              <p className="text-xs text-slate-300">Hệ thống PostgreSQL RDBMS · Hoàn toàn không tạo database.json</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            status?.connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {status?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {status?.connected 
                    ? `Đã kết nối PostgreSQL (${status.databaseName || 'Render PostgreSQL'})` 
                    : 'Chế độ Preview / Sẵn sàng triển khai Render'}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  status?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {status?.mode || 'Preview Mode'}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {status?.connected
                  ? `Kết nối trực tiếp tới cơ sở dữ liệu thật PostgreSQL. Tất cả thao tác của nhiều người dùng trên các thiết bị khác nhau sẽ đồng bộ thời gian thực qua Render backend.`
                  : `Hiện tại ứng dụng đang nạp bộ dữ liệu thực tế từ hồ sơ khóa luận (Du_lieu_mau_NHM_test) và đã tích hợp sẵn backend Express + driver pg kết nối Render PostgreSQL.`}
              </p>
            </div>
          </div>

          {/* Key Facts / Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                <Server className="w-4 h-4 text-blue-600" />
                Backend Express + pg
              </div>
              <p className="text-[11px] text-slate-500">
                Đã xây dựng sẵn API server kết nối trực tiếp PostgreSQL với pooling và SSL.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                <Layers className="w-4 h-4 text-emerald-600" />
                22 Bảng &amp; 427 Records
              </div>
              <p className="text-[11px] text-slate-500">
                Toàn bộ dữ liệu nằm trong file <code className="text-blue-600 font-mono">nmh_postgres_full.sql</code>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                <Shield className="w-4 h-4 text-purple-600" />
                Không database.json
              </div>
              <p className="text-[11px] text-slate-500">
                Không dùng file json giả lập, đảm bảo chuẩn dữ liệu RDBMS doanh nghiệp.
              </p>
            </div>
          </div>

          {/* Render Deployment Steps */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#0D1A36]" />
              Hướng Dẫn 3 Bước Triển Khai Lên Render (Dữ Liệu Thật 100%)
            </h3>

            <ol className="text-xs text-slate-600 space-y-2.5 list-decimal list-inside pl-1">
              <li>
                <span className="font-semibold text-slate-800">Tạo PostgreSQL Database trên Render:</span> Vào <span className="font-mono text-blue-600">dashboard.render.com</span> &gt; Chọn <strong>New +</strong> &gt; Chọn <strong>PostgreSQL</strong> (miễn phí).
              </li>
              <li>
                <span className="font-semibold text-slate-800">Lấy chuỗi kết nối (Internal/External Database URL):</span> Copy giá trị <code className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[11px]">Internal Database URL</code> (hoặc External).
              </li>
              <li>
                <span className="font-semibold text-slate-800">Tạo Web Service và gán biến môi trường:</span>
                <div className="mt-1.5 pl-4 border-l-2 border-blue-400 space-y-1">
                  <div>• Build Command: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">npm run build</code></div>
                  <div>• Start Command: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">npm start</code></div>
                  <div className="flex items-center gap-2 mt-1">
                    <span>• Environment Variable:</span>
                    <button
                      type="button"
                      onClick={handleCopyEnv}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-300 rounded text-blue-700 hover:bg-blue-50 text-[10px] font-mono cursor-pointer"
                    >
                      {copiedVar ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                      DATABASE_URL
                    </button>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          {/* 1-Click Init DB Trigger */}
          {status?.hasDatabaseUrl && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-900">Khởi tạo 22 Bảng &amp; Dữ liệu Mẫu lên PostgreSQL</h4>
                  <p className="text-[11px] text-blue-700">Tự động chạy file nmh_postgres_full.sql nạp 427 bản ghi vào database Render</p>
                </div>
                <button
                  type="button"
                  disabled={isInitializing}
                  onClick={handleInitDB}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isInitializing ? 'animate-spin' : ''}`} />
                  {isInitializing ? 'Đang nạp...' : 'Nạp CSDL Mẫu'}
                </button>
              </div>

              {initResult && (
                <div className={`p-2.5 rounded-lg text-xs font-medium ${
                  initResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {initResult.message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            NMH Data Center Network · PostgreSQL 16+ Production Ready
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0D1A36] text-white font-medium text-xs hover:bg-[#152A55] transition-colors cursor-pointer shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
