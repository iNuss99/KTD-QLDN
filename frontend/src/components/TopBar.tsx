/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  User,
  LogOut,
  ChevronDown,
  Settings as SettingsIcon,
  Check
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface TopBarProps {
  onToggleSidebar: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function TopBar({
  onToggleSidebar,
  searchTerm,
  setSearchTerm,
  currentTab,
  setCurrentTab
}: TopBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPlaceholderText = () => {
    switch (currentTab) {
      case 'employees':
        return 'Tìm kiếm nhân viên theo tên, vai trò hoặc phòng ban...';
      case 'permissions':
        return 'Tìm kiếm ma trận quyền hạn...';
      case 'finance':
        return 'Tìm kiếm giao dịch hoặc chỉ số tài chính...';
      default:
        return 'Tìm kiếm dữ liệu, báo cáo hoặc nhân sự...';
    }
  };

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Báo cáo Quý 3 đã duyệt', desc: 'Phòng Tài chính đã ký duyệt.', time: '10 phút trước', unread: true },
    { id: 2, title: 'Tải máy chủ cao', desc: 'Node cơ sở dữ liệu 3 gần đầy.', time: '45 phút trước', unread: true },
    { id: 3, title: 'Nhân viên mới gia nhập', desc: 'Sarah Jenkins gia nhập Bộ phận Bán lẻ.', time: '2 giờ trước', unread: false }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 px-4 md:px-6 sticky top-0 z-30 flex items-center justify-between shadow-sm">
      {/* Left side: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={getPlaceholderText()}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-slate-50 transition-all text-slate-800 placeholder-slate-400"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Right side: Action icons & Profile */}
      <div className="flex items-center gap-1 sm:gap-3 ml-4 shrink-0">
        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifyRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all rounded-full relative cursor-pointer active:scale-95"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="font-semibold text-xs text-slate-700">Thông báo</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">{unreadCount} mới</span>
                  )}
                  <button 
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-[10px] text-slate-500 hover:text-amber-600 transition-colors disabled:opacity-50 disabled:hover:text-slate-500"
                  >
                    Đánh dấu đã đọc
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`px-4 py-3 border-b border-slate-50 last:border-none hover:bg-slate-50 transition-all cursor-pointer flex gap-2.5 ${
                      notif.unread ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${notif.unread ? 'bg-amber-600' : 'bg-transparent'}`} />
                    </div>
                    <div>
                      <h4 className={`font-medium text-xs ${notif.unread ? 'text-amber-900' : 'text-slate-800'}`}>{notif.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{notif.desc}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Profile Info & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-full pr-2.5 transition-all cursor-pointer active:scale-95 border border-transparent hover:border-slate-100"
          >
            <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
              <img
                alt="User Profile"
                className="w-full h-full object-cover"
                src={user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCNX2ktZppyqhjYerSanIbyJ8TzBEG7aWAkhVVPJIWiqKxiJycFe0jgcw58dT-CytXtGGBTEpIt3YaBQPKB4aVZ9mFyk0FveBFZEfv2mwtksPRC9zYk4tRDgfF35ak7q0pMIPQeAfov9rsQIsHPukcC4O0Zkr1y36fwkFfd_BozIbq23hYtuV5smTOn7_Pbh77ejKFvIvM-sIvpn_YiwqxraTdScRzPu1KK7hg42orRhAhm1PuDUeLdZkh83ygiNPW1G5MsUYVuMLIO"}
              />
            </div>
            <span className="text-slate-400 transition-transform">
              <ChevronDown size={14} className={`transform transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100">
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.fullName || 'Người dùng'}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{user?.email || 'email@example.com'}</p>
                <p className="text-[10px] bg-amber-50 text-amber-700 font-medium px-1.5 py-0.5 rounded mt-1.5 inline-block">
                  {user?.role || 'Nhân viên'}
                </p>
              </div>
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-800 flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setCurrentTab('settings');
                  }}
                >
                  <SettingsIcon size={14} />
                  <span>Hồ sơ & Cài đặt</span>
                </button>
              </div>
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 font-medium cursor-pointer"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                >
                  <LogOut size={14} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
