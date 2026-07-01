import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invoiceApi, vendorApi, customerApi } from '../../services/endpoints';
import { formatCurrency } from '../../lib/utils';
import { X, Plus, Trash2, IndianRupee, AlertCircle } from 'lucide-react';

const GST_RATES = [0, 5, 12, 18, 28];

const emptyLineItem = (gstDefault: number) => ({
  description: '',
  hsnSacCode: '',
  quantity: 1,
  unit: 'Nos',
  rate: 0,
  discount: 0,
  gstPercentage: gstDefault,
  taxableAmount: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,
  totalAmount: 0,
});

const calcItem = (item: any, isInterState: boolean) => {
  const taxable = item.quantity * item.rate * (1 - (item.discount || 0) / 100);
  const gstRate = item.gstPercentage || 0;
  let cgst = 0, sgst = 0, igst = 0;
  if (isInterState) {
    igst = taxable * (gstRate / 100);
  } else {
    cgst = taxable * (gstRate / 2 / 100);
    sgst = taxable * (gstRate / 2 / 100);
  }
  const total = taxable + cgst + sgst + igst;
  return {
    ...item,
    taxableAmount: Math.round(taxable * 100) / 100,
    cgstAmount: Math.round(cgst * 100) / 100,
    sgstAmount: Math.round(sgst * 100) / 100,
    igstAmount: Math.round(igst * 100) / 100,
    totalAmount: Math.round(total * 100) / 100,
  };
};

