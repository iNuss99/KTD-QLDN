import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { PermissionRow } from '../types';
import { INITIAL_PERMISSIONS } from '../utils/data';

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

export const fetchPermissions = async () => {
  const res = await api.get('/Permissions');
  return buildPermissionsFromApi(res.data);
};

export const savePermissions = async (rows: PermissionRow[]) => {
  const flatData = flattenPermissions(rows);
  const res = await api.post('/Permissions/bulk', flatData);
  return res.data;
};

export const PERMISSIONS_KEY = ['permissions'] as const;

export function usePermissions() {
  return useQuery({
    queryKey: PERMISSIONS_KEY,
    queryFn: fetchPermissions,
  });
}

export function useSavePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: savePermissions,
    onSuccess: () => qc.invalidateQueries({ queryKey: PERMISSIONS_KEY }),
  });
}
