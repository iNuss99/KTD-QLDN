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
  Package,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNewReport: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  onOpenNewReport,
  isOpenMobile = false,
  onCloseMobile
}: SidebarProps) {
  const user = useAuthStore((state) => state.user);

  const isAdminOrManager = user?.role?.includes('Quản lý') || user?.role?.includes('Giám đốc') || user?.role?.includes('Quản trị') || user?.role === 'Admin' || user?.role === 'Manager';
  const isFinanceVisible = user?.role?.includes('Giám đốc') || user?.role?.includes('Quản trị') || user?.role?.includes('Kiểm toán') || user?.role === 'Admin' || user?.role === 'Accountant' || user?.role === 'Manager';
  const isInventoryVisible = isAdminOrManager || user?.role === 'Warehouse Staff' || user?.role === 'Accountant';
  const isSalesStaff = user?.role === 'Sales Staff';
  const isDashboardVisible = isAdminOrManager || user?.role === 'Accountant';
  const isOrdersVisible = isAdminOrManager || user?.role === 'Sales Staff' || user?.role === 'Warehouse Staff' || user?.role === 'Accountant';

  const menuItems = [
    ...(isDashboardVisible ? [{ id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard }] : []),
    ...(isOrdersVisible ? [{ id: 'orders', label: 'Đơn hàng', icon: Package }] : []),
    ...(isInventoryVisible ? [{ id: 'products', label: 'Tồn kho', icon: Package }] : []),
    ...(isAdminOrManager ? [{ id: 'employees', label: 'Nhân sự', icon: Users }] : []),
    ...(isAdminOrManager ? [{ id: 'permissions', label: 'Phân quyền', icon: ShieldCheck }] : []),
    ...(isFinanceVisible ? [{ id: 'finance', label: 'Tài chính', icon: CreditCard }] : []),
    ...(isSalesStaff ? [{ id: 'staff-report', label: 'Báo cáo cá nhân', icon: BarChart3 }] : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-200 p-4">
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-3 mb-8 px-2 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            <img
              alt="KD Logo"
              className="w-full h-full object-cover"
              src="/logo.png"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-[14px] tracking-tight leading-none text-white whitespace-nowrap">Kingdom Trust Division</h1>
            <p className="text-[11px] text-slate-400 mt-1 whitespace-nowrap">KTD Enterprise</p>
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
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 px-3 rounded-lg mb-8 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? 'text-white bg-indigo-600 font-semibold shadow-sm'
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'settings'
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'support'
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
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 shadow-md bg-[#0f172a] z-40 border-r border-slate-800">
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
          <div className="relative flex flex-col w-64 max-w-xs bg-[#0f172a] h-full shadow-xl transition-transform duration-300 transform translate-x-0">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
