import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi, vendorApi, customerApi } from '../../services/endpoints';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, formatDate, getStatusBadgeClass, downloadFile } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  Receipt, Plus, Search, Filter, Download, TrendingUp, DollarSign,
  AlertTriangle, CheckCircle, Clock, FileText, RefreshCw, Eye,
  Edit3, Trash2, X, ChevronLeft, ChevronRight, ArrowUpRight,
  Building2, Calendar, IndianRupee, Percent,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import InvoiceForm from './InvoiceForm';
import InvoiceDetailModal from './InvoiceDetailModal';

// COLORS is now theme-split inside the component

const KpiCard: React.FC<{
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: string;
}> = ({ label, value, sub, icon, color, trend }) => (
  <div className="glass-card p-5 group hover:border-white/10 transition-all duration-300">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
        <span className={`${color.replace('bg-', 'text-')}`}>{icon}</span>
      </div>
      {trend && (
        <span className={`text-xs font-semibold flex items-center gap-1 ${trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
          <ArrowUpRight size={12} className={trend.startsWith('-') ? 'rotate-180' : ''} />
          {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-white mt-1">{value}</p>
    <p className="text-sm text-neutral-400 mt-1">{label}</p>
    {sub && <p className="text-xs text-neutral-600 mt-0.5">{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }} className="rounded-xl p-3 shadow-2xl">
        <p className="text-xs text-neutral-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const InvoiceDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisStroke = isDark ? '#64748b' : '#94a3b8';
  const COLORS = isDark
    ? ['#818cf8', '#22d3ee', '#34d399', '#f472b6', '#fb923c', '#a78bfa']
    : ['#f97316', '#fbbf24', '#22d3ee', '#10b981', '#ef4444', '#a855f7'];
  const revenuePrimary  = isDark ? '#818cf8' : '#f97316';
  const gradientStart   = isDark ? '#818cf8' : '#f97316';
  const gradientEnd     = isDark ? '#a78bfa' : '#fbbf24';

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState<any>(null);
  const [viewInvoice, setViewInvoice] = useState<any>(null);

  // Debounce search so rapid typing doesn't fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', page, search, statusFilter, typeFilter, year, month],
    queryFn: () => invoiceApi.getAll({ page, limit: 10, search: search || undefined, status: statusFilter || undefined, invoiceType: typeFilter || undefined, year: year || undefined, month: month || undefined }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: () => invoiceApi.getStats(),
    staleTime: 60000,
  });

  // Sir's exact dashboard metrics — customer-invoice side only, never netted
  // against vendor/purchase invoices (see Purchases for that side).
  const { data: dashboard } = useQuery({
    queryKey: ['invoice-dashboard', year, month],
    queryFn: () => invoiceApi.getDashboard({ year, month }),
  });

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); queryClient.invalidateQueries({ queryKey: ['invoice-stats'] }); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.markAsPaid(id, 'Bank Transfer'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const pdfMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.generatePdf(id),
    onSuccess: (data: any) => {
      if (data?.url) downloadFile(data.url, data.fileName || 'invoice.pdf');
    },
  });

  const invoices = invoicesData?.items || [];
  const pagination = invoicesData?.pagination;
  const stats = statsData as any;

  const summary = stats?.summary || {};
  const byStatus = stats?.byStatus || [];

  // Build monthly chart data from invoice list (simplified)
  const monthlyData = [
    { month: 'Jan', revenue: 0, gst: 0 },
    { month: 'Feb', revenue: 0, gst: 0 },
    { month: 'Mar', revenue: 0, gst: 0 },
  ];

  const statusPie = byStatus.map((s: any) => ({ name: s.status, value: s.count }));

  // Per-month invoice count derived from the dashboard invoices array
  const monthlyBreakdown = useMemo(() => {
    if (!dashboard?.invoices?.length) return [];
    const map: Record<string, number> = {};
    for (const inv of dashboard.invoices) {
      if (inv.issueDate) {
        const d = new Date(inv.issueDate);
        const key = MONTHS[d.getMonth()];
        map[key] = (map[key] || 0) + 1;
      }
    }
    return MONTHS.filter(m => map[m]).map(m => ({ month: m, count: map[m] }));
  }, [dashboard?.invoices]);

  const canCreate = user?.role === 'admin' || user?.role === 'finance' || user?.role === 'procurement_manager';
  const canApprove = user?.role === 'admin' || user?.role === 'finance';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice Dashboard</h1>
          <p className="page-description">Manage invoices, track payments, and analyze financial performance</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditInvoice(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> New Invoice
          </button>
        )}
      </div>

      {/* Year/Month filter */}
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

      {/* KPI Cards — matches sir's exact dashboard: total invoices, income
          generated net of GST/TDS, TDS deducted, GST collected. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total invoices" value={dashboard?.totalInvoices || 0} sub="Click to view invoice listings" icon={<Receipt size={20} />} color="bg-indigo-500" />
        <KpiCard label="Income generated" value={formatCurrency(dashboard?.incomeGenerated || 0)} sub="Net amount after GST and TDS" icon={<IndianRupee size={20} />} color="bg-emerald-500" />
        <KpiCard label="TDS deducted" value={formatCurrency(dashboard?.totalTds || 0)} sub="Total TDS collected from customers" icon={<TrendingUp size={20} />} color="bg-amber-500" />
        <KpiCard label="GST collected" value={formatCurrency(dashboard?.totalGst || 0)} sub="Sum of CGST/SGST/IGST" icon={<Percent size={20} />} color="bg-cyan-500" />
      </div>

      {/* Monthly count — shows per-month invoice count for the current filter */}
      {monthlyBreakdown.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-muted)' }}>
              Invoices by Month {year ? `(${year})` : ''}
            </h3>
            <span className="text-xs" style={{ color: 'var(--fg-faint)' }}>{dashboard?.totalInvoices} total</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {monthlyBreakdown.map(({ month: m, count }) => (
              <div
                key={m}
                onClick={() => { setMonth(String(MONTHS.indexOf(m) + 1)); if (!year) setYear(String(new Date().getFullYear())); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                title={`Filter by ${m}`}
              >
                <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>{m.slice(0, 3)}</span>
                <span className="text-sm font-bold" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {byStatus.map((s: any, i: number) => (
          <div key={s.status} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusBadgeClass(s.status)}`}>{s.status}</span>
              <span className="text-xs text-neutral-500">{s.count} invoices</span>
            </div>
            <p className="text-xl font-bold text-white">{formatCurrency(s.totalAmount)}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-400" /> Monthly Revenue Trend
          </h3>
          <div className="h-64">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={gradientStart} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={gradientEnd} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGst" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" stroke={axisStroke} fontSize={11} />
                  <YAxis stroke={axisStroke} fontSize={11} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={revenuePrimary} fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="gst" name="GST" stroke="#22d3ee" fill="url(#colorGst)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full"><p>No data yet — create your first invoice</p></div>
            )}
          </div>
        </div>

        {/* Status Pie */}
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Invoice Status</h3>
          <div className="h-64 flex items-center justify-center">
            {statusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusPie.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }} className="rounded-lg p-2">
                      <p className="text-sm capitalize" style={{ color: 'var(--fg)' }}>{payload[0].name}: {payload[0].value}</p>
                    </div>
                  ) : null} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No invoices yet</p></div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {statusPie.map((s: any, i: number) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-neutral-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="capitalize">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="glass-card p-5">
        <h3 className="section-title mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-emerald-400" /> Financial Summary (All Invoices)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Gross Amount', value: summary.totalGrossAmount, color: 'text-white' },
            { label: 'Total GST', value: summary.totalGst, color: 'text-cyan-400' },
            { label: 'Total TDS Deducted', value: summary.totalTds, color: 'text-amber-400' },
            { label: 'Company Receivable', value: summary.totalReceivable, color: 'text-emerald-400' },
            { label: 'Vendor Payable', value: summary.totalPayable, color: 'text-indigo-400' },
          ].map(item => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className={`text-xl font-bold ${item.color}`}>{formatCurrency(item.value || 0)}</p>
              <p className="text-xs text-neutral-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <Search size={16} className="text-neutral-500" />
          <input
            type="text" placeholder="Search invoice number or party..."
            value={searchInput} onChange={e => setSearchInput(e.target.value)}
            className="bg-transparent text-sm outline-none w-full"
            style={{ color: 'var(--fg)' }}
          />
          {searchInput && <button onClick={() => { setSearchInput(''); setSearch(''); }}><X size={14} style={{ color: 'var(--fg-faint)' }} /></button>}
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-[#0d0d14]">All Status</option>
          {['draft', 'pending', 'approved', 'paid', 'overdue', 'disputed', 'cancelled'].map(s => (
            <option key={s} value={s} className="bg-[#0d0d14] capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-[#0d0d14]">All Types</option>
          <option value="CUSTOMER_INVOICE" className="bg-[#0d0d14]">Customer Invoice</option>
          <option value="VENDOR_INVOICE" className="bg-[#0d0d14]">Vendor Invoice</option>
        </select>
      </div>

      {/* Invoice Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Invoice #', 'Type', 'Party', 'Issue Date', 'Due Date', 'Gross Amount', 'GST', 'TDS', 'Co. Receivable', 'Vendor Payable', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="table-row">
                    <td colSpan={12} className="px-4 py-3">
                      <div className="loading-skeleton h-4 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16">
                    <Receipt size={40} className="mx-auto mb-3 text-neutral-700" />
                    <p className="text-neutral-500">No invoices found</p>
                    {canCreate && (
                      <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
                        <Plus size={14} className="inline mr-1" /> Create First Invoice
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                invoices.map((inv: any) => {
                  const isOverdue = new Date(inv.dueDate) < new Date() && !['paid', 'cancelled'].includes(inv.status);
                  return (
                    <tr key={inv._id} className="table-row group">
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono font-semibold text-white">{inv.invoiceNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.invoiceType === 'CUSTOMER_INVOICE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {inv.invoiceType === 'CUSTOMER_INVOICE' ? 'Customer' : 'Vendor'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-medium truncate max-w-[140px]">{inv.partyName || inv.vendor || '—'}</p>
                        {inv.partyGstin && <p className="text-[10px] text-neutral-500">{inv.partyGstin}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-400 whitespace-nowrap">{formatDate(inv.issueDate || inv.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm whitespace-nowrap ${isOverdue ? 'text-red-400 font-semibold' : 'text-neutral-400'}`}>
                          {isOverdue && <AlertTriangle size={12} className="inline mr-1" />}
                          {formatDate(inv.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-white whitespace-nowrap">{formatCurrency(inv.grossAmount || inv.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-cyan-400 whitespace-nowrap">{formatCurrency(inv.totalGst || inv.tax || 0)}</td>
                      <td className="px-4 py-3 text-sm text-amber-400 whitespace-nowrap">{formatCurrency(inv.tdsAmount || 0)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-400 font-semibold whitespace-nowrap">{formatCurrency(inv.companyReceivable || inv.grossAmount || inv.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-indigo-400 whitespace-nowrap">{formatCurrency(inv.vendorPayable || inv.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold capitalize ${getStatusBadgeClass(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewInvoice(inv)} className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-white" title="View">
                            <Eye size={14} />
                          </button>
                          {canCreate && inv.status !== 'paid' && (
                            <button onClick={() => { setEditInvoice(inv); setShowForm(true); }} className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-white" title="Edit">
                              <Edit3 size={14} />
                            </button>
                          )}
                          {canApprove && inv.status === 'pending' && (
                            <button onClick={() => approveMutation.mutate(inv._id)} className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-400" title="Approve">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {canApprove && inv.status === 'approved' && (
                            <button onClick={() => payMutation.mutate(inv._id)} className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400" title="Mark Paid">
                              <DollarSign size={14} />
                            </button>
                          )}
                          <button onClick={() => pdfMutation.mutate(inv._id)} disabled={pdfMutation.isPending} className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-white" title="Download PDF">
                            <Download size={14} />
                          </button>
                          {canCreate && inv.status !== 'paid' && (
                            <button
                              onClick={() => { if (confirm('Delete this invoice?')) deleteMutation.mutate(inv._id); }}
                              className="p-1.5 rounded hover:bg-red-500/10 text-neutral-400 hover:text-red-400" title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-neutral-500">{pagination.total} total invoices</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-neutral-400">Page {page} of {pagination.totalPages || 1}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= (pagination.totalPages || 1)}
                className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Form Modal */}
      {showForm && (
        <InvoiceForm
          invoice={editInvoice}
          onClose={() => { setShowForm(false); setEditInvoice(null); }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
            setShowForm(false);
            setEditInvoice(null);
          }}
        />
      )}

      {/* Invoice Detail Modal */}
      {viewInvoice && (
        <InvoiceDetailModal
          invoice={viewInvoice}
          onClose={() => setViewInvoice(null)}
          onDownloadPdf={() => pdfMutation.mutate(viewInvoice._id)}
        />
      )}
    </div>
  );
};

export default InvoiceDashboard;
