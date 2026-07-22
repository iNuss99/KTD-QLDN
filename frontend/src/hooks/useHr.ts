import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

// ── API functions ──────────────────────────────────────────────

export interface AuditLogParams {
  page: number;
  pageSize: number;
  actionType?: string;
  severity?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export const fetchAuditLogs = async (params: AuditLogParams) => {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  p.set('pageSize', String(params.pageSize));
  if (params.actionType) p.set('action', params.actionType);
  if (params.severity) p.set('severity', params.severity);
  if (params.fromDate) p.set('from', params.fromDate);
  if (params.toDate) p.set('to', params.toDate);
  if (params.search) p.set('search', params.search);

  const res = await api.get(`/AuditLog?${p.toString()}`);
  return {
    items: res.data.items ?? res.data ?? [],
    totalCount: res.data.totalCount ?? (res.data.items ?? res.data ?? []).length,
  };
};

export const fetchAttendance = async (date: string) => {
  const res = await api.get(`/Hr/attendance/daily?date=${date}`);
  return res.data ?? [];
};

export const fetchPayroll = async (month: number, year: number) => {
  const res = await api.get(`/Hr/payroll?month=${month}&year=${year}`);
  return res.data ?? [];
};

export const calculatePayroll = async (userId: string, month: number, year: number) => {
  const res = await api.post('/Hr/payroll/calculate', { userId, month, year });
  return res.data;
};

// ── Hooks ──────────────────────────────────────────────────────

export function useAuditLogs(params: AuditLogParams) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => fetchAuditLogs(params),
    placeholderData: (prev) => prev,
  });
}

export function useAttendance(date: string, enabled: boolean) {
  return useQuery({
    queryKey: ['attendance', date],
    queryFn: () => fetchAttendance(date),
    enabled,
  });
}

export function usePayroll(month: number, year: number) {
  return useQuery({
    queryKey: ['payroll', month, year],
    queryFn: () => fetchPayroll(month, year),
  });
}

export function useCalculatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, month, year }: { userId: string; month: number; year: number }) =>
      calculatePayroll(userId, month, year),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['payroll', variables.month, variables.year] });
    },
  });
}
