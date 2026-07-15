import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Search, Filter } from 'lucide-react';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  notes: string | null;
}

interface AttendanceViewProps {
  onShowNotification: (message: string, type?: 'success' | 'info') => void;
}

export default function AttendanceView({ onShowNotification }: AttendanceViewProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const user = useAuthStore((state) => state.user);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async (targetDate: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/Hr/attendance/daily?date=${targetDate}`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      onShowNotification('Lỗi khi tải dữ liệu chấm công', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      fetchAttendance(date);
    }
  }, [date, user]);

  const handleCheckIn = async () => {
    try {
      await api.post('/Hr/attendance/checkin', { userId: user?.id, notes: 'Check-in web' });
      onShowNotification('Check-in thành công!', 'success');
      if (user?.role === 'Admin' || user?.role === 'Manager') fetchAttendance(date);
    } catch (error: any) {
      onShowNotification(error.response?.data?.message || 'Check-in thất bại', 'info');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/Hr/attendance/checkout', { userId: user?.id, notes: 'Check-out web' });
      onShowNotification('Check-out thành công!', 'success');
      if (user?.role === 'Admin' || user?.role === 'Manager') fetchAttendance(date);
    } catch (error: any) {
      onShowNotification(error.response?.data?.message || 'Check-out thất bại', 'info');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Chấm công</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Quản lý lịch sử điểm danh và chấm công hàng ngày.</p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            onClick={handleCheckIn}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all"
          >
            <ClipboardCheck size={16} />
            Check-In
          </button>
          <button
            onClick={handleCheckOut}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all"
          >
            Check-Out
          </button>
        </div>
      </div>

      {(user?.role === 'Admin' || user?.role === 'Manager') && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[440px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">ID Nhân viên</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ngày</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Giờ Check-in</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Giờ Check-out</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200 text-xs font-normal">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400 dark:text-slate-500 font-medium">
                      Chưa có dữ liệu chấm công ngày này.
                    </td>
                  </tr>
                ) : (
                  records.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-3.5 font-medium">{record.userId}</td>
                      <td className="px-6 py-3.5">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3.5">{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                      <td className="px-6 py-3.5">{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
