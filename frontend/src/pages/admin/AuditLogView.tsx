import { useState, useEffect, useCallback, ComponentType } from 'react';
import {
  ScrollText,
  Filter,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock
} from 'lucide-react';
import api from '../../api';
import { SkeletonTable } from '../../components/common/SkeletonLoader';

const SEVERITY_CONFIG: Record<string, { label: string; color: string; icon: ComponentType<{ size?: number; className?: string }> }> = {
  High: { label: 'Cao', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
  Normal: { label: 'Bình thường', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Info },
  Low: { label: 'Thấp', color: 'text-slate-600 bg-slate-50 border-slate-200', icon: CheckCircle2 },
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  CREATE_USER: 'Tạo tài khoản',
  DEACTIVATE_USER: 'Vô hiệu hoá TK',
  DELETE_USER: 'Xóa tài khoản',
  CHANGE_PASSWORD: 'Đổi mật khẩu',
  CREATE_ORDER: 'Tạo đơn hàng',
  UPDATE_ORDER_STATUS: 'Cập nhật đơn',
  AdminOverrideStatus: 'Ghi đè trạng thái (Admin)',
  SEND_REPORT: 'Gửi báo cáo',
  UPDATE_STOCK: 'Điều chỉnh kho',
  BULK_IMPORT: 'Nhập hàng loạt',
  UPDATE_PERMISSIONS: 'Cập nhật phân quyền',
};

interface LogEntry {
  id: string;
  userId: string;
  userEmail?: string;
  userFullName?: string;
  actionType: string;
  tableName: string;
  oldValues?: string;
  newValues?: string;
  severityLevel: string;
  createdAt: string;
}

interface FilterState {
  actionType: string;
  severity: string;
  fromDate: string;
  toDate: string;
  search: string;
}

interface AuditLogViewProps {
  onShowNotification: (message: string) => void;
}

export default function AuditLogView({ onShowNotification }: AuditLogViewProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageSize = 20;

  const [filters, setFilters] = useState<FilterState>({
    actionType: '',
    severity: '',
    fromDate: '',
    toDate: '',
    search: '',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (filters.actionType) params.set('action', filters.actionType);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.fromDate) params.set('from', filters.fromDate);
      if (filters.toDate) params.set('to', filters.toDate);
      if (filters.search) params.set('search', filters.search);

      const res = await api.get(`/AuditLog?${params.toString()}`);
      setLogs(res.data.items || res.data);
      setTotalCount(res.data.totalCount || (res.data.items || res.data).length);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      onShowNotification('Tải nhật ký thất bại');
    } finally {
      setLoading(false);
    }
  }, [page, filters, onShowNotification]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/AuditLog/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AuditLog_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onShowNotification('Xuất CSV thành công!');
    } catch {
      onShowNotification('Xuất CSV thất bại');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch { return iso; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ScrollText size={20} className="text-amber-600" />
            Nhật ký Kiểm toán
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Toàn bộ lịch sử thao tác hệ thống — chỉ Admin có quyền xem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={13} />
            Làm mới
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              showFilters ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter size={13} />
            Bộ lọc
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            <Download size={13} />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <select
            value={filters.actionType}
            onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Tất cả hành động</option>
            {Object.keys(ACTION_LABELS).map((k) => (
              <option key={k} value={k}>{ACTION_LABELS[k]}</option>
            ))}
          </select>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Tất cả mức độ</option>
            <option value="High">Cao</option>
            <option value="Normal">Bình thường</option>
            <option value="Low">Thấp</option>
          </select>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Shield size={13} className="text-amber-600" />
        <span>Tổng <strong>{totalCount.toLocaleString('vi-VN')}</strong> bản ghi nhật ký</span>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[10px] w-40">Thời gian</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Người dùng</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Hành động</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Đối tượng</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[10px] w-28">Mức độ</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <ScrollText size={32} className="mx-auto mb-3 opacity-30" />
                      <p>Không có nhật ký nào</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const sev = SEVERITY_CONFIG[log.severityLevel] || SEVERITY_CONFIG['Normal'];
                    const SevIcon = sev.icon;
                    const isExpanded = expandedId === log.id;
                    return (
                      <>
                        <tr
                          key={log.id}
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock size={11} />
                              {formatDate(log.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{log.userFullName || '—'}</p>
                            <p className="text-slate-400 text-[10px]">{log.userEmail || log.userId}</p>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {ACTION_LABELS[log.actionType] || log.actionType}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{log.tableName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sev.color}`}>
                              <SevIcon size={10} />
                              {sev.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-[10px] max-w-[200px] truncate">
                            {log.newValues || log.oldValues || '—'}
                          </td>
                        </tr>
                        {isExpanded && (log.oldValues || log.newValues) && (
                          <tr key={`${log.id}-detail`} className="bg-slate-50">
                            <td colSpan={6} className="px-6 py-3">
                              <div className="grid grid-cols-2 gap-4">
                                {log.oldValues && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Trước</p>
                                    <pre className="text-[10px] text-slate-600 bg-white border border-slate-200 rounded-lg p-2 whitespace-pre-wrap break-all">{log.oldValues}</pre>
                                  </div>
                                )}
                                {log.newValues && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Sau</p>
                                    <pre className="text-[10px] text-slate-600 bg-white border border-slate-200 rounded-lg p-2 whitespace-pre-wrap break-all">{log.newValues}</pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Trang {page}/{totalPages} — {totalCount} bản ghi
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                        page === pageNum ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
