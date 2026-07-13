/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuthStore } from '../store/authStore';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Calendar,
  Download,
  Filter,
  MoreVertical,
  Activity as ActivityIcon,
  Package,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity } from '../types';

interface DashboardViewProps {
  onNavigateToTab: (tab: string) => void;
  activities: Activity[];
  onShowNotification: (message: string) => void;
  searchTerm: string;
}

export default function DashboardView({
  onNavigateToTab,
  activities,
  onShowNotification,
  searchTerm
}: DashboardViewProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartInterval, setChartInterval] = useState<'weekly' | 'monthly'>('monthly');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const canViewFinancials = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Accountant';

  const [kpis, setKpis] = useState<any>({
    totalRevenue: 0,
    totalCogs: 0,
    grossProfit: 0,
    margin: 0,
    revenueChange: 0
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [marginData, setMarginData] = useState<any[]>([]);
  const [marginPage, setMarginPage] = useState(1);
  const [marginTotalPages, setMarginTotalPages] = useState(1);
  const marginPageSize = 5;

  const fetchData = useCallback(async () => {
    try {
      const kpiRes = await api.get('/Dashboard/kpis');
      setKpis(kpiRes.data);

      const revRes = await api.get('/Dashboard/revenue-chart');
      const revArray = revRes.data.map((r: any) => ({
        label: r.label.replace('Jan','T1').replace('Feb','T2').replace('Mar','T3').replace('Apr','T4').replace('May','T5').replace('Jun','T6').replace('Jul','T7').replace('Aug','T8').replace('Sep','T9').replace('Oct','T10').replace('Nov','T11').replace('Dec','T12'),
        amount: r.amount,
        cost: r.cost
      }));
      setRevenueData(revArray);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    }
  }, []);

  const fetchMarginData = useCallback(async () => {
    if (!canViewFinancials) return;
    try {
      const res = await api.get(`/Dashboard/margin-details?page=${marginPage}&pageSize=${marginPageSize}`);
      setMarginData(res.data.items);
      setMarginTotalPages(Math.ceil(res.data.totalCount / marginPageSize));
    } catch (error) {
      console.error('Failed to fetch margin details', error);
    }
  }, [marginPage, canViewFinancials]);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
  };

  const formatCompactVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value) + ' ₫';
  };

  useEffect(() => {
    fetchData();
    fetchMarginData();

    if (token) {
        const intervalId = setInterval(() => {
            fetchData();
        }, 30000);

        return () => clearInterval(intervalId);
    }
  }, [token, fetchData, fetchMarginData]);

  const filteredActivities = activities.filter(act => 
    act.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    act.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayRevenueData = revenueData;

  const handleDownloadReport = () => {
    onShowNotification('Đang chuẩn bị báo cáo tài chính...');
    const BOM = "\uFEFF";
    const csvContent = BOM + "Mã đơn hàng,Khách hàng,Ngày tạo,Doanh thu,Giá vốn,Lợi nhuận,Margin (%)\n"
      + marginData.map(e => `${e.orderCode},${e.customerName},${new Date(e.createdAt).toLocaleDateString('vi-VN')},${e.revenue},${e.cost},${e.profit},${e.margin}%`).join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "bang_margin.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderActivityBadge = (act: Activity) => {
    if (!act.badgeText) return null;
    let style = "bg-slate-100 text-slate-700 border-slate-200";
    if (act.type === 'success') {
      style = "bg-green-50 text-green-700 border-green-200";
    } else if (act.type === 'warning') {
      style = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (act.type === 'critical') {
      style = "bg-rose-50 text-rose-700 border-rose-200";
    }

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${style} ml-auto shrink-0`}>
        {act.badgeText}
      </span>
    );
  };

  const renderActivityIcon = (act: Activity) => {
    switch (act.type) {
      case 'success':
        return (
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 border border-green-100 text-green-700">
            <CheckCircle2 size={16} />
          </div>
        );
      case 'warning':
      case 'critical':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100 text-rose-700">
            <AlertTriangle size={16} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-600">
            <ActivityIcon size={16} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and top-level filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Tổng quan</h2>
          <p className="text-xs text-slate-500 mt-1">Hệ thống Vận hành TMĐT (E-commerce Operations)</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-200 font-medium text-xs rounded-lg shadow-sm bg-white text-slate-700 hover:bg-slate-50 focus:outline-none"
          >
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
          </select>
          
          <button
            onClick={handleDownloadReport}
            disabled={!canViewFinancials || marginData.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-indigo-600 text-white font-medium text-xs rounded-lg shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500">Tổng doanh thu</p>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{formatVND(kpis.totalRevenue)}</h3>
            <p className="text-[11px] text-green-700 font-medium flex items-center gap-1 mt-1">
              <TrendingUp size={12} />
              {kpis.revenueChange}% so với tháng trước
            </p>
          </div>
        </div>

        {/* Total COGS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500">Tổng giá vốn (COGS)</p>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors">
              <Package size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {canViewFinancials ? formatVND(kpis.totalCogs) : '***'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
              Dữ liệu theo giá nhập
            </p>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500">Lợi nhuận gộp</p>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <ActivityIcon size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {canViewFinancials ? formatVND(kpis.grossProfit) : '***'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
              Sau khi trừ giá vốn
            </p>
          </div>
        </div>

        {/* Margin % */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-slate-500">Biên lợi nhuận</p>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg group-hover:bg-amber-100">
              <PieChart size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {canViewFinancials ? `${kpis.margin}%` : '***'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
              Tỷ suất sinh lời
            </p>
          </div>
        </div>
      </div>

      {/* Main Analytics: Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart Component */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col h-[380px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-800">Doanh thu & Chi phí</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">So sánh theo từng tháng (7 tháng gần nhất)</p>
            </div>
            
            <div className="flex items-center gap-2">
              <select 
                value={chartInterval}
                onChange={(e) => setChartInterval(e.target.value as 'weekly' | 'monthly')}
                className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-600 focus:outline-none"
              >
                <option value="monthly">Hàng tháng</option>
                <option value="weekly">Hàng tuần</option>
              </select>
            </div>
          </div>

          <div className="flex-1 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayRevenueData}
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={formatCompactVND} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [canViewFinancials || name === 'Doanh thu' ? formatVND(value) : '***', name]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="amount" name="Doanh thu" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="cost" name="Chi phí" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} hide={!canViewFinancials} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-[380px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-800">Hoạt động gần đây</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Các hành động hệ thống theo thời gian thực</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
            {filteredActivities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <ActivityIcon size={32} className="opacity-20 animate-pulse mb-2 text-slate-600" />
                <p className="text-xs">Không có hoạt động nào</p>
              </div>
            ) : (
              filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0 group"
                >
                  {renderActivityIcon(act)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 truncate">{act.title}</p>
                      {renderActivityBadge(act)}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{act.description}</p>
                    <span className="text-[10px] text-slate-400 block mt-1 font-medium">{act.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Margin Details Table */}
      {canViewFinancials && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-semibold text-sm text-slate-800">Bảng margin theo đơn hàng</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Chi tiết doanh thu và lợi nhuận cho từng giao dịch</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Mã Đơn</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Khách Hàng</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Doanh Thu</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Giá Vốn</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Lợi Nhuận</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-xs font-medium">
                {marginData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">Không có dữ liệu đơn hàng.</td>
                  </tr>
                ) : (
                  marginData.map((order, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 text-indigo-600 font-semibold">{order.orderCode}</td>
                      <td className="px-6 py-3">{order.customerName}</td>
                      <td className="px-6 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-900">{formatVND(order.revenue)}</td>
                      <td className="px-6 py-3 text-right text-rose-600">{formatVND(order.cost)}</td>
                      <td className="px-6 py-3 text-right text-emerald-600 font-bold">{formatVND(order.profit)}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${order.margin >= 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {order.margin}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {marginTotalPages > 1 && (
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Trang {marginPage} / {marginTotalPages}
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setMarginPage(p => Math.max(1, p - 1))}
                  disabled={marginPage === 1}
                  className="p-1 bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setMarginPage(p => Math.min(marginTotalPages, p + 1))}
                  disabled={marginPage === marginTotalPages}
                  className="p-1 bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
