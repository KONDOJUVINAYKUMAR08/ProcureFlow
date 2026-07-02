import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/endpoints';
import { Shield, Key, AlertCircle, CheckCircle } from 'lucide-react';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) return saved === 'true';
      // Auto-collapse on viewports narrower than 1280px so the sidebar doesn't
      // eat into the content area on typical 1366×768 / 100%-zoom laptops.
      return typeof window !== 'undefined' && window.innerWidth < 1280;
    } catch { return false; }
  });
  const { user, updateUser } = useAuth();

  // Below the lg breakpoint the toggle opens/closes the mobile overlay;
  // at lg and above it collapses the fixed sidebar down to an icon rail.
  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(o => !o);
    } else {
      setSidebarCollapsed(c => {
        const next = !c;
        try { localStorage.setItem('sidebarCollapsed', String(next)); } catch { /* ignore */ }
        return next;
      });
    }
  };
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForceChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess('Password updated successfully! Redirecting...');
      setTimeout(() => {
        if (user) {
          updateUser({ ...user, mustChangePassword: false });
        }
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (user?.mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-6 glass-card">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto">
              <Shield size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Change Password Required</h2>
            <p className="text-sm text-neutral-400">
              For security, you must update your password before accessing the ProcureFlow portal.
            </p>
          </div>

          <form onSubmit={handleForceChangePassword} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                <CheckCircle size={16} /> {success}
              </div>
            )}

            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Temporary/Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="input-field"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Minimum 6 characters"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 mt-2"
            >
              <Key size={16} /> {loading ? 'Updating Password...' : 'Update Password & Enter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative" style={{ backgroundColor: 'var(--page-bg)' }}>
      {/* Gradient orb backdrop — low-opacity atmosphere blobs */}
      <div className="orb-backdrop" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />

      {/* Main content — min-w-0 prevents wide tables from expanding the page */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-[padding] duration-300 relative z-10 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <Header onMenuToggle={toggleSidebar} />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
