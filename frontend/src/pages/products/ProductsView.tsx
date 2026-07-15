import React, { useState, useEffect } from 'react';
import { Package, Search, Edit3, X, History, Save, AlertTriangle } from 'lucide-react';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';
import { SkeletonTable } from '../../components/common/SkeletonLoader';

interface Product {
    id: string;
    sku: string;
    productName: string;
    sellingPrice: number;
    costPrice?: number;
    stockQuantity: number;
    minStockThreshold: number;
    isDeleted: boolean;
}

interface StockHistory {
    id: string;
    productId: string;
    oldQuantity: number;
    newQuantity: number;
    reason: string;
    createdAt: string;
    user?: { fullName: string };
}

export default function ProductsView({ onShowNotification, searchTerm }: { onShowNotification: (msg: string, type?: 'success'|'info') => void, searchTerm: string }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Auth context
    const user = useAuthStore((state) => state.user);
    const canAdjustStock = user?.role === 'Warehouse Staff' || user?.role === 'Admin';
    const canReceiveStock = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Accountant';
    const isFinancialMasked = user && ['Sales Staff', 'Warehouse Staff'].includes(user.role);
    
    // Stock adjustment modal state
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantityChange, setQuantityChange] = useState<number>(0);
    const [reason, setReason] = useState<string>('');

    // Receive stock modal state
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [receiveQuantity, setReceiveQuantity] = useState<number>(0);
    const [newCostPrice, setNewCostPrice] = useState<number>(0);
    const [receiveReason, setReceiveReason] = useState<string>('Nhập hàng mới');

    // History modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/Products');
            setProducts(res.data.items || res.data);
        } catch (error) {
            console.error(error);
            onShowNotification('Lỗi khi tải danh sách sản phẩm', 'info');
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !reason) {
            onShowNotification('Vui lòng điền đầy đủ lý do điều chỉnh.', 'info');
            return;
        }

        try {
            await api.put(`/Products/${selectedProduct.id}/stock`, {
                quantity: quantityChange,
                reason
            });
            onShowNotification('Cập nhật tồn kho thành công!', 'success');
            setShowAdjustModal(false);
            setQuantityChange(0);
            setReason('');
            fetchProducts();
        } catch (error) {
            console.error(error);
            onShowNotification('Lỗi khi cập nhật tồn kho. Kiểm tra quyền của bạn.', 'info');
        }
    };

    const handleReceiveStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        if (receiveQuantity <= 0) {
            onShowNotification('Số lượng nhập phải lớn hơn 0.', 'info');
            return;
        }

        try {
            await api.put(`/Products/${selectedProduct.id}/stock`, {
                quantity: selectedProduct.stockQuantity + receiveQuantity,
                reason: receiveReason,
                newCostPrice: newCostPrice > 0 ? newCostPrice : undefined
            });
            onShowNotification('Nhập hàng thành công!', 'success');
            setShowReceiveModal(false);
            setReceiveQuantity(0);
            setNewCostPrice(0);
            setReceiveReason('Nhập hàng mới');
            fetchProducts();
        } catch (error) {
            console.error(error);
            onShowNotification('Lỗi khi nhập hàng.', 'info');
        }
    };

    const handleViewHistory = async (productId: string) => {
        try {
            const res = await api.get(`/Products/${productId}/stock-history`);
            setStockHistory(res.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error(error);
            onShowNotification('Lỗi khi tải lịch sử tồn kho', 'info');
        }
    };

    const filteredProducts = products.filter(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sản phẩm &amp; Tồn kho</h2>
                    <p className="text-xs text-slate-500 mt-1">Quản lý danh sách sản phẩm và kiểm soát tồn kho.</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <div className="relative max-w-sm w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo mã SKU hoặc tên sản phẩm..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                            value={searchTerm}
                            onChange={() => {}}
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Mã SKU</th>
                                <th className="px-4 py-3">Tên sản phẩm</th>
                                <th className="px-4 py-3 text-right">Giá bán</th>
                                <th className="px-4 py-3 text-center">Tồn kho</th>
                                <th className="px-4 py-3 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <SkeletonTable rows={8} cols={5} />
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900">{product.sku}</td>
                                        <td className="px-4 py-3">
                                            {product.productName}
                                            {product.isDeleted && (
                                                <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded border border-slate-200">Ngưng hoạt động</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{isFinancialMasked ? '***' : `${product.sellingPrice.toLocaleString()}₫`}</td>
                                        <td className="px-4 py-3 text-center">
                                            {(() => {
                                              const threshold = product.minStockThreshold ?? 10;
                                              const isLow = product.stockQuantity <= threshold;
                                              const isCritical = product.stockQuantity === 0;
                                              return (
                                                <div className="flex items-center justify-center gap-1.5">
                                                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                                    isCritical ? 'bg-red-100 text-red-700 border-red-200' :
                                                    isLow ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                  }`}>
                                                    {product.stockQuantity}
                                                  </span>
                                                  {isCritical && (
                                                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                                      <AlertTriangle size={10} /> Hết hàng
                                                    </span>
                                                  )}
                                                  {!isCritical && isLow && (
                                                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                                      <AlertTriangle size={10} /> Thấp
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => handleViewHistory(product.id)} 
                                                className="text-slate-600 hover:text-slate-800 text-xs font-semibold px-2 py-1 rounded hover:bg-slate-100 transition-colors mr-2"
                                                title="Xem lịch sử"
                                            >
                                                <History size={14} />
                                            </button>
                                            {canReceiveStock && (
                                                <button 
                                                    onClick={() => { setSelectedProduct(product); setShowReceiveModal(true); setNewCostPrice(isFinancialMasked ? 0 : product.costPrice || 0); setReceiveQuantity(0); }}
                                                    className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold px-2 py-1 rounded hover:bg-emerald-50 transition-colors mr-2"
                                                    title="Nhập thêm hàng"
                                                >
                                                    <Package size={14} />
                                                </button>
                                            )}
                                            {canAdjustStock && (
                                                <button 
                                                    onClick={() => { setSelectedProduct(product); setShowAdjustModal(true); }}
                                                    className="text-amber-600 hover:text-amber-800 text-xs font-semibold px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                                                    title="Điều chỉnh tồn kho"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-slate-400">
                                        <Package size={32} className="mx-auto mb-2 text-slate-300" />
                                        <p>Không tìm thấy sản phẩm nào.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adjust Stock Modal */}
            {showAdjustModal && selectedProduct && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Edit3 size={18} className="text-amber-600" />
                                Cập nhật Tồn kho
                            </h3>
                            <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <form id="adjust-stock-form" onSubmit={handleAdjustStock} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Sản phẩm</label>
                                    <input 
                                        type="text" 
                                        value={selectedProduct.productName}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                                        disabled
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Tồn hiện tại</label>
                                        <input 
                                            type="text" 
                                            value={selectedProduct.stockQuantity}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Thay đổi (±)</label>
                                        <input 
                                            type="number" 
                                            value={quantityChange}
                                            onChange={(e) => setQuantityChange(parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Lý do (Bắt buộc)</label>
                                    <select 
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    >
                                        <option value="" disabled>-- Chọn lý do --</option>
                                        <option value="Nhập hàng mới">Nhập hàng mới</option>
                                        <option value="Hàng hỏng/Lỗi">Hàng hỏng/Lỗi</option>
                                        <option value="Trả lại">Khách trả lại</option>
                                        <option value="Kiểm kê chênh lệch">Kiểm kê chênh lệch</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-slate-100 bg-white">
                            <button 
                                type="button"
                                onClick={() => setShowAdjustModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button 
                                type="submit"
                                form="adjust-stock-form"
                                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                                disabled={!reason}
                            >
                                <Save size={16} /> Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receive Stock Modal */}
            {showReceiveModal && selectedProduct && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Package size={18} className="text-emerald-600" />
                                Nhập Thêm Hàng
                            </h3>
                            <button onClick={() => setShowReceiveModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <form id="receive-stock-form" onSubmit={handleReceiveStock} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Sản phẩm</label>
                                    <input 
                                        type="text" 
                                        value={selectedProduct.productName}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                                        disabled
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Tồn hiện tại</label>
                                        <input 
                                            type="text" 
                                            value={selectedProduct.stockQuantity}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Số lượng nhập</label>
                                        <input 
                                            type="number" 
                                            value={receiveQuantity}
                                            onChange={(e) => setReceiveQuantity(parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Giá nhập lô này (₫)</label>
                                    <input 
                                        type="number" 
                                        value={newCostPrice}
                                        onChange={(e) => setNewCostPrice(parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Lý do</label>
                                    <input 
                                        type="text" 
                                        value={receiveReason}
                                        onChange={(e) => setReceiveReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                </div>
                            </form>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-slate-100 bg-white">
                            <button 
                                type="button"
                                onClick={() => setShowReceiveModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button 
                                type="submit"
                                form="receive-stock-form"
                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                                disabled={receiveQuantity <= 0}
                            >
                                <Save size={16} /> Nhập Hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <History size={18} className="text-amber-600" />
                                Lịch sử Tồn kho
                            </h3>
                            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 flex-1">
                            {stockHistory.length > 0 ? (
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2">Thời gian</th>
                                            <th className="px-3 py-2 text-center">Biến động</th>
                                            <th className="px-3 py-2">Lý do</th>
                                            <th className="px-3 py-2">Người thực hiện</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {stockHistory.map((hist) => {
                                            const quantityChanged = hist.newQuantity - hist.oldQuantity;
                                            return (
                                                <tr key={hist.id} className="hover:bg-slate-50">
                                                    <td className="px-3 py-2">{new Date(hist.createdAt).toLocaleString('vi-VN')}</td>
                                                    <td className="px-3 py-2 text-center font-bold">
                                                        <span className={quantityChanged > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                            {quantityChanged > 0 ? `+${quantityChanged}` : quantityChanged}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">{hist.reason}</td>
                                                    <td className="px-3 py-2">{hist.user?.fullName || 'N/A'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-6 text-slate-500">
                                    <History size={24} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm">Chưa có lịch sử thay đổi tồn kho.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
