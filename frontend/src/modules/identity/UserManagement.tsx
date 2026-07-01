import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services/endpoints';
import { formatDate, getInitials } from '../../lib/utils';
import { Users, Plus, Trash2, Shield, X, AlertCircle } from 'lucide-react';

const ASSIGNABLE_ROLES = ['procurement_manager', 'finance', 'vendor', 'auditor', 'employee'];

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => userApi.getAll() });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const users = Array.isArray(data) ? data : [];

  const roleColors: Record<string, string> = {
    admin: 'bg-white/10 text-white',
    procurement_manager: 'bg-blue-400/10 text-blue-400',
    finance: 'bg-emerald-400/10 text-emerald-400',
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">User Management</h1><p className="page-description">Create accounts and manage permissions — there is no public sign-up.</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create User
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">User</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Role</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Department</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Last Login</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => <tr key={i} className="table-row"><td colSpan={6} className="px-6 py-4"><div className="loading-skeleton h-4 w-full" /></td></tr>)
              : users.map((user: any) => (
                <tr key={user._id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-medium text-white">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className={`badge ${roleColors[user.role] || 'badge-draft'}`}>{user.role.replace('_', ' ')}</span></td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{user.department}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${user.isActive ? 'badge-active' : 'badge-inactive'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</td>
                  <td className="px-6 py-4">
                    {user.role !== 'admin' && (
                      <button onClick={() => { if (confirm(`Delete ${user.firstName} ${user.lastName}?`)) deleteMutation.mutate(user._id); }} className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-red-400"><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
    </div>
  );
};

const CreateUserModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', department: '', role: 'employee' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => userApi.create(data),
    onSuccess: onCreated,
    onError: (err: any) => setError(err.response?.data?.message || err.message || 'Failed to create user'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Shield size={18} /> Create User</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Restricted-role account — admins can't create more admins here.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">First Name *</label>
              <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Last Name</label>
              <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-300 mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm text-neutral-300 mb-1.5">Temporary Password *</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" minLength={6} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Department *</label>
              <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Role *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
                {ASSIGNABLE_ROLES.map(r => <option key={r} value={r} className="bg-black">{r.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.06]">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary min-w-[120px]">
              {mutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;
