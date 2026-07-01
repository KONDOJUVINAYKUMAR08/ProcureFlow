import { prisma } from '../lib/prisma';

// Vendor-invoice ledger (sir's "Purchases" module) — distinct from
// procurement-service's Purchase Order workflow. TDS defaults to a flat 10%
// of the taxable amount, auto-computed here rather than entered manually.
export class PurchaseService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 50) {
    const where: Record<string, any> = {};
    if (query.year || query.month) {
      const year = query.year ? parseInt(query.year as string, 10) : new Date().getFullYear();
      const month = query.month ? parseInt(query.month as string, 10) : undefined;
      const start = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
      const end = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);
      where.purchaseDate = { gte: start, lt: end };
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({ where, orderBy: { purchaseDate: 'desc' }, skip, take: limit }),
      prisma.purchase.count({ where }),
    ]);

    const totals = await prisma.purchase.aggregate({
      where,
      _sum: { invoiceValue: true, tdsAmount: true },
    });

    return {
      purchases,
      total,
      totalPurchases: total,
      invoiceValue: Math.round((totals._sum.invoiceValue || 0) * 100) / 100,
      totalTds: Math.round((totals._sum.tdsAmount || 0) * 100) / 100,
    };
  }

  async findById(id: string) {
    const purchase = await prisma.purchase.findUnique({ where: { id: id } });
    if (!purchase) throw new Error('Purchase not found');
    return purchase;
  }

  async create(data: Record<string, any>, userId: string) {
    const taxableAmount = Number(data.taxableAmount) || 0;
    const cgst = Number(data.cgst) || 0;
    const sgst = Number(data.sgst) || 0;
    const igst = Number(data.igst) || 0;
    const tdsPercentage = data.tdsPercentage !== undefined ? Number(data.tdsPercentage) : 10;
    const tdsAmount = Math.round(taxableAmount * (tdsPercentage / 100) * 100) / 100;
    const invoiceValue = data.invoiceValue !== undefined
      ? Number(data.invoiceValue)
      : Math.round((taxableAmount + cgst + sgst + igst) * 100) / 100;

    return prisma.purchase.create({
      data: {
        ...data,
        taxableAmount,
        cgst,
        sgst,
        igst,
        invoiceValue,
        tdsPercentage,
        tdsAmount,
        createdBy: userId,
      } as any,
    });
  }

  async delete(id: string) {
    const purchase = await prisma.purchase.findUnique({ where: { id: id } });
    if (!purchase) throw new Error('Purchase not found');
    await prisma.purchase.delete({ where: { id: id } });
  }
}

export default new PurchaseService();
