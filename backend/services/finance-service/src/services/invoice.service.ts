import { prisma } from '../lib/prisma';
import { saveFile } from '@procurement/common';
import { InvoiceLineItem } from '../models/Invoice';

const generateInvoiceNumber = (templateType: string) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  if (templateType === 'beulix') {
    const fyStart = now.getMonth() >= 3 ? y % 100 : (y - 1) % 100;
    const fyEnd = fyStart + 1;
    return `BLX-IN/${fyStart}-${fyEnd}/${y}${m}${rand}`;
  }
  return `INV${String(rand).padStart(4, '0')}`;
};

const numberToWords = (amount: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);
  let result = 'Rupees ' + convert(intPart);
  if (decPart > 0) result += ' and ' + convert(decPart) + ' Paise';
  return result + ' Only';
};

const computeTotals = (data: Record<string, any>) => {
  const items: InvoiceLineItem[] = data.lineItems || [];

  let subTotal = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0;

  items.forEach(item => {
    const taxable = item.taxableAmount ?? (item.quantity * item.rate * (1 - (item.discount || 0) / 100));
    item.taxableAmount = Math.round(taxable * 100) / 100;

    const gst = item.gstPercentage || 0;
    const halfGst = gst / 2;

    if (data.taxType === 'inter_state') {
      item.cgstAmount = 0;
      item.sgstAmount = 0;
      item.igstAmount = Math.round(item.taxableAmount * (gst / 100) * 100) / 100;
      totalIgst += item.igstAmount;
    } else {
      item.cgstAmount = Math.round(item.taxableAmount * (halfGst / 100) * 100) / 100;
      item.sgstAmount = Math.round(item.taxableAmount * (halfGst / 100) * 100) / 100;
      item.igstAmount = 0;
      totalCgst += item.cgstAmount;
      totalSgst += item.sgstAmount;
    }

    item.totalAmount = Math.round((item.taxableAmount + item.cgstAmount + item.sgstAmount + item.igstAmount) * 100) / 100;
    subTotal += item.taxableAmount;
  });

  const totalGst = Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100;
  const grossAmount = Math.round((subTotal + totalGst) * 100) / 100;
  const tdsPercentage = data.tdsPercentage || 0;
  const tdsAmount = Math.round(subTotal * (tdsPercentage / 100) * 100) / 100;
  const companyReceivable = grossAmount;
  const vendorPayable = Math.round((grossAmount - tdsAmount) * 100) / 100;

  return {
    lineItems: items,
    subTotal: Math.round(subTotal * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalGst,
    grossAmount,
    tdsAmount,
    tdsPercentage,
    companyReceivable,
    vendorPayable,
    totalAmount: grossAmount,
    amount: subTotal,
    tax: totalGst,
    amountInWords: numberToWords(grossAmount),
  };
};

export class InvoiceService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.invoiceType) where.invoiceType = query.invoiceType;
    if (query.search) {
      const search = query.search as string;
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { partyName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (query.year || query.month) {
      const year = query.year ? parseInt(query.year as string, 10) : new Date().getFullYear();
      const month = query.month ? parseInt(query.month as string, 10) : undefined;
      const start = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
      const end = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);
      where.issueDate = { gte: start, lt: end };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }

  async findById(id: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: id } });
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async create(data: Record<string, any>, userId: string) {
    const templateType = data.templateType || 'beulix';
    const invoiceNumber = generateInvoiceNumber(templateType);
    const computed = computeTotals(data);

    return prisma.invoice.create({
      data: {
        ...data,
        ...computed,
        templateType,
        invoiceNumber,
        createdBy: userId,
      } as any,
    });
  }

  async update(id: string, data: Record<string, any>) {
    const invoice = await prisma.invoice.findUnique({ where: { id: id } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'paid') throw new Error('Cannot update a paid invoice');

    const normalized: Record<string, any> = { ...data };
    if (normalized.issueDate) normalized.issueDate = new Date(normalized.issueDate);
    if (normalized.dueDate) normalized.dueDate = new Date(normalized.dueDate);

    const computed = normalized.lineItems ? computeTotals({ ...invoice, ...normalized }) : {};
    return prisma.invoice.update({ where: { id: id }, data: { ...normalized, ...computed } });
  }

  async delete(id: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: id } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'paid') throw new Error('Cannot delete a paid invoice');
    await prisma.invoice.delete({ where: { id: id } });
  }

  async approve(id: string, userId: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: id } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'pending') throw new Error('Only pending invoices can be approved');
    return prisma.invoice.update({ where: { id: id }, data: { status: 'approved', approvedBy: userId, approvedAt: new Date() } });
  }

  async markAsPaid(id: string, paymentMethod: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: id } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'approved') throw new Error('Invoice must be approved before payment');
    return prisma.invoice.update({
      where: { id: id },
      data: { status: 'paid', paymentDate: new Date(), paymentMethod },
    });
  }

  async generatePdf(id: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: id } });
    if (!invoice) throw new Error('Invoice not found');

    const issuer = await prisma.issuerProfile.findUnique({
      where: { type: invoice.templateType === 'individual' ? 'individual' : 'beulix' },
    });

    try {
      const puppeteer = await import('puppeteer').catch(() => null);
      if (!puppeteer) {
        return { url: null, fileName: `${invoice.invoiceNumber}.pdf`, message: 'PDF generation requires puppeteer' };
      }

      const html = invoice.templateType === 'individual'
        ? buildIndividualInvoiceHtml(invoice as any, issuer as any)
        : buildBeulixInvoiceHtml(invoice as any, issuer as any);

      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
      await browser.close();

      const key = `invoices/${id}/${invoice.invoiceNumber.replace(/\//g, '_')}.pdf`;
      await saveFile(Buffer.from(pdfBuffer), key);
      await prisma.invoice.update({ where: { id: id }, data: { pdfUrl: key, pdfKey: key } });

      return { url: `/invoices/${id}/file`, fileName: `${invoice.invoiceNumber}.pdf` };
    } catch (err: any) {
      throw new Error(`PDF generation failed: ${err.message}`);
    }
  }

  async getFilePath(id: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: id } });
    if (!invoice || !invoice.pdfKey) throw new Error('Invoice PDF not found — generate it first');
    return invoice;
  }

  async getStats() {
    const allInvoices = await prisma.invoice.findMany();
    const now = new Date();

    let totalGrossAmount = 0, totalGst = 0, totalTds = 0, totalReceivable = 0, totalPayable = 0;
    const statusMap: Record<string, { count: number; totalAmount: number }> = {};

    for (const i of allInvoices) {
      const s = i.status || 'unknown';
      if (!statusMap[s]) statusMap[s] = { count: 0, totalAmount: 0 };
      statusMap[s].count++;
      statusMap[s].totalAmount += i.grossAmount || i.totalAmount || 0;

      totalGrossAmount += i.grossAmount || i.totalAmount || 0;
      totalGst += i.totalGst || i.tax || 0;
      totalTds += i.tdsAmount || 0;
      totalReceivable += i.companyReceivable || i.totalAmount || 0;
      totalPayable += i.vendorPayable || i.totalAmount || 0;

      if ((i.status === 'pending' || i.status === 'approved') && new Date(i.dueDate) < now) {
        await prisma.invoice.update({ where: { id: i.id }, data: { status: 'overdue' } }).catch(() => {});
      }
    }

    return {
      total: allInvoices.length,
      byStatus: Object.entries(statusMap).map(([status, v]) => ({ status, ...v })),
      summary: {
        totalGrossAmount: Math.round(totalGrossAmount * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        totalTds: Math.round(totalTds * 100) / 100,
        totalReceivable: Math.round(totalReceivable * 100) / 100,
        totalPayable: Math.round(totalPayable * 100) / 100,
      },
    };
  }

  // Backs the Invoice Dashboard: per-invoice breakdown + the exact summary
  // totals the user asked for (Total Company Receivable / Total TDS / Total
  // GST), scoped to customer-side invoices and an optional year/month filter.
  async getDashboard(query: Record<string, any> = {}) {
    const where: Record<string, any> = { invoiceType: 'CUSTOMER_INVOICE' };
    if (query.year || query.month) {
      const year = query.year ? parseInt(query.year as string, 10) : new Date().getFullYear();
      const month = query.month ? parseInt(query.month as string, 10) : undefined;
      const start = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
      const end = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);
      where.issueDate = { gte: start, lt: end };
    }

    const invoices = await prisma.invoice.findMany({ where, orderBy: { issueDate: 'desc' } });

    let incomeGenerated = 0, totalTds = 0, totalGst = 0, totalReceivable = 0;
    for (const inv of invoices) {
      incomeGenerated += (inv.subTotal || 0) - (inv.tdsAmount || 0);
      totalTds += inv.tdsAmount || 0;
      totalGst += inv.totalGst || 0;
      totalReceivable += inv.companyReceivable || inv.totalAmount || 0;
    }

    return {
      totalInvoices: invoices.length,
      incomeGenerated: Math.round(incomeGenerated * 100) / 100,
      totalTds: Math.round(totalTds * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      totalReceivable: Math.round(totalReceivable * 100) / 100,
      invoices,
    };
  }
}