interface InvoiceFormProps {
  invoice?: any;
  onClose: () => void;
  onSaved: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onClose, onSaved }) => {
  const isEdit = !!invoice;
  const [form, setForm] = useState({
    templateType: invoice?.templateType || 'beulix',
    invoiceType: invoice?.invoiceType || 'CUSTOMER_INVOICE',
    vendorId: invoice?.vendorId || invoice?.vendor || '',
    customerId: invoice?.customerId || '',
    partyName: invoice?.partyName || '',
    partyGstin: invoice?.partyGstin || '',
    partyPan: invoice?.partyPan || '',
    partyAddress: invoice?.partyAddress || '',
    issueDate: invoice?.issueDate ? invoice.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate ? invoice.dueDate.split('T')[0] : '',
    poNumber: invoice?.poNumber || '',
    placeOfSupply: invoice?.placeOfSupply || '',
    taxType: invoice?.taxType || 'intra_state',
    tdsPercentage: invoice?.tdsPercentage || 0,
    courseActivityName: invoice?.courseActivityName || '',
    classroomLocation: invoice?.classroomLocation || '',
    modeOfLecture: invoice?.modeOfLecture || 'In-Person',
    contactPerson: invoice?.contactPerson || '',
    contactNumber: invoice?.contactNumber || '',
    notes: invoice?.notes || '',
  });

  const isIndividual = form.templateType === 'individual';
  const isInterState = form.taxType === 'inter_state';
  const gstDefault = isIndividual ? 0 : 18;

  const [lineItems, setLineItems] = useState<any[]>(
    invoice?.lineItems?.length > 0 ? invoice.lineItems : [emptyLineItem(gstDefault)]
  );
  const [error, setError] = useState('');

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => vendorApi.getAll({ limit: 100, status: 'active' }),
    enabled: form.invoiceType === 'VENDOR_INVOICE',
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.getAll({ limit: 100, status: 'active' }),
    enabled: form.invoiceType === 'CUSTOMER_INVOICE',
  });

  const vendors = vendorsData?.items || [];
  const customers = customersData?.items || [];

  useEffect(() => {
    if (form.invoiceType === 'VENDOR_INVOICE' && form.vendorId) {
      const v = vendors.find((v: any) => v._id === form.vendorId);
      if (v) {
        setForm(f => ({
          ...f,
          partyName: v.vendorName,
          partyGstin: v.taxId || '',
          partyAddress: v.address ? `${v.address.street}, ${v.address.city}, ${v.address.state}` : '',
        }));
      }
    }
  }, [form.vendorId, vendors, form.invoiceType]);

  useEffect(() => {
    if (form.invoiceType === 'CUSTOMER_INVOICE' && form.customerId) {
      const c = customers.find((c: any) => c._id === form.customerId);
      if (c) {
        setForm(f => ({
          ...f,
          partyName: c.companyName,
          partyGstin: c.gstin || '',
          partyPan: c.pan || '',
          partyAddress: c.address ? `${c.address.street}, ${c.address.city}, ${c.address.state}` : '',
        }));
      }
    }
  }, [form.customerId, customers, form.invoiceType]);

  const recalcItems = (items: any[]) => items.map(item => calcItem(item, isInterState));

  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[idx] = calcItem({ ...updated[idx], [field]: value }, isInterState);
    setLineItems(updated);
  };

  const addItem = () => setLineItems([...lineItems, emptyLineItem(gstDefault)]);
  const removeItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));

  const subTotal = lineItems.reduce((s, i) => s + (i.taxableAmount || 0), 0);
  const totalCgst = lineItems.reduce((s, i) => s + (i.cgstAmount || 0), 0);
  const totalSgst = lineItems.reduce((s, i) => s + (i.sgstAmount || 0), 0);
  const totalIgst = lineItems.reduce((s, i) => s + (i.igstAmount || 0), 0);
  const totalGst = totalCgst + totalSgst + totalIgst;
  const grossAmount = subTotal + totalGst;
  const tdsAmount = subTotal * ((form.tdsPercentage as number) / 100);
  const netPayable = grossAmount - tdsAmount;

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? invoiceApi.update(invoice._id, data) : invoiceApi.create(data),
    onSuccess: onSaved,
    onError: (err: any) => setError(err.response?.data?.message || err.message || 'Failed to save invoice'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.dueDate) { setError('Due date is required'); return; }
    if (!form.partyName) { setError(isIndividual ? 'Company name is required' : 'Party name is required'); return; }
    if (lineItems.length === 0) { setError('Add at least one line item'); return; }
    if (lineItems.some(i => !i.description || i.rate <= 0)) { setError('All line items need a description and rate'); return; }

    mutation.mutate({
      ...form,
      lineItems: recalcItems(lineItems),
      tdsPercentage: isIndividual ? 0 : Number(form.tdsPercentage),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-semibold text-white">{isEdit ? 'Edit Invoice' : 'Create New Invoice'}</h2>
            <p className="text-sm text-neutral-400 mt-0.5">Fill in the details below to generate the invoice PDF</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Template selector */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest mb-4">Invoice Template</h3>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm(f => ({ ...f, templateType: 'beulix' }))}
                className={`p-4 rounded-xl border text-left transition-colors ${form.templateType === 'beulix' ? 'border-white/30 bg-white/[0.06]' : 'border-white/[0.06] hover:bg-white/[0.02]'}`}>
                <p className="text-sm font-semibold text-white">Beulix (Tax Invoice)</p>
                <p className="text-xs text-neutral-500 mt-1">Company tax invoice with GST/CGST/SGST/IGST line items.</p>
              </button>
              <button type="button" onClick={() => setForm(f => ({ ...f, templateType: 'individual', invoiceType: 'CUSTOMER_INVOICE' }))}
                className={`p-4 rounded-xl border text-left transition-colors ${form.templateType === 'individual' ? 'border-white/30 bg-white/[0.06]' : 'border-white/[0.06] hover:bg-white/[0.02]'}`}>
                <p className="text-sm font-semibold text-white">Individual (Trainer Invoice)</p>
                <p className="text-xs text-neutral-500 mt-1">No GST/tax breakdown — simple qty/price line items.</p>
              </button>
            </div>
          </div>

          {/* Invoice Type & Party */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest mb-4">
              {isIndividual ? 'Billing To' : 'Invoice Details'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isIndividual && (
                <>
                  <div>
                    <label className="block text-sm text-neutral-300 mb-1.5">Invoice Type *</label>
                    <select value={form.invoiceType} onChange={e => setForm({ ...form, invoiceType: e.target.value })} className="input-field">
                      <option value="VENDOR_INVOICE" className="bg-[#0d0d14]">Vendor Invoice (Payable)</option>
                      <option value="CUSTOMER_INVOICE" className="bg-[#0d0d14]">Customer Invoice (Receivable)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-300 mb-1.5">
                      {form.invoiceType === 'VENDOR_INVOICE' ? 'Vendor' : 'Customer'}
                    </label>
                    {form.invoiceType === 'VENDOR_INVOICE' ? (
                      <select value={form.vendorId} onChange={e => setForm({ ...form, vendorId: e.target.value })} className="input-field">
                        <option value="" className="bg-[#0d0d14]">Select vendor (or type manually below)</option>
                        {vendors.map((v: any) => <option key={v._id} value={v._id} className="bg-[#0d0d14]">{v.vendorName}</option>)}
                      </select>
                    ) : (
                      <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className="input-field">
                        <option value="" className="bg-[#0d0d14]">Select customer (or type manually below)</option>
                        {customers.map((c: any) => <option key={c._id} value={c._id} className="bg-[#0d0d14]">{c.companyName}</option>)}
                      </select>
                    )}
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">{isIndividual ? 'Company *' : 'Party Name *'}</label>
                <input value={form.partyName} onChange={e => setForm({ ...form, partyName: e.target.value })} required className="input-field" placeholder="Company or individual name" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">Address</label>
                <input value={form.partyAddress} onChange={e => setForm({ ...form, partyAddress: e.target.value })} className="input-field" placeholder="Street, City, State" />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">PO Number</label>
                <input value={form.poNumber} onChange={e => setForm({ ...form, poNumber: e.target.value })} className="input-field" placeholder="PO-2026-0001" />
              </div>
              {isIndividual && (
                <>
                  <div>
                    <label className="block text-sm text-neutral-300 mb-1.5">Contact Person</label>
                    <input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="input-field" placeholder="Vinay" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-300 mb-1.5">Contact Number</label>
                    <input value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} className="input-field" placeholder="7731819993" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm text-neutral-300 mb-1.5">{isIndividual ? 'PAN No' : 'GSTIN'}</label>
                {isIndividual ? (
                  <input value={form.partyPan} onChange={e => setForm({ ...form, partyPan: e.target.value })} className="input-field" placeholder="LAHUHSK0010" />
                ) : (
                  <input value={form.partyGstin} onChange={e => setForm({ ...form, partyGstin: e.target.value })} className="input-field" placeholder="22AAAAA0000A1Z5" maxLength={15} />
                )}
              </div>
              {isIndividual ? (
                <div>
                  <label className="block text-sm text-neutral-300 mb-1.5">GST No</label>
                  <input value={form.partyGstin} onChange={e => setForm({ ...form, partyGstin: e.target.value })} className="input-field" placeholder="29ABCDE1234F1Z5" maxLength={15} />
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-neutral-300 mb-1.5">PAN</label>
                  <input value={form.partyPan} onChange={e => setForm({ ...form, partyPan: e.target.value })} className="input-field" placeholder="AAAAA0000A" maxLength={10} />
                </div>
              )}
            </div>
          </div>

          {isIndividual ? (
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest mb-4">Training Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-neutral-300 mb-1.5">Invoice Date *</label>
                  <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-1.5">Due Date *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-1.5">Course/Activity Name</label>
                  <input value={form.courseActivityName} onChange={e => setForm({ ...form, courseActivityName: e.target.value })} className="input-field" placeholder="DevOps" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-1.5">Mode of Lecture</label>
                  <select value={form.modeOfLecture} onChange={e => setForm({ ...form, modeOfLecture: e.target.value })} className="input-field">
                    <option value="In-Person" className="bg-[#0d0d14]">In-Person</option>
                    <option value="Online" className="bg-[#0d0d14]">Online</option>
                    <option value="Hybrid" className="bg-[#0d0d14]">Hybrid</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-neutral-300 mb-1.5">Classroom Location</label>
                  <input value={form.classroomLocation} onChange={e => setForm({ ...form, classroomLocation: e.target.value })} className="input-field" placeholder="First Floor, Room No:01" />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest mb-4">Dates &amp; Tax Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-neutral-300 mb-1.5">Issue Date *</label>
                  <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-1.5">Due Date *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-1.5">Place of Supply</label>
                  <input value={form.placeOfSupply} onChange={e => setForm({ ...form, placeOfSupply: e.target.value })} className="input-field" placeholder="Karnataka (29)" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-1.5">Tax Type</label>
                  <select value={form.taxType} onChange={e => {
                    setForm({ ...form, taxType: e.target.value });
                    setLineItems(lineItems.map(i => calcItem(i, e.target.value === 'inter_state')));
                  }} className="input-field">
                    <option value="intra_state" className="bg-[#0d0d14]">CGST + SGST (Intra-State)</option>
                    <option value="inter_state" className="bg-[#0d0d14]">IGST (Inter-State)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest">Item Details</h3>
              <button type="button" onClick={addItem} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs font-semibold text-neutral-500 pb-2 pr-2 min-w-[200px]">Description *</th>
                    {!isIndividual && <th className="text-left text-xs font-semibold text-neutral-500 pb-2 pr-2 w-24">HSN/SAC</th>}
                    <th className="text-left text-xs font-semibold text-neutral-500 pb-2 pr-2 w-16">Qty *</th>
                    {!isIndividual && <th className="text-left text-xs font-semibold text-neutral-500 pb-2 pr-2 w-24">Unit</th>}
                    <th className="text-left text-xs font-semibold text-neutral-500 pb-2 pr-2 w-24">{isIndividual ? 'Price *' : 'Rate *'}</th>
                    {!isIndividual && <th className="text-left text-xs font-semibold text-neutral-500 pb-2 pr-2 w-16">Disc%</th>}
                    {!isIndividual && <th className="text-left text-xs font-semibold text-neutral-500 pb-2 pr-2 w-20">GST%</th>}
                    {!isIndividual && <th className="text-right text-xs font-semibold text-neutral-500 pb-2 pr-2 w-24">Taxable</th>}
                    {!isIndividual && <th className="text-right text-xs font-semibold text-neutral-500 pb-2 pr-2 w-24">{isInterState ? 'IGST' : 'CGST+SGST'}</th>}
                    <th className="text-right text-xs font-semibold text-neutral-500 pb-2 w-24">Amount</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/[0.03]">
                      <td className="py-2 pr-2">
                        <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                          className="input-field text-xs py-1.5" placeholder="Description / batch / activity" />
                      </td>
                      {!isIndividual && (
                        <td className="py-2 pr-2">
                          <input value={item.hsnSacCode || ''} onChange={e => updateItem(idx, 'hsnSacCode', e.target.value)}
                            className="input-field text-xs py-1.5" placeholder="9983" />
                        </td>
                      )}
                      <td className="py-2 pr-2">
                        <input type="number" min={0} value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="input-field text-xs py-1.5" />
                      </td>
                      {!isIndividual && (
                        <td className="py-2 pr-2">
                          <select value={item.unit || 'Nos'} onChange={e => updateItem(idx, 'unit', e.target.value)} className="input-field text-xs py-1.5">
                            {['Nos', 'Hrs', 'Days', 'Months', 'Kg', 'L', 'Pcs', 'Sets'].map(u => (
                              <option key={u} value={u} className="bg-[#0d0d14]">{u}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="py-2 pr-2">
                        <input type="number" min={0} step={0.01} value={item.rate} onChange={e => updateItem(idx, 'rate', Number(e.target.value))}
                          className="input-field text-xs py-1.5" />
                      </td>
                      {!isIndividual && (
                        <td className="py-2 pr-2">
                          <input type="number" min={0} max={100} value={item.discount || 0} onChange={e => updateItem(idx, 'discount', Number(e.target.value))}
                            className="input-field text-xs py-1.5" />
                        </td>
                      )}
                      {!isIndividual && (
                        <td className="py-2 pr-2">
                          <select value={item.gstPercentage} onChange={e => updateItem(idx, 'gstPercentage', Number(e.target.value))} className="input-field text-xs py-1.5">
                            {GST_RATES.map(r => <option key={r} value={r} className="bg-[#0d0d14]">{r}%</option>)}
                          </select>
                        </td>
                      )}
                      {!isIndividual && <td className="py-2 pr-2 text-right text-xs text-neutral-300">{formatCurrency(item.taxableAmount)}</td>}
                      {!isIndividual && (
                        <td className="py-2 pr-2 text-right text-xs text-cyan-400">
                          {isInterState ? formatCurrency(item.igstAmount) : formatCurrency((item.cgstAmount || 0) + (item.sgstAmount || 0))}
                        </td>
                      )}
                      <td className="py-2 text-right text-xs font-semibold text-white">{formatCurrency(item.totalAmount)}</td>
                      <td className="py-2 pl-2">
                        {lineItems.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="p-1 hover:text-red-400 text-neutral-600 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals + TDS (Beulix only — individual template shows no tax breakdown) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isIndividual && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-widest mb-4">TDS</h3>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-neutral-400">TDS %</label>
                  <select value={form.tdsPercentage} onChange={e => setForm({ ...form, tdsPercentage: Number(e.target.value) })}
                    className="input-field w-32">
                    {[0, 1, 2, 5, 10].map(r => <option key={r} value={r} className="bg-[#0d0d14]">{r}%</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className={`bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2 ${isIndividual ? 'md:col-span-2' : ''}`}>
              <div className="flex justify-between text-sm"><span className="text-neutral-400">Sub Total</span><span className="text-white">{formatCurrency(subTotal)}</span></div>
              {!isIndividual && (
                isInterState ? (
                  <div className="flex justify-between text-sm"><span className="text-neutral-400">IGST</span><span className="text-cyan-400">{formatCurrency(totalIgst)}</span></div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm"><span className="text-neutral-400">CGST</span><span className="text-cyan-400">{formatCurrency(totalCgst)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-neutral-400">SGST</span><span className="text-cyan-400">{formatCurrency(totalSgst)}</span></div>
                  </>
                )
              )}
              {!isIndividual && (form.tdsPercentage as number) > 0 && (
                <div className="flex justify-between text-sm"><span className="text-amber-400">TDS ({form.tdsPercentage}%)</span><span className="text-amber-400">-{formatCurrency(tdsAmount)}</span></div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-white/10 pt-2">
                <span className="text-neutral-300">{isIndividual ? 'Grand Total' : 'Net Payable'}</span>
                <span className="text-emerald-400 flex items-center gap-1"><IndianRupee size={14} />{formatCurrency(isIndividual ? subTotal : netPayable).replace('₹', '')}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary min-w-[140px]">
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
