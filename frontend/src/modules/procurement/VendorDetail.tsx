import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../services/endpoints';
import { formatCurrency, getStatusBadgeClass, formatRelativeTime } from '../../lib/utils';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Star, Clock, Edit2, Trash2 } from 'lucide-react';

const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorApi.getById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => vendorApi.delete(id!),
    onSuccess: () => navigate('/vendors'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => vendorApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setShowEdit(false);
    },
  });

  const vendor = data;

  const openEdit = () => {
    if (!vendor) return;
    setForm({
      vendorName: vendor.vendorName || '',
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: {
        street: vendor.address?.street || '',
        city: vendor.address?.city || '',
        state: vendor.address?.state || '',
        country: vendor.address?.country || '',
        zipCode: vendor.address?.zipCode || '',
      },
      taxId: vendor.taxId || '',
      bankAccount: vendor.bankAccount || '',
      status: vendor.status || 'pending',
      rating: vendor.rating || 0,
      notes: vendor.notes || '',
    });
    updateMutation.reset();
    setShowEdit(true);
  };

  if (isLoading) return <div className="space-y-4"><div className="loading-skeleton h-48 rounded-xl" /><div className="loading-skeleton h-64 rounded-xl" /></div>;
  if (!vendor) return <div className="empty-state py-20"><p>Vendor not found</p></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vendors')} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{vendor.vendorName}</h1>
              <span className={getStatusBadgeClass(vendor.status)}>{vendor.status}</span>
            </div>
            <p className="text-sm text-neutral-500 font-mono">{vendor.vendorCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openEdit} className="btn-ghost flex items-center gap-2"><Edit2 size={14} /> Edit</button>
          <button onClick={() => deleteMutation.mutate()} className="btn-ghost text-red-400 hover:text-red-300 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="section-title">Contact Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Building2 size={16} className="text-neutral-500" /><div><p className="text-xs text-neutral-500">Contact Person</p><p className="text-sm text-white">{vendor.contactPerson}</p></div></div>
            <div className="flex items-center gap-3"><Mail size={16} className="text-neutral-500" /><div><p className="text-xs text-neutral-500">Email</p><p className="text-sm text-white">{vendor.email}</p></div></div>
            <div className="flex items-center gap-3"><Phone size={16} className="text-neutral-500" /><div><p className="text-xs text-neutral-500">Phone</p><p className="text-sm text-white">{vendor.phone}</p></div></div>
            <div className="flex items-start gap-3"><MapPin size={16} className="text-neutral-500 mt-0.5" /><div><p className="text-xs text-neutral-500">Address</p><p className="text-sm text-white">{vendor.address?.street}, {vendor.address?.city}, {vendor.address?.state} {vendor.address?.zipCode}</p><p className="text-sm text-neutral-400">{vendor.address?.country}</p></div></div>
          </div>
          <div className="pt-4 border-t border-white/[0.06]">
            <p className="text-xs text-neutral-500">Rating</p>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(s => <Star key={s} size={16} className={s <= Math.round(vendor.rating) ? 'text-white fill-white' : 'text-neutral-700'} />)}
              <span className="text-sm text-neutral-400 ml-2">{vendor.rating}/5</span>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="section-title">Activity Timeline</h3>
          <div className="space-y-4 mt-4">
            {(vendor.activities || []).map((activity: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-white/20 mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-white">{activity.description}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1"><Clock size={10} /> {formatRelativeTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
            {(!vendor.activities || vendor.activities.length === 0) && <p className="text-sm text-neutral-500">No activity recorded</p>}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && form && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
          <div className="bg-card border border-white/[0.06] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold">Edit Vendor</h2>
              <p className="text-sm text-neutral-500 mt-1">Update vendor details and status</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="p-6 space-y-4">
              {updateMutation.isError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-3 py-2">
                  {(updateMutation.error as any)?.response?.data?.message || 'Failed to update vendor'}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-neutral-300 mb-1">Vendor Name *</label><input required value={form.vendorName} onChange={e => setForm({...form, vendorName: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Contact Person *</label><input required value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Email *</label><input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Phone *</label><input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Tax ID *</label><input required value={form.taxId} onChange={e => setForm({...form, taxId: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Bank Account *</label><input required value={form.bankAccount} onChange={e => setForm({...form, bankAccount: e.target.value})} className="input-field" /></div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-field">
                    <option value="pending" className="bg-black">Pending</option>
                    <option value="active" className="bg-black">Active</option>
                    <option value="inactive" className="bg-black">Inactive</option>
                    <option value="blacklisted" className="bg-black">Blacklisted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-1">Rating (0-5)</label>
                  <input type="number" min={0} max={5} step={1} value={form.rating} onChange={e => setForm({...form, rating: Number(e.target.value)})} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-neutral-300 mb-1">Street</label><input value={form.address.street} onChange={e => setForm({...form, address: {...form.address, street: e.target.value}})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">City</label><input value={form.address.city} onChange={e => setForm({...form, address: {...form.address, city: e.target.value}})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">State</label><input value={form.address.state} onChange={e => setForm({...form, address: {...form.address, state: e.target.value}})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Zip Code</label><input value={form.address.zipCode} onChange={e => setForm({...form, address: {...form.address, zipCode: e.target.value}})} className="input-field" /></div>
                <div className="col-span-2"><label className="block text-sm text-neutral-300 mb-1">Country</label><input value={form.address.country} onChange={e => setForm({...form, address: {...form.address, country: e.target.value}})} className="input-field" /></div>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="input-field resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetail;
