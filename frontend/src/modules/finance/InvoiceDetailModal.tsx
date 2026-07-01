import React from 'react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { X, Download, Building2, Calendar, FileText, IndianRupee, CreditCard } from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: any;
  onClose: () => void;
  onDownloadPdf: () => void;
}

const Row: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
    <span className="text-sm text-neutral-400">{label}</span>
    <span className={`text-sm font-medium text-white text-right ${className || ''}`}>{value}</span>
  </div>
);

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoice, onClose, onDownloadPdf }) => {
  const fmt = (n: number) => formatCurrency(n || 0);
  const isInterState = invoice.placeOfSupply === 'Inter-State';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl w-full max-w-3xl my-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-bold text-white font-mono">{invoice.invoiceNumber}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                invoice.status === 'overdue' ? 'bg-red-500/10 text-red-400' :
                invoice.status === 'approved' ? 'bg-blue-500/10 text-blue-400' :
                'bg-neutral-500/10 text-neutral-400'
              }`}>{invoice.status}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                invoice.invoiceType === 'CUSTOMER_INVOICE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
              }`}>{invoice.invoiceType === 'CUSTOMER_INVOICE' ? 'Customer Invoice' : 'Vendor Invoice'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onDownloadPdf} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium transition-colors">
              <Download size={14} /> Download PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Party Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Party</span>
              </div>
              <p className="text-base font-semibold text-white">{invoice.partyName || '—'}</p>
              {invoice.partyGstin && <p className="text-sm text-neutral-400 mt-1">GSTIN: {invoice.partyGstin}</p>}
              {invoice.partyPan && <p className="text-sm text-neutral-400">PAN: {invoice.partyPan}</p>}
              {invoice.partyAddress && <p className="text-sm text-neutral-400 mt-1">{invoice.partyAddress}</p>}
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Dates & Reference</span>
              </div>
              <Row label="Issue Date" value={formatDate(invoice.issueDate || invoice.createdAt)} />
              <Row label="Due Date" value={formatDate(invoice.dueDate)} />
              {invoice.poNumber && <Row label="PO Number" value={invoice.poNumber} />}
              {invoice.placeOfSupply && <Row label="Place of Supply" value={invoice.placeOfSupply} />}
              {invoice.paymentDate && <Row label="Payment Date" value={formatDate(invoice.paymentDate)} />}
              {invoice.paymentMethod && <Row label="Payment Method" value={invoice.paymentMethod} />}
            </div>
          </div>

          {/* Line Items */}
          {invoice.lineItems?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Line Items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-xs text-neutral-500 pb-2 pr-3">#</th>
                      <th className="text-left text-xs text-neutral-500 pb-2 pr-3">Description</th>
                      <th className="text-left text-xs text-neutral-500 pb-2 pr-3">HSN/SAC</th>
                      <th className="text-right text-xs text-neutral-500 pb-2 pr-3">Qty</th>
                      <th className="text-right text-xs text-neutral-500 pb-2 pr-3">Rate</th>
                      <th className="text-right text-xs text-neutral-500 pb-2 pr-3">Taxable</th>
                      <th className="text-right text-xs text-neutral-500 pb-2 pr-3">GST</th>
                      <th className="text-right text-xs text-neutral-500 pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-3 text-neutral-500">{i + 1}</td>
                        <td className="py-2 pr-3 text-white">{item.description}</td>
                        <td className="py-2 pr-3 text-neutral-400">{item.hsnSacCode || '—'}</td>
                        <td className="py-2 pr-3 text-right text-neutral-300">{item.quantity} {item.unit}</td>
                        <td className="py-2 pr-3 text-right text-neutral-300">{fmt(item.rate)}</td>
                        <td className="py-2 pr-3 text-right text-neutral-300">{fmt(item.taxableAmount)}</td>
                        <td className="py-2 pr-3 text-right text-cyan-400">{fmt((item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0))}</td>
                        <td className="py-2 text-right font-semibold text-white">{fmt(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tax Summary + Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee size={16} className="text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Tax Breakdown</span>
              </div>
              <Row label="Sub Total (Taxable)" value={fmt(invoice.subTotal || 0)} />
              {!isInterState ? (
                <>
                  <Row label="CGST" value={<span className="text-cyan-400">{fmt(invoice.totalCgst || 0)}</span>} />
                  <Row label="SGST" value={<span className="text-cyan-400">{fmt(invoice.totalSgst || 0)}</span>} />
                </>
              ) : (
                <Row label="IGST" value={<span className="text-cyan-400">{fmt(invoice.totalIgst || 0)}</span>} />
              )}
              <Row label="Total GST" value={<span className="text-cyan-400 font-semibold">{fmt(invoice.totalGst || invoice.tax || 0)}</span>} />
              {(invoice.tdsAmount > 0) && (
                <Row label={`TDS (${invoice.tdsPercentage || 0}%)`} value={<span className="text-amber-400">-{fmt(invoice.tdsAmount)}</span>} />
              )}
            </div>

            <div className="bg-[#1a1a2e] border border-indigo-500/20 rounded-xl p-4">
              <Row label="Gross Amount" value={fmt(invoice.grossAmount || invoice.totalAmount)} />
              <Row label="Company Receivable" value={<span className="text-emerald-400 text-base font-bold">{fmt(invoice.companyReceivable || invoice.grossAmount || invoice.totalAmount)}</span>} />
              <Row label="Vendor Payable (after TDS)" value={<span className="text-indigo-400 text-base font-bold">{fmt(invoice.vendorPayable || invoice.totalAmount)}</span>} />
              {invoice.amountInWords && (
                <div className="mt-3 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                  <p className="text-xs text-amber-300 italic">{invoice.amountInWords}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bank Details */}
          {(invoice.bankName || invoice.accountNumber) && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Bank Details</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {invoice.accountHolder && <div><p className="text-neutral-500 text-xs">Account Holder</p><p className="text-white">{invoice.accountHolder}</p></div>}
                {invoice.bankName && <div><p className="text-neutral-500 text-xs">Bank</p><p className="text-white">{invoice.bankName}</p></div>}
                {invoice.accountNumber && <div><p className="text-neutral-500 text-xs">Account No.</p><p className="text-white font-mono">{invoice.accountNumber}</p></div>}
                {invoice.ifscCode && <div><p className="text-neutral-500 text-xs">IFSC Code</p><p className="text-white font-mono">{invoice.ifscCode}</p></div>}
                {invoice.upiId && <div><p className="text-neutral-500 text-xs">UPI ID</p><p className="text-white">{invoice.upiId}</p></div>}
              </div>
            </div>
          )}

          {/* Notes */}
          {(invoice.notes || invoice.description) && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Notes</p>
              <p className="text-sm text-neutral-300">{invoice.notes || invoice.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;
