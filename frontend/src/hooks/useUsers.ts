import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

// ── API functions ──────────────────────────────────────────────

export const fetchUsers = async () => {
  const res = await api.get('/Users');
  return res.data.items ?? res.data ?? [];
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
