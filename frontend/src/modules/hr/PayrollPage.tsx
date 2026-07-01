import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatDate, downloadFile } from '../../lib/utils';
import {
  DollarSign, Plus, Search, X, Download, CheckCircle,
  ChevronLeft, ChevronRight, AlertCircle, FileText, Users,
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const GenerateForm: React.FC<{ employees: any[]; onClose: () => void; onSaved: () => void }> = ({ employees, onClose, onSaved }) => {
  const now = new Date();
  const [form, setForm] = useState({ employeeId: '', month: now.getMonth() + 1, year: now.getFullYear(), leaveDays: 0, tds: 0, otherDeductions: 0, arrears: 0 });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => hrApi.payroll.generate(data),
    onSuccess: onSaved,
    onError: (e: any) => setError(e.response?.data?.message || e.message || 'Failed to generate payslip'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.employeeId) { setError('Select an employee'); return; }
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-xl font-semibold text-white">Generate Payslip</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"><AlertCircle size={16} />{error}</div>}

          <div><label className="block text-sm text-neutral-300 mb-1.5">Employee *</label>
            <select value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required className="input-field">
              <option value="" className="bg-[#0d0d14]">Select employee</option>
              {employees.map((e: any) => <option key={e._id} value={e._id} className="bg-[#0d0d14]">{e.firstName} {e.lastName} ({e.employeeId})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-300 mb-1.5">Month</label>
              <select value={form.month} onChange={e => setForm({...form, month: Number(e.target.value)})} className="input-field">
                {MONTHS.map((m, i) => <option key={m} value={i + 1} className="bg-[#0d0d14]">{m}</option>)}
              </select>
            </div>
            <div><label className="block text-sm text-neutral-300 mb-1.5">Year</label>
              <select value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})} className="input-field">
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-[#0d0d14]">{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-300 mb-1.5">Leave Days</label><input type="number" min={0} max={26} value={form.leaveDays} onChange={e => setForm({...form, leaveDays: Number(e.target.value)})} className="input-field" /></div>
            <div><label className="block text-sm text-neutral-300 mb-1.5">TDS (₹)</label><input type="number" min={0} value={form.tds} onChange={e => setForm({...form, tds: Number(e.target.value)})} className="input-field" /></div>
            <div><label className="block text-sm text-neutral-300 mb-1.5">Other Deductions (₹)</label><input type="number" min={0} value={form.otherDeductions} onChange={e => setForm({...form, otherDeductions: Number(e.target.value)})} className="input-field" /></div>
            <div><label className="block text-sm text-neutral-300 mb-1.5">Arrears (₹)</label><input type="number" min={0} value={form.arrears} onChange={e => setForm({...form, arrears: Number(e.target.value)})} className="input-field" /></div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary min-w-[140px]">
              {mutation.isPending ? 'Generating...' : 'Generate Payslip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PayrollPage: React.FC = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || '';

  const [page, setPage] = useState(1);
  const [empFilter, setEmpFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [showGenerate, setShowGenerate] = useState(false);

  const { data } = useQuery({
    queryKey: ['payroll', page, empFilter, monthFilter, yearFilter, role],
    queryFn: () => hrApi.payroll.getAll({ 
      page, 
      limit: 10, 
      employeeId: role === 'employee' ? user?._id : empFilter, 
      month: monthFilter, 
      year: yearFilter 
    }),
  });

  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => hrApi.employees.getAll({ limit: 100, status: 'active' }),
    enabled: role !== 'employee',
  });

  const pdfMutation = useMutation({
    mutationFn: (id: string) => hrApi.payroll.generatePdf(id),
    onSuccess: (result: any) => {
      if (result?.url) downloadFile(result.url, result.fileName || 'payslip.pdf');
    },
  });

  const paidMutation = useMutation({
    mutationFn: (id: string) => hrApi.payroll.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });

  const payslips = data?.items || [];
  const pagination = data?.pagination;
  const employees = empData?.items || [];

  const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-description">
            {role === 'employee' ? 'View and download your monthly payslips' : 'Generate, manage, and download employee payslips'}
          </p>
        </div>
        {role !== 'employee' && (
          <button onClick={() => setShowGenerate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Generate Payslip
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {role !== 'employee' && (
          <select value={empFilter} onChange={e => { setEmpFilter(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
            <option value="" className="bg-[#0d0d14]">All Employees</option>
            {employees.map((e: any) => <option key={e._id} value={e._id} className="bg-[#0d0d14]">{e.firstName} {e.lastName}</option>)}
          </select>
        )}
        <select value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="" className="bg-[#0d0d14]">All Months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1} className="bg-[#0d0d14]">{m}</option>)}
        </select>
        <select value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(1); }} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-[#0d0d14]">{y}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Payslip #', 'Employee', 'Pay Period', 'Gross', 'PF', 'ESIC', 'TDS', 'Deductions', 'Net Salary', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payslips.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-16 text-neutral-500">
                  <FileText size={36} className="mx-auto mb-3 text-neutral-700" />
                  No payslips found. Generate one using the button above.
                </td></tr>
              ) : payslips.map((p: any) => (
                <tr key={p._id} className="table-row group">
                  <td className="px-4 py-3 text-xs font-mono text-neutral-400">{p.payslipNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{p.employeeName}</p>
                    <p className="text-xs text-neutral-500">{p.designation}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400 whitespace-nowrap">{p.payPeriod}</td>
                  <td className="px-4 py-3 text-sm text-white font-semibold">{fmt(p.grossEarnings)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400">{fmt(p.pfEmployee)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400">{fmt(p.esicEmployee)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-400">{fmt(p.tds)}</td>
                  <td className="px-4 py-3 text-sm text-red-400">{fmt(p.totalDeductions)}</td>
                  <td className="px-4 py-3 text-base font-bold text-emerald-400 whitespace-nowrap">{fmt(p.netSalary)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                      p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                      p.status === 'generated' ? 'bg-indigo-500/10 text-indigo-400' :
                      'bg-neutral-500/10 text-neutral-400'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => pdfMutation.mutate(p._id)} disabled={pdfMutation.isPending} className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-white" title="Download PDF">
                        <Download size={14} />
                      </button>
                      {p.status === 'generated' && role !== 'employee' && (
                        <button onClick={() => paidMutation.mutate(p._id)} className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-400" title="Mark Paid">
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-neutral-500">{pagination.total} payslips</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronLeft size={16} /></button>
              <span className="text-xs text-neutral-400">{page}/{pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {showGenerate && (
        <GenerateForm
          employees={employees}
          onClose={() => setShowGenerate(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['payroll'] }); setShowGenerate(false); }}
        />
      )}
    </div>
  );
};

export default PayrollPage;
