/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Calendar,
  Layers,
  MoreVertical,
  CheckCircle2,
  Info,
  Plus,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';

const formatVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + ' ₫';
};

const formatCompactVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value) + ' ₫';
};

interface FinanceViewProps {
  onShowNotification: (message: string) => void;
}

export default function FinanceView({ onShowNotification }: FinanceViewProps) {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: 'Payroll', amount: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExportCSV = async () => {
    onShowNotification('Đang xuất báo cáo tài chính...');
    try {
      const response = await api.get('/Reports/finance/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "finance_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      onShowNotification('Lỗi khi xuất báo cáo tài chính');
    }
  };

  const handleExportPDF = () => {
    onShowNotification('Đang tạo tài liệu PDF sẵn sàng kiểm toán... (Mở hộp thoại in)');
    window.print();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || isNaN(Number(expenseForm.amount.replace(/,/g, '')))) {
      onShowNotification('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/Finance/expenses', {
        category: expenseForm.category,
        amount: Number(expenseForm.amount.replace(/,/g, '')),
        description: expenseForm.description,
        date: new Date().toISOString()
      });
      onShowNotification('Thêm chi phí thành công');
      setIsAddExpenseModalOpen(false);
      setExpenseForm({ category: 'Payroll', amount: '', description: '' });
      fetchFinance();
    } catch (error) {
      console.error(error);
      onShowNotification('Lỗi khi thêm chi phí');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [donutSegments, setDonutSegments] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [metrics, setMetrics] = useState<any>(null);

  const fetchFinance = async () => {
    // Fetch expense categories
    try {
      const catRes = await api.get('/Finance/categories');
      const categories = catRes.data;

      let cumulativeOffset = 0;
      const totalValue = categories.reduce((sum: number, c: any) => sum + c.value, 0);
      setTotalExpenses(totalValue);

      const segments = categories.map((c: any) => {
        const strokeArray = `${(c.percentage / 100) * 502} 502`;
        const strokeOffset = `-${cumulativeOffset}`;
        cumulativeOffset += (c.percentage / 100) * 502;
        return {
          name: c.name,
          percentage: c.percentage,
          strokeDasharray: strokeArray,
          strokeDashoffset: strokeOffset,
          color: c.color
        };
      });
      setDonutSegments(segments);

      const mappedCategories = categories.map((c: any, index: number) => ({
        name: c.name,
        percentage: c.percentage,
        valueFormatted: formatVND(c.value),
        rawValue: c.value,
        bgClass: index === 0 ? 'bg-indigo-600' : index === 1 ? 'bg-[#c3c0ff]' : index === 2 ? 'bg-[#dae2fd]' : index === 3 ? 'bg-[#cbdbf5]' : 'bg-slate-400'
      }));
      setExpenseCategories(mappedCategories);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('User does not have permission to view expense categories');
      } else {
        console.error('Failed to fetch finance categories data', error);
      }
    }

    // Fetch monthly growth
    try {
      const growthRes = await api.get('/Finance/growth');
      const growthData = growthRes.data;
      setMonthlyGrowth(growthData);
    } catch (error: any) {
      console.error('Failed to fetch finance growth data', error);
    }

    // Fetch real KPIs
    try {
      const kpiRes = await api.get('/Dashboard/kpis');
      setMetrics(kpiRes.data);
    } catch (error: any) {
      console.error('Failed to fetch KPI metrics', error);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tài chính &amp; Báo cáo</h2>
          <p className="text-xs text-slate-500 mt-1">Tổng quan về hiệu suất tài chính và phân bổ chi phí.</p>
        </div>

        <div className="flex gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-xs hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            Thêm chi phí
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium text-xs hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={14} />
            Xuất CSV
          </button>

          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-xs hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <FileText size={14} />
            Xuất PDF
          </button>
        </div>
      </div>

      {/* Bento Grid: Categories Donut & Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Expense Categories Chart Box (Spans 2 columns on desktop) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-800">Hạng mục Chi phí</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Phân bổ chi phí hoạt động hiện tại.</p>
          </div>

          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 min-h-[250px] mt-4">

            {/* Real Recharts Donut Chart */}
            <div className="relative w-52 h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutSegments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="percentage"
                    stroke="none"
                    onMouseEnter={(_, index) => setActiveSegmentIndex(index)}
                    onMouseLeave={() => setActiveSegmentIndex(null)}
                  >
                    {donutSegments.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={activeSegmentIndex === null || activeSegmentIndex === index ? 1 : 0.4}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Central Text HUD */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {activeSegmentIndex !== null ? donutSegments[activeSegmentIndex].name : 'Tổng cộng'}
                </span>
                <span className="text-lg font-bold text-slate-800 mt-0.5">
                  {activeSegmentIndex !== null
                    ? `${donutSegments[activeSegmentIndex].percentage}%`
                    : formatCompactVND(totalExpenses)}
                </span>
              </div>
            </div>

            {/* List Legends */}
            <div className="flex flex-col gap-2.5 w-full md:w-auto md:min-w-[200px]">
              {expenseCategories.map((cat, i) => {
                const isFocused = activeSegmentIndex === i;
                const hasAnyFocus = activeSegmentIndex !== null;
                return (
                  <div
                    key={cat.name}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${isFocused
                        ? 'bg-slate-50 border-slate-200 shadow-sm scale-102'
                        : hasAnyFocus
                          ? 'border-transparent opacity-40'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    onMouseEnter={() => setActiveSegmentIndex(i)}
                    onMouseLeave={() => setActiveSegmentIndex(null)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full ${cat.bgClass}`} />
                      <span className="font-semibold text-xs text-slate-700">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block">{cat.percentage}%</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{cat.valueFormatted || cat.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Key Metrics Dashboard Segment */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-sm text-slate-800">Chỉ số Chính</h3>

          {/* Tổng Doanh Thu */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tổng Doanh Thu</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">{metrics ? formatVND(metrics.totalRevenue) : '0 đ'}</span>
              <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 flex items-center gap-0.5 ${metrics?.revenueGrowth >= 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-rose-700 bg-rose-50 border border-rose-100'}`}>
                {metrics?.revenueGrowth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {metrics ? Math.abs(metrics.revenueGrowth) : 0}%
              </span>
            </div>
          </div>

          {/* Tổng Giá Vốn (COGS) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tổng Giá Vốn (COGS)</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">{metrics ? formatVND(metrics.totalCogs) : '0 đ'}</span>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                <Layers size={10} /> Dữ liệu thực tế
              </span>
            </div>
          </div>

          {/* Lợi nhuận gộp */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Lợi Nhuận Gộp</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">{metrics ? formatVND(metrics.grossProfit) : '0 đ'}</span>
              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                <Percent size={10} />
                Biên LN: {metrics ? metrics.margin : 0}%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Monthly Growth Grid Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-semibold text-sm text-slate-800">Tăng trưởng Hàng tháng</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Doanh thu so với Chi phí (6 Tháng qua)</p>
          </div>
        </div>

        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyGrowth}
              margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompactVND}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                dx={-10}
              />
              <RechartsTooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px' }}
                formatter={(value: number, name: string) => [
                  formatVND(value),
                  name === 'revenue' ? 'Doanh thu' : 'Chi phí'
                ]}
                labelStyle={{ color: '#cbd5e1', marginBottom: '4px' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>{value === 'revenue' ? 'Doanh thu' : 'Chi phí'}</span>}
              />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[2, 2, 0, 0]} maxBarSize={40} />
              <Bar dataKey="expenses" fill="#c3c0ff" radius={[2, 2, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Add Expense Modal */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Thêm Chi Phí Mới</h3>
              <button 
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hạng mục</label>
                <select 
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                >
                  <option value="Payroll">Lương (Payroll)</option>
                  <option value="Marketing">Marketing</option>
                  <option value="R&D">Nghiên cứu & Phát triển (R&D)</option>
                  <option value="Khác (Others)">Khác (Văn phòng phẩm, sự kiện...)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Số tiền (VNĐ)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm">₫</span>
                  </div>
                  <input 
                    type="text" 
                    value={expenseForm.amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (!val) {
                        setExpenseForm({...expenseForm, amount: ''});
                        return;
                      }
                      const formatted = new Intl.NumberFormat('en-US').format(Number(val));
                      setExpenseForm({...expenseForm, amount: formatted});
                    }}
                    placeholder="Ví dụ: 5,000,000"
                    className="w-full text-sm pl-8 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mô tả chi tiết</label>
                <textarea 
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  placeholder="Ghi chú thêm về khoản chi..."
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[80px] resize-y"
                />
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Chi Phí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
