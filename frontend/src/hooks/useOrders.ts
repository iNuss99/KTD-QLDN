import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

// ── API functions ──────────────────────────────────────────────

export interface OrdersParams {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  createdBy?: string;
}

export const fetchOrders = async (params: OrdersParams) => {
  const p = new URLSearchParams();
  p.set('page', String(params.page));
  p.set('pageSize', String(params.pageSize));
  if (params.status && params.status !== 'ALL') p.set('status', params.status);
  if (params.search) p.set('search', params.search);
  if (params.fromDate) p.set('fromDate', params.fromDate);
  if (params.toDate) p.set('toDate', params.toDate);
  if (params.createdBy) p.set('createdBy', params.createdBy);

  const res = await api.get(`/Orders?${p.toString()}`);
  return {
    items: res.data.items ?? res.data ?? [],
    totalCount: res.data.totalCount ?? (res.data.items ?? res.data ?? []).length,
  };
};

export const createOrder = async (payload: { customerName: string; orderDetails: { productId: string; quantity: number; unitPrice: number }[] }) => {
  const res = await api.post('/Orders', payload);
  return res.data;
};

export const updateOrderStatus = async (orderId: string, payload: { status: string; reason?: string }) => {
  const res = await api.patch(`/Orders/${orderId}/status`, payload);
  return res.data;
};

export const deleteOrder = async (orderId: string) => {
  await api.delete(`/Orders/${orderId}`);
};

export const bulkUpdateOrderStatus = async (payload: { orderIds: string[]; newStatus: string; reason?: string }) => {
  const res = await api.post('/Orders/bulk-status-update', payload);
  return res.data;
};

// ── Hooks ──────────────────────────────────────────────────────

export const ordersKey = (params: OrdersParams) => ['orders', params] as const;

export function useOrders(params: OrdersParams) {
  return useQuery({
    queryKey: ordersKey(params),
    queryFn: () => fetchOrders(params),
    placeholderData: (prev) => prev, // giữ data cũ khi đổi page/filter
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: { status: string; reason?: string } }) =>
      updateOrderStatus(orderId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useBulkUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateOrderStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
