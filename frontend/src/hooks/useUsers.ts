import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

// ── API functions ──────────────────────────────────────────────

export const fetchUsers = async () => {
  const res = await api.get('/Users');
  const rawData = res.data.items ?? res.data ?? [];
  
  const mapRoleIdToName = (roleId: number) => {
    switch(roleId) {
      case 1: return 'Admin';
      case 2: return 'Manager';
      case 3: return 'Accountant';
      case 4: return 'Sales Staff';
      case 5: return 'Warehouse Staff';
      default: return 'Sales Staff';
    }
  };

  return rawData.map((u: any) => {
    const parts = (u.fullName || '').trim().split(' ');
    const lastName = parts.length > 1 ? parts.pop() : '';
    const firstName = parts.join(' ');
    const roleName = u.role?.roleName || mapRoleIdToName(u.roleId);
    
    return {
      id: u.id,
      firstName: firstName || 'Chưa cập nhật',
      lastName: lastName,
      email: u.email,
      role: roleName,
      department: u.department || 'Kinh doanh (Sales/CSKH)',
      status: u.isActive ? 'Đang hoạt động' : 'Đã nghỉ việc',
      avatarUrl: u.avatarUrl,
      avatarInitials: ((firstName || 'U').charAt(0) + (lastName ? lastName.charAt(0) : '')).toUpperCase(),
      salary: u.salary
    };
  });
};

export const createUser = async (payload: { fullName: string; email: string; roleId: number; department?: string; salary?: number }) => {
  const res = await api.post('/Users', payload);
  return res.data;
};

export const resetPassword = async (userId: string) => {
  const res = await api.post(`/Users/${userId}/reset-password`);
  return res.data;
};

export const deactivateUser = async (userId: string) => {
  const res = await api.patch(`/Users/${userId}/deactivate`);
  return res.data;
};

export const deleteUser = async (userId: string) => {
  const res = await api.delete(`/Users/${userId}`);
  return res.data;
};


// ── Hooks ──────────────────────────────────────────────────────

export const USERS_KEY = ['users'] as const;

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: fetchUsers,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
