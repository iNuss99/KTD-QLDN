/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  X,
  Settings as SettingsIcon,
  HelpCircle,
  Briefcase,
  ShieldAlert,
  Server,
  Terminal,
  Database,
  Search
} from 'lucide-react';

import Sidebar from './layouts/Sidebar';
import TopBar from './layouts/TopBar';
import ForceChangePasswordView from './pages/auth/ForceChangePasswordView';
import DashboardView from './pages/dashboard/DashboardView';
import EmployeesView from './pages/employees/EmployeesView';
import AttendanceView from './pages/employees/AttendanceView';
import PayrollView from './pages/employees/PayrollView';
import PermissionsView from './pages/employees/PermissionsView';
import FinanceView from './pages/finance/FinanceView';
import OrdersView from './pages/orders/OrdersView';
import ProductsView from './pages/products/ProductsView';
import NewReportModal from './components/common/NewReportModal';
import LoginView from './pages/auth/LoginView';
import SettingsView from './pages/settings/SettingsView';
import StaffSalesReportView from './pages/settings/StaffSalesReportView';
import AuditLogView from './pages/admin/AuditLogView';
import SessionTimeoutModal from './components/common/SessionTimeoutModal';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import { Activity } from './types';
import {
  INITIAL_ACTIVITIES
} from './utils/data';
import api from './api';

