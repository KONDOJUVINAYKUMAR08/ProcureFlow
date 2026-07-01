import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseRequestApi, vendorApi } from '../../services/endpoints';
import { formatCurrency, getStatusBadgeClass, formatDate } from '../../lib/utils';
import { Plus, Search, FileText, ChevronLeft, ChevronRight, Send, CheckCircle, XCircle } from 'lucide-react';

const PurchaseRequests: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', department: '', priority: 'medium' as string, description: '', estimatedCost: 0, vendor: '', items: [] as any[] });

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-requests', page, search, statusFilter],
    queryFn: () => purchaseRequestApi.getAll({ page, limit: 10, search, status: statusFilter }),
  });

  const { data: vendorsData } = useQuery({ queryKey: ['vendors-list'], queryFn: () => vendorApi.getAll({ limit: 100 }) });
  const vendors = Array.isArray(vendorsData?.items) ? vendorsData.items : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => purchaseRequestApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-requests'] }); setShowCreate(false); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => purchaseRequestApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-requests'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => purchaseRequestApi.reject(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-requests'] }),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => purchaseRequestApi.submit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-requests'] }),
  });

  const prs = Array.isArray(data?.items) ? data.items : [];
  const pagination = data?.pagination;

  const priorityColors: Record<string, string> = { low: 'text-neutral-400', medium: 'text-blue-400', high: 'text-amber-400', urgent: 'text-red-400' };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Requests</h1>
          <p className="page-description">Track and manage purchase requests</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Request</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <Search size={16} className="text-neutral-500" />
          <input type="text" placeholder="Search requests..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none w-full" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-black">All Status</option>
          <option value="draft" className="bg-black">Draft</option>
          <option value="pending" className="bg-black">Pending</option>
          <option value="approved" className="bg-black">Approved</option>
          <option value="rejected" className="bg-black">Rejected</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Request</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Department</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Priority</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Est. Cost</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => <tr key={i} className="table-row"><td colSpan={7} className="px-6 py-4"><div className="loading-skeleton h-4 w-full" /></td></tr>)
              : prs.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-neutral-500"><FileText size={32} className="mx-auto mb-2 opacity-50" />No purchase requests found</td></tr>
              : prs.map((pr: any) => (
                <tr key={pr._id} className="table-row">
                  <td className="px-6 py-4"><p className="text-sm font-medium text-white">{pr.title}</p><p className="text-xs text-neutral-500 truncate max-w-48">{pr.description}</p></td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{pr.department}</td>
                  <td className="px-6 py-4"><span className={`${priorityColors[pr.priority] || ''} text-sm capitalize`}>{pr.priority}</span></td>
                  <td className="px-6 py-4 text-sm text-white font-medium">{formatCurrency(pr.estimatedCost)}</td>
                  <td className="px-6 py-4"><span className={getStatusBadgeClass(pr.status)}>{pr.status}</span></td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(pr.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {pr.status === 'draft' && <button onClick={() => submitMutation.mutate(pr._id)} className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-white" title="Submit"><Send size={14} /></button>}
                      {pr.status === 'pending' && (
                        <>
                          <button onClick={() => approveMutation.mutate(pr._id)} className="p-1.5 rounded hover:bg-white/5 text-emerald-400" title="Approve"><CheckCircle size={14} /></button>
                          <button onClick={() => rejectMutation.mutate({ id: pr._id, reason: 'Rejected' })} className="p-1.5 rounded hover:bg-white/5 text-red-400" title="Reject"><XCircle size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-neutral-500">Showing {(pagination.page-1)*pagination.limit+1}-{Math.min(pagination.page*pagination.limit, pagination.total)} of {pagination.total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => p+1)} disabled={page>=pagination.totalPages} className="p-1 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-white/[0.06] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/[0.06]"><h2 className="text-lg font-semibold">New Purchase Request</h2></div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              <div><label className="block text-sm text-neutral-300 mb-1">Title *</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-neutral-300 mb-1">Department *</label><input required value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input-field">
                    <option value="low" className="bg-black">Low</option>
                    <option value="medium" className="bg-black">Medium</option>
                    <option value="high" className="bg-black">High</option>
                    <option value="urgent" className="bg-black">Urgent</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1">Description *</label><textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="input-field resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-neutral-300 mb-1">Estimated Cost *</label><input required type="number" value={form.estimatedCost} onChange={e => setForm({...form, estimatedCost: Number(e.target.value)})} className="input-field" /></div>
                <div><label className="block text-sm text-neutral-300 mb-1">Vendor</label>
                  <select value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} className="input-field">
                    <option value="" className="bg-black">Select vendor</option>
                    {vendors.map((v: any) => <option key={v._id} value={v._id} className="bg-black">{v.vendorName}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">{createMutation.isPending ? 'Creating...' : 'Create Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;
