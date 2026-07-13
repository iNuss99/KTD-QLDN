/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EmployeeStatus = 'Đang hoạt động' | 'Nghỉ phép' | 'Đã nghỉ việc';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  status: EmployeeStatus;
  avatarUrl?: string;
  avatarInitials: string;
  salary?: number;
}

export interface PermissionRow {
  id: string;
  action: string;
  module: 'Finance' | 'HR' | 'Inventory' | 'Orders';
  admin: boolean;
  manager: boolean;
  accountant: boolean;
  salesStaff: boolean;
  warehouseStaff: boolean;
  disabledRoles?: string[]; // e.g., ['salesStaff']
}

export interface Activity {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  time: string;
  badgeText?: string;
}

export interface KPICardData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  isStable?: boolean;
  isAttention?: boolean;
  iconName: string;
}

export interface ExpenseCategory {
  name: string;
  percentage: number;
  value: string;
  color: string;
  bgClass: string;
}

export interface MonthlyGrowth {
  month: string;
  revenue: number;
  expenses: number;
}
