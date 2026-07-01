import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseApi, customerApi } from '../../services/endpoints';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Wallet, Receipt, Percent, Plus, X, AlertCircle, Trash2 } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Purchases: React.FC = () => {
  const queryClient = useQueryClient();
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', year, month],
    queryFn: () => purchaseApi.getAll({ year, month }),
  });

  const purchases = data?.purchases || [];

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-description">View purchase totals, filter by month or year, and record vendor purchase invoices.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Purchase
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select value={year} onChange={e => setYear(e.target.value)} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-black">All Years</option>
          {years.map(y => <option key={y} value={y} className="bg-black">{y}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-black">All Months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1} className="bg-black">{m}</option>)}
        </select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="p-2 rounded-lg bg-white/[0.04] text-neutral-400 w-fit mb-3"><Wallet size={20} /></div>
          <p className="metric-value">{data?.totalPurchases ?? 0}</p>
          <p className="metric-label">Total Purchases</p>
        </div>
        <div className="metric-card">
          <div className="p-2 rounded-lg bg-white/[0.04] text-neutral-400 w-fit mb-3"><Receipt size={20} /></div>
          <p className="metric-value">{formatCurrency(data?.invoiceValue ?? 0)}</p>
          <p className="metric-label">Invoice Value</p>
        </div>
        <div className="metric-card">
          <div className="p-2 rounded-lg bg-white/[0.04] text-neutral-400 w-fit mb-3"><Percent size={20} /></div>
          <p className="metric-value">{formatCurrency(data?.totalTds ?? 0)}</p>
          <p className="metric-label">TDS (auto-calculated)</p>
        </div>
      </div>

      {/* Purchase Details Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]"><h3 className="font-semibold">Purchase Details</h3></div>
        {isLoading ? (
          <div className="p-12 text-center text-neutral-500">Loading purchases...</div>
        ) : purchases.length === 0 ? (
          <div className="empty-state py-16"><p>No purchases found for selected filters.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Date', 'Invoice No.', 'Billed From', 'GSTIN of Supplier', 'Billed To', 'HSN/SAC', 'Description', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'TDS', 'Invoice Value'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-neutral-500 px-6 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.map((p: any) => (
                  <tr key={p._id} className="table-row">
                    <td className="px-6 py-3 text-neutral-400 whitespace-nowrap">{formatDate(p.purchaseDate)}</td>
                    <td className="px-6 py-3 font-mono text-white whitespace-nowrap">{p.invoiceNumber}</td>
                    <td className="px-6 py-3 text-neutral-300 whitespace-nowrap">{p.supplierName}</td>
                    <td className="px-6 py-3 text-neutral-400 whitespace-nowrap">{p.supplierGstin || '—'}</td>
                    <td className="px-6 py-3 text-neutral-300 whitespace-nowrap">{p.billedTo || '—'}</td>
                    <td className="px-6 py-3 text-neutral-400 whitespace-nowrap">{p.hsnSac || '—'}</td>
                    <td className="px-6 py-3 text-neutral-400">{p.description || '—'}</td>
                    <td className="px-6 py-3 text-white whitespace-nowrap">{formatCurrency(p.taxableAmount)}</td>
                    <td className="px-6 py-3 text-neutral-400 whitespace-nowrap">{formatCurrency(p.cgst)}</td>
                    <td className="px-6 py-3 text-neutral-400 whitespace-nowrap">{formatCurrency(p.sgst)}</td>
                    <td className="px-6 py-3 text-neutral-400 whitespace-nowrap">{formatCurrency(p.igst)}</td>
                    <td className="px-6 py-3 text-amber-400 whitespace-nowrap">{formatCurrency(p.tdsAmount)} ({p.tdsPercentage}%)</td>
                    <td className="px-6 py-3 text-white font-medium whitespace-nowrap">{formatCurrency(p.invoiceValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <NewPurchaseModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
          }}
        />
      )}
    </div>
  );
};

const emptyForm = {
  registeredCustomerId: '',
  supplierName: '',
  supplierGstin: '',
  billedTo: '',
  customerGstin: '',
  hsnSac: '',
  invoiceNumber: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  taxableAmount: '',
  cgst: '',
  sgst: '',
  igst: '',
  invoiceValue: '',
  description: '',
  tdsPercentage: '10',
};

const NewPurchaseModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customerApi.getAll({ limit: 200 }),
  });
  const customers = customersData?.items || [];

  const mutation = useMutation({
    mutationFn: (data: any) => purchaseApi.create(data),
    onSuccess: onCreated,
    onError: (err: any) => setError(err.response?.data?.message || err.message || 'Failed to save purchase'),
  });

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.supplierName || !form.invoiceNumber || !form.taxableAmount) {
      setError('Supplier name, invoice number, and taxable amount are required');
      return;
    }
    mutation.mutate({
      ...form,
      taxableAmount: Number(form.taxableAmount),
      cgst: Number(form.cgst) || 0,
      sgst: Number(form.sgst) || 0,
      igst: Number(form.igst) || 0,
      invoiceValue: form.invoiceValue ? Number(form.invoiceValue) : undefined,
      tdsPercentage: Number(form.tdsPercentage) || 10,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white">New Purchase</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Pick a registered customer or enter supplier details. TDS is calculated automatically from the taxable amount.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-neutral-300 mb-1.5">Registered Customer</label>
            <select value={form.registeredCustomerId} onChange={e => set('registeredCustomerId', e.target.value)} className="input-field">
              <option value="" className="bg-black">— None / not registered —</option>
              {customers.map((c: any) => (
                <option key={c._id} value={c._id} className="bg-black">{c.companyName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Supplier Name *</label>
              <input value={form.supplierName} onChange={e => set('supplierName', e.target.value)} className="input-field" placeholder="Supplier / Vendor Name" required />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">GSTIN of Supplier</label>
              <input value={form.supplierGstin} onChange={e => set('supplierGstin', e.target.value)} className="input-field" placeholder="Supplier GSTIN" />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Billed To</label>
              <input value={form.billedTo} onChange={e => set('billedTo', e.target.value)} className="input-field" placeholder="Customer / billed to" />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">GST No of Customer</label>
              <input value={form.customerGstin} onChange={e => set('customerGstin', e.target.value)} className="input-field" placeholder="Customer GSTIN" />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">HSN / SAC</label>
              <input value={form.hsnSac} onChange={e => set('hsnSac', e.target.value)} className="input-field" placeholder="HSN / SAC code" />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Invoice Number *</label>
              <input value={form.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} className="input-field" placeholder="Purchase invoice number" required />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Taxable Amount *</label>
              <input type="number" value={form.taxableAmount} onChange={e => set('taxableAmount', e.target.value)} className="input-field" placeholder="Taxable amount" required />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">CGST</label>
              <input type="number" value={form.cgst} onChange={e => set('cgst', e.target.value)} className="input-field" placeholder="CGST amount" />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">SGST</label>
              <input type="number" value={form.sgst} onChange={e => set('sgst', e.target.value)} className="input-field" placeholder="SGST amount" />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">IGST</label>
              <input type="number" value={form.igst} onChange={e => set('igst', e.target.value)} className="input-field" placeholder="IGST amount" />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">Invoice Value</label>
              <input type="number" value={form.invoiceValue} onChange={e => set('invoiceValue', e.target.value)} className="input-field" placeholder="Total invoice value (auto if blank)" />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5">TDS %</label>
              <input type="number" value={form.tdsPercentage} onChange={e => set('tdsPercentage', e.target.value)} className="input-field" placeholder="10" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="input-field resize-none" placeholder="Purchase description or notes" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.06]">
            <button type="button" onClick={() => setForm(emptyForm)} className="btn-secondary flex items-center gap-2"><Trash2 size={14} /> Reset Form</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary min-w-[140px]">
              {mutation.isPending ? 'Saving...' : 'Save Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Purchases;
