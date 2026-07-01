import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationApi } from '../../services/endpoints';
import { Menu, Bell, Search, LogOut, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  const unreadCount = typeof unreadData === 'number' ? unreadData : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="sticky top-0 z-30 h-16 backdrop-blur-xl border-b flex items-center justify-between px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--header-bg)', borderBottomColor: 'var(--glass-border)' }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          title="Toggle sidebar"
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--fg-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--glass-bg)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Menu size={20} />
        </button>
        <div
          className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 w-72"
          style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          <Search size={16} style={{ color: 'var(--fg-faint)' }} />
          <input
            type="text"
            placeholder="Search vendors, orders, invoices..."
            className="bg-transparent text-sm outline-none w-full"
            style={{ color: 'var(--fg)' }}
          />
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded border font-mono"
            style={{ color: 'var(--fg-faint)', backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
          >⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--fg-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--glass-bg)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: 'var(--fg-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--glass-bg)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center keep-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="w-px h-6 mx-2 hidden sm:block" style={{ backgroundColor: 'var(--glass-border)' }} />

        {/* User */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium keep-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--fg-faint)' }}>
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--fg-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--glass-bg)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
