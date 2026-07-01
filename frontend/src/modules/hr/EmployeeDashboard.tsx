import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../../services/endpoints';
import { formatDate } from '../../lib/utils';
import {
  Briefcase, Plus, Search, X, Edit3, Trash2, Eye, ChevronLeft, ChevronRight,
  Users, TrendingUp, DollarSign, Building2, AlertCircle, Phone, Mail,
  Calendar, UserCircle, ArrowUpRight,
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Design', 'Product', 'Legal', 'Admin', 'Other'];
const DESIGNATIONS = ['Software Engineer', 'Senior Engineer', 'Team Lead', 'Manager', 'Senior Manager', 'VP', 'Director', 'CEO', 'CFO', 'CTO', 'Analyst', 'Executive', 'Associate', 'Intern', 'Consultant'];

const EmpForm: React.FC<{ emp?: any; onClose: () => void; onSaved: () => void }> = ({ emp, onClose, onSaved }) => {
  const isEdit = !!emp;
  const [form, setForm] = useState({
    firstName: emp?.firstName || '',
    lastName: emp?.lastName || '',
    email: emp?.email || '',
    phone: emp?.phone || '',
    department: emp?.department || '',
    designation: emp?.designation || '',
    employmentType: emp?.employmentType || 'full_time',
    joiningDate: emp?.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
    status: emp?.status || 'active',
    basicSalary: emp?.basicSalary || '',
    hra: emp?.hra || '',
    transportAllowance: emp?.transportAllowance || '',
    otherAllowances: emp?.otherAllowances || '',
    pan: emp?.pan || '',
    bankName: emp?.bankName || '',
    accountNumber: emp?.accountNumber || '',
    ifscCode: emp?.ifscCode || '',
    gender: emp?.gender || '',
    dateOfBirth: emp?.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '',
    address: emp?.address || '',
    emergencyContact: emp?.emergencyContact || '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? hrApi.employees.update(emp._id, data) : hrApi.employees.create(data),
    onSuccess: onSaved,
    onError: (e: any) => setError(e.response?.data?.message || e.message || 'Failed to save'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.email || !form.department || !form.designation || !form.joiningDate) {
      setError('First name, email, department, designation, and joining date are required');
      return;
    }
    mutation.mutate({
      ...form,
      basicSalary: Number(form.basicSalary) || 0,
      hra: Number(form.hra) || 0,
      transportAllowance: Number(form.transportAllowance) || 0,
      otherAllowances: Number(form.otherAllowances) || 0,
      joiningDate: new Date(form.joiningDate),
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl w-full max-w-3xl my-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-semibold text-white">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Fill in employee details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"><AlertCircle size={16} />{error}</div>}

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-300 mb-1.5">First Name *</label><input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required className="input-field" placeholder="John" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Last Name</label><input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="input-field" placeholder="Doe" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Email *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="input-field" placeholder="john@company.com" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Phone *</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className="input-field" placeholder="+91 9876543210" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Gender</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="input-field">
                  <option value="" className="bg-[#0d0d14]">Select</option>
                  <option value="male" className="bg-[#0d0d14]">Male</option>
                  <option value="female" className="bg-[#0d0d14]">Female</option>
                  <option value="other" className="bg-[#0d0d14]">Other</option>
                </select>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Date of Birth</label><input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="input-field" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Employment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-300 mb-1.5">Department *</label>
                <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} required className="input-field">
                  <option value="" className="bg-[#0d0d14]">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-[#0d0d14]">{d}</option>)}
                </select>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Designation *</label>
                <select value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} required className="input-field">
                  <option value="" className="bg-[#0d0d14]">Select designation</option>
                  {DESIGNATIONS.map(d => <option key={d} value={d} className="bg-[#0d0d14]">{d}</option>)}
                </select>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Employment Type</label>
                <select value={form.employmentType} onChange={e => setForm({...form, employmentType: e.target.value})} className="input-field">
                  <option value="full_time" className="bg-[#0d0d14]">Full Time</option>
                  <option value="part_time" className="bg-[#0d0d14]">Part Time</option>
                  <option value="contract" className="bg-[#0d0d14]">Contract</option>
                  <option value="intern" className="bg-[#0d0d14]">Intern</option>
                </select>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Joining Date *</label><input type="date" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} required className="input-field" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-field">
                  <option value="active" className="bg-[#0d0d14]">Active</option>
                  <option value="inactive" className="bg-[#0d0d14]">Inactive</option>
                  <option value="resigned" className="bg-[#0d0d14]">Resigned</option>
                  <option value="terminated" className="bg-[#0d0d14]">Terminated</option>
                </select>
              </div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">PAN</label><input value={form.pan} onChange={e => setForm({...form, pan: e.target.value})} className="input-field" placeholder="AAAAA0000A" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Salary (Monthly ₹)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="block text-sm text-neutral-300 mb-1.5">Basic</label><input type="number" min={0} value={form.basicSalary} onChange={e => setForm({...form, basicSalary: e.target.value})} className="input-field" placeholder="25000" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">HRA</label><input type="number" min={0} value={form.hra} onChange={e => setForm({...form, hra: e.target.value})} className="input-field" placeholder="10000" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Transport</label><input type="number" min={0} value={form.transportAllowance} onChange={e => setForm({...form, transportAllowance: e.target.value})} className="input-field" placeholder="2000" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Other</label><input type="number" min={0} value={form.otherAllowances} onChange={e => setForm({...form, otherAllowances: e.target.value})} className="input-field" placeholder="3000" /></div>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-sm text-emerald-400">Gross: ₹{((Number(form.basicSalary)||0) + (Number(form.hra)||0) + (Number(form.transportAllowance)||0) + (Number(form.otherAllowances)||0)).toLocaleString('en-IN')}/month</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Bank Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm text-neutral-300 mb-1.5">Bank Name</label><input value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} className="input-field" placeholder="HDFC Bank" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Account No.</label><input value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} className="input-field" placeholder="1234567890" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">IFSC Code</label><input value={form.ifscCode} onChange={e => setForm({...form, ifscCode: e.target.value})} className="input-field" placeholder="HDFC0001234" /></div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary min-w-[140px]">
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EmployeeDashboard: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, deptFilter, statusFilter],
    queryFn: () => hrApi.employees.getAll({ page, limit: 12, search, department: deptFilter, status: statusFilter }),
  });

  const { data: stats } = useQuery({ queryKey: ['employee-stats'], queryFn: () => hrApi.employees.getStats() });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hrApi.employees.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); qc.invalidateQueries({ queryKey: ['employee-stats'] }); },
  });

  const employees = data?.items || [];
  const pagination = data?.pagination;
  const s = stats as any || {};

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Management</h1>
          <p className="page-description">Manage your workforce, roles, and compensation</p>
        </div>
        <button onClick={() => { setEditEmp(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: s.total || 0, icon: <Users size={20} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Active', value: s.active || 0, icon: <UserCircle size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Departments', value: s.byDepartment?.length || 0, icon: <Building2 size={20} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Monthly Payroll', value: `₹${((s.totalPayroll || 0) / 1000).toFixed(0)}K`, icon: <DollarSign size={20} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(c => (
          <div key={c.label} className="glass-card p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${c.bg} mb-3`}><span className={c.color}>{c.icon}</span></div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-sm text-neutral-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {s.byDepartment?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <h3 className="section-title mb-4">By Department</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.byDepartment}>
                  <XAxis dataKey="dept" stroke="#555" fontSize={10} />
                  <YAxis stroke="#555" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Employees" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="section-title mb-4">Employment Type</h3>
            <div className="h-48 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={s.byType || []} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                    {(s.byType || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(v, n) => [v, String(n).replace('_', ' ')]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {(s.byType || []).map((t: any, i: number) => (
                  <div key={t.type} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-neutral-400 capitalize">{t.type.replace('_', ' ')}</span>
                    <span className="text-white font-semibold ml-auto">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <Search size={16} className="text-neutral-500" />
          <input type="text" placeholder="Search employees..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none flex-1" />
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-neutral-500 hover:text-white" /></button>}
        </div>
        <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-[#0d0d14]">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-[#0d0d14]">{d}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-[#0d0d14]">All Status</option>
          <option value="active" className="bg-[#0d0d14]">Active</option>
          <option value="inactive" className="bg-[#0d0d14]">Inactive</option>
          <option value="resigned" className="bg-[#0d0d14]">Resigned</option>
        </select>
      </div>

      {/* Employee Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="glass-card p-5 animate-pulse"><div className="loading-skeleton h-5 w-2/3 rounded mb-3" /><div className="loading-skeleton h-4 w-1/2 rounded mb-2" /><div className="loading-skeleton h-4 w-1/3 rounded" /></div>)}
        </div>
      ) : employees.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Briefcase size={48} className="mx-auto mb-4 text-neutral-700" />
          <p className="text-neutral-400 font-medium">No employees found</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm"><Plus size={14} className="inline mr-1" /> Add Employee</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp: any) => (
            <div key={emp._id} className="glass-card p-5 group hover:border-white/10 transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center text-base font-bold text-indigo-400 shrink-0">
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-neutral-400 truncate">{emp.designation}</p>
                  <p className="text-xs text-indigo-400 font-mono">{emp.employeeId}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${
                  emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                  emp.status === 'resigned' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-neutral-500/10 text-neutral-500'
                }`}>{emp.status}</span>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-400 mb-4">
                <div className="flex items-center gap-2"><Building2 size={12} />{emp.department}</div>
                <div className="flex items-center gap-2"><Mail size={12} /><span className="truncate">{emp.email}</span></div>
                <div className="flex items-center gap-2"><Phone size={12} />{emp.phone}</div>
                <div className="flex items-center gap-2"><Calendar size={12} />Joined {formatDate(emp.joiningDate)}</div>
              </div>

              {emp.grossSalary > 0 && (
                <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
                  <span className="text-xs text-neutral-600">Gross Salary</span>
                  <span className="text-sm font-semibold text-emerald-400">₹{emp.grossSalary.toLocaleString('en-IN')}/mo</span>
                </div>
              )}

              <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditEmp(emp); setShowForm(true); }} className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-white flex-1 flex items-center justify-center gap-1 text-xs">
                  <Edit3 size={12} /> Edit
                </button>
                <button onClick={() => { if (confirm(`Delete ${emp.firstName} ${emp.lastName}?`)) deleteMutation.mutate(emp._id); }}
                  className="p-1.5 rounded hover:bg-red-500/10 text-neutral-400 hover:text-red-400 flex-1 flex items-center justify-center gap-1 text-xs">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">{pagination.total} employees</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronLeft size={16} /></button>
            <span className="text-xs text-neutral-400">{page}/{pagination.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {showForm && <EmpForm emp={editEmp} onClose={() => { setShowForm(false); setEditEmp(null); }} onSaved={() => { qc.invalidateQueries({ queryKey: ['employees'] }); qc.invalidateQueries({ queryKey: ['employee-stats'] }); setShowForm(false); setEditEmp(null); }} />}
    </div>
  );
};

export default EmployeeDashboard;
