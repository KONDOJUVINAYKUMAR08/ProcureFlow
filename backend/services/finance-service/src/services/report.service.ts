import ExcelJS from 'exceljs';
import { prisma } from '../lib/prisma';

const dateRange = (year?: string, month?: string) => {
  if (!year && !month) return undefined;
  const y = year ? parseInt(year, 10) : new Date().getFullYear();
  const m = month ? parseInt(month, 10) : undefined;
  const start = m ? new Date(y, m - 1, 1) : new Date(y, 0, 1);
  const end = m ? new Date(y, m, 1) : new Date(y + 1, 0, 1);
  return { gte: start, lt: end };
};

// One workbook, two un-netted sheets (matching the dashboard design):
// Invoices (customer-side revenue, GST/TDS) and Purchases (vendor-side
// ledger, flat 10% TDS) — plus a Summary sheet totalling each side
// separately, never combined into a single "profit" figure.
export class ReportService {
  async exportWorkbook(year?: string, month?: string): Promise<Buffer> {
    const issueDateRange = dateRange(year, month);
    const purchaseDateRange = dateRange(year, month);

    const invoices = await prisma.invoice.findMany({
      where: { invoiceType: 'CUSTOMER_INVOICE', ...(issueDateRange ? { issueDate: issueDateRange } : {}) },
      orderBy: { issueDate: 'desc' },
    });

    const purchases = await prisma.purchase.findMany({
      where: purchaseDateRange ? { purchaseDate: purchaseDateRange } : {},
      orderBy: { purchaseDate: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ProcureFlow';
    workbook.created = new Date();

    // ── Invoices sheet ─────────────────────────────────────────────────────
    const invSheet = workbook.addWorksheet('Invoices');
    invSheet.columns = [
      { header: 'Invoice No.', key: 'invoiceNumber', width: 22 },
      { header: 'Party', key: 'partyName', width: 24 },
      { header: 'Issue Date', key: 'issueDate', width: 14 },
      { header: 'Due Date', key: 'dueDate', width: 14 },
      { header: 'Taxable Amount', key: 'subTotal', width: 16 },
      { header: 'GST', key: 'totalGst', width: 14 },
      { header: 'TDS', key: 'tdsAmount', width: 14 },
      { header: 'Gross Amount', key: 'grossAmount', width: 16 },
      { header: 'Company Receivable', key: 'companyReceivable', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
    ];
    invSheet.getRow(1).font = { bold: true };
    let totalIncome = 0, totalTds = 0, totalGst = 0, totalReceivable = 0;
    invoices.forEach(inv => {
      invSheet.addRow({
        invoiceNumber: inv.invoiceNumber,
        partyName: inv.partyName,
        issueDate: inv.issueDate.toISOString().slice(0, 10),
        dueDate: inv.dueDate.toISOString().slice(0, 10),
        subTotal: inv.subTotal,
        totalGst: inv.totalGst,
        tdsAmount: inv.tdsAmount,
        grossAmount: inv.grossAmount,
        companyReceivable: inv.companyReceivable,
        status: inv.status,
      });
      totalIncome += (inv.subTotal || 0) - (inv.tdsAmount || 0);
      totalTds += inv.tdsAmount || 0;
      totalGst += inv.totalGst || 0;
      totalReceivable += inv.companyReceivable || 0;
    });

    // ── Purchases sheet ────────────────────────────────────────────────────
    const purSheet = workbook.addWorksheet('Purchases');
    purSheet.columns = [
      { header: 'Date', key: 'purchaseDate', width: 14 },
      { header: 'Invoice No.', key: 'invoiceNumber', width: 22 },
      { header: 'Supplier', key: 'supplierName', width: 24 },
      { header: 'GSTIN of Supplier', key: 'supplierGstin', width: 20 },
      { header: 'HSN/SAC', key: 'hsnSac', width: 12 },
      { header: 'Taxable Amount', key: 'taxableAmount', width: 16 },
      { header: 'CGST', key: 'cgst', width: 12 },
      { header: 'SGST', key: 'sgst', width: 12 },
      { header: 'IGST', key: 'igst', width: 12 },
      { header: 'TDS', key: 'tdsAmount', width: 14 },
      { header: 'Invoice Value', key: 'invoiceValue', width: 16 },
    ];
    purSheet.getRow(1).font = { bold: true };
    let totalPurchaseValue = 0, totalPurchaseTds = 0;
    purchases.forEach(p => {
      purSheet.addRow({
        purchaseDate: p.purchaseDate.toISOString().slice(0, 10),
        invoiceNumber: p.invoiceNumber,
        supplierName: p.supplierName,
        supplierGstin: p.supplierGstin || '',
        hsnSac: p.hsnSac || '',
        taxableAmount: p.taxableAmount,
        cgst: p.cgst,
        sgst: p.sgst,
        igst: p.igst,
        tdsAmount: p.tdsAmount,
        invoiceValue: p.invoiceValue,
      });
      totalPurchaseValue += p.invoiceValue || 0;
      totalPurchaseTds += p.tdsAmount || 0;
    });

    // ── Summary sheet ──────────────────────────────────────────────────────
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [{ header: 'Metric', key: 'metric', width: 32 }, { header: 'Value', key: 'value', width: 20 }];
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.addRows([
      { metric: 'Period', value: month ? `${month}/${year || new Date().getFullYear()}` : (year || 'All time') },
      { metric: '', value: '' },
      { metric: 'Invoices — Total Count', value: invoices.length },
      { metric: 'Invoices — Income Generated (net of GST & TDS)', value: Math.round(totalIncome * 100) / 100 },
      { metric: 'Invoices — TDS Deducted', value: Math.round(totalTds * 100) / 100 },
      { metric: 'Invoices — GST Collected', value: Math.round(totalGst * 100) / 100 },
      { metric: 'Invoices — Total Company Receivable', value: Math.round(totalReceivable * 100) / 100 },
      { metric: '', value: '' },
      { metric: 'Purchases — Total Count', value: purchases.length },
      { metric: 'Purchases — Total Invoice Value', value: Math.round(totalPurchaseValue * 100) / 100 },
      { metric: 'Purchases — TDS Withheld', value: Math.round(totalPurchaseTds * 100) / 100 },
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export default new ReportService();
