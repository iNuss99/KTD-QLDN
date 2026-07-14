import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Loader2, KeyRound } from 'lucide-react';
import api from '../api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu cũ'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ForceChangePasswordView() {
  const [isLoading, setIsLoading] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      setIsLoading(true);
      await api.post('/Auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      logout();
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 400) {
        toast.error('Mật khẩu cũ không chính xác');
      } else {
        toast.error('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shadow-sm border border-rose-200">
            <KeyRound className="text-rose-600" size={28} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Yêu cầu Đổi mật khẩu
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 px-4">
          Chào <strong>{user?.fullName}</strong>, đây là lần đăng nhập đầu tiên của bạn. Để đảm bảo tính bảo mật, hệ thống yêu cầu bạn đổi mật khẩu mới trước khi truy cập ứng dụng.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                htmlFor="oldPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Mật khẩu hiện tại (khởi tạo)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="oldPassword"
                  type="password"
                  {...register('oldPassword')}
                  className={`block w-full pl-10 sm:text-sm rounded-md py-2 px-3 border focus:outline-none transition-colors ${
                    errors.oldPassword
                      ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-slate-300 focus:ring-amber-500 focus:border-amber-500 bg-white'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.oldPassword && (
                <p className="mt-1.5 text-xs text-red-600">{errors.oldPassword.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Mật khẩu mới
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="newPassword"
                  type="password"
                  {...register('newPassword')}
                  className={`block w-full pl-10 sm:text-sm rounded-md py-2 px-3 border focus:outline-none transition-colors ${
                    errors.newPassword
                      ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-slate-300 focus:ring-amber-500 focus:border-amber-500 bg-white'
                  }`}
                  placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                />
              </div>
              {errors.newPassword && (
                <p className="mt-1.5 text-xs text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Xác nhận mật khẩu mới
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  className={`block w-full pl-10 sm:text-sm rounded-md py-2 px-3 border focus:outline-none transition-colors ${
                    errors.confirmPassword
                      ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-slate-300 focus:ring-amber-500 focus:border-amber-500 bg-white'
                  }`}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Đang xử lý...
                  </span>
                ) : (
                  'Xác nhận Đổi mật khẩu'
                )}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <button 
                type="button"
                onClick={logout}
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Đăng xuất
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
