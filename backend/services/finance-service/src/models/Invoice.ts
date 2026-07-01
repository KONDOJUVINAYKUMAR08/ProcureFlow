export type {
  Invoice as InvoiceRecord,
  InvoiceType,
  InvoiceTemplateType,
  TaxType,
  InvoiceStatus,
} from '../lib/prisma';

export interface InvoiceLineItem {
  description: string;
  hsnSacCode?: string;
  quantity: number;
  unit?: string;
  rate: number;
  discount?: number;
  taxableAmount: number;
  gstPercentage: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number;
}
