import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { authApi, issuerProfileApi } from '../../services/endpoints';
import { User, Shield, Bell, Database, CheckCircle, AlertCircle, FileSignature } from 'lucide-react';

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  // Profile State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setIsSavingProfile(true);

    try {
      const updatedUser = await authApi.updateProfile({ firstName, lastName });
      updateUser(updatedUser);
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySuccess('');
    setSecurityError('');

    if (newPassword !== confirmPassword) {
      setSecurityError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters long');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSecuritySuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityError(err.response?.data?.message || err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Manage your account and application preferences</p>
      </div>

      {/* Profile Section */}
      <form onSubmit={handleSaveProfile} className="glass-card p-6">
        <h3 className="section-title flex items-center gap-2">
          <User size={18} className="text-neutral-400" /> Profile Information
        </h3>
        
        {profileSuccess && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
            <CheckCircle size={16} /> {profileSuccess}
          </div>
        )}
        {profileError && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} /> {profileError}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-300 mb-1">First Name</label>
            <input 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              className="input-field" 
              required
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Last Name</label>
            <input 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              className="input-field" 
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Email</label>
            <input defaultValue={user?.email} className="input-field" disabled />
          </div>
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Department</label>
            <input defaultValue={user?.department} className="input-field" disabled />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={isSavingProfile} className="btn-primary">
            {isSavingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Security */}
      <form onSubmit={handleUpdatePassword} className="glass-card p-6">
        <h3 className="section-title flex items-center gap-2">
          <Shield size={18} className="text-neutral-400" /> Security
        </h3>

        {securitySuccess && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
            <CheckCircle size={16} /> {securitySuccess}
          </div>
        )}
        {securityError && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} /> {securityError}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Current Password</label>
            <input 
              type="password" 
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input-field" 
              placeholder="Enter current password" 
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input-field" 
                placeholder="Enter new password" 
                required
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field" 
                placeholder="Confirm new password" 
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isUpdatingPassword} className="btn-secondary">
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </form>

      {/* Invoice Issuer Profiles (admin only) — fixed letterhead/bank/signature
          data used to render the two invoice PDF templates. Entered once
          here instead of being re-typed on every invoice. */}
      {user?.role === 'admin' && <IssuerProfilesSection />}

      {/* Notifications Preferences */}
      <div className="glass-card p-6">
        <h3 className="section-title flex items-center gap-2">
          <Bell size={18} className="text-neutral-400" /> Notification Preferences
        </h3>
        <div className="mt-4 space-y-3">
          {[
            { label: 'Contract expiration alerts', desc: 'Get notified when contracts are about to expire' },
            { label: 'Invoice due date reminders', desc: 'Receive reminders for upcoming invoice due dates' },
            { label: 'Purchase request updates', desc: 'Notifications when requests are approved or rejected' },
            { label: 'Vendor status changes', desc: 'Alerts when vendor status is updated' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-white">{item.label}</p>
                <p className="text-xs text-neutral-500">{item.desc}</p>
              </div>
              <div className="w-10 h-6 rounded-full bg-white/10 relative cursor-pointer hover:bg-white/20 transition-colors">
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="glass-card p-6">
        <h3 className="section-title flex items-center gap-2">
          <Database size={18} className="text-neutral-400" /> System Information
        </h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
            <span className="text-neutral-500">Application Version</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
            <span className="text-neutral-500">API Status</span>
            <span className="text-emerald-400">Connected</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
            <span className="text-neutral-500">Role</span>
            <span className="text-white capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-neutral-500">Environment</span>
            <span className="text-white">Development</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const emptyProfile = (type: 'individual' | 'beulix') => ({
  type,
  name: '',
  contactPerson: '',
  email: '',
  contact: '',
  address: '',
  pan: '',
  gst: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  termsAndConditions: '',
  signatureUrl: '',
  logoUrl: '',
});

const IssuerProfilesSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'individual' | 'beulix'>('beulix');
  const [success, setSuccess] = useState('');

  const { data: profiles } = useQuery({
    queryKey: ['issuer-profiles'],
    queryFn: () => issuerProfileApi.getAll(),
  });

  const existing = profiles?.find((p: any) => p.type === activeTab);
  const [form, setForm] = useState(emptyProfile(activeTab));

  React.useEffect(() => {
    setForm(existing ? { ...emptyProfile(activeTab), ...existing } : emptyProfile(activeTab));
    setSuccess('');
  }, [activeTab, profiles]);

  const mutation = useMutation({
    mutationFn: () => issuerProfileApi.upsert(activeTab, form),
    onSuccess: () => {
      setSuccess('Issuer profile saved');
      queryClient.invalidateQueries({ queryKey: ['issuer-profiles'] });
    },
  });

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="glass-card p-6">
      <h3 className="section-title flex items-center gap-2">
        <FileSignature size={18} className="text-neutral-400" /> Invoice Issuer Profiles
      </h3>
      <p className="text-sm text-neutral-500 mt-1">
        Fixed letterhead, bank, and signature details rendered on each invoice template —
        set once here instead of re-entering them on every invoice.
      </p>

      <div className="flex gap-1 bg-white/[0.02] rounded-lg p-1 border border-white/[0.06] w-fit mt-4">
        {(['beulix', 'individual'] as const).map(t => (
          <button key={t} type="button" onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === t ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>
            {t === 'beulix' ? 'Beulix' : 'Individual'}
          </button>
        ))}
      </div>

      {success && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-300 mb-1">{activeTab === 'individual' ? 'Trainer Name' : 'Company Name'}</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Contact</label>
          <input value={form.contact} onChange={e => set('contact', e.target.value)} className="input-field" placeholder="Phone number" />
        </div>
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Email</label>
          <input value={form.email} onChange={e => set('email', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-neutral-300 mb-1">PAN</label>
          <input value={form.pan} onChange={e => set('pan', e.target.value)} className="input-field" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-neutral-300 mb-1">Address</label>
          <input value={form.address} onChange={e => set('address', e.target.value)} className="input-field" />
        </div>
        {activeTab === 'beulix' && (
          <div>
            <label className="block text-sm text-neutral-300 mb-1">GST</label>
            <input value={form.gst} onChange={e => set('gst', e.target.value)} className="input-field" />
          </div>
        )}
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Bank Name</label>
          <input value={form.bankName} onChange={e => set('bankName', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Account Number</label>
          <input value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-neutral-300 mb-1">IFSC Code</label>
          <input value={form.ifscCode} onChange={e => set('ifscCode', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Signature Image URL</label>
          <input value={form.signatureUrl} onChange={e => set('signatureUrl', e.target.value)} className="input-field" placeholder="https://..." />
        </div>
        {activeTab === 'beulix' && (
          <div className="sm:col-span-2">
            <label className="block text-sm text-neutral-300 mb-1">Terms &amp; Conditions</label>
            <textarea value={form.termsAndConditions} onChange={e => set('termsAndConditions', e.target.value)} rows={2} className="input-field resize-none" />
          </div>
        )}
        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
