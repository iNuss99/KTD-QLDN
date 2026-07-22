import React, { useState } from 'react';
import {
  PackageOpen, Filter, Search, Plus, Download, X,
  Trash2, ShoppingCart, CheckSquare, Square, CalendarDays,
  RefreshCw, ChevronLeft, ChevronRight, LayersIcon
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import ConfirmModal from '../../components/common/ConfirmModal';
import { SkeletonTable } from '../../components/common/SkeletonLoader';
import { useOrders, useCreateOrder, useUpdateOrderStatus, useDeleteOrder, useBulkUpdateOrderStatus } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';

interface Product {
  id: string;
  sku: string;
  productName: string;
  sellingPrice: number;
}

interface OrderDetail {
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
  orderDetails?: OrderDetail[];
}

interface FilterState {
  status: string;
  fromDate: string;
  toDate: string;
  createdBy: string;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'Pending', label: 'Mới tạo' },
  { value: 'Confirmed', label: 'Xác nhận' },
  { value: 'Shipped', label: 'Đang giao' },
  { value: 'Delivered', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

export default function OrdersView({ onShowNotification, searchTerm }: {
  onShowNotification: (msg: string, type?: 'success' | 'info' | 'error') => void;
  searchTerm: string;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ status: 'ALL', fromDate: '', toDate: '', createdBy: '' });

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('Confirmed');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modals — new order
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  const [selectedProducts, setSelectedProducts] = useState<OrderDetail[]>([]);

  // Modals — view / update / delete
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; code: string }>({ open: false, id: '', code: '' });

  const user = useAuthStore((state) => state.user);
  const canUpdateStatus = user && ['Admin', 'Manager', 'Sales Staff'].includes(user.role);
  const canCreateOrder = user && ['Admin', 'Manager', 'Sales Staff'].includes(user.role);
  const canDeleteOrder = user && ['Admin', 'Manager'].includes(user.role);
  const canBulkUpdate = user && ['Admin', 'Manager'].includes(user.role);
  const isFinancialMasked = user && ['Warehouse Staff'].includes(user.role);

  const ordersParams = { page, pageSize, status: filters.status, search: searchTerm, fromDate: filters.fromDate, toDate: filters.toDate, createdBy: filters.createdBy };
  const { data: ordersData, isLoading: loading } = useOrders(ordersParams);
  const orders = ordersData?.items ?? [];
  const totalCount = ordersData?.totalCount ?? 0;
  const { data: productsData = [] } = useProducts();
  const products = productsData as Product[];

  const createOrderMutation = useCreateOrder();
  const updateStatusMutation = useUpdateOrderStatus();
  const deleteOrderMutation = useDeleteOrder();
  const bulkUpdateMutation = useBulkUpdateOrderStatus();

  // ── Bulk select helpers ──────────────────────────────────
  const allSelected = orders.length > 0 && orders.every(o => selectedIds.has(o.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(orders.map(o => o.id)));
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await bulkUpdateMutation.mutateAsync({
        orderIds: Array.from(selectedIds),
        newStatus: bulkStatus,
        reason: bulkReason || undefined,
      });
      onShowNotification((res as any)?.message || 'Cập nhật hàng loạt thành công!', 'success');
      setSelectedIds(new Set());
      setShowBulkModal(false);
      setBulkReason('');
    } catch (err: any) {
      onShowNotification(err.response?.data?.message || 'Cập nhật hàng loạt thất bại', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // ── CRUD ────────────────────────────────────────────────
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || selectedProducts.length === 0) {
      onShowNotification('Vui lòng nhập tên khách hàng và chọn ít nhất 1 sản phẩm', 'info');
      return;
    }
    const calculatedTotal = selectedProducts.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    try {
      const payload = {
        orderCode: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        customerName: newCustomerName,
        totalAmount: calculatedTotal,
        orderStatus: 'Pending',
        orderDetails: selectedProducts.map(p => ({ productId: p.productId, quantity: p.quantity, unitPrice: p.unitPrice })),
      };
      await createOrderMutation.mutateAsync(payload as any);
      onShowNotification('Tạo đơn hàng thành công!', 'success');
      setShowNewOrderModal(false);
      setNewCustomerName('');
      setSelectedProducts([]);
    } catch (error) {
      onShowNotification('Tạo đơn hàng thất bại. Vui lòng kiểm tra quyền.', 'error');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToUpdate || !newStatus) return;
    try {
      await updateStatusMutation.mutateAsync({ orderId: orderToUpdate.id, payload: { status: newStatus, reason: updateReason } });
      onShowNotification('Cập nhật trạng thái thành công!', 'success');
      setShowUpdateStatusModal(false);
      setOrderToUpdate(null);
      setNewStatus('');
      setUpdateReason('');
    } catch (error: any) {
      onShowNotification(error.response?.data?.message || 'Cập nhật thất bại', 'error');
    }
  };

  const handleDeleteOrder = async () => {
    try {
      await deleteOrderMutation.mutateAsync(confirmDelete.id);
      onShowNotification('Xóa đơn hàng thành công!', 'success');
      setConfirmDelete({ open: false, id: '', code: '' });
    } catch (error) {
      onShowNotification('Xóa đơn hàng thất bại. Vui lòng kiểm tra quyền.', 'error');
    }
  };

  const handleAddProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = selectedProducts.find(p => p.productId === productId);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => p.productId === productId ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      setSelectedProducts([...selectedProducts, { productId: product.id, product, quantity: 1, unitPrice: product.sellingPrice }]);
    }
  };

  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const csv = BOM + 'Mã Đơn Hàng,Khách Hàng,Ngày,Tổng Tiền,Trạng Thái\n'
      + orders.map(o => `${o.orderCode},${o.customerName},${new Date(o.createdAt).toLocaleDateString()},${o.totalAmount},${o.orderStatus}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'don_hang.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowNotification('Xuất CSV thành công!', 'success');
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      delivered: 'px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold uppercase',
      shipped:   'px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase',
      confirmed: 'px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold uppercase',
      pending:   'px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase',
      cancelled: 'px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold uppercase',
    };
    const STATUS_VI: Record<string, string> = { delivered:'Hoàn thành', shipped:'Đang giao', confirmed:'Xác nhận', pending:'Mới tạo', cancelled:'Đã hủy' };
    const cls = map[status.toLowerCase()] || 'px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold uppercase';
    return <span className={cls}>{STATUS_VI[status.toLowerCase()] || status}</span>;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Đơn hàng</h2>
            <p className="text-xs text-slate-500 mt-0.5">Quản lý đơn hàng, cập nhật trạng thái và theo dõi thực hiện.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canBulkUpdate && selectedIds.size > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <LayersIcon size={14} />
                Cập nhật {selectedIds.size} đơn
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                showFilters ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter size={13} />
              Bộ lọc
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">
              <Download size={13} />
              Xuất CSV
            </button>
            {canCreateOrder && (
              <button
                onClick={() => { setSelectedProducts([]); setNewCustomerName(''); setShowNewOrderModal(true); }}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <Plus size={14} />
                Đơn hàng mới
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={filters.status}
              onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="relative">
              <CalendarDays size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={filters.fromDate}
                onChange={e => { setFilters(f => ({ ...f, fromDate: e.target.value })); setPage(1); }}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Từ ngày"
              />
            </div>
            <div className="relative">
              <CalendarDays size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={filters.toDate}
                onChange={e => { setFilters(f => ({ ...f, toDate: e.target.value })); setPage(1); }}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Đến ngày"
              />
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.createdBy}
                onChange={e => { setFilters(f => ({ ...f, createdBy: e.target.value })); setPage(1); }}
                placeholder="Người tạo..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    {canBulkUpdate && (
                      <th className="px-4 py-3 w-10">
                        <button onClick={toggleAll} className="text-slate-400 hover:text-amber-600 transition-colors">
                          {allSelected ? <CheckSquare size={15} className="text-amber-600" /> : <Square size={15} />}
                        </button>
                      </th>
                    )}
                    <th className="px-4 py-3 text-left">Mã đơn hàng</th>
                    <th className="px-4 py-3 text-left">Khách hàng</th>
                    <th className="px-4 py-3 text-left">Ngày tạo</th>
                    <th className="px-4 py-3 text-right">Tổng tiền</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={canBulkUpdate ? 7 : 6} className="text-center py-12 text-slate-400">
                        <PackageOpen size={32} className="mx-auto mb-2 opacity-30" />
                        <p>Không có đơn hàng nào</p>
                      </td>
                    </tr>
                  ) : orders.map(order => (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/60 transition-colors ${selectedIds.has(order.id) ? 'bg-amber-50/40' : ''}`}
                    >
                      {canBulkUpdate && (
                        <td className="px-4 py-2.5">
                          <button onClick={() => toggleOne(order.id)} className="text-slate-400 hover:text-amber-600 transition-colors">
                            {selectedIds.has(order.id) ? <CheckSquare size={15} className="text-amber-600" /> : <Square size={15} />}
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{order.orderCode}</td>
                      <td className="px-4 py-2.5">{order.customerName}</td>
                      <td className="px-4 py-2.5 text-slate-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {isFinancialMasked ? '***' : `${order.totalAmount.toLocaleString('vi-VN')} ₫`}
                      </td>
                      <td className="px-4 py-2.5 text-center">{getStatusBadge(order.orderStatus)}</td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button onClick={() => setSelectedOrder(order)} className="text-amber-600 hover:text-amber-800 text-[10px] font-semibold px-2 py-1 rounded hover:bg-amber-50 transition-colors">Xem</button>
                        {canUpdateStatus && (
                          <button onClick={() => { setOrderToUpdate(order); setNewStatus(order.orderStatus); setShowUpdateStatusModal(true); }} className="ml-1 text-emerald-600 hover:text-emerald-800 text-[10px] font-semibold px-2 py-1 rounded hover:bg-emerald-50 transition-colors">Cập nhật</button>
                        )}
                        {canDeleteOrder && (
                          <button onClick={() => setConfirmDelete({ open: true, id: order.id, code: order.orderCode })} className="ml-1 text-red-500 hover:text-red-700 text-[10px] font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors">Xóa</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Trang {page}/{totalPages} — {totalCount} đơn hàng</span>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 text-slate-500 disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft size={15} /></button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pn = page <= 3 ? i + 1 : page - 2 + i;
                    if (pn < 1 || pn > totalPages) return null;
                    return (
                      <button key={pn} onClick={() => setPage(pn)} className={`w-7 h-7 rounded-lg font-medium transition-colors ${page === pn ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{pn}</button>
                    );
                  })}
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 text-slate-500 disabled:opacity-30 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight size={15} /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bulk Status Update Modal ───────────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowBulkModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                <LayersIcon size={16} className="text-blue-600" />
                Cập nhật {selectedIds.size} đơn hàng
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Trạng thái mới</label>
                <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500">
                  {STATUS_OPTIONS.filter(s => s.value !== 'ALL').map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Lý do (tùy chọn)</label>
                <textarea value={bulkReason} onChange={e => setBulkReason(e.target.value)} rows={2} placeholder="Nhập lý do thay đổi hàng loạt..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
              <button onClick={handleBulkUpdate} disabled={bulkLoading} className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                {bulkLoading ? 'Đang xử lý...' : `Áp dụng cho ${selectedIds.size} đơn`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Order Modal ───────────────────────────────── */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm"><ShoppingCart size={17} className="text-amber-600" />Tạo Đơn Hàng Mới</h3>
              <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-5 flex-1 space-y-5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tên Khách hàng</label>
                <input type="text" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Ví dụ: Nguyễn Văn A" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" required />
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Thêm Sản Phẩm</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500" onChange={e => { handleAddProduct(e.target.value); (e.target as HTMLSelectElement).value = ''; }} defaultValue="">
                  <option value="" disabled>-- Chọn sản phẩm --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.productName} — {p.sellingPrice.toLocaleString('vi-VN')} ₫</option>)}
                </select>
                {selectedProducts.length > 0 && (
                  <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">Sản phẩm</th>
                          <th className="px-3 py-2 w-20 text-center">SL</th>
                          <th className="px-3 py-2 text-right">Đơn giá</th>
                          <th className="px-3 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedProducts.map(item => (
                          <tr key={item.productId}>
                            <td className="px-3 py-2">{item.product?.productName}</td>
                            <td className="px-3 py-2 text-center">
                              <input type="number" min="1" value={item.quantity} onChange={e => { const v = parseInt(e.target.value); setSelectedProducts(prev => prev.map(p => p.productId === item.productId ? { ...p, quantity: isNaN(v) ? 1 : Math.max(1, v) } : p)); }} className="w-14 px-1 py-1 text-center border border-slate-200 rounded text-xs" />
                            </td>
                            <td className="px-3 py-2 text-right">{item.unitPrice.toLocaleString('vi-VN')} ₫</td>
                            <td className="px-3 py-2 text-center">
                              <button type="button" onClick={() => setSelectedProducts(prev => prev.filter(p => p.productId !== item.productId))} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"><Trash2 size={13} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 bg-slate-50 text-right text-xs font-semibold text-slate-800 border-t border-slate-200">
                      Tổng: <span className="text-amber-600 text-sm ml-1">{selectedProducts.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-100 bg-white">
              <button type="button" onClick={() => setShowNewOrderModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">Hủy</button>
              <button onClick={handleCreateOrder} disabled={selectedProducts.length === 0 || !newCustomerName} className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-sm">Tạo Đơn Hàng</button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Order Modal ──────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2"><PackageOpen size={17} className="text-amber-600" />Chi tiết: <span className="text-amber-700">{selectedOrder.orderCode}</span></h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                {[['Khách hàng', selectedOrder.customerName], ['Ngày tạo', new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')], ['Trạng thái', ''], ['Tổng tiền', '']].map(([k, v], i) => (
                  <div key={i}>
                    <span className="text-slate-500 block uppercase text-[10px] mb-1">{k}</span>
                    {i === 2 ? getStatusBadge(selectedOrder.orderStatus) : i === 3 ? <span className="font-bold text-amber-600">{isFinancialMasked ? '***' : `${selectedOrder.totalAmount.toLocaleString('vi-VN')} ₫`}</span> : <span className="font-medium text-slate-800">{v}</span>}
                  </div>
                ))}
              </div>
              {selectedOrder.orderDetails && selectedOrder.orderDetails.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left">Sản phẩm</th>
                        <th className="px-3 py-2 text-center">SL</th>
                        <th className="px-3 py-2 text-right">Đơn giá</th>
                        <th className="px-3 py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.orderDetails.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium">{item.product?.productName || `SP #${item.productId.slice(-6)}`}</td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{isFinancialMasked ? '***' : `${item.unitPrice.toLocaleString('vi-VN')} ₫`}</td>
                          <td className="px-3 py-2 text-right font-semibold">{isFinancialMasked ? '***' : `${(item.quantity * item.unitPrice).toLocaleString('vi-VN')} ₫`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Update Status Modal ───────────────────────────── */}
      {showUpdateStatusModal && orderToUpdate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-sm text-slate-800">Cập nhật trạng thái</h3>
              <button onClick={() => setShowUpdateStatusModal(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Mã đơn hàng</label>
                <input type="text" value={orderToUpdate.orderCode} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Trạng thái mới</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500">
                  {STATUS_OPTIONS.filter(s => s.value !== 'ALL').map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Lý do thay đổi</label>
                <textarea value={updateReason} onChange={e => setUpdateReason(e.target.value)} rows={2} placeholder="Nhập lý do (bắt buộc nếu hủy / lùi trạng thái)..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowUpdateStatusModal(false)} className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Hủy</button>
                <button type="submit" className="flex-1 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={confirmDelete.open}
        onConfirm={handleDeleteOrder}
        onCancel={() => setConfirmDelete({ open: false, id: '', code: '' })}
        title="Xóa đơn hàng"
        message={`Bạn có chắc muốn xóa đơn hàng "${confirmDelete.code}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa đơn hàng"
        variant="danger"
      />
    </>
  );
}
