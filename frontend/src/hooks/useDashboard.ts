import { useQuery } from '@tanstack/react-query';
import api from '../api';

// ── API functions ──────────────────────────────────────────────

export const fetchKpis = async () => {
  const res = await api.get('/Dashboard/kpis');
  return res.data;
};

export const fetchRevenueChart = async () => {
  const res = await api.get('/Dashboard/revenue-chart');
  return (res.data as any[]).map((r) => ({
    label: r.label
      .replace('Jan','T1').replace('Feb','T2').replace('Mar','T3')
      .replace('Apr','T4').replace('May','T5').replace('Jun','T6')
      .replace('Jul','T7').replace('Aug','T8').replace('Sep','T9')
      .replace('Oct','T10').replace('Nov','T11').replace('Dec','T12'),
    amount: r.amount,
    cost: r.cost,
  }));
};

export const fetchTopProducts = async () => {
  const res = await api.get('/Dashboard/top-products?limit=5');
  return res.data;
};

export const fetchOrderDistribution = async () => {
  const res = await api.get('/Dashboard/order-status-distribution');
  return res.data;
};

export const fetchSalesTrend = async () => {
  const res = await api.get('/Dashboard/sales-trend?days=30');
  return res.data;
};

export const fetchMarginDetails = async (page: number, pageSize: number) => {
  const res = await api.get(`/Dashboard/margin-details?page=${page}&pageSize=${pageSize}`);
  return res.data;
};

// ── Hooks ──────────────────────────────────────────────────────

// 30 giây refetch cho real-time dashboard
const DASHBOARD_STALE = 1000 * 30;

export function useDashboardKpis() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: fetchKpis,
    staleTime: DASHBOARD_STALE,
    refetchInterval: 1000 * 30, // auto-refetch mỗi 30s thay cho setInterval thủ công
  });
}

export function useRevenueChart() {
  return useQuery({
    queryKey: ['dashboard', 'revenue-chart'],
    queryFn: fetchRevenueChart,
    staleTime: DASHBOARD_STALE,
    refetchInterval: 1000 * 30,
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: fetchTopProducts,
    staleTime: DASHBOARD_STALE,
    refetchInterval: 1000 * 30,
  });
}

export function useOrderDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'order-distribution'],
    queryFn: fetchOrderDistribution,
    staleTime: DASHBOARD_STALE,
    refetchInterval: 1000 * 30,
  });
}

export function useSalesTrend() {
  return useQuery({
    queryKey: ['dashboard', 'sales-trend'],
    queryFn: fetchSalesTrend,
    staleTime: DASHBOARD_STALE,
    refetchInterval: 1000 * 30,
  });
}

export function useMarginDetails(page: number, pageSize: number, enabled: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'margin-details', page, pageSize],
    queryFn: () => fetchMarginDetails(page, pageSize),
    enabled,
    placeholderData: (prev) => prev,
  });
}
