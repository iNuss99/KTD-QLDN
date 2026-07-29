import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import api from '../api';
import { useAuthStore } from '../store/authStore';
import { 
  RevenueChartItem, 
  TopProductItem, 
  OrderDistributionData, 
  SalesTrendItem, 
  MarginTableResponse,
  Activity,
  KPICardData
} from '../types';

// ── API functions ──────────────────────────────────────────────

export const fetchKpis = async (range: string) => {
  const res = await api.get(`/Dashboard/kpis?range=${range}`);
  return res.data;
};

export const fetchRevenueChart = async (range: string): Promise<RevenueChartItem[]> => {
  const res = await api.get(`/Dashboard/revenue-chart?range=${range}`);
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

export const fetchTopProducts = async (range: string): Promise<TopProductItem[]> => {
  const res = await api.get(`/Dashboard/top-products?limit=5&range=${range}`);
  return res.data;
};

export const fetchOrderDistribution = async (range: string): Promise<OrderDistributionData> => {
  const res = await api.get(`/Dashboard/order-status-distribution?range=${range}`);
  return res.data;
};

export const fetchSalesTrend = async (range: string): Promise<SalesTrendItem[]> => {
  const res = await api.get(`/Dashboard/sales-trend?days=30&range=${range}`);
  return res.data;
};

export const fetchMarginDetails = async (page: number, pageSize: number, range: string = 'month'): Promise<MarginTableResponse> => {
  const res = await api.get(`/Dashboard/margin-details?page=${page}&pageSize=${pageSize}&range=${range}`);
  return res.data;
};

export const fetchRecentActivities = async (): Promise<Activity[]> => {
  const res = await api.get('/Dashboard/recent-activities?limit=10');
  return res.data;
};

// ── Hooks ──────────────────────────────────────────────────────

const DASHBOARD_STALE = 1000 * 60 * 5; // 5 minutes (reduced polling)

export function useDashboardKpis(range: string) {
  return useQuery({
    queryKey: ['dashboard', 'kpis', range],
    queryFn: () => fetchKpis(range),
    staleTime: DASHBOARD_STALE,
  });
}

export function useRevenueChart(range: string) {
  return useQuery({
    queryKey: ['dashboard', 'revenue-chart', range],
    queryFn: () => fetchRevenueChart(range),
    staleTime: DASHBOARD_STALE,
  });
}

export function useTopProducts(range: string) {
  return useQuery({
    queryKey: ['dashboard', 'top-products', range],
    queryFn: () => fetchTopProducts(range),
    staleTime: DASHBOARD_STALE,
  });
}

export function useOrderDistribution(range: string) {
  return useQuery({
    queryKey: ['dashboard', 'order-distribution', range],
    queryFn: () => fetchOrderDistribution(range),
    staleTime: DASHBOARD_STALE,
  });
}

export function useSalesTrend(range: string) {
  return useQuery({
    queryKey: ['dashboard', 'sales-trend', range],
    queryFn: () => fetchSalesTrend(range),
    staleTime: DASHBOARD_STALE,
  });
}

export function useMarginDetails(page: number, pageSize: number, range: string, enabled: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'margin-details', page, pageSize, range],
    queryFn: () => fetchMarginDetails(page, pageSize, range),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useRecentActivities() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  const query = useQuery({
    queryKey: ['dashboard', 'recent-activities'],
    queryFn: fetchRecentActivities,
    staleTime: Infinity, // Dữ liệu sẽ được update realtime qua SignalR
  });

  useEffect(() => {
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5130/api';
    const hubUrl = baseUrl.replace('/api', '/hubs/operations');

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => console.log('[SignalR] Connected to OperationsHub'))
      .catch(err => console.error('[SignalR] Connection Error: ', err));

    connection.on('ReceiveActivity', (activity: Activity) => {
      queryClient.setQueryData(['dashboard', 'recent-activities'], (oldData: Activity[] | undefined) => {
        if (!oldData) return [activity];
        return [activity, ...oldData].slice(0, 10); // Giữ tối đa 10 logs mới nhất
      });
    });

    return () => {
      connection.stop();
    };
  }, [token, queryClient]);

  return query;
}

