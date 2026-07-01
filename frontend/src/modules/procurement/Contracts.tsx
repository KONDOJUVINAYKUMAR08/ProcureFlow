import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractApi, vendorApi } from '../../services/endpoints';
import { formatCurrency, getStatusBadgeClass, formatDate } from '../../lib/utils';
import { Plus, Search, FileCheck, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const Contracts: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ contractName: '', vendor: '', effectiveDate: '', expiryDate: '', contractValue: 0, description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', page, search, statusFilter],
    queryFn: () => contractApi.getAll({ page, limit: 10, search, status: statusFilter }),
  });

  const { data: vendorsData } = useQuery({ queryKey: ['vendors-list'], queryFn: () => vendorApi.getAll({ limit: 100 }) });
  const vendors = Array.isArray(vendorsData?.items) ? vendorsData.items : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => contractApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); setShowCreate(false); },
  });

  const contracts = Array.isArray(data?.items) ? data.items : [];
  const pagination = data?.pagination;

  const daysUntilExpiry = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Contracts</h1><p className="page-description">Manage vendor contracts and agreements</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Contract</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <Search size={16} className="text-neutral-500" />
          <input type="text" placeholder="Search contracts..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none w-full" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-black">All Status</option>
          <option value="active" className="bg-black">Active</option>
          <option value="expired" className="bg-black">Expired</option>
          <option value="terminated" className="bg-black">Terminated</option>
          <option value="pending_renewal" className="bg-black">Pending Renewal</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Contract</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Value</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Effective</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Expiry</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => <tr key={i} className="table-row"><td colSpan={6} className="px-6 py-4"><div className="loading-skeleton h-4 w-full" /></td></tr>)
              : contracts.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-neutral-500"><FileCheck size={32} className="mx-auto mb-2 opacity-50" />No contracts found</td></tr>
              : contracts.map((c: any) => {
                const days = daysUntilExpiry(c.expiryDate);
                return (
                  <tr key={c._id} className="table-row">
                    <td className="px-6 py-4"><p className="text-sm font-medium text-white">{c.contractName}</p><p className="text-xs text-neutral-500 font-mono">{c.contractNumber}</p></td>
                    <td className="px-6 py-4 text-sm text-neutral-400">{typeof c.vendor === 'object' ? c.vendor?.vendorName : c.vendor}</td>
                    <td className="px-6 py-4 text-sm font-medium text-white">{formatCurrency(c.contractValue)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(c.effectiveDate)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500">{formatDate(c.expiryDate)}</span>
                        {days > 0 && days <= 30 && <AlertTriangle size={14} className="text-amber-400" />}
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className={getStatusBadgeClass(c.status)}>{c.status.replace('_', ' ')}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-neutral-500">{pagination.total} results</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => p+1)} disabled={page>=pagination.totalPages} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-white/[0.06] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/[0.06]"><h2 className="text-lg font-semibold">New Contract</h2></div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              <div><label className="block text-sm text-neutral-300 mb-1">Contract Name *</label><input required value={form.contractName} onChange={e => setForm({...form, contractName: e.target.value})} className="input-field" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1">Vendor *</label>
                <select required value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} className="input-field">
                  <option value="" className="bg-black">Select vendor</option>
                  {vendors.map((v: any) => <option key={v._id} value={v._id} className="bg-black">{v.vendorName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-neutral-300 mb-1">Effective Date *</label><input required type="date" value={form.effectiveDate} onChange={e => setForm({...form, effectiveDate: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Expiry Date *</label><input required type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="input-field" /></div>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1">Contract Value *</label><input required type="number" value={form.contractValue} onChange={e => setForm({...form, contractValue: Number(e.target.value)})} className="input-field" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="input-field resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">{createMutation.isPending ? 'Creating...' : 'Create Contract'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
