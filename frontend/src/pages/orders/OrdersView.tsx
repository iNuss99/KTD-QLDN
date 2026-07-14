import React, { useState, useEffect } from 'react';
import { PackageOpen, Filter, Search, Plus, Download, X, Trash2, ShoppingCart } from 'lucide-react';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';

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

export default function OrdersView({ onShowNotification, searchTerm }: { onShowNotification: (msg: string, type?: 'success'|'info'|'error') => void, searchTerm: string }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    
    // States cho thao tac tao don hang
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<OrderDetail[]>([]);
    
    // States cho thao tac xem chi tiet don hang
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const allowedRoles = ['Admin', 'Manager', 'Sales Staff'];
    const canUpdateStatus = user && allowedRoles.includes(user.role);
    const canCreateOrder = user && allowedRoles.includes(user.role);
    const canDeleteOrder = user && ['Admin', 'Manager'].includes(user.role);
    const isFinancialMasked = user && ['Warehouse Staff'].includes(user.role);

    // States cho thao tac cap nhat trang thai
    const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
    const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [updateReason, setUpdateReason] = useState<string>('');

    useEffect(() => {
        fetchOrders();
        fetchProducts();

        if (token) {
            const intervalId = setInterval(() => {
                fetchOrders();
            }, 30000);

            return () => clearInterval(intervalId);
        }
    }, [token]);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/Orders');
            setOrders(res.data.items || res.data);
        } catch (error) {
            console.error(error);
            onShowNotification('Lỗi khi tải danh sách đơn hàng', 'info');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/Products');
            const data = res.data.items || res.data;
            if (data && data.length > 0) {
                setProducts(data);
            } else {
                setProducts(getMockProducts());
            }
        } catch (error) {
            console.error('Error fetching products', error);
            setProducts(getMockProducts());
        }
    };

    const getMockProducts = (): Product[] => [
        { id: '10000000-0000-0000-0000-000000000001', sku: 'LAP-MAC-14', productName: 'MacBook Pro 14" M3', sellingPrice: 49990000 },
        { id: '10000000-0000-0000-0000-000000000002', sku: 'PHO-IPH-15', productName: 'iPhone 15 Pro Max', sellingPrice: 29990000 },
        { id: '10000000-0000-0000-0000-000000000003', sku: 'AUD-SON-XM5', productName: 'Sony WH-1000XM5', sellingPrice: 9990000 },
        { id: '10000000-0000-0000-0000-000000000004', sku: 'ACC-MOU-MX3', productName: 'Logitech MX Master 3S', sellingPrice: 2490000 },
        { id: '10000000-0000-0000-0000-000000000005', sku: 'TAB-IPAD-11', productName: 'iPad Pro 11" M4', sellingPrice: 24990000 },
        { id: '10000000-0000-0000-0000-000000000006', sku: 'PHO-GAL-S24', productName: 'Samsung Galaxy S24 Ultra', sellingPrice: 32490000 },
        { id: '10000000-0000-0000-0000-000000000007', sku: 'WAT-APP-S9', productName: 'Apple Watch Series 9', sellingPrice: 9990000 },
        { id: '10000000-0000-0000-0000-000000000008', sku: 'KEY-KCH-Q1', productName: 'Bàn phím cơ Keychron Q1', sellingPrice: 3990000 },
        { id: '10000000-0000-0000-0000-000000000009', sku: 'TV-LG-C3-55', productName: 'LG OLED TV 55 inch C3', sellingPrice: 37490000 },
        { id: '10000000-0000-0000-0000-000000000010', sku: 'AUD-APP-AP2', productName: 'AirPods Pro 2', sellingPrice: 6240000 }
    ];

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomerName || selectedProducts.length === 0) {
            onShowNotification('Vui lòng nhập tên khách hàng và chọn ít nhất 1 sản phẩm', 'info');
            return;
        }

        const calculatedTotal = selectedProducts.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        try {
            const newOrder = {
                orderCode: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
                customerName: newCustomerName,
                totalAmount: calculatedTotal,
                orderStatus: "Pending",
                createdBy: user?.id || "00000000-0000-0000-0000-000000000000",
                orderDetails: selectedProducts.map(p => ({
                    productId: p.productId,
                    quantity: p.quantity > 0 ? p.quantity : 1,
                    unitPrice: p.unitPrice
                }))
            };
            const res = await api.post('/Orders', newOrder);
            onShowNotification('Tạo đơn hàng thành công!', 'success');
            setOrders(prev => [res.data, ...prev]);
            setShowNewOrderModal(false);
            setNewCustomerName('');
            setSelectedProducts([]);
        } catch (error) {
            console.error(error);
            onShowNotification('Tạo đơn hàng thất bại. Vui lòng kiểm tra quyền.', 'info');
        }
    };

    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderToUpdate || !newStatus) return;

        try {
            await api.patch(`/Orders/${orderToUpdate.id}/status`, { status: newStatus, reason: updateReason });
            onShowNotification('Cập nhật trạng thái thành công!', 'success');
            setOrders(prev => prev.map(o => o.id === orderToUpdate.id ? { ...o, orderStatus: newStatus } : o));
            setShowUpdateStatusModal(false);
            setOrderToUpdate(null);
            setNewStatus('');
            setUpdateReason('');
        } catch (error: any) {
            console.error(error);
            onShowNotification(error.response?.data?.message || 'Cập nhật trạng thái thất bại. Vui lòng kiểm tra quyền.', 'error');
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này? Thao tác này không thể hoàn tác.")) return;
        try {
            await api.delete(`/Orders/${id}`);
            onShowNotification('Xóa đơn hàng thành công!', 'success');
            setOrders(prev => prev.filter(o => o.id !== id));
        } catch (error) {
            console.error(error);
            onShowNotification('Xóa đơn hàng thất bại. Vui lòng kiểm tra quyền.', 'info');
        }
    };

    const handleAddProduct = (productId: string) => {
        if (!productId) return;
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existing = selectedProducts.find(p => p.productId === productId);
        if (existing) {
            setSelectedProducts(selectedProducts.map(p => 
                p.productId === productId ? { ...p, quantity: p.quantity + 1 } : p
            ));
        } else {
            setSelectedProducts([...selectedProducts, {
                productId: product.id,
                product: product,
                quantity: 1,
                unitPrice: product.sellingPrice
            }]);
        }
    };

    const handleUpdateQuantity = (productId: string, qty: number) => {
        if (qty < 0) return;
        setSelectedProducts(selectedProducts.map(p => 
            p.productId === productId ? { ...p, quantity: qty } : p
        ));
    };

    const handleRemoveProduct = (productId: string) => {
        setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || o.orderStatus.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const handleExportCSV = () => {
        onShowNotification('Đang tải xuống danh sách đơn hàng...');
        const BOM = "\uFEFF";
        const csvContent = BOM + "Mã Đơn Hàng,Khách Hàng,Ngày,Tổng Tiền,Trạng Thái\n"
            + filteredOrders.map(o => `${o.orderCode},${o.customerName},${new Date(o.createdAt).toLocaleDateString()},${o.totalAmount},${o.orderStatus}`).join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "danh_sach_don_hang.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered': return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold uppercase tracking-wide">Hoàn thành</span>;
            case 'shipped': return <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase tracking-wide">Đang giao</span>;
            case 'confirmed': return <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold uppercase tracking-wide">Đã xác nhận</span>;
            case 'pending': return <span className="px-2 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wide">Mới tạo</span>;
            case 'cancelled': return <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold uppercase tracking-wide">Đã hủy</span>;
            default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wide">{status}</span>;
        }
    };

    return (
        <>
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Đơn hàng &amp; Tồn kho</h2>
                    <p className="text-xs text-slate-500 mt-1">Quản lý đơn hàng thương mại điện tử, xem hoạt động tồn kho và trạng thái thực hiện.</p>
                </div>
                {canCreateOrder && (
                    <button 
                        onClick={() => {
                            setSelectedProducts([]);
                            setNewCustomerName('');
                            setShowNewOrderModal(true);
                        }}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        <span>Đơn hàng Mới</span>
                    </button>
                )}
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between">
                    <div className="relative max-w-sm w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo mã đơn hàng hoặc khách hàng..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                            value={searchTerm}
                            onChange={() => {}}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-md text-sm transition-colors focus:outline-none"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="Pending">Chờ xử lý</option>
                            <option value="Delivered">Hoàn thành</option>
                        </select>
                        <button 
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-md text-sm transition-colors"
                        >
                            <Download size={16} />
                            <span>Tải xuống</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Mã Đơn hàng</th>
                                <th className="px-4 py-3">Khách hàng</th>
                                <th className="px-4 py-3">Ngày</th>
                                <th className="px-4 py-3 text-right">Tổng Tiền</th>
                                <th className="px-4 py-3 text-center">Trạng thái</th>
                                <th className="px-4 py-3 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-400">Đang tải đơn hàng...</td>
                                </tr>
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="even:bg-slate-50 hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-2 font-medium text-slate-900">{order.orderCode}</td>
                                        <td className="px-4 py-2">{order.customerName}</td>
                                        <td className="px-4 py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-right font-medium">{isFinancialMasked ? '***' : `${order.totalAmount.toLocaleString()}₫`}</td>
                                        <td className="px-4 py-2 text-center">{getStatusBadge(order.orderStatus)}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button 
                                                onClick={() => setSelectedOrder(order)} 
                                                className="text-amber-600 hover:text-amber-800 text-xs font-semibold px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                                            >
                                                Xem
                                            </button>
                                                {canUpdateStatus && (
                                                <button 
                                                    onClick={() => { setOrderToUpdate(order); setNewStatus(order.orderStatus); setShowUpdateStatusModal(true); }}
                                                    className="ml-2 text-emerald-600 hover:text-emerald-800 text-xs font-semibold px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                                                >
                                                    Cập nhật
                                                </button>
                                            )}
                                            {canDeleteOrder && (
                                                <button 
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    className="ml-2 text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    Xóa
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-400">
                                        <PackageOpen size={32} className="mx-auto mb-2 text-slate-300" />
                                        <p>Không tìm thấy đơn hàng nào.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
            
        {/* New Order Modal */}
        {showNewOrderModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <ShoppingCart size={18} className="text-amber-600" />
                            Tạo Đơn Hàng Mới
                        </h3>
                        <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto p-4 flex-1">
                        <form id="new-order-form" onSubmit={handleCreateOrder} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Tên Khách hàng</label>
                                <input 
                                    type="text" 
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Thêm Sản Phẩm (Đồ Điện Tử)</label>
                                <div className="flex gap-2">
                                    <select 
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                        onChange={(e) => {
                                            handleAddProduct(e.target.value);
                                            e.target.value = "";
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>-- Chọn sản phẩm --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.productName} - {p.sellingPrice.toLocaleString()}₫</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {selectedProducts.length > 0 && (
                                    <div className="mt-4 border border-slate-200 rounded-md overflow-hidden bg-white">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                                                <tr>
                                                    <th className="px-3 py-2">Sản phẩm</th>
                                                    <th className="px-3 py-2 w-20 text-center">SL</th>
                                                    <th className="px-3 py-2 text-right">Đơn giá</th>
                                                    <th className="px-3 py-2 text-center w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedProducts.map(item => (
                                                    <tr key={item.productId}>
                                                        <td className="px-3 py-2">{item.product?.productName}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <input 
                                                                type="number" 
                                                                min="1" 
                                                                value={item.quantity || ''} 
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    handleUpdateQuantity(item.productId, isNaN(val) ? 0 : val);
                                                                }}
                                                                onBlur={(e) => {
                                                                    if (!item.quantity || item.quantity <= 0) {
                                                                        handleUpdateQuantity(item.productId, 1);
                                                                    }
                                                                }}
                                                                className="w-14 px-1 py-1 text-center border border-slate-200 rounded text-sm"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-right">{item.unitPrice.toLocaleString()}₫</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleRemoveProduct(item.productId)}
                                                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="px-4 py-3 bg-slate-50 text-right font-medium text-slate-800 border-t border-slate-200">
                                            Tổng tiền: <span className="text-amber-600 text-lg ml-2">{selectedProducts.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString()}₫</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="flex justify-end gap-3 p-4 border-t border-slate-100 bg-white">
                        <button 
                            type="button"
                            onClick={() => setShowNewOrderModal(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit"
                            form="new-order-form"
                            disabled={selectedProducts.length === 0 || !newCustomerName}
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                        >
                            Tạo Đơn Hàng
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* View Order Modal */}
        {selectedOrder && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <PackageOpen size={18} className="text-amber-600" />
                            Chi tiết Đơn hàng: <span className="text-amber-700">{selectedOrder.orderCode}</span>
                        </h3>
                        <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div>
                                <span className="text-slate-500 block text-xs uppercase mb-1">Khách hàng</span>
                                <span className="font-medium text-slate-800">{selectedOrder.customerName}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-xs uppercase mb-1">Ngày tạo</span>
                                <span className="font-medium text-slate-800">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block text-xs uppercase mb-1">Trạng thái</span>
                                {getStatusBadge(selectedOrder.orderStatus)}
                            </div>
                            <div>
                                <span className="text-slate-500 block text-xs uppercase mb-1">Tổng tiền</span>
                                <span className="font-bold text-amber-600">{isFinancialMasked ? '***' : `${selectedOrder.totalAmount.toLocaleString()}₫`}</span>
                            </div>
                        </div>
                        
                        <h4 className="font-semibold text-sm text-slate-800 mb-3 border-b pb-2">Danh sách sản phẩm mua</h4>
                        {selectedOrder.orderDetails && selectedOrder.orderDetails.length > 0 ? (
                            <div className="border border-slate-200 rounded-md overflow-hidden">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2">Sản phẩm</th>
                                            <th className="px-3 py-2 text-center">SL</th>
                                            <th className="px-3 py-2 text-right">Đơn giá</th>
                                            <th className="px-3 py-2 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedOrder.orderDetails.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 font-medium text-slate-800">
                                                    {item.product?.productName || products.find(p => p.id === item.productId)?.productName || 'Sản phẩm ID ' + item.productId.substring(24)}
                                                </td>
                                                <td className="px-3 py-2 text-center">{item.quantity}</td>
                                                <td className="px-3 py-2 text-right">{isFinancialMasked ? '***' : `${item.unitPrice.toLocaleString()}₫`}</td>
                                                <td className="px-3 py-2 text-right font-medium text-slate-800">
                                                    {isFinancialMasked ? '***' : `${(item.quantity * item.unitPrice).toLocaleString()}₫`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100 text-slate-500">
                                <ShoppingCart size={24} className="mx-auto mb-2 text-slate-300" />
                                <p className="text-sm">Không có chi tiết sản phẩm.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        {/* Update Status Modal */}
        {showUpdateStatusModal && orderToUpdate && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800">
                            Cập nhật trạng thái đơn hàng
                        </h3>
                        <button onClick={() => setShowUpdateStatusModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-4">
                        <form id="update-status-form" onSubmit={handleUpdateStatus} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Mã đơn hàng</label>
                                <input 
                                    type="text" 
                                    value={orderToUpdate.orderCode}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Trạng thái mới</label>
                                <select 
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                >
                                    <option value="Pending">Mới tạo (Pending)</option>
                                    <option value="Confirmed">Đã xác nhận (Confirmed)</option>
                                    <option value="Shipped">Đang giao (Shipped)</option>
                                    <option value="Delivered">Hoàn thành (Delivered)</option>
                                    <option value="Cancelled">Đã hủy (Cancelled)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Lý do (Bắt buộc nếu hủy hoặc lùi trạng thái)</label>
                                <textarea 
                                    value={updateReason}
                                    onChange={(e) => setUpdateReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                    rows={2}
                                    placeholder="Nhập lý do thay đổi..."
                                />
                            </div>
                        </form>
                    </div>

                    <div className="flex justify-end gap-3 p-4 border-t border-slate-100 bg-white">
                        <button 
                            type="button"
                            onClick={() => setShowUpdateStatusModal(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit"
                            form="update-status-form"
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
