/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Shield, Filter, Search, RotateCcw, Save, Check } from 'lucide-react';
import { PermissionRow } from '../../types';

import { usePermissions, useSavePermissions } from '../../hooks/usePermissions';
import { INITIAL_PERMISSIONS } from '../../utils/data';

interface PermissionsViewProps {
  onShowNotification: (message: string) => void;
  searchTerm: string;
  canEdit?: boolean;
}

export default function PermissionsView({
  onShowNotification,
  searchTerm,
  canEdit = false
}: PermissionsViewProps) {
  // Local active module filter
  const [activeModuleFilter, setActiveModuleFilter] = useState<'All' | 'Orders' | 'Finance' | 'HR' | 'Inventory'>('All');
  
  // Working draft of permissions
  const { data: permissions = [] } = usePermissions();
  const savePermissions = useSavePermissions();
  const [draftPermissions, setDraftPermissions] = useState<PermissionRow[]>(permissions);
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Sync draft whenever parent permissions update (e.g. after API load)
  useEffect(() => {
    if (permissions.length > 0) {
      setDraftPermissions(permissions);
    }
  }, [permissions]);

  const handleCheckboxChange = (rowId: string, role: 'admin' | 'manager' | 'accountant' | 'salesStaff' | 'warehouseStaff') => {
    const updated = draftPermissions.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          [role]: !row[role]
        };
      }
      return row;
    });
    setDraftPermissions(updated);
  };

  const handleReset = () => {
    if (!canEdit) {
      onShowNotification('Bạn không có quyền đặt lại ma trận phân quyền.');
      return;
    }
    setDraftPermissions(INITIAL_PERMISSIONS);
    onShowNotification('Ma trận quyền đã được khôi phục về mặc định hệ thống. Vui lòng Lưu để áp dụng.');
  };

  const handleSave = async () => {
    if (!canEdit) {
      onShowNotification('Bạn không có quyền lưu ma trận phân quyền.');
      return;
    }
    try {
      await savePermissions.mutateAsync(draftPermissions);
      onShowNotification('Ma trận phân quyền đã được lưu thành công vào CSDL.');
    } catch (e: any) {
      onShowNotification('Lưu phân quyền thất bại');
    }
  };

  // Filter permission rows by both Search terms and Category tabs
  const filteredRows = draftPermissions.filter((row) => {
    const matchesSearch = (row.action || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesModule = activeModuleFilter === 'All' || row.module === activeModuleFilter;
    return matchesSearch && matchesModule;
  });

  // Group filtered rows by module/section for segmented headers
  const financeRows = filteredRows.filter((r) => r.module === 'Finance');
  const hrRows = filteredRows.filter((r) => r.module === 'HR');
  const inventoryRows = filteredRows.filter((r) => r.module === 'Inventory');
  const ordersRows = filteredRows.filter((r) => r.module === 'Orders');

  const renderCheckbox = (row: PermissionRow, role: keyof PermissionRow) => {
      const isDisabled = !canEdit || row.disabledRoles?.includes(role as string);
      return (
        <td key={role} className="p-3.5 text-center">
          <input
            type="checkbox"
            checked={!!row[role]}
            disabled={isDisabled}
            onChange={() => canEdit && handleCheckboxChange(row.id, role as any)}
            className={`w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 focus:ring-1 ${
              isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
            }`}
          />
        </td>
      );
    };

  const renderRow = (row: PermissionRow) => {
    return (
      <tr key={row.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
        <td className="p-3.5 border-r border-slate-100 sticky left-0 bg-white font-medium text-slate-800">
          {row.action}
        </td>
        {renderCheckbox(row, 'admin')}
        {renderCheckbox(row, 'manager')}
        {renderCheckbox(row, 'accountant')}
        {renderCheckbox(row, 'salesStaff')}
        {renderCheckbox(row, 'warehouseStaff')}
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ma trận Quyền</h2>
          <p className="text-xs text-slate-500 mt-1">Quản lý kiểm soát truy cập dựa trên vai trò trên toàn hệ thống doanh nghiệp.</p>
        </div>

        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleReset}
            disabled={!canEdit}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium text-xs hover:bg-slate-50 transition-colors shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <RotateCcw size={14} />
            Đặt lại
          </button>
          
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!canEdit || savePermissions.isPending}
          >
            <Save size={13} />
            {savePermissions.isPending ? 'Đang lưu...' : 'Lưu Thay đổi'}
          </button>
        </div>
      </div>

      {/* Matrix Box */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Filter Actions Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-normal text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400"
              placeholder="Lọc hành động..."
            />
          </div>

          {/* Module Selector Chips */}
          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['All', 'Orders', 'Finance', 'HR', 'Inventory'].map((mod) => {
              const isActive = activeModuleFilter === mod;
              const getModuleLabel = (m: string) => {
                if (m === 'All') return 'Tất cả Phân hệ';
                if (m === 'Orders') return 'Đơn hàng';
                if (m === 'Finance') return 'Tài chính';
                if (m === 'HR') return 'Nhân sự';
                if (m === 'Inventory') return 'Tồn kho';
                return m;
              };
              return (
                <button
                  key={mod}
                  onClick={() => setActiveModuleFilter(mod as any)}
                  className={`px-3 py-1 rounded-full font-medium text-[10px] whitespace-nowrap cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {getModuleLabel(mod)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Matrix Grid Structure */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-3.5 border-r border-slate-200 font-semibold text-xs text-slate-500 min-w-[220px] sticky left-0 bg-slate-50 z-20">
                  Tài nguyên / Hành động
                </th>
                <th className="p-3.5 font-semibold text-xs text-slate-700 text-center min-w-[110px]">Quản trị Hệ thống</th>
                <th className="p-3.5 font-semibold text-xs text-slate-700 text-center min-w-[110px]">Quản lý</th>
                <th className="p-3.5 font-semibold text-xs text-slate-700 text-center min-w-[110px]">Kế toán</th>
                <th className="p-3.5 font-semibold text-xs text-slate-700 text-center min-w-[110px]">Nhân viên Bán hàng</th>
                <th className="p-3.5 font-semibold text-xs text-slate-700 text-center min-w-[110px]">Nhân viên Kho</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-800 font-normal">
              
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Không tìm thấy quyền nào khớp với tiêu chí tìm kiếm.
                  </td>
                </tr>
              )}

              {/* Group: Orders */}
              {ordersRows.length > 0 && (
                <>
                  <tr className="bg-amber-50/30 border-y border-slate-200">
                    <td className="p-2 pl-4 font-semibold text-[11px] text-amber-700 sticky left-0 bg-[#f4f5fd]" colSpan={6}>
                      Quản lý Đơn hàng
                    </td>
                  </tr>
                  {ordersRows.map(renderRow)}
                </>
              )}

              {/* Group: Finance */}
              {financeRows.length > 0 && (
                <>
                  <tr className="bg-amber-50/30 border-y border-slate-200">
                    <td className="p-2 pl-4 font-semibold text-[11px] text-amber-700 sticky left-0 bg-[#f4f5fd]" colSpan={6}>
                      Phân hệ Tài chính
                    </td>
                  </tr>
                  {financeRows.map(renderRow)}
                </>
              )}

              {/* Group: HR */}
              {hrRows.length > 0 && (
                <>
                  <tr className="bg-amber-50/30 border-y border-slate-200">
                    <td className="p-2 pl-4 font-semibold text-[11px] text-amber-700 sticky left-0 bg-[#f4f5fd]" colSpan={6}>
                      Quản lý Nhân sự
                    </td>
                  </tr>
                  {hrRows.map(renderRow)}
                </>
              )}

              {/* Group: Inventory */}
              {inventoryRows.length > 0 && (
                <>
                  <tr className="bg-amber-50/30 border-y border-slate-200">
                    <td className="p-2 pl-4 font-semibold text-[11px] text-amber-700 sticky left-0 bg-[#f4f5fd]" colSpan={6}>
                      Tồn kho &amp; Lưu kho
                    </td>
                  </tr>
                  {inventoryRows.map(renderRow)}
                </>
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
