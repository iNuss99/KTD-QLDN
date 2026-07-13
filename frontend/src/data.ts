/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, PermissionRow, Activity, ExpenseCategory, MonthlyGrowth } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 's.jenkins@ktd.com',
    role: 'Store Manager',
    department: 'Retail Ops',
    status: 'Active',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATR2KC_QKoo4kLHGbZgxewNPvh7hDrNtOVSrKdO1yeEHvF5sKAQzsTpDUQVZ93icFYXUelcr2e52usgtqz9r7MjwrvZ1Bb-t-TulL45_a9lD7MJUyZh0TVEZbg9gr_9Mhqek50FeA9LavZVCkoqMUwWs8WrFEGMeVghDKXC3TfEiI9LpYC1eNwu-1u6JGwoMRhfW4TnInWNHP_WL3FhEUEUAUpfrO7ZVw4YlmeR2uu3ZZE3Bivta3nejkpKHdCatpD67E-oqfmDNXY',
    avatarInitials: 'SJ'
  },
  {
    id: 'emp-2',
    firstName: 'Marcus',
    lastName: 'Chen',
    email: 'm.chen@ktd.com',
    role: 'Inventory Analyst',
    department: 'Logistics',
    status: 'Active',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKd6uppsOyMT-wNUNgQ3zWxtqlFNoHXUTLqXPd-cBOEmqpd7JYw6CmVMbdujOFQZN3ArTQQHxSO7vozi1-jokcsmli68cQ80QX0nkV57NDKtj-zWdz-XmHIFOBI5AnyQ0T382fedl0k_kOE1JazkWKPVWmkdVvbXRwXr_hKmNSij1lZ7a9p1rhQkwlL_hOK6n0ajMgJn2VzHrFE4mDJiUs-aT9c9BbDHs6Nze3Lq_jfyhaLjtAQr4t8jucKGnaKbYcnTmxw7pVYfmQ',
    avatarInitials: 'MC'
  },
  {
    id: 'emp-3',
    firstName: 'Elena',
    lastName: 'Rodriguez',
    email: 'e.rodriguez@ktd.com',
    role: 'Regional Director',
    department: 'Executive',
    status: 'On Leave',
    avatarInitials: 'EL'
  },
  {
    id: 'emp-4',
    firstName: 'David',
    lastName: 'Kim',
    email: 'd.kim@ktd.com',
    role: 'IT Support Spec.',
    department: 'Information Tech',
    status: 'Active',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYx0BLJ4S0Ut-uuKV50bfGu_iy6kbqJD38yTW-LRxqg7MEJlHpYvz44lLEAsiLJMSMVHLkismwb3CrLQxg7fsDsLwc3h1BwnwGV5eYsok-EO_aGoaxwqd9KCMbPRJOG5Kv5d25rKMJc7qGHtR1uM9nDcaLEblU2GUH_H7eKHosilULZPZpYZj5rUoORdQ_oDtC3XwjIUN4l-OELaEpPgoov7zRRCRLG1y_yjKrc6wtoZZQKQz3krqJiS-eZX__gUlcbdYD4EbzholG',
    avatarInitials: 'DK'
  },
  {
    id: 'emp-5',
    firstName: 'Alice',
    lastName: 'Wright',
    email: 'a.wright@ktd.com',
    role: 'Sales Associate',
    department: 'Retail Ops',
    status: 'Terminated',
    avatarInitials: 'AW'
  },
  {
    id: 'emp-6',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'r.taylor@ktd.com',
    role: 'Sales Associate',
    department: 'Retail Ops',
    status: 'Active',
    avatarInitials: 'RT'
  },
  {
    id: 'emp-7',
    firstName: 'Jessica',
    lastName: 'Miller',
    email: 'j.miller@ktd.com',
    role: 'HR Specialist',
    department: 'Executive',
    status: 'Active',
    avatarInitials: 'JM'
  },
  {
    id: 'emp-8',
    firstName: 'Thomas',
    lastName: 'Anderson',
    email: 't.anderson@ktd.com',
    role: 'Security Engineer',
    department: 'Information Tech',
    status: 'Active',
    avatarInitials: 'TA'
  },
  {
    id: 'emp-9',
    firstName: 'Amanda',
    lastName: 'White',
    email: 'a.white@ktd.com',
    role: 'Inventory Analyst',
    department: 'Logistics',
    status: 'On Leave',
    avatarInitials: 'AW'
  },
  {
    id: 'emp-10',
    firstName: 'Kevin',
    lastName: 'Martin',
    email: 'k.martin@ktd.com',
    role: 'Store Manager',
    department: 'Retail Ops',
    status: 'Active',
    avatarInitials: 'KM'
  },
  {
    id: 'emp-11',
    firstName: 'Lisa',
    lastName: 'Garcia',
    email: 'l.garcia@ktd.com',
    role: 'Auditor',
    department: 'Executive',
    status: 'Active',
    avatarInitials: 'LG'
  },
  {
    id: 'emp-12',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'j.wilson@ktd.com',
    role: 'Floor Staff',
    department: 'Retail Ops',
    status: 'Active',
    avatarInitials: 'JW'
  }
];

