import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5130/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// Track if a refresh is already in-flight to prevent parallel refresh calls
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: silent refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // Skip refresh for auth endpoints to prevent infinite loops
    const isAuthEndpoint = originalRequest?.url?.includes('/Auth/');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        console.warn('[api] 401 with no refresh token → logging out');
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue up requests waiting for the refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshApi = axios.create({ baseURL: BASE_URL });
        const res = await refreshApi.post('/Auth/refresh-token', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data;

        useAuthStore.getState().setToken(accessToken, newRefreshToken);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        console.warn('[api] Refresh token failed → logging out');
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