// ─── PDF HTML Templates ─────────────────────────────────────────────────────
const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateSlash = (d: any) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '—';

// Matches the Beulix Solutions "TAX INVOICE" reference PDF field-for-field:
// logo + company block, Bill To / Invoice-Due-Date columns, blue line-items
// table, Sub Total -> CGST/SGST or IGST -> Total -> Balance Due, amount in
// words, bank details, terms, signature. No TDS row in this template.
function buildBeulixInvoiceHtml(invoice: any, issuer: any): string {
  const lineRows = (invoice.lineItems || []).map((item: any, i: number) => `
    <tr>
      <td>${i + 1}.</td>
      <td>${item.description || ''}</td>
      <td>${item.hsnSacCode || ''}</td>
      <td>${(item.quantity || 0).toFixed(2)}</td>
      <td>${(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td>${(item.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#1a1a2e; background:#fff; }
  .page { padding:24px; max-width:800px; margin:0 auto; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
  .company-name { font-size:18px; font-weight:800; color:#1a1a2e; }
  .logo-x { color:#0d6efd; }
  .invoice-title { font-size:16px; font-weight:800; color:#0d6efd; text-align:right; }
  .invoice-meta { text-align:right; font-size:11px; color:#1a1a2e; margin-top:2px; font-weight:700; }
  .company-block { font-size:11px; line-height:1.5; margin-bottom:14px; }
  .company-block b { font-weight:700; }
  .parties { display:flex; justify-content:space-between; margin-bottom:14px; }
  .party-label { font-weight:700; font-size:11px; margin-bottom:4px; }
  .party-detail { font-size:11px; line-height:1.5; }
  .right-meta { text-align:right; font-size:11px; }
  .right-meta b { font-weight:700; }
  table.items { width:100%; border-collapse:collapse; margin-bottom:4px; }
  table.items th { background:#0d6efd; color:#fff; padding:6px 8px; text-align:left; font-size:11px; font-weight:700; }
  table.items td { padding:6px 8px; font-size:11px; border-bottom:1px solid #eee; }
  table.items th:last-child, table.items td:last-child { text-align:right; }
  table.items th:nth-child(4), table.items td:nth-child(4),
  table.items th:nth-child(5), table.items td:nth-child(5) { text-align:right; }
  .totals-row { display:flex; justify-content:flex-end; }
  .totals-table { width:280px; }
  .totals-table div { display:flex; justify-content:space-between; padding:4px 8px; font-size:11px; }
  .totals-table .shaded { background:#f0f0f0; font-weight:700; }
  .totals-table .grand { font-weight:800; }
  .amount-words { text-align:center; font-size:11px; margin:18px 0; }
  .bank-section { margin-top:24px; font-size:11px; line-height:1.6; }
  .bank-section b { font-weight:700; }
  .terms { margin-top:18px; font-size:11px; line-height:1.6; }
  .terms b { font-weight:700; }
  .signature { margin-top:36px; text-align:left; }
  .signature img { height:48px; }
  .sig-label { font-size:11px; font-weight:700; margin-top:4px; }
</style></head>
<body><div class="page">
  <div class="header">
    <div>
      <div class="company-name">${issuer?.name || 'BEULIX SOLUTIONS'}</div>
    </div>
    <div>
      <div class="invoice-title">TAX INVOICE</div>
      <div class="invoice-meta"># ${invoice.invoiceNumber || ''}</div>
    </div>
  </div>

  <div class="company-block">
    <b>${issuer?.name || ''}</b><br/>
    ${issuer?.address || ''}<br/>
    ${issuer?.email ? `Email: ${issuer.email}<br/>` : ''}
    ${issuer?.contact ? `Contact: ${issuer.contact}<br/>` : ''}
    ${issuer?.pan ? `PAN: ${issuer.pan}<br/>` : ''}
    ${issuer?.gst ? `GST: ${issuer.gst}` : ''}
  </div>

  <div class="parties">
    <div>
      <div class="party-label">Bill To:</div>
      <div class="party-detail">
        ${invoice.partyName || ''}<br/>
        ${invoice.partyAddress || ''}<br/>
        ${invoice.poNumber ? `PONO: ${invoice.poNumber}<br/>` : ''}
        ${invoice.partyPan ? `PAN: ${invoice.partyPan}<br/>` : ''}
        ${invoice.partyGstin ? `GST: ${invoice.partyGstin}<br/>` : ''}
        ${invoice.placeOfSupply ? `Place of Supply: ${invoice.placeOfSupply}` : ''}
      </div>
    </div>
    <div class="right-meta">
      <div><b>Invoice Date:</b> ${fmtDateSlash(invoice.issueDate)}</div>
      <div style="margin-top:6px;"><b>Due Date:</b> ${fmtDateSlash(invoice.dueDate)}</div>
    </div>
  </div>

  <table class="items">
    <thead><tr><th>S.No</th><th>Item &amp; Description</th><th>HSN/SAC</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>

  <div class="totals-row">
    <div class="totals-table">
      <div class="shaded"><span>Sub Total</span><span>${(invoice.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
      ${invoice.totalCgst > 0 ? `<div><span>CGST (${(invoice.gstPercentage || 18) / 2}%)</span><span>${invoice.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>` : ''}
      ${invoice.totalSgst > 0 ? `<div><span>SGST (${(invoice.gstPercentage || 18) / 2}%)</span><span>${invoice.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>` : ''}
      ${invoice.totalIgst > 0 ? `<div><span>IGST (${invoice.gstPercentage || 18}%)</span><span>${invoice.totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>` : ''}
      <div class="shaded grand"><span>Total</span><span>Rs:${invoice.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
      <div class="shaded grand"><span>Balance Due</span><span>Rs:${invoice.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
    </div>
  </div>

  <div class="amount-words">AMOUNT IN WORDS: ${invoice.amountInWords || ''}</div>

  ${issuer?.bankName ? `
  <div class="bank-section">
    <b>Bank Details:</b><br/>
    ${issuer.name}<br/>
    ${issuer.accountNumber ? `A/C No: ${issuer.accountNumber}<br/>` : ''}
    ${issuer.ifscCode ? `IFSC: ${issuer.ifscCode}` : ''}
  </div>` : ''}

  ${issuer?.termsAndConditions ? `
  <div class="terms"><b>Terms &amp; Conditions:</b><br/>${issuer.termsAndConditions}</div>` : ''}

  <div class="signature">
    ${issuer?.signatureUrl ? `<img src="${issuer.signatureUrl}" />` : '<div style="height:48px;"></div>'}
    <div class="sig-label">Authorized Signature</div>
  </div>
</div></body></html>`;
}

// Matches the individual/trainer "INVOICE" reference PDF field-for-field:
// boxed layout, From/Billing To boxes, orange key-value grid, plain line
// items (no GST/TDS columns), Grand Total, amount in words, signature.
function buildIndividualInvoiceHtml(invoice: any, issuer: any): string {
  const lineRows = (invoice.lineItems || []).map((item: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.description || ''}</td>
      <td>${(item.quantity || 0).toFixed(2)}</td>
      <td>${(item.rate || 0).toFixed(2)}</td>
      <td>${(item.taxableAmount || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#1a1a2e; background:#fff; }
  .page { border:2px solid #1a1a2e; padding:20px; max-width:760px; margin:16px auto; }
  .title { text-align:center; font-size:20px; font-weight:800; margin-bottom:16px; }
  .boxes { display:flex; border:1px solid #1a1a2e; margin-bottom:16px; }
  .box { flex:1; padding:10px; font-size:11px; line-height:1.6; }
  .box:first-child { border-right:1px solid #1a1a2e; }
  .box b { display:block; margin-bottom:4px; }
  table.kv { width:100%; border-collapse:collapse; margin-bottom:16px; }
  table.kv td { border:1px solid #1a1a2e; padding:6px 8px; font-size:11px; }
  table.kv td.label { background:#e8770d; color:#fff; font-weight:700; width:18%; }
  table.items { width:100%; border-collapse:collapse; margin-bottom:6px; }
  table.items th, table.items td { border:1px solid #1a1a2e; padding:6px 8px; font-size:11px; text-align:left; }
  table.items th:nth-child(3), table.items td:nth-child(3),
  table.items th:nth-child(4), table.items td:nth-child(4),
  table.items th:nth-child(5), table.items td:nth-child(5) { text-align:right; }
  .grand-row td { font-weight:800; text-align:right; }
  .amount-words { text-align:center; font-size:11px; margin:24px 0; }
  .sig-block { margin-top:60px; text-align:right; font-size:11px; }
  .sig-block img { height:40px; display:block; margin:4px 0 0 auto; }
</style></head>
<body><div class="page">
  <div class="title">INVOICE</div>

  <div class="boxes">
    <div class="box">
      <b>From:</b>
      ${issuer?.name || ''}<br/>
      ${issuer?.contact ? `Contact: ${issuer.contact}<br/>` : ''}
      ${issuer?.email ? `Email: ${issuer.email}<br/>` : ''}
      ${issuer?.address ? `Address: ${issuer.address}` : ''}
    </div>
    <div class="box">
      <b>Billing To:</b>
      ${invoice.poNumber ? `PO Number: ${invoice.poNumber}<br/>` : ''}
      ${invoice.partyName ? `Company: ${invoice.partyName}<br/>` : ''}
      ${invoice.partyAddress ? `Address: ${invoice.partyAddress}<br/>` : ''}
      ${invoice.contactPerson ? `Contact Person: ${invoice.contactPerson}<br/>` : ''}
      ${invoice.contactNumber ? `Contact Number: ${invoice.contactNumber}<br/>` : ''}
      ${invoice.partyPan ? `PAN No: ${invoice.partyPan}<br/>` : ''}
      ${invoice.partyGstin ? `GST No: ${invoice.partyGstin}` : ''}
    </div>
  </div>

  <table class="kv">
    <tr><td class="label">Trainer Full Name</td><td>${issuer?.name || ''}</td><td class="label">Payee Name</td><td>${issuer?.name || ''}</td></tr>
    <tr><td class="label">Invoice Number</td><td>${invoice.invoiceNumber}</td><td class="label">Account Number</td><td>${issuer?.accountNumber || ''}</td></tr>
    <tr><td class="label">Invoice Date</td><td>${fmtDateSlash(invoice.issueDate)}</td><td class="label">IFSC Code</td><td>${issuer?.ifscCode || ''}</td></tr>
    <tr><td class="label">Course/Activity Name</td><td>${invoice.courseActivityName || ''}</td><td class="label">PAN Number</td><td>${issuer?.pan || ''}</td></tr>
    <tr><td class="label">Mode of Lecture</td><td>${invoice.modeOfLecture || ''}</td><td class="label">Classroom Location</td><td>${invoice.classroomLocation || ''}</td></tr>
  </table>

  <table class="items">
    <thead><tr><th>S.No</th><th>Description/Batch/Activity/Details</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
    <tbody>
      ${lineRows}
      <tr class="grand-row"><td colspan="4">Grand Total</td><td>Rs.${(invoice.totalAmount || 0).toFixed(2)}</td></tr>
    </tbody>
  </table>

  <div class="amount-words">AMOUNT IN WORDS: ${invoice.amountInWords || ''}</div>

  <div class="sig-block">
    Trainer Name: ${issuer?.name || ''}<br/>
    Signature:
    ${issuer?.signatureUrl ? `<img src="${issuer.signatureUrl}" />` : ''}
  </div>
</div></body></html>`;
}

export default new InvoiceService();
