import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Mail, Loader2, Eye, EyeOff, CheckCircle2, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const stats = [
  { icon: TrendingUp, label: 'Doanh thu tháng', value: '2.4 tỷ' },
  { icon: Users, label: 'Nhân viên', value: '48' },
  { icon: ShieldCheck, label: 'Bảo mật', value: 'SSL/TLS' },
];

export default function LoginView() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);

      if (forgotPasswordMode) {
        const res = await api.post('/Auth/forgot-password', { email: data.email.trim() });
        toast.success(res.data.message || 'Yêu cầu đặt lại mật khẩu đã được xử lý!');
        if (res.data.demoPassword) {
            toast.info(`[Demo Mode] Mật khẩu tạm thời: ${res.data.demoPassword}`, { 
                duration: 10000,
                position: 'top-center'
            });
        }
        setIsLoading(false);
        // Do not switch back to login mode automatically so they can read the message
        return;
      }

      const res = await api.post('/Auth/login', {
        email: data.email.trim(),
        password: data.password,
      });
      const { token, user } = res.data;
      setLoginSuccess(true);
      // Delay to show success animation
      setTimeout(() => {
        setAuth(token, user, undefined, rememberMe);
        toast.success(`Chào mừng trở lại, ${user.fullName}!`);
      }, 1200);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message;
      if (forgotPasswordMode) {
        toast.error(msg || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      } else if (error.response?.status === 401) {
        toast.error('Email hoặc mật khẩu không chính xác');
      } else if (error.response?.status === 423) {
        toast.error('Tài khoản bị tạm khóa. Vui lòng liên hệ Admin.');
      } else {
        toast.error(msg || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── Left Panel: Branding ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #312e81 55%, #92400e 80%, #b45309 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 8s ease infinite',
        }}
      >
        {/* Animated gradient style */}
        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.7); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.9); opacity: 1; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          .fade-up { animation: fadeInUp 0.6s ease both; }
          .fade-up-1 { animation: fadeInUp 0.6s 0.1s ease both; }
          .fade-up-2 { animation: fadeInUp 0.6s 0.2s ease both; }
          .fade-up-3 { animation: fadeInUp 0.6s 0.4s ease both; }
          .scale-in { animation: scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        `}</style>

        {/* Decorative geometric grid */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-20 -right-20 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full border border-white/10" />
        <div className="absolute top-1/3 -right-8 w-40 h-40 rounded-full border border-amber-400/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="fade-up w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-8 shadow-2xl overflow-hidden">
            <img src="/logo.png" alt="KTD Logo" className="w-full h-full object-cover" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:2rem;font-weight:900;color:white">KTD</span>';
            }} />
          </div>

          <h1 className="fade-up-1 text-4xl font-black text-white tracking-tight mb-3">
            Kingdom Trust<br />Division
          </h1>
          <p className="fade-up-2 text-amber-300/90 text-sm font-medium mb-12 max-w-xs leading-relaxed">
            Hệ thống quản lý nguồn lực doanh nghiệp bán lẻ — Phiên bản doanh nghiệp
          </p>

          {/* Stats cards */}
          <div className="fade-up-3 grid grid-cols-3 gap-3 w-full max-w-sm">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-center">
                <Icon size={16} className="text-amber-300 mx-auto mb-1" />
                <div className="text-white font-bold text-sm">{value}</div>
                <div className="text-white/60 text-[10px] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom timestamp */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <div className="text-white/40 text-xs font-mono">
            {currentTime.toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'medium' })}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center mb-3 overflow-hidden">
            <img src="/logo.png" alt="KTD" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Kingdom Trust Division</h2>
        </div>

        <div className="w-full max-w-sm">
          {/* Success State */}
          {loginSuccess ? (
            <div className="flex flex-col items-center justify-center py-16 scale-in">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-green-400 opacity-30" style={{ animation: 'pulse-ring 1s ease-out infinite' }} />
                <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={40} className="text-white" />
                </div>
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Đăng nhập thành công!</h3>
              <p className="mt-2 text-sm text-slate-500">Đang chuyển hướng vào hệ thống...</p>
              <div className="mt-6 w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full animate-[progress_1.2s_ease-out_forwards]"
                  style={{ animation: 'width 1.2s ease-out forwards', width: '100%' }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                {forgotPasswordMode ? (
                  <>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quên mật khẩu?</h2>
                    <p className="mt-1 text-sm text-slate-500">Nhập email của bạn để nhận mật khẩu tạm thời</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chào mừng trở lại</h2>
                    <p className="mt-1 text-sm text-slate-500">Đăng nhập để truy cập hệ thống KTD Enterprise</p>
                  </>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className={`block w-full pl-10 pr-4 py-3 text-sm rounded-xl border-2 focus:outline-none transition-all ${
                        errors.email
                          ? 'border-red-300 bg-red-50 focus:border-red-400'
                          : 'border-slate-200 bg-slate-50 focus:border-amber-500 focus:bg-white'
                      }`}
                      placeholder="admin@ktd.local"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <span>⚠</span> {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password (only in login mode) */}
                {!forgotPasswordMode && (
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        className={`block w-full pl-10 pr-12 py-3 text-sm rounded-xl border-2 focus:outline-none transition-all ${
                          errors.password
                            ? 'border-red-300 bg-red-50 focus:border-red-400'
                            : 'border-slate-200 bg-slate-50 focus:border-amber-500 focus:bg-white'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.password.message}
                      </p>
                    )}
                  </div>
                )}

                  {/* Remember me + Forgot */}
                <div className="flex items-center justify-between">
                  {!forgotPasswordMode ? (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotPasswordMode(true)}
                        className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setForgotPasswordMode(false)}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      &larr; Quay lại đăng nhập
                    </button>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    boxShadow: '0 4px 15px rgba(180, 83, 9, 0.4)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Đang xử lý...
                    </>
                  ) : forgotPasswordMode ? (
                    'Khôi phục mật khẩu'
                  ) : (
                    'Đăng nhập vào hệ thống'
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                  Bảo mật bởi SSL/TLS 256-bit · KTD Enterprise v2.0
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
