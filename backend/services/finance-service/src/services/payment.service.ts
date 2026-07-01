import { prisma } from '../lib/prisma';
import { generatePaymentReference } from '@procurement/utils';

export class PaymentService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.vendor) where.vendor = query.vendor;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  async findById(id: string) {
    const payment = await prisma.payment.findUnique({ where: { id: id } });
    if (!payment) throw new Error('Payment not found');
    return payment;
  }

  async processPayment(data: { invoiceId: string; paymentMethod: string; notes?: string }, userId: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.status !== 'approved') {
      throw new Error(`Cannot pay invoice in ${invoice.status} status. Must be approved first.`);
    }

    const vendorId = invoice.vendorId || invoice.vendor;
    if (!vendorId) {
      throw new Error('This invoice has no associated vendor and cannot be recorded as a vendor payment.');
    }

    const payment = await prisma.payment.create({
      data: {
        paymentReference: generatePaymentReference(),
        invoice: invoice.id,
        vendor: vendorId,
        amount: invoice.totalAmount,
        paymentMethod: data.paymentMethod as any,
        notes: data.notes || '',
        processedBy: userId,
      },
    });

    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: { status: 'paid', paymentDate: new Date(), paymentMethod: data.paymentMethod },
    });

    return payment;
  }

  async getStats() {
    const grouped = await prisma.payment.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { amount: true },
    });
    const stats = grouped.map(g => ({ _id: g.status, count: g._count.status, totalValue: g._sum.amount || 0 }));
    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    return { total, byStatus: stats };
  }
}

export default new PaymentService();
