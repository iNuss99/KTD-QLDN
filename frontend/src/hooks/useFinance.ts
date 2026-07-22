import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

// ── API functions ──────────────────────────────────────────────

export const fetchFinanceCategories = async () => {
  const res = await api.get('/Finance/categories');
  return res.data ?? [];
};

export const fetchFinanceGrowth = async () => {
  const res = await api.get('/Finance/growth');
  return res.data ?? [];
};

export const addExpense = async (payload: { category: string; amount: number; description: string; date: string }) => {
  const res = await api.post('/Finance/expenses', payload);
  return res.data;
};

// ── Hooks ──────────────────────────────────────────────────────

export const FINANCE_KEY = ['finance'] as const;

export function useFinanceCategories() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'categories'],
    queryFn: fetchFinanceCategories,
  });
}

export function useFinanceGrowth() {
  return useQuery({
    queryKey: [...FINANCE_KEY, 'growth'],
    queryFn: fetchFinanceGrowth,
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINANCE_KEY });
      qc.invalidateQueries({ queryKey: ['dashboard', 'kpis'] });
    },
  });
}
