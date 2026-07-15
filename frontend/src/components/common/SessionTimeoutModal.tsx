import { useEffect, useState, useCallback, useRef } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 phút
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Cảnh báo 2 phút trước khi hết

interface SessionTimeoutModalProps {
  onExtend?: () => void;
}

export default function SessionTimeoutModal({ onExtend }: SessionTimeoutModalProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutes in seconds
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(120);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [logout]);

  const resetIdleTimer = useCallback(() => {
    if (!token) return;
    clearAllTimers();
    setShowWarning(false);

    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);
  }, [token, clearAllTimers, startCountdown]);

  // Track user activity
  useEffect(() => {
    if (!token) return;

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      if (!showWarning) resetIdleTimer();
    };

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearAllTimers();
    };
  }, [token, showWarning, resetIdleTimer, clearAllTimers]);

  const handleExtend = async () => {
    clearAllTimers();
    setShowWarning(false);
    try {
      await api.get('/Auth/me'); // Ping server to keep session alive
    } catch {
      // ignore
    }
    resetIdleTimer();
    onExtend?.();
  };

  const handleLogout = () => {
    clearAllTimers();
    setShowWarning(false);
    logout();
  };

  if (!showWarning) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock size={26} className="text-amber-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Phiên làm việc sắp hết</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Do không có hoạt động trong 30 phút, hệ thống sẽ tự động đăng xuất sau:
          </p>
          <div className="mt-4 text-3xl font-mono font-bold text-amber-600 tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
          <button
            onClick={handleExtend}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all active:scale-[0.98]"
          >
            <RefreshCw size={14} />
            Tiếp tục làm việc
          </button>
        </div>
      </div>
    </div>
  );
}
