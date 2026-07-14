/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface NewReportModalProps {
  onClose: () => void;
  onShowNotification: (message: string) => void;
}

export default function NewReportModal({ onClose, onShowNotification }: NewReportModalProps) {
  const [reportType, setReportType] = useState('financial');
  const [quarter, setQuarter] = useState('Q3-2026');
  const [format, setFormat] = useState('pdf');
  const [includeAI, setIncludeAI] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setProgress(15);

    // Simulated progress compiler
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            onShowNotification(`Thành công: Báo cáo ${reportType.toUpperCase()} cho ${quarter} đã được tạo và gửi.`);
            onClose();
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-200">
          
          {/* Header */}
          <div className="bg-white px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <FileText className="text-amber-600" size={16} />
              Tạo Báo cáo Kiểm toán Tùy chỉnh
            </h3>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          {isGenerating ? (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <Loader2 className="animate-spin text-amber-600 mb-4" size={42} />
              <h4 className="text-xs font-bold text-slate-800">Đang tổng hợp Tài sản Doanh nghiệp...</h4>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[250px]">
                Đang tập hợp hồ sơ sổ cái, nhật ký ca làm việc và ma trận quyền mã hóa đang hoạt động.
              </p>
              
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-6 max-w-xs overflow-hidden">
                <div 
                  className="bg-amber-600 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-amber-600 mt-2">{progress}%</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                
                {/* Report Class */}
                <div>
                  <label htmlFor="report-type" className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Loại Báo cáo / Phân loại
                  </label>
                  <select
                    id="report-type"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-slate-50"
                  >
                    <option value="financial">Sổ cái Doanh thu &amp; Chi phí Tài chính Quý 3</option>
                    <option value="employees">Quản lý Nhân viên &amp; Hồ sơ Ca làm việc</option>
                    <option value="permissions">Vai trò Bảo mật &amp; Ma trận Quyền Mã hóa</option>
                  </select>
                </div>

                {/* Audit Period */}
                <div>
                  <label htmlFor="report-quarter" className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Kỳ Kiểm toán
                  </label>
                  <select
                    id="report-quarter"
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-slate-50"
                  >
                    <option value="Q3-2026">Quý 3 2026 (Kỳ Hiện tại)</option>
                    <option value="Q2-2026">Quý 2 2026 (Sổ cái Lịch sử)</option>
                    <option value="Q1-2026">Quý 1 2026 (Khởi đầu Năm)</option>
                  </select>
                </div>

                {/* Grid format and AI switch */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="report-format" className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Định dạng
                    </label>
                    <select
                      id="report-format"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-800 bg-slate-50"
                    >
                      <option value="pdf">Adobe PDF (.pdf)</option>
                      <option value="csv">Bảng tính Excel (.csv)</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded-lg select-none hover:bg-slate-100 transition-colors h-9">
                      <input
                        type="checkbox"
                        checked={includeAI}
                        onChange={(e) => setIncludeAI(e.target.checked)}
                        className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 focus:ring-1 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5">
                        <Sparkles size={11} className="text-amber-500" />
                        Tóm tắt AI
                      </span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex flex-row-reverse gap-2 rounded-b-xl">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                >
                  Biên dịch &amp; Gửi đi
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
