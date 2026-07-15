/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CreditCard,
  Plus,
  Settings,
  HelpCircle,
  X,
  ShoppingCart,
  Boxes,
  BarChart3,
  ScrollText,
  ClipboardList
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

import { PermissionRow } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNewReport: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  permissions: PermissionRow[];
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  onOpenNewReport,
  isOpenMobile = false,
  onCloseMobile,
  permissions,
}: SidebarProps) {
  const user = useAuthStore((state) => state.user);

  // Map backend role names to PermissionRow keys
  const getRoleKey = (roleName?: string): keyof PermissionRow | null => {
    if (!roleName) return null;
    if (roleName === 'Admin' || roleName.includes('Quản trị')) return 'admin';
    if (roleName === 'Manager' || roleName.includes('Quản lý') || roleName.includes('Giám đốc')) return 'manager';
    if (roleName === 'Accountant' || roleName.includes('Kế toán') || roleName.includes('Kiểm toán')) return 'accountant';
    if (roleName === 'Sales Staff' || roleName.includes('Bán hàng')) return 'salesStaff';
    if (roleName === 'Warehouse Staff' || roleName.includes('Kho')) return 'warehouseStaff';
    return null;
  };

  const roleKey = getRoleKey(user?.role);

  // Check if user has ANY permission in a specific module
  const hasModuleAccess = (moduleName: string) => {
    if (!roleKey) return false;
    return permissions.some(p => p.module === moduleName && p[roleKey] === true);
  };

  const isFinanceVisible = hasModuleAccess('Finance');
  const isInventoryVisible = hasModuleAccess('Inventory');
  const isOrdersVisible = hasModuleAccess('Orders');
  const isHRVisible = hasModuleAccess('HR');
  const isAdminOrManager = roleKey === 'admin' || roleKey === 'manager'; // For special admin tabs

  const menuItems = [
    ...(roleKey ? [{ id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard }] : []),
    ...(isOrdersVisible ? [{ id: 'orders', label: 'Đơn hàng', icon: ShoppingCart }] : []),
    ...(isInventoryVisible ? [{ id: 'products', label: 'Tồn kho', icon: Boxes }] : []),
    ...(isHRVisible ? [{ id: 'employees', label: 'Nhân sự', icon: Users }] : []),
    ...(isAdminOrManager ? [{ id: 'permissions', label: 'Phân quyền', icon: ShieldCheck }] : []),
    ...(isFinanceVisible ? [{ id: 'finance', label: 'Tài chính', icon: CreditCard }] : []),
    ...(roleKey === 'salesStaff' || roleKey === 'warehouseStaff' ? [{ id: 'staff-report', label: 'Báo cáo cá nhân', icon: BarChart3 }] : []),
    ...(roleKey === 'admin' ? [{ id: 'audit-log', label: 'Nhật ký kiểm toán', icon: ScrollText }] : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-neutral-950 text-slate-200 p-4">
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-3 mb-8 px-2 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            <img
              alt="KD Logo"
              className="w-full h-full object-cover"
              src="/logo.png"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-[14px] tracking-tight leading-none text-white whitespace-nowrap">Kingdom Trust Division</h1>
            <p className="text-[11px] text-amber-400 mt-1 whitespace-nowrap">KTD Enterprise</p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Primary Action Button */}
      <button
        onClick={() => {
          onOpenNewReport();
          if (onCloseMobile) onCloseMobile();
        }}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs py-2 px-3 rounded-lg mb-8 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
      >
        <Plus size={16} />
        Báo cáo mới
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li key={item.id} className="mb-1">
                <button
                  onClick={() => {
                    setCurrentTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${isActive
                      ? 'text-white bg-amber-600 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-slate-800 mt-auto">
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => {
                setCurrentTab('settings');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${currentTab === 'settings'
                  ? 'text-white bg-slate-800 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              <Settings size={16} />
              <span>Cài đặt</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setCurrentTab('support');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${currentTab === 'support'
                  ? 'text-white bg-slate-800 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              <HelpCircle size={16} />
              <span>Hỗ trợ</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar (fixed on left) */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 shadow-md bg-neutral-950 z-40 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile drawer sidebar */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          {/* Sidebar drawer panel */}
          <div className="relative flex flex-col w-64 max-w-xs bg-neutral-950 h-full shadow-xl transition-transform duration-300 transform translate-x-0">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