export const INITIAL_PERMISSIONS: PermissionRow[] = [
  {
    id: 'perm-1',
    action: 'Xem Báo cáo Tài chính',
    module: 'Finance',
    admin: true,
    manager: true,
    accountant: true,
    salesStaff: false,
    warehouseStaff: false
  },
  {
    id: 'perm-2',
    action: 'Phê duyệt Bảng lương',
    module: 'Finance',
    admin: true,
    manager: false,
    accountant: true,
    salesStaff: false,
    warehouseStaff: false
  },
  {
    id: 'perm-3',
    action: 'Xem Danh sách Nhân viên',
    module: 'HR',
    admin: true,
    manager: true,
    accountant: true,
    salesStaff: false,
    warehouseStaff: false
  },
  {
    id: 'perm-4',
    action: 'Chỉnh sửa Lịch làm việc',
    module: 'HR',
    admin: true,
    manager: true,
    accountant: false,
    salesStaff: false,
    warehouseStaff: false
  },
  {
    id: 'perm-5',
    action: 'Điều chỉnh Mức Tồn kho',
    module: 'Inventory',
    admin: true,
    manager: true,
    accountant: false,
    salesStaff: false,
    warehouseStaff: true
  },
  {
    id: 'perm-6',
    action: 'Bắt đầu Kiểm kê Tồn kho',
    module: 'Inventory',
    admin: true,
    manager: true,
    accountant: false,
    salesStaff: false,
    warehouseStaff: true
  },
  {
    id: 'perm-7',
    action: 'Thêm Chi phí',
    module: 'Finance',
    admin: true,
    manager: true,
    accountant: true,
    salesStaff: false,
    warehouseStaff: false
  },
  {
    id: 'perm-8',
    action: 'Quản lý Tất cả Đơn hàng',
    module: 'Orders',
    admin: true,
    manager: true,
    accountant: false,
    salesStaff: false,
    warehouseStaff: false
  }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    type: 'success',
    title: 'Báo cáo Quý 3 đã được Phê duyệt',
    description: 'Phòng tài chính đã ký duyệt.',
    time: '10 phút trước'
  },
  {
    id: 'act-2',
    type: 'warning',
    title: 'Tải Máy chủ Cao',
    description: 'Node cơ sở dữ liệu 3 sắp quá tải.',
    time: '45 phút trước',
    badgeText: 'Cảnh báo'
  },
  {
    id: 'act-3',
    type: 'success',
    title: 'Nhân viên Mới gia nhập',
    description: 'Sarah Jenkins, Marketing.',
    time: '2 giờ trước',
    badgeText: 'Thành công'
  },
  {
    id: 'act-4',
    type: 'info',
    title: 'Đồng bộ Tồn kho',
    description: 'Đã hoàn tất đồng bộ tự động.',
    time: '4 giờ trước'
  },
  {
    id: 'act-5',
    type: 'critical',
    title: 'Sao lưu Thất bại',
    description: 'Đã đạt giới hạn dung lượng lưu trữ trên bản sao S3.',
    time: '1 ngày trước',
    badgeText: 'Nghiêm trọng'
  }
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { name: 'Cơ sở hạ tầng', percentage: 40, value: '$960k', color: '#3525cd', bgClass: 'bg-[#3525cd]' },
  { name: 'Lương thưởng', percentage: 24, value: '$576k', color: '#c3c0ff', bgClass: 'bg-[#c3c0ff]' },
  { name: 'Tiếp thị', percentage: 20, value: '$480k', color: '#dae2fd', bgClass: 'bg-[#dae2fd]' },
  { name: 'Nghiên cứu & Phát triển', percentage: 16, value: '$384k', color: '#cbdbf5', bgClass: 'bg-[#cbdbf5]' }
];

export const MONTHLY_GROWTH_DATA: MonthlyGrowth[] = [
  { month: 'Thg 1', revenue: 750000, expenses: 400000 },
  { month: 'Thg 2', revenue: 820000, expenses: 450000 },
  { month: 'Thg 3', revenue: 790000, expenses: 500000 },
  { month: 'Thg 4', revenue: 950000, expenses: 480000 },
  { month: 'Thg 5', revenue: 1100000, expenses: 600000 },
  { month: 'Thg 6', revenue: 1245000, expenses: 650000 }
];

export const REVENUE_HISTORY_DATA = [
  { name: 'Th2', revenue: 12000 },
  { name: 'Th3', revenue: 15000 },
  { name: 'Th4', revenue: 18000 },
  { name: 'Th5', revenue: 14000 },
  { name: 'Th6', revenue: 22000 },
  { name: 'Th7', revenue: 26000 },
  { name: 'CN', revenue: 21000 }
];
