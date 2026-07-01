import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi, invoiceApi } from '../../services/endpoints';
import { formatCurrency } from '../../lib/utils';
import {
  CreditCard, Search, ChevronLeft, ChevronRight, Plus, X, AlertCircle,
  CheckCircle, Clock, TrendingUp, DollarSign, ArrowUpRight,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  reversed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const methodLabels: Record<string, string> = {
  wire_transfer: 'Wire Transfer',
  check: 'Check',
  ach: 'ACH',
  credit_card: 'Credit Card',
};

const Payments: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', page, search],
    queryFn: () => paymentApi.getAll({ page, limit: 20, search }),
  });

  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () => paymentApi.getStats(),
  });

  const payments = paymentsData?.items || [];
  const pagination = paymentsData?.pagination || { page: 1, totalPages: 1, total: 0 };

  const totalCompleted = stats?.byStatus?.find((s: any) => s._id === 'completed');
  const totalPending = stats?.byStatus?.find((s: any) => s._id === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-sm text-neutral-400 mt-1">Process and track payments for approved invoices</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={20} />} label="Total Payments" value={stats?.total || 0} color="text-indigo-400" bg="bg-indigo-500/10" />
        <StatCard icon={<CheckCircle size={20} />} label="Completed" value={totalCompleted?.count || 0} sub={formatCurrency(totalCompleted?.totalValue || 0)} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard icon={<Clock size={20} />} label="Pending" value={totalPending?.count || 0} sub={formatCurrency(totalPending?.totalValue || 0)} color="text-amber-400" bg="bg-amber-500/10" />
        <StatCard icon={<TrendingUp size={20} />} label="Total Value" value={formatCurrency(stats?.byStatus?.reduce((a: number, s: any) => a + (s.totalValue || 0), 0) || 0)} color="text-cyan-400" bg="bg-cyan-500/10" />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Search payments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Payments Table */}
      <div className="bg-[#0d0d14] border border-white/[0.06] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-500">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard size={40} className="mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-400">No payments found</p>
            <p className="text-sm text-neutral-600 mt-1">Payments will appear here after processing</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-6 py-4">Reference</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-6 py-4">Invoice</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-6 py-4">Amount</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-6 py-4">Method</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment: any) => (
                <tr key={payment._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <CreditCard size={14} className="text-indigo-400" />
                      </div>
                      <span className="font-medium text-white">{payment.paymentReference}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-300 font-mono text-xs">{payment.invoice?.substring(0, 8) || '—'}...</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-emerald-400">{formatCurrency(payment.amount)}</span>
                  </td>
                  <td className="px-6 py-4 text-neutral-300">{methodLabels[payment.paymentMethod] || payment.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[payment.status] || 'bg-neutral-500/10 text-neutral-400'}`}>
                      {payment.status === 'completed' && <CheckCircle size={12} />}
                      {payment.status === 'pending' && <Clock size={12} />}
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-400 text-xs">
                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
            <p className="text-sm text-neutral-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-2 rounded-lg border border-white/[0.06] hover:bg-white/5 disabled:opacity-30 text-neutral-400">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
                className="p-2 rounded-lg border border-white/[0.06] hover:bg-white/5 disabled:opacity-30 text-neutral-400">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Payment Modal */}
      {showCreate && <CreatePaymentModal onClose={() => setShowCreate(false)} onCreated={() => {
        setShowCreate(false);
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      }} />}
    </div>
  );
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string; bg: string }> = ({ icon, label, value, sub, color, bg }) => (
  <div className="bg-[#0d0d14] border border-white/[0.06] rounded-2xl p-5">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>{icon}</div>
      <ArrowUpRight size={14} className="text-neutral-600" />
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-sm text-neutral-500 mt-1">{label}</p>
    {sub && <p className={`text-xs mt-0.5 ${color}`}>{sub}</p>}
  </div>
);

// ── Create Payment Modal ──────────────────────────────────────────────────────
const CreatePaymentModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ invoiceId: '', paymentMethod: 'wire_transfer', notes: '' });
  const [error, setError] = useState('');

  // Fetch approved invoices
  const { data: invoicesData } = useQuery({
    queryKey: ['approved-invoices'],
    queryFn: () => invoiceApi.getAll({ status: 'approved', limit: 100 }),
  });
  const approvedInvoices = invoicesData?.items || [];

  const mutation = useMutation({
    mutationFn: (data: any) => paymentApi.create(data),
    onSuccess: onCreated,
    onError: (err: any) => setError(err.response?.data?.message || err.message || 'Payment failed'),
  });

  const selectedInvoice = approvedInvoices.find((i: any) => i._id === form.invoiceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.invoiceId) { setError('Select an invoice'); return; }
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white">Process Payment</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Pay an approved invoice</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-neutral-300 mb-1.5">Invoice *</label>
            <select value={form.invoiceId} onChange={e => setForm({ ...form, invoiceId: e.target.value })} className="input-field" required>
              <option value="" className="bg-[#0d0d14]">Select an approved invoice</option>
              {approvedInvoices.map((inv: any) => (
                <option key={inv._id} value={inv._id} className="bg-[#0d0d14]">
                  {inv.invoiceNumber} — {inv.partyName || 'Unknown'} — {formatCurrency(inv.totalAmount || inv.grossAmount || 0)}
                </option>
              ))}
            </select>
          </div>

          {selectedInvoice && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-neutral-400">Invoice</span><span className="text-white font-medium">{selectedInvoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Party</span><span className="text-neutral-300">{selectedInvoice.partyName}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Amount</span><span className="text-emerald-400 font-semibold">{formatCurrency(selectedInvoice.vendorPayable || selectedInvoice.totalAmount || 0)}</span></div>
            </div>
          )}

          <div>
            <label className="block text-sm text-neutral-300 mb-1.5">Payment Method *</label>
            <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="input-field">
              <option value="wire_transfer" className="bg-[#0d0d14]">Wire Transfer</option>
              <option value="ach" className="bg-[#0d0d14]">ACH</option>
              <option value="check" className="bg-[#0d0d14]">Check</option>
              <option value="credit_card" className="bg-[#0d0d14]">Credit Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1.5">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
              className="input-field resize-none" placeholder="Payment notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.06]">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary min-w-[120px]">
              {mutation.isPending ? 'Processing...' : 'Process Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Payments;
