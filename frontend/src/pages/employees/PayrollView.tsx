import React, { useState } from 'react';
import { DollarSign, Play } from 'lucide-react';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';
import { usePayroll, useCalculatePayroll } from '../../hooks/useHr';

interface PayrollRecord {
  id: string;
  userId: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  status: string;
}

interface PayrollViewProps {
  onShowNotification: (message: string, type?: 'success' | 'info') => void;
}

export default function PayrollView({ onShowNotification }: PayrollViewProps) {
  const user = useAuthStore((state) => state.user);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const { data: recordsData, isLoading: loading } = usePayroll(month, year);
  const records = recordsData as PayrollRecord[] ?? [];
  const calculatePayrollMutation = useCalculatePayroll();

  const handleCalculatePayroll = async () => {
    if (!user) return;
    try {
      await calculatePayrollMutation.mutateAsync({ userId: user.id, month, year });
      onShowNotification(`Tính lương tháng ${month}/${year} thành công!`, 'success');
    } catch (error: any) {
      onShowNotification(error.response?.data?.message || 'Tính lương thất bại', 'info');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Bảng lương</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Quản lý lương thưởng nhân viên.</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Accountant') && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={handleCalculatePayroll}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all"
            >
              <Play size={16} />
              Chạy Tính lương
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[440px]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-200"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <input 
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID Nhân viên</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lương cơ bản</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thưởng</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Khấu trừ</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thực nhận</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200 text-xs font-normal">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500 font-medium">
                    Chưa có dữ liệu bảng lương tháng này.
                  </td>
                </tr>
              ) : (
                records.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-3.5 font-medium">{record.userId}</td>
                    <td className="px-6 py-3.5">{record.baseSalary.toLocaleString()} đ</td>
                    <td className="px-6 py-3.5 text-emerald-600">+{record.bonus.toLocaleString()} đ</td>
                    <td className="px-6 py-3.5 text-rose-600">-{record.deductions.toLocaleString()} đ</td>
                    <td className="px-6 py-3.5 font-semibold">{record.netPay.toLocaleString()} đ</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${record.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {record.status === 'Paid' ? 'Đã thanh toán' : 'Chờ xử lý'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
