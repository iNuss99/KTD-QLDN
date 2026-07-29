import { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../api';

const formatVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + ' ₫';
};

interface StaffSalesReportViewProps {
  onShowNotification: (message: string) => void;
}

export default function StaffSalesReportView({ onShowNotification }: StaffSalesReportViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('day');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/Reports/staff-sales?period=${period}`);
        setData(response.data);
      } catch (error) {
        console.error('Lỗi khi tải báo cáo cá nhân', error);
        onShowNotification('Lỗi khi tải báo cáo cá nhân');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [period]);

  const handleSubmitReport = async () => {
    setSubmitting(true);
    try {
      await api.post('/Reports/staff-sales/submit', {
        period,
        note: `Báo cáo cuối ca - ${new Date().toLocaleString('vi-VN')}`
      });
      onShowNotification('Báo cáo doanh thu đã được gửi thành công!');
    } catch (error) {
      console.error('Lỗi khi gửi báo cáo', error);
      onShowNotification('Lỗi khi gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Đang tải báo cáo...</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-64 text-rose-500">Không có dữ liệu</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Báo cáo cá nhân</h2>
          <p className="text-xs text-slate-500 mt-1">Tổng quan về hiệu suất bán hàng và xử lý đơn hàng của bạn.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="text-sm border-slate-200 rounded-md focus:border-amber-500 focus:ring-amber-500 shadow-sm px-3 py-2 border bg-white"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="day">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
          </select>
          
          <button 
            onClick={handleSubmitReport}
            disabled={submitting}
            className={`px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md shadow-sm hover:bg-amber-700 transition-colors flex items-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Đang gửi...' : 'Gửi báo cáo doanh thu'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tổng Đơn hàng</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{data.totalOrders}</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tổng Doanh thu</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{formatVND(data.totalRevenue)}</p>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Hoàn thành</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{data.completedOrders}</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Đang chờ xử lý</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{data.pendingOrders}</p>
          </div>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Đã hủy</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{data.cancelledOrders}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-sm text-slate-800 mb-4">Đơn hàng gần đây do bạn tạo</h3>
        
        {data.recentOrders && data.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 font-semibold">Mã đơn</th>
                  <th className="py-3 px-4 font-semibold">Khách hàng</th>
                  <th className="py-3 px-4 font-semibold">Thành tiền</th>
                  <th className="py-3 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {data.recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{order.orderCode}</td>
                    <td className="py-3 px-4 text-slate-600">{order.customerName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{formatVND(order.totalAmount)}</td>
                    <td className="py-3 px-4">
                      {order.orderStatus === 'Delivered' || order.orderStatus === 'Completed' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 w-max">
                          <CheckCircle2 size={10} />
                          Hoàn thành
                        </span>
                      ) : order.orderStatus === 'Cancelled' ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 w-max">
                          <AlertCircle size={10} />
                          Đã hủy
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 w-max">
                          <Clock size={10} />
                          Đang xử lý
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-sm text-slate-500 py-6">
            Bạn chưa có đơn hàng nào gần đây.
          </div>
        )}
      </div>
    </div>
  );
}
