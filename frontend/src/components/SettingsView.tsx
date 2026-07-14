import React, { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Shield, Building, Lock, LogOut, Camera } from 'lucide-react';
import api from '../api';

export default function SettingsView({ onShowNotification }: { onShowNotification: (msg: string) => void }) {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = user?.role === 'Admin';

  const getDepartment = (role: string | undefined) => {
    if (!role) return 'Vận hành Bán lẻ';
    if (['Admin', 'Manager'].includes(role)) return 'Ban điều hành';
    if (['Accountant'].includes(role)) return 'Kế toán';
    if (['Warehouse Staff'].includes(role)) return 'Hậu cần';
    return 'Vận hành Bán lẻ';
  };

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [department, setDepartment] = useState(getDepartment(user?.role));
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNX2ktZppyqhjYerSanIbyJ8TzBEG7aWAkhVVPJIWiqKxiJycFe0jgcw58dT-CytXtGGBTEpIt3YaBQPKB4aVZ9mFyk0FveBFZEfv2mwtksPRC9zYk4tRDgfF35ak7q0pMIPQeAfov9rsQIsHPukcC4O0Zkr1y36fwkFfd_BozIbq23hYtuV5smTOn7_Pbh77ejKFvIvM-sIvpn_YiwqxraTdScRzPu1KK7hg42orRhAhm1PuDUeLdZkh83ygiNPW1G5MsUYVuMLIO');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const profileRes = await api.put('/Auth/profile', {
        fullName,
        department,
        avatarUrl
      });
      updateUser(profileRes.data.user);

      if (oldPassword && newPassword) {
        await api.post('/Auth/change-password', {
          oldPassword,
          newPassword
        });
        setOldPassword('');
        setNewPassword('');
      }

      onShowNotification('Đã lưu thay đổi cài đặt!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu thay đổi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cài đặt tài khoản &amp; Hồ sơ</h2>
        <p className="text-xs text-slate-500 mt-1">Quản lý thông tin cá nhân và tùy chọn bảo mật của bạn.</p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center gap-6 pb-6 border-b border-slate-200">
            <input type="file" accept="image/*" ref={fileInputRef} hidden onChange={handleFileChange} />
            <div 
              className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shrink-0 shadow-sm relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Nhấn để đổi ảnh đại diện"
            >
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{fullName || 'Người dùng'}</h3>
              <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
              <div className="mt-2 flex gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <Shield size={12} />
                  {user?.role}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Hoạt động
                </span>
              </div>
            </div>
            <div className="ml-auto">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
            <div className="sm:col-span-1">
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Họ và Tên</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  id="fullName" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  readOnly={!isAdmin}
                  className={`focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 sm:text-sm rounded-md py-2 border ${!isAdmin ? 'bg-slate-50 border-slate-300 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`} 
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input type="email" id="email" defaultValue={user?.email} readOnly className="bg-slate-50 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 border text-slate-500 cursor-not-allowed" />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="department" className="block text-sm font-medium text-slate-700">Phòng ban</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  id="department" 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  readOnly={!isAdmin}
                  className={`focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 sm:text-sm rounded-md py-2 border ${!isAdmin ? 'bg-slate-50 border-slate-300 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`} 
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-900 mb-4">Thay đổi mật khẩu</h4>
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700">Mật khẩu hiện tại</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 border" 
                  />
                </div>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700">Mật khẩu mới</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Mật khẩu mới" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 border" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={loading}
              className={`border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${loading ? 'bg-amber-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
