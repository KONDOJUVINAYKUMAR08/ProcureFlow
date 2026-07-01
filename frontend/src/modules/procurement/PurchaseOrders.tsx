import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi, vendorApi } from '../../services/endpoints';
import { formatCurrency, getStatusBadgeClass, formatDate } from '../../lib/utils';
import { Plus, Search, ShoppingCart, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const PurchaseOrders: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vendor: '', tax: 0, expectedDeliveryDate: '', notes: '', items: [{ name: '', description: '', quantity: 1, unitPrice: 0 }] });

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, search, statusFilter],
    queryFn: () => purchaseOrderApi.getAll({ page, limit: 10, search, status: statusFilter }),
  });

  const { data: vendorsData } = useQuery({ queryKey: ['vendors-list'], queryFn: () => vendorApi.getAll({ limit: 100 }) });
  const vendors = Array.isArray(vendorsData?.items) ? vendorsData.items : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => purchaseOrderApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); setShowCreate(false); },
  });

  const pos = Array.isArray(data?.items) ? data.items : [];
  const pagination = data?.pagination;

  const addItem = () => setForm({ ...form, items: [...form.items, { name: '', description: '', quantity: 1, unitPrice: 0 }] });
  const updateItem = (i: number, field: string, value: any) => { const items = [...form.items]; items[i] = { ...items[i], [field]: value }; setForm({ ...form, items }); };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Purchase Orders</h1><p className="page-description">Manage purchase orders and track deliveries</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Create PO</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <Search size={16} className="text-neutral-500" />
          <input type="text" placeholder="Search POs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none w-full" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-black">All Status</option>
          <option value="draft" className="bg-black">Draft</option>
          <option value="issued" className="bg-black">Issued</option>
          <option value="completed" className="bg-black">Completed</option>
          <option value="cancelled" className="bg-black">Cancelled</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">PO Number</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Order Date</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-6 py-3">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => <tr key={i} className="table-row"><td colSpan={6} className="px-6 py-4"><div className="loading-skeleton h-4 w-full" /></td></tr>)
              : pos.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-neutral-500"><ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />No purchase orders found</td></tr>
              : pos.map((po: any) => (
                <tr key={po._id} className="table-row cursor-pointer">
                  <td className="px-6 py-4 text-sm font-mono font-medium text-white">{po.poNumber}</td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{typeof po.vendor === 'object' ? po.vendor?.vendorName : po.vendor}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white">{formatCurrency(po.totalAmount)}</td>
                  <td className="px-6 py-4"><span className={getStatusBadgeClass(po.status)}>{po.status}</span></td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(po.orderDate)}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : '—'}</td>
                </tr>
              ))}
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
          <div className="bg-card border border-white/[0.06] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/[0.06]"><h2 className="text-lg font-semibold">Create Purchase Order</h2></div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-neutral-300 mb-1">Vendor *</label>
                  <select required value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} className="input-field">
                    <option value="" className="bg-black">Select vendor</option>
                    {vendors.map((v: any) => <option key={v._id} value={v._id} className="bg-black">{v.vendorName}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm text-neutral-300 mb-1">Expected Delivery</label><input type="date" value={form.expectedDeliveryDate} onChange={e => setForm({...form, expectedDeliveryDate: e.target.value})} className="input-field" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className="text-sm text-neutral-300">Items *</label><button type="button" onClick={addItem} className="text-xs text-white hover:underline">+ Add Item</button></div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                    <input required placeholder="Name" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} className="input-field text-xs" />
                    <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="input-field text-xs" />
                    <input type="number" min="0" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} className="input-field text-xs" />
                    <p className="text-sm text-neutral-400 flex items-center">{formatCurrency(item.quantity * item.unitPrice)}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-neutral-300 mb-1">Tax</label><input type="number" value={form.tax} onChange={e => setForm({...form, tax: Number(e.target.value)})} className="input-field" /></div>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="input-field resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">{createMutation.isPending ? 'Creating...' : 'Create PO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
