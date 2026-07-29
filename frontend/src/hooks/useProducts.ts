import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

// ── API functions ──────────────────────────────────────────────

export const fetchProducts = async () => {
  const res = await api.get('/Products');
  return res.data.items ?? res.data ?? [];
};

export const createProduct = async (payload: {
  sku: string; productName: string; costPrice: number;
  sellingPrice: number; stockQuantity: number; minStockThreshold: number; imageUrl?: string;
}) => {
  const res = await api.post('/Products', payload);
  return res.data;
};

export const adjustStock = async (productId: string, payload: {
  quantityChange: number; reason: string;
}) => {
  const res = await api.put(`/Products/${productId}/stock`, payload);
  return res.data;
};

export const receiveStock = async (productId: string, payload: {
  quantityChange: number; reason: string; newCostPrice?: number;
}) => {
  const res = await api.put(`/Products/${productId}/stock`, payload);
  return res.data;
};

export const fetchStockHistory = async (productId: string) => {
  const res = await api.get(`/Products/${productId}/stock-history`);
  return res.data ?? [];
};

// ── Hooks ──────────────────────────────────────────────────────

export const PRODUCTS_KEY = ['products'] as const;

export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: fetchProducts,
  });
}

export function useStockHistory(productId: string | null) {
  return useQuery({
    queryKey: ['stock-history', productId],
    queryFn: () => fetchStockHistory(productId!),
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: { quantityChange: number; reason: string } }) =>
      adjustStock(productId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useReceiveStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: { quantityChange: number; reason: string; newCostPrice?: number } }) =>
      receiveStock(productId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
