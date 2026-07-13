import axios from 'axios';
import { useAuthStore } from './store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5130/api',
});

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

// Response interceptor: auto-logout on 401 or stale-token 403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    // 401 = token invalid/expired; treat 403 as possible stale token too
    if (status === 401) {
      console.warn('[api] Received 401 – token invalid or expired. Logging out...');
      useAuthStore.getState().logout();
      // Optionally: window.location.reload() to force re-render to login screen
    }
    return Promise.reject(error);
  }
);

export default api;
