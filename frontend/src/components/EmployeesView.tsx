/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  X,
  User,
  Trash2,
  Mail,
  Briefcase,
  Layers,
  Check
} from 'lucide-react';
import { Employee, EmployeeStatus } from '../types';
import api from '../api';

interface EmployeesViewProps {
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'id' | 'avatarInitials'> & { password?: string }) => void;
  onDeactivateEmployee: (id: string) => void;
  onDeleteEmployee: (id: string) => void;
  onShowNotification: (message: string) => void;
  searchTerm: string;
  currentUserRole?: string;
}

export default function EmployeesView({
  employees,
  onAddEmployee,
  onDeactivateEmployee,
  onDeleteEmployee,
  onShowNotification,
  searchTerm,
  currentUserRole
}: EmployeesViewProps) {
  // Local page state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState('Tất cả');

  // Form Fields State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Kinh doanh (Sales/CSKH)');
  const [role, setRole] = useState('Sales Staff');
  const [salary, setSalary] = useState('');

  const isManagerOrAdmin = currentUserRole === 'Admin' || currentUserRole === 'Manager';
  const isManager = currentUserRole === 'Manager';

  const mapRoleToRoleId = (roleName: string) => {
    switch (roleName) {
      case 'Admin': return 1;
      case 'Manager': return 2;
      case 'Accountant': return 3;
      case 'Sales Staff': return 4;
      case 'Warehouse Staff': return 5;
      default: return 4;
    }
  };

  const departmentRolesMap: Record<string, string[]> = isManager ? {
    'Kinh doanh (Sales/CSKH)': ['Sales Staff'],
    'Kho vận': ['Warehouse Staff']
  } : {
    'Ban Giám đốc': ['Admin', 'Manager'],
    'Kinh doanh (Sales/CSKH)': ['Sales Staff'],
    'Kho vận': ['Warehouse Staff'],
    'Kế toán': ['Accountant']
  };

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    setRole(departmentRolesMap[newDept]?.[0] || '');
  };

  const itemsPerPage = 6;

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(term) ||
      emp.lastName.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.role.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term);
      
    const matchesDepartment = departmentFilter === 'Tất cả' || emp.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  // Pagination calculations
  const totalResults = filteredEmployees.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = () => {
    // Clear form
    setFirstName('');
    setLastName('');
    setEmail('');
    setDepartment('Kinh doanh (Sales/CSKH)');
    setRole('Sales Staff');
    setSalary('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSalaryChange = (value: string) => {
    const rawValue = value.replace(/\D/g, '');
    if (!rawValue) {
      setSalary('');
      return;
    }
    const formattedValue = new Intl.NumberFormat('en-US').format(parseInt(rawValue, 10));
    setSalary(formattedValue);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      onShowNotification('Vui lòng điền tất cả các trường bắt buộc.');
      return;
    }

    onAddEmployee({
      firstName,
      lastName,
      email,
      department,
      role,
      status: 'Đang hoạt động' as any,
      salary: parseFloat(salary.replace(/,/g, '')) || 0
    });

    handleCloseModal();
  };

  const handleDeleteClick = (id: string, name: string) => {
    onDeleteEmployee(id);
    setActiveActionsId(null);
  };

  const handleDeactivateClick = (id: string, name: string) => {
    onDeactivateEmployee(id);
    setActiveActionsId(null);
  };

  const handleResetPassword = async (id: string, name: string) => {
    try {
      const response = await api.post(`/Users/${id}/reset-password`);
      onShowNotification(`Đã cấp lại mật khẩu cho ${name}. Mật khẩu mới: ${response.data.generatedPassword}`);
    } catch (err) {
      onShowNotification(`Lỗi khi cấp lại mật khẩu cho ${name}.`);
    }
    setActiveActionsId(null);
  };

  const toggleActionsDropdown = (id: string) => {
    if (activeActionsId === id) {
      setActiveActionsId(null);
    } else {
      setActiveActionsId(id);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Đang hoạt động':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đang hoạt động
          </span>
        );
      case 'Nghỉ phép':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Nghỉ phép
          </span>
        );
      case 'Đã nghỉ việc':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Đã nghỉ việc
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nhân sự</h1>
          <p className="text-xs text-slate-500 mt-1">Quản lý nhân sự, vai trò và quyền truy cập hệ thống.</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            onClick={handleOpenModal}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus size={16} />
            Thêm Nhân viên
          </button>
        </div>
      </div>

      {/* Main Registry Table Area */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[440px]">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col gap-4 bg-white">
          <div className="flex flex-wrap gap-2">
            {(isManager
              ? ['Tất cả', 'Kinh doanh (Sales/CSKH)', 'Kho vận']
              : ['Tất cả', 'Ban Giám đốc', 'Kinh doanh (Sales/CSKH)', 'Kho vận', 'Kế toán']
            ).map(dept => (
              <button
                key={dept}
                onClick={() => {
                  setDepartmentFilter(dept);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                  departmentFilter === dept
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="text-xs text-slate-500 font-semibold">
              {filteredEmployees.length} nhân sự đăng ký khớp với tiêu chí
            </div>
            <div className="text-[10px] text-slate-400">
              Nhấp vào menu cột hành động để cập nhật hoặc xóa bản ghi
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Tên</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Vai trò</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Phòng ban</th>
                {isManagerOrAdmin && <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Lương</th>}
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 text-xs font-normal">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400 font-medium">
                    <User size={36} className="mx-auto opacity-10 mb-2" />
                    Không tìm thấy nhân viên nào khớp với tiêu chí tìm kiếm.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Name column */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {emp.avatarUrl ? (
                          <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                            <img
                              alt={`${emp.firstName} ${emp.lastName}`}
                              className="w-full h-full object-cover"
                              src={emp.avatarUrl}
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                            {emp.avatarInitials}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center">
                            {`${emp.firstName} ${emp.lastName}`}
                            {emp.status === 'Đã nghỉ việc' && (
                              <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded border border-slate-200">Ngưng hoạt động</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role column */}
                    <td className="px-6 py-3.5 text-slate-600 font-medium">
                      {emp.role}
                    </td>

                    {/* Department column */}
                    <td className="px-6 py-3.5 text-slate-500 font-medium">
                      {emp.department}
                    </td>

                    {/* Salary column */}
                    {isManagerOrAdmin && (
                      <td className="px-6 py-3.5 text-slate-700 font-semibold">
                        {emp.salary?.toLocaleString()} đ
                      </td>
                    )}

                    {/* Status column */}
                    <td className="px-6 py-3.5">
                      {renderStatusBadge(emp.status)}
                    </td>

                    {/* Actions column */}
                    <td className="px-6 py-3.5 text-right relative">
                      <button
                        onClick={() => toggleActionsDropdown(emp.id)}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition-colors cursor-pointer"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Floating actions contextual popup menu */}
                      {activeActionsId === emp.id && (
                        <div className="absolute right-6 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-30 divide-y divide-slate-100 text-left">
                          <div className="py-0.5">
                            <button
                              onClick={() => handleResetPassword(emp.id, `${emp.firstName} ${emp.lastName}`)}
                              className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-1.5"
                            >
                              <Check size={13} />
                              Cấp lại Mật khẩu
                            </button>
                          </div>
                          {emp.status === 'Đang hoạt động' && (
                            <div className="py-0.5">
                              <button
                                onClick={() => handleDeactivateClick(emp.id, `${emp.firstName} ${emp.lastName}`)}
                                className="w-full text-left px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-1.5 font-medium"
                              >
                                <X size={13} />
                                Cho nghỉ việc
                              </button>
                            </div>
                          )}
                          {emp.status === 'Đã nghỉ việc' && currentUserRole === 'Admin' && (
                            <div className="py-0.5">
                              <button
                                onClick={() => handleDeleteClick(emp.id, `${emp.firstName} ${emp.lastName}`)}
                                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1.5 font-medium"
                              >
                                <Trash2 size={13} />
                                Xóa Bản ghi
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between mt-auto">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Hiển thị <span className="font-semibold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                  <span className="font-semibold text-slate-800">
                    {Math.min(currentPage * itemsPerPage, totalResults)}
                  </span>{' '}
                  trong số <span className="font-semibold text-slate-800">{totalResults}</span> kết quả
                </p>
              </div>

              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-1.5 rounded-l-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-semibold cursor-pointer ${
                        currentPage === i + 1
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-1.5 rounded-r-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            </div>

            {/* Mobile simplified pagination */}
            <div className="flex items-center justify-between w-full sm:hidden">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-slate-200 text-xs font-medium rounded-lg text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-3 py-2 border border-slate-200 text-xs font-medium rounded-lg text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal Overlay Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          {/* Backdrop blur effect */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          />

          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-200">
              
              {/* Modal Header */}
              <div className="bg-white px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-800">Thêm Nhân viên mới</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleFormSubmit}>
                <div className="p-5 space-y-4">
                  
                  {/* Photo Upload placeholder */}
                  <div className="flex gap-4 items-center">
                    <div className="h-16 w-16 rounded-full border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 hover:border-indigo-500 transition-all group shrink-0">
                      <UploadCloud size={18} className="group-hover:text-indigo-600 transition-colors" />
                      <span className="text-[9px] mt-0.5 group-hover:text-indigo-600 select-none">Ảnh</span>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-700">Ảnh Đại diện</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Kéo thả hoặc tải lên JPEG/PNG. Kích thước tối đa 2MB.</p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modal-first-name" className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Tên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="modal-first-name"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 bg-slate-50"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-last-name" className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Họ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="modal-last-name"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 bg-slate-50"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                    <div className="col-span-2">
                      <label htmlFor="modal-email" className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Địa chỉ Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="modal-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 bg-slate-50"
                        placeholder="j.doe@techretail.com"
                      />
                    </div>

                  {isManagerOrAdmin && (
                    <div className="col-span-2">
                      <label htmlFor="modal-salary" className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Lương cơ bản <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="modal-salary"
                          type="text"
                          required
                          value={salary}
                          onChange={(e) => handleSalaryChange(e.target.value)}
                          className="w-full text-xs px-3 py-2 pr-12 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 bg-slate-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="10,000,000"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium pointer-events-none">VNĐ</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modal-dept" className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Phòng ban
                      </label>
                      <select
                        id="modal-dept"
                        value={department}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 bg-slate-50"
                      >
                        {Object.keys(departmentRolesMap).map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="modal-role" className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Vai trò
                      </label>
                      <select
                        id="modal-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 bg-slate-50"
                      >
                        {departmentRolesMap[department]?.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex flex-row-reverse gap-2 rounded-b-xl">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Lưu Nhân viên
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