export default function App() {
  // Tab Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.role) {
      if (['Admin', 'Manager'].includes(user.role)) setCurrentTab('dashboard');
      else if (user.role === 'Accountant') setCurrentTab('finance');
      else if (user.role === 'Sales Staff') setCurrentTab('orders');
      else if (user.role === 'Warehouse Staff') setCurrentTab('products');
      else setCurrentTab('dashboard');
    }
  }, [user?.role]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Modal toggler
  const [showNewReportModal, setShowNewReportModal] = useState<boolean>(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Core App states
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);

  const token = useAuthStore((state) => state.token);

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast(message);
    }
  };

  const mapRoleIdToRole = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Admin';
      case 2: return 'Manager';
      case 3: return 'Accountant';
      case 4: return 'Sales Staff';
      case 5: return 'Warehouse Staff';
      default: return 'Sales Staff';
    }
  };

  const mapRoleToRoleId = (roleStr: string) => {
    switch (roleStr) {
      case 'Admin': return 1;
      case 'Manager': return 2;
      case 'Accountant': return 3;
      case 'Sales Staff': return 4;
      case 'Warehouse Staff': return 5;
      default: return 4;
    }
  };

  const mapRoleToDepartment = (roleStr: string) => {
    if (['Admin', 'Manager'].includes(roleStr)) return 'Ban Giám đốc';
    if (['Accountant'].includes(roleStr)) return 'Kế toán';
    if (['Warehouse Staff'].includes(roleStr)) return 'Kho vận';
    return 'Kinh doanh (Sales/CSKH)'; // Sales Staff default
  };

  // On mount: validate token against backend (catches stale tokens after backend DB reset)
  const logout = useAuthStore((state) => state.logout);
  useEffect(() => {
    if (!token) return;

    api.get('/Auth/me')
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 401) {
          console.warn('[App] Token validation failed (401). Logging out.');
          logout();
          toast('Phiên đăng nhập đã hết hạn hoặc tài khoản thay đổi. Vui lòng đăng nhập lại.', { duration: 5000 });
        }
      });
  }, [token]);

  const canEditPermissions = user?.role === 'Admin' || user?.role === 'Manager';

  if (!token) {
    return (
      <>
        <LoginView />
        <Toaster position="bottom-right" />
      </>
    );
  }

  if (user?.isFirstLogin) {
    return <ForceChangePasswordView />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased select-none">

      {/* 1. Sidebar Panel (Handles responsiveness itself) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewReport={() => setShowNewReportModal(true)}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main staging container (shifted left to clear fixed sidebar on desktop) */}
      <div className="flex-1 flex flex-col md:pl-64 h-full overflow-hidden transition-all duration-300">

        {/* Top Header Actions block */}
        <TopBar
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />

        {/* Dynamic page viewport scrollable section */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigateToTab={setCurrentTab}
                activities={activities}
                onShowNotification={triggerToast}
                searchTerm={searchTerm}
              />
            )}

            {currentTab === 'orders' && (
              <OrdersView
                onShowNotification={triggerToast}
                searchTerm={searchTerm}
              />
            )}

            {currentTab === 'products' && (
              <ProductsView
                onShowNotification={triggerToast}
                searchTerm={searchTerm}
              />
            )}

            {currentTab === 'employees' && (
              <EmployeesView
                onShowNotification={triggerToast}
                searchTerm={searchTerm}
                currentUserRole={user?.role}
              />
            )}

            {currentTab === 'attendance' && (
              <AttendanceView onShowNotification={triggerToast} />
            )}

            {currentTab === 'payroll' && (
              <PayrollView onShowNotification={triggerToast} />
            )}

            {currentTab === 'permissions' && (
              <PermissionsView
                onShowNotification={triggerToast}
                searchTerm={searchTerm}
                canEdit={canEditPermissions}
              />
            )}

            {currentTab === 'finance' && (
              <FinanceView onShowNotification={triggerToast} />
            )}

            {currentTab === 'staff-report' && (
              <StaffSalesReportView onShowNotification={triggerToast} />
            )}

            {/* Audit Log — Admin Only */}
            {currentTab === 'audit-log' && user?.role === 'Admin' && (
              <AuditLogView onShowNotification={triggerToast} />
            )}

            {/* Custom Settings Page */}
            {currentTab === 'settings' && (
              <SettingsView onShowNotification={triggerToast} />
            )}

            {/* Custom Support Page */}
            {currentTab === 'support' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Trung tâm Hỗ trợ</h2>
                  <p className="text-xs text-slate-500 mt-1">Nhận hỗ trợ từ lập trình viên, kiểm tra chỉ số hệ thống, hoặc mở vé yêu cầu khẩn cấp.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 max-w-2xl space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                      <HelpCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-800">Kênh Hỗ trợ</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Liên hệ với kỹ sư quản trị hệ thống hoặc duyệt tài liệu hướng dẫn.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl">
                      <Briefcase className="mx-auto text-amber-600 mb-2" size={20} />
                      <h4 className="text-xs font-bold text-slate-800">Tài liệu</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Đọc hướng dẫn cài đặt chung và các tham số API.</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl">
                      <Server className="mx-auto text-green-600 mb-2" size={20} />
                      <h4 className="text-xs font-bold text-slate-800">Chỉ số Máy chủ</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Kiểm tra hiệu suất container, thời gian hoạt động và CSDL.</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl">
                      <ShieldAlert className="mx-auto text-amber-600 mb-2" size={20} />
                      <h4 className="text-xs font-bold text-slate-800">Mở Vé Hỗ trợ</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Tổng hợp nhật ký khẩn cấp và yêu cầu hỗ trợ kỹ thuật.</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Gửi Yêu cầu Hỗ trợ</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Tiêu đề..."
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                      />
                      <textarea
                        rows={3}
                        placeholder="Nêu rõ mã lỗi, tham số mạng hoặc thay đổi cần thiết..."
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            triggerToast('Vé Hỗ trợ Khẩn cấp đã được gửi và tải lên JIRA.');
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                        >
                          Gửi Vé
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. Global Floating Action Modal "New Report" */}
      {showNewReportModal && (
        <NewReportModal
          onClose={() => setShowNewReportModal(false)}
          onShowNotification={triggerToast}
        />
      )}

      {/* Session Timeout Modal */}
      <SessionTimeoutModal />

      {/* 4. Global Toast Notifications banner */}
      <Toaster position="bottom-right" />

    </div>
  );
}
