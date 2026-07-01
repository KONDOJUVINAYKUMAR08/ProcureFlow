import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { vendorApi } from '../../services/endpoints';
import { formatCurrency, getStatusBadgeClass, formatDate } from '../../lib/utils';
import { Plus, Search, Filter, Building2, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const Vendors: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    vendorName: '', contactPerson: '', email: '', phone: '',
    address: { street: '', city: '', state: '', country: '', zipCode: '' },
    taxId: '', bankAccount: '', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', page, search, statusFilter],
    queryFn: () => vendorApi.getAll({ page, limit: 10, search, status: statusFilter }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => vendorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setShowCreate(false);
      setForm({ vendorName: '', contactPerson: '', email: '', phone: '', address: { street: '', city: '', state: '', country: '', zipCode: '' }, taxId: '', bankAccount: '', notes: '' });
    },
  });

  const vendors = Array.isArray(data?.items) ? data.items : [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-description">Manage your vendor relationships</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <Search size={16} className="text-neutral-500" />
          <input
            type="text" placeholder="Search vendors..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none w-full"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none"
        >
          <option value="" className="bg-black">All Status</option>
          <option value="active" className="bg-black">Active</option>
          <option value="pending" className="bg-black">Pending</option>
          <option value="inactive" className="bg-black">Inactive</option>
          <option value="blacklisted" className="bg-black">Blacklisted</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Code</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Contact</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Rating</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="table-row"><td colSpan={6} className="px-6 py-4"><div className="loading-skeleton h-4 w-full" /></td></tr>
                ))
              ) : vendors.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-neutral-500"><Building2 size={32} className="mx-auto mb-2 opacity-50" />No vendors found</td></tr>
              ) : (
                vendors.map((vendor: any) => (
                  <tr
                    key={vendor._id} className="table-row cursor-pointer"
                    onClick={() => navigate(`/vendors/${vendor._id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-medium text-white">
                          {vendor.vendorName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{vendor.vendorName}</p>
                          <p className="text-xs text-neutral-500">{vendor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-400 font-mono">{vendor.vendorCode}</td>
                    <td className="px-6 py-4 text-sm text-neutral-400">{vendor.contactPerson}</td>
                    <td className="px-6 py-4"><span className={getStatusBadgeClass(vendor.status)}>{vendor.status}</span></td>
                    <td className="px-6 py-4 text-sm text-neutral-400">{'★'.repeat(Math.round(vendor.rating))}{'☆'.repeat(5 - Math.round(vendor.rating))}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(vendor.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-neutral-500">Showing {(pagination.page-1)*pagination.limit+1}-{Math.min(pagination.page*pagination.limit, pagination.total)} of {pagination.total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => p+1)} disabled={page >= pagination.totalPages} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-white/[0.06] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold">Add New Vendor</h2>
              <p className="text-sm text-neutral-500 mt-1">Fill in the vendor details</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-neutral-300 mb-1">Vendor Name *</label><input required value={form.vendorName} onChange={e => setForm({...form, vendorName: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Contact Person *</label><input required value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Email *</label><input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Phone *</label><input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Tax ID *</label><input required value={form.taxId} onChange={e => setForm({...form, taxId: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Bank Account *</label><input required value={form.bankAccount} onChange={e => setForm({...form, bankAccount: e.target.value})} className="input-field" /></div>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="input-field resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
