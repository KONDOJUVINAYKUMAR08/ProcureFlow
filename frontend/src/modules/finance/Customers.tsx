import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../services/endpoints';
import { formatDate } from '../../lib/utils';
import {
  UserCircle, Plus, Search, X, Edit3, Trash2, Eye,
  Phone, Mail, Building2, ChevronLeft, ChevronRight,
  MapPin, FileText, AlertCircle, ArrowUpRight,
} from 'lucide-react';

const KpiCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="glass-card p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
        <span className={`${color.replace('bg-', 'text-')}`}>{icon}</span>
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-sm text-neutral-400 mt-1">{label}</p>
  </div>
);

interface CustomerFormProps {
  customer?: any;
  onClose: () => void;
  onSaved: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onClose, onSaved }) => {
  const isEdit = !!customer;
  const [form, setForm] = useState({
    companyName: customer?.companyName || '',
    contactPerson: customer?.contactPerson || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    gstin: customer?.gstin || '',
    pan: customer?.pan || '',
    paymentTerms: customer?.paymentTerms || 'Net 30',
    creditLimit: customer?.creditLimit || '',
    industry: customer?.industry || '',
    website: customer?.website || '',
    notes: customer?.notes || '',
    status: customer?.status || 'active',
    currency: customer?.currency || 'INR',
    language: customer?.language || 'English',
    gstTreatment: customer?.gstTreatment || '',
    placeOfSupply: customer?.placeOfSupply || '',
    taxPreference: customer?.taxPreference || 'taxable',
    portalEnabled: customer?.portalEnabled || false,
    address: {
      street: customer?.address?.street || '',
      city: customer?.address?.city || '',
      state: customer?.address?.state || '',
      country: customer?.address?.country || 'India',
      zipCode: customer?.address?.zipCode || '',
    },
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? customerApi.update(customer._id, data) : customerApi.create(data),
    onSuccess: onSaved,
    onError: (err: any) => setError(err.response?.data?.message || err.message || 'Failed to save'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.companyName || !form.email || !form.phone) {
      setError('Company name, email, and phone are required');
      return;
    }
    mutation.mutate({ ...form, creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined });
  };

  const inputClass = "input-field";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl w-full max-w-2xl my-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-semibold text-white">{isEdit ? 'Edit Customer' : 'Add Customer'}</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Customer information for invoice generation</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-neutral-300 mb-1.5">Company Name *</label>
                <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} required className={inputClass} placeholder="Acme Technologies Ltd." />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Contact Person *</label>
                <input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} required className={inputClass} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className={inputClass} placeholder="billing@company.com" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Phone *</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required className={inputClass} placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">GSTIN</label>
                <input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} className={inputClass} placeholder="22AAAAA0000A1Z5" maxLength={15} />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">PAN</label>
                <input value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value })} className={inputClass} placeholder="AAAAA0000A" maxLength={10} />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Industry</label>
                <select value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} className={inputClass}>
                  <option value="" className="bg-[#0d0d14]">Select industry</option>
                  {['IT & Software', 'Manufacturing', 'Healthcare', 'Education', 'Finance', 'Retail', 'Construction', 'Logistics', 'Consulting', 'Other'].map(i => (
                    <option key={i} value={i} className="bg-[#0d0d14]">{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Website</label>
                <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className={inputClass} placeholder="https://company.com" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Address</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm text-neutral-300 mb-1.5">Street</label>
                <input value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} className={inputClass} placeholder="123 Business Park" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">City</label>
                <input value={form.address.city} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className={inputClass} placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">State</label>
                <input value={form.address.state} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} className={inputClass} placeholder="Maharashtra" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">ZIP Code</label>
                <input value={form.address.zipCode} onChange={e => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })} className={inputClass} placeholder="400001" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Country</label>
                <input value={form.address.country} onChange={e => setForm({ ...form, address: { ...form.address, country: e.target.value } })} className={inputClass} placeholder="India" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Payment Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Currency</label>
                <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className={inputClass}>
                  {['INR', 'USD', 'EUR', 'GBP'].map(c => <option key={c} value={c} className="bg-[#0d0d14]">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Customer Language</label>
                <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className={inputClass}>
                  {['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu'].map(l => <option key={l} value={l} className="bg-[#0d0d14]">{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Payment Terms</label>
                <select value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} className={inputClass}>
                  {['Immediate', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'].map(t => (
                    <option key={t} value={t} className="bg-[#0d0d14]">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Credit Limit (₹)</label>
                <input type="number" min={0} value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} className={inputClass} placeholder="500000" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}>
                  <option value="active" className="bg-[#0d0d14]">Active</option>
                  <option value="inactive" className="bg-[#0d0d14]">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputClass} placeholder="Any special notes..." />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Other Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">GST Treatment</label>
                <select value={form.gstTreatment} onChange={e => setForm({ ...form, gstTreatment: e.target.value })} className={inputClass}>
                  <option value="" className="bg-[#0d0d14]">Select a GST treatment</option>
                  {['Registered Business - Regular', 'Registered Business - Composition', 'Unregistered Business', 'Consumer', 'Overseas'].map(g => (
                    <option key={g} value={g} className="bg-[#0d0d14]">{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Place of Supply</label>
                <input value={form.placeOfSupply} onChange={e => setForm({ ...form, placeOfSupply: e.target.value })} className={inputClass} placeholder="Karnataka (29)" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Tax Preference</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                    <input type="radio" name="taxPreference" checked={form.taxPreference === 'taxable'} onChange={() => setForm({ ...form, taxPreference: 'taxable' })} /> Taxable
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                    <input type="radio" name="taxPreference" checked={form.taxPreference === 'tax_exempt'} onChange={() => setForm({ ...form, taxPreference: 'tax_exempt' })} /> Tax Exempt
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Enable Portal?</label>
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer mt-2">
                  <input type="checkbox" checked={form.portalEnabled} onChange={e => setForm({ ...form, portalEnabled: e.target.checked })} />
                  Allow portal access for this customer
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary min-w-[140px]">
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Customers: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [viewCustomer, setViewCustomer] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, statusFilter],
    queryFn: () => customerApi.getAll({ page, limit: 10, search, status: statusFilter }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: () => customerApi.getStats(),
    staleTime: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
    },
  });

  const customers = data?.items || [];
  const pagination = data?.pagination;
  const stats = statsData as any || {};

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Management</h1>
          <p className="page-description">Manage your B2B clients and billing contacts</p>
        </div>
        <button onClick={() => { setEditCustomer(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Customers" value={stats.total || 0} color="bg-indigo-500" icon={<Building2 size={20} />} />
        <KpiCard label="Active Customers" value={stats.active || 0} color="bg-emerald-500" icon={<UserCircle size={20} />} />
        <KpiCard label="Inactive Customers" value={stats.inactive || 0} color="bg-neutral-500" icon={<UserCircle size={20} />} />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <Search size={16} className="text-neutral-500" />
          <input
            type="text" placeholder="Search by company, email, contact..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none w-full"
          />
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-neutral-500 hover:text-white" /></button>}
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-[#0d0d14]">All Status</option>
          <option value="active" className="bg-[#0d0d14]">Active</option>
          <option value="inactive" className="bg-[#0d0d14]">Inactive</option>
        </select>
      </div>

      {/* Customer Cards / Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="loading-skeleton h-5 w-2/3 rounded mb-3" />
              <div className="loading-skeleton h-4 w-1/2 rounded mb-2" />
              <div className="loading-skeleton h-4 w-1/3 rounded" />
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <UserCircle size={48} className="mx-auto mb-4 text-neutral-700" />
          <p className="text-neutral-400 font-medium">No customers found</p>
          <p className="text-neutral-600 text-sm mt-1">Start by adding your first customer</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
            <Plus size={14} className="inline mr-1" /> Add Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((c: any) => (
            <div key={c._id} className="glass-card p-5 group hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center text-sm font-bold text-indigo-400">
                    {c.companyName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{c.companyName}</p>
                    <p className="text-xs text-neutral-500 font-mono">{c.customerCode}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-500/10 text-neutral-500'}`}>
                  {c.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-400">
                <div className="flex items-center gap-2"><Building2 size={12} /> <span>{c.contactPerson}</span></div>
                <div className="flex items-center gap-2"><Mail size={12} /> <span className="truncate">{c.email}</span></div>
                <div className="flex items-center gap-2"><Phone size={12} /> <span>{c.phone}</span></div>
                {c.gstin && <div className="flex items-center gap-2"><FileText size={12} /> <span>GSTIN: {c.gstin}</span></div>}
                {c.address?.city && <div className="flex items-center gap-2"><MapPin size={12} /> <span>{c.address.city}, {c.address.state}</span></div>}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-neutral-600">Terms:</span>
                  <span className="text-neutral-400">{c.paymentTerms || 'Net 30'}</span>
                  {c.industry && <><span className="text-neutral-700 mx-1">·</span><span className="text-neutral-500">{c.industry}</span></>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setViewCustomer(c)} className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-white" title="View">
                    <Eye size={13} />
                  </button>
                  <button onClick={() => { setEditCustomer(c); setShowForm(true); }} className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-white" title="Edit">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => { if (confirm(`Delete ${c.companyName}?`)) deleteMutation.mutate(c._id); }}
                    className="p-1.5 rounded hover:bg-red-500/10 text-neutral-400 hover:text-red-400" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">{pagination.total} customers total</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronLeft size={16} /></button>
            <span className="text-xs text-neutral-400">Page {page} of {pagination.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* View Detail Side Panel */}
      {viewCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => setViewCustomer(null)}>
          <div className="bg-[#0d0d14] border-l border-white/[0.06] w-full max-w-md h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white">Customer Profile</h2>
              <button onClick={() => setViewCustomer(null)} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center text-2xl font-bold text-indigo-400 mx-auto mb-3">
                  {viewCustomer.companyName?.[0]}
                </div>
                <p className="text-lg font-bold text-white">{viewCustomer.companyName}</p>
                <p className="text-sm text-neutral-500 font-mono">{viewCustomer.customerCode}</p>
              </div>

              {[
                { label: 'Contact Person', value: viewCustomer.contactPerson },
                { label: 'Email', value: viewCustomer.email },
                { label: 'Phone', value: viewCustomer.phone },
                { label: 'GSTIN', value: viewCustomer.gstin || '—' },
                { label: 'PAN', value: viewCustomer.pan || '—' },
                { label: 'Industry', value: viewCustomer.industry || '—' },
                { label: 'Payment Terms', value: viewCustomer.paymentTerms },
                { label: 'Credit Limit', value: viewCustomer.creditLimit ? `₹${viewCustomer.creditLimit.toLocaleString('en-IN')}` : '—' },
                { label: 'Status', value: viewCustomer.status },
                { label: 'Website', value: viewCustomer.website || '—' },
                { label: 'Added On', value: formatDate(viewCustomer.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-sm text-neutral-500">{label}</span>
                  <span className="text-sm text-white font-medium max-w-[60%] text-right">{value}</span>
                </div>
              ))}

              {viewCustomer.address?.city && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Address</p>
                  <p className="text-sm text-neutral-300">
                    {[viewCustomer.address.street, viewCustomer.address.city, viewCustomer.address.state, viewCustomer.address.zipCode, viewCustomer.address.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setViewCustomer(null); setEditCustomer(viewCustomer); setShowForm(true); }} className="btn-secondary flex-1">
                  <Edit3 size={14} className="inline mr-1" /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editCustomer}
          onClose={() => { setShowForm(false); setEditCustomer(null); }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
            setShowForm(false);
            setEditCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default Customers;
