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

import { Employee, PermissionRow, Activity } from './types';
import {
  INITIAL_PERMISSIONS,
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>(INITIAL_PERMISSIONS);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
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

  const fetchUsers = async () => {
    try {
      const response = await api.get('/Users');
      const users = response.data.items || response.data;
      const mappedEmployees: Employee[] = users.map((u: any) => {
        const nameParts = u.fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        const roleStr = mapRoleIdToRole(u.roleId);
        return {
          id: u.id,
          firstName,
          lastName,
          email: u.email,
          role: roleStr,
          // IMPORTANT: always use the department from DB, not a derived mapping.
          // mapRoleToDepartment is only used as fallback for old data.
          department: u.department || mapRoleToDepartment(roleStr),
          status: u.isActive ? 'Đang hoạt động' : 'Đã nghỉ việc',
          avatarInitials: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase(),
          salary: u.salary || 0
        };
      });
      setEmployees(mappedEmployees);
    } catch (error) {
      console.error('Error fetching users:', error);
      triggerToast('Tải danh sách nhân viên thất bại', 'info');
    }
  };

  // Helper: convert flat API records to PermissionRow[] (frontend format)
  const buildPermissionsFromApi = (records: Array<{ permissionKey: string; roleName: string; isGranted: boolean }>) => {
    const permMap: Record<string, Partial<PermissionRow>> = {};
    records.forEach(r => {
      if (!permMap[r.permissionKey]) {
        const base = INITIAL_PERMISSIONS.find(p => p.id === r.permissionKey);
        permMap[r.permissionKey] = base
          ? { ...base, admin: false, manager: false, accountant: false, salesStaff: false, warehouseStaff: false }
          : { id: r.permissionKey, action: r.permissionKey, module: 'Finance', admin: false, manager: false, accountant: false, salesStaff: false, warehouseStaff: false };
      }
      const roleKey = {
        'Admin': 'admin', 'Manager': 'manager', 'Accountant': 'accountant',
        'Sales Staff': 'salesStaff', 'Warehouse Staff': 'warehouseStaff'
      }[r.roleName];
      if (roleKey) (permMap[r.permissionKey] as any)[roleKey] = r.isGranted;
    });
    return Object.values(permMap) as PermissionRow[];
  };

  // Helper: convert PermissionRow[] to flat records for API
  const flattenPermissions = (rows: PermissionRow[]) => {
    const items: Array<{ permissionKey: string; roleName: string; isGranted: boolean }> = [];
    const roleMap: Array<[keyof PermissionRow, string]> = [
      ['admin', 'Admin'], ['manager', 'Manager'], ['accountant', 'Accountant'],
      ['salesStaff', 'Sales Staff'], ['warehouseStaff', 'Warehouse Staff']
    ];
    rows.forEach(row => {
      roleMap.forEach(([key, roleName]) => {
        items.push({ permissionKey: row.id, roleName, isGranted: !!row[key] });
      });
    });
    return items;
  };

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/Permissions');
      const built = buildPermissionsFromApi(res.data);
      if (built.length > 0) setPermissions(built);
    } catch (e) {
      console.warn('[App] Could not load permissions from API, using defaults.');
    } finally {
      setPermissionsLoaded(true);
    }
  };

  // On mount: validate token against backend (catches stale tokens after backend DB reset)
  const logout = useAuthStore((state) => state.logout);
  useEffect(() => {
    if (!token) return;
    
    api.get('/Auth/me')
      .then(() => {
        // Token is valid → fetch users AND permissions
        fetchUsers();
        fetchPermissions();
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 401) {
          console.warn('[App] Token validation failed (401). Logging out.');
          logout();
          toast('Phiên đăng nhập đã hết hạn hoặc tài khoản thay đổi. Vui lòng đăng nhập lại.', { duration: 5000 });
        } else {
          fetchUsers();
          fetchPermissions();
        }
      });
  }, [token]);


  // State manipulation handlers
  const handleAddEmployee = async (newEmpData: Omit<Employee, 'id' | 'avatarInitials'> & { password?: string }) => {
    try {
      const userPayload = {
        fullName: `${newEmpData.firstName} ${newEmpData.lastName}`,
        email: newEmpData.email,
        roleId: mapRoleToRoleId(newEmpData.role),
        department: newEmpData.department,
        isActive: newEmpData.status !== 'Đã nghỉ việc',
        salary: newEmpData.salary || 0
      };
      const response = await api.post('/Users', userPayload);
      const generatedPassword = response.data.generatedPassword;

      // Append to activities
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        type: 'success',
        title: 'Thêm nhân viên mới',
        description: `${newEmpData.firstName} ${newEmpData.lastName} đã tham gia với vai trò ${newEmpData.role} tại bộ phận ${newEmpData.department}.`,
        time: 'Vừa xong',
        badgeText: 'Thành công'
      };
      setActivities((prev) => [newActivity, ...prev]);

      toast.success(
        (t) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm">Thêm nhân viên thành công!</span>
            <span className="text-xs">Mật khẩu khởi tạo của <b>{newEmpData.email}</b> là:</span>
            <span className="font-mono bg-slate-100 px-2 py-1 rounded text-amber-700 text-center text-lg mt-1 select-all">{generatedPassword}</span>
            <span className="text-[10px] text-slate-500 mt-1 italic">Mật khẩu này chỉ hiện 1 lần, hãy copy gửi cho nhân viên.</span>
          </div>
        ),
        { duration: 15000 }
      );
      
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding employee:', error);
      triggerToast(error.response?.data?.message || 'Thêm nhân viên thất bại', 'info');
    }
  };

  const handleDeactivateEmployee = async (id: string) => {
    const targetEmployee = employees.find(e => e.id === id);
    if (!targetEmployee) return;

    try {
      await api.patch(`/Users/${id}/deactivate`);
      
      // Append to activities
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        type: 'warning',
        title: 'Đã cho nghỉ việc',
        description: `${targetEmployee.firstName} ${targetEmployee.lastName} đã được đánh dấu là nghỉ việc.`,
        time: 'Vừa xong',
        badgeText: 'Cảnh báo'
      };
      setActivities((prev) => [newActivity, ...prev]);
      
      triggerToast(`Đã chuyển nhân viên sang trạng thái nghỉ việc!`);
      fetchUsers();
    } catch (error) {
      console.error('Error deactivating employee:', error);
      triggerToast('Thao tác thất bại', 'info');
    }
  };

  const handleHardDeleteEmployee = async (id: string) => {
    const targetEmployee = employees.find(e => e.id === id);
    if (!targetEmployee) return;

    try {
      await api.delete(`/Users/${id}`);
      
      // Append to activities
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        type: 'warning',
        title: 'Đã xóa bản ghi nhân viên',
        description: `${targetEmployee.firstName} ${targetEmployee.lastName} đã bị xóa hoàn toàn khỏi hồ sơ hệ thống.`,
        time: 'Vừa xong',
        badgeText: 'Cảnh báo'
      };
      setActivities((prev) => [newActivity, ...prev]);
      
      triggerToast(`Xóa nhân viên thành công!`);
      fetchUsers();
    } catch (error) {
      console.error('Error hard deleting employee:', error);
      triggerToast('Xóa nhân viên thất bại (Chỉ Admin mới có quyền này)', 'info');
    }
  };

  const canEditPermissions = user?.role === 'Admin' || user?.role === 'Manager';

  const handleUpdatePermissions = async (updatedPerms: PermissionRow[]) => {
    if (!canEditPermissions) {
      triggerToast('Bạn không có quyền thay đổi ma trận phân quyền.', 'info');
      return;
    }
    // Optimistic update
    setPermissions(updatedPerms);

    try {
      await api.put('/Permissions', flattenPermissions(updatedPerms));
      // Append to activities
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        type: 'info',
        title: 'Cập nhật Ma trận Bảo mật',
        description: 'Quyền hạn vai trò trên toàn hệ thống đã được lưu vào cơ sở dữ liệu.',
        time: 'Vừa xong'
      };
      setActivities((prev) => [newActivity, ...prev]);
      triggerToast('Lưu ma trận quyền thành công!');
    } catch (e) {
      triggerToast('Lưu ma trận quyền thất bại. Vui lòng thử lại.', 'info');
      // Rollback
      await fetchPermissions();
    }
  };

  const handleResetPermissions = async () => {
    if (!canEditPermissions) {
      triggerToast('Bạn không có quyền đặt lại ma trận phân quyền.', 'info');
      return;
    }
    setPermissions(INITIAL_PERMISSIONS);
    try {
      await api.put('/Permissions', flattenPermissions(INITIAL_PERMISSIONS));
      triggerToast('Đã đặt lại ma trận quyền về mặc định!');
    } catch (e) {
      triggerToast('Đặt lại ma trận quyền thất bại.', 'info');
    }
  };

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
        permissions={permissions}
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
                employees={employees}
                permissions={permissions}
                onAddEmployee={handleAddEmployee}
                onDeactivateEmployee={handleDeactivateEmployee}
                onDeleteEmployee={handleHardDeleteEmployee}
                onShowNotification={triggerToast}
                searchTerm={searchTerm}
                currentUserRole={user?.role}
              />
            )}

            {currentTab === 'permissions' && (
              <PermissionsView
                permissions={permissions}
                onUpdatePermissions={handleUpdatePermissions}
                onResetPermissions={handleResetPermissions}
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
