import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatDate, downloadFile } from '../../lib/utils';
import {
  FileText, Plus, Download, Trash2, AlertCircle, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const LETTER_TYPES = [
  { value: 'offer', label: 'Offer Letter' },
  { value: 'experience', label: 'Experience Letter' },
  { value: 'relieving', label: 'Relieving Letter' },
  { value: 'internship_certificate', label: 'Internship Certificate' },
];

const LetterForm: React.FC<{ employees: any[]; onClose: () => void; onSaved: () => void }> = ({ employees, onClose, onSaved }) => {
  const [form, setForm] = useState({
    letterType: 'offer',
    employeeId: '',
    employeeName: '',
    designation: '',
    department: '',
    // offer
    ctcAnnual: '',
    joiningDate: '',
    // exp/relieving
    joiningDateActual: '',
    lastWorkingDate: '',
    // internship
    internProject: '',
    internDurationMonths: '',
    internFromDate: '',
    internToDate: '',
    internPerformance: 'Excellent',
    mentorName: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => hrApi.letters.create(data),
    onSuccess: onSaved,
    onError: (e: any) => setError(e.response?.data?.message || e.message || 'Failed to create'),
  });

  const selectEmployee = (id: string) => {
    const emp = employees.find(e => e._id === id);
    if (emp) setForm(f => ({ ...f, employeeId: id, employeeName: `${emp.firstName} ${emp.lastName}`, designation: emp.designation, department: emp.department }));
    else setForm(f => ({ ...f, employeeId: id }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.employeeName || !form.designation) { setError('Employee name and designation are required'); return; }
    mutation.mutate({
      ...form,
      ctcAnnual: form.ctcAnnual ? Number(form.ctcAnnual) : undefined,
      internDurationMonths: form.internDurationMonths ? Number(form.internDurationMonths) : undefined,
      joiningDate: form.joiningDate ? new Date(form.joiningDate) : undefined,
      joiningDateActual: form.joiningDateActual ? new Date(form.joiningDateActual) : undefined,
      lastWorkingDate: form.lastWorkingDate ? new Date(form.lastWorkingDate) : undefined,
      internFromDate: form.internFromDate ? new Date(form.internFromDate) : undefined,
      internToDate: form.internToDate ? new Date(form.internToDate) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl w-full max-w-xl my-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-xl font-semibold text-white">Generate Letter / Certificate</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"><AlertCircle size={16} />{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-300 mb-1.5">Letter Type *</label>
              <select value={form.letterType} onChange={e => setForm({...form, letterType: e.target.value})} className="input-field">
                {LETTER_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#0d0d14]">{t.label}</option>)}
              </select>
            </div>
            <div><label className="block text-sm text-neutral-300 mb-1.5">Employee</label>
              <select value={form.employeeId} onChange={e => selectEmployee(e.target.value)} className="input-field">
                <option value="" className="bg-[#0d0d14]">Select employee (or type below)</option>
                {employees.map((e: any) => <option key={e._id} value={e._id} className="bg-[#0d0d14]">{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div><label className="block text-sm text-neutral-300 mb-1.5">Employee Name *</label><input value={form.employeeName} onChange={e => setForm({...form, employeeName: e.target.value})} required className="input-field" placeholder="Full name" /></div>
            <div><label className="block text-sm text-neutral-300 mb-1.5">Designation *</label><input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} required className="input-field" placeholder="Software Engineer" /></div>
            <div><label className="block text-sm text-neutral-300 mb-1.5">Department</label><input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="input-field" placeholder="Engineering" /></div>
          </div>

          {/* Offer Letter fields */}
          {form.letterType === 'offer' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="col-span-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Offer Details</h3>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Annual CTC (₹)</label><input type="number" min={0} value={form.ctcAnnual} onChange={e => setForm({...form, ctcAnnual: e.target.value})} className="input-field" placeholder="600000" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Joining Date</label><input type="date" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} className="input-field" /></div>
            </div>
          )}

          {/* Experience / Relieving Letter fields */}
          {(form.letterType === 'experience' || form.letterType === 'relieving') && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="col-span-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Employment Dates</h3>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Joining Date</label><input type="date" value={form.joiningDateActual} onChange={e => setForm({...form, joiningDateActual: e.target.value})} className="input-field" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Last Working Date</label><input type="date" value={form.lastWorkingDate} onChange={e => setForm({...form, lastWorkingDate: e.target.value})} className="input-field" /></div>
            </div>
          )}

          {/* Internship Certificate fields */}
          {form.letterType === 'internship_certificate' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="col-span-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest">Internship Details</h3>
              <div><label className="block text-sm text-neutral-300 mb-1.5">From Date</label><input type="date" value={form.internFromDate} onChange={e => setForm({...form, internFromDate: e.target.value})} className="input-field" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">To Date</label><input type="date" value={form.internToDate} onChange={e => setForm({...form, internToDate: e.target.value})} className="input-field" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Duration (months)</label><input type="number" min={1} value={form.internDurationMonths} onChange={e => setForm({...form, internDurationMonths: e.target.value})} className="input-field" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Performance Rating</label>
                <select value={form.internPerformance} onChange={e => setForm({...form, internPerformance: e.target.value})} className="input-field">
                  {['Excellent', 'Very Good', 'Good', 'Satisfactory'].map(p => <option key={p} value={p} className="bg-[#0d0d14]">{p}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className="block text-sm text-neutral-300 mb-1.5">Project / Work Area</label><input value={form.internProject} onChange={e => setForm({...form, internProject: e.target.value})} className="input-field" placeholder="Procurement Management System" /></div>
              <div><label className="block text-sm text-neutral-300 mb-1.5">Mentor Name</label><input value={form.mentorName} onChange={e => setForm({...form, mentorName: e.target.value})} className="input-field" placeholder="Mentor name" /></div>
            </div>
          )}

          <div><label className="block text-sm text-neutral-300 mb-1.5">Additional Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="input-field resize-none" placeholder="Any additional details..." /></div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary min-w-[140px]">{mutation.isPending ? 'Creating...' : 'Create Letter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LettersPage: React.FC = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || '';

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: ['letters', page, typeFilter, role],
    queryFn: () => hrApi.letters.getAll({ 
      page, 
      limit: 10, 
      letterType: typeFilter, 
      employeeId: role === 'employee' ? user?._id : undefined 
    }),
  });

  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => hrApi.employees.getAll({ limit: 100, status: 'active' }),
    enabled: role !== 'employee',
  });

  const pdfMutation = useMutation({
    mutationFn: (id: string) => hrApi.letters.generatePdf(id),
    onSuccess: (result: any) => {
      if (result?.url) downloadFile(result.url, result.fileName || 'letter.pdf');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hrApi.letters.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['letters'] }),
  });

  const letters = data?.items || [];
  const pagination = data?.pagination;
  const employees = empData?.items || [];

  const typeLabel = (t: string) => LETTER_TYPES.find(l => l.value === t)?.label || t;
  const typeColor = (t: string) => ({
    offer: 'bg-emerald-500/10 text-emerald-400',
    experience: 'bg-indigo-500/10 text-indigo-400',
    relieving: 'bg-amber-500/10 text-amber-400',
    internship_certificate: 'bg-cyan-500/10 text-cyan-400',
  }[t] || 'bg-neutral-500/10 text-neutral-400');

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Letters & Certificates</h1>
          <p className="page-description">
            {role === 'employee' ? 'View and download your official company letters and certificates' : 'Generate offer letters, experience letters, and internship certificates'}
          </p>
        </div>
        {role !== 'employee' && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Generate Letter</button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'All Types' }, ...LETTER_TYPES].map(t => (
          <button key={t.value} onClick={() => { setTypeFilter(t.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === t.value ? 'bg-indigo-600 text-white' : 'bg-white/[0.03] border border-white/[0.06] text-neutral-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {letters.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FileText size={48} className="mx-auto mb-4 text-neutral-700" />
          <p className="text-neutral-400 font-medium">No letters generated yet</p>
          {role !== 'employee' && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm"><Plus size={14} className="inline mr-1" /> Generate First Letter</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {letters.map((l: any) => (
            <div key={l._id} className="glass-card p-5 group hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <FileText size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{l.employeeName}</p>
                    <p className="text-xs text-neutral-500 font-mono">{l.letterNumber}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColor(l.letterType)}`}>
                  {typeLabel(l.letterType)}
                </span>
              </div>

              <div className="space-y-1 text-xs text-neutral-400 mb-4">
                <div>Designation: <span className="text-neutral-300">{l.designation}</span></div>
                {l.department && <div>Department: <span className="text-neutral-300">{l.department}</span></div>}
                <div>Issued: <span className="text-neutral-300">{formatDate(l.issuedDate)}</span></div>
                {l.joiningDate && <div>Joining: <span className="text-neutral-300">{formatDate(l.joiningDate)}</span></div>}
                {l.lastWorkingDate && <div>Last Day: <span className="text-neutral-300">{formatDate(l.lastWorkingDate)}</span></div>}
                {l.ctcAnnual && <div>CTC: <span className="text-emerald-400 font-semibold">₹{l.ctcAnnual.toLocaleString('en-IN')}</span></div>}
                {l.internPerformance && <div>Performance: <span className="text-cyan-400">{l.internPerformance}</span></div>}
              </div>

              <div className="flex items-center gap-2 border-t border-white/[0.04] pt-3">
                <button onClick={() => pdfMutation.mutate(l._id)} disabled={pdfMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium transition-colors">
                  <Download size={13} /> Download PDF
                </button>
                {role !== 'employee' && (
                  <button onClick={() => { if (confirm('Delete this letter?')) deleteMutation.mutate(l._id); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">{pagination.total} letters</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronLeft size={16} /></button>
            <span className="text-xs text-neutral-400">{page}/{pagination.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-neutral-400"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {showForm && (
        <LetterForm
          employees={employees}
          onClose={() => setShowForm(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['letters'] }); setShowForm(false); }}
        />
      )}
    </div>
  );
};

export default LettersPage;
