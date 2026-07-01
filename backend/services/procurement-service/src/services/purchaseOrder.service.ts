import { prisma } from '../lib/prisma';
import { generatePoNumber } from '@procurement/utils';

export class PurchaseOrderService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.vendor) where.vendor = query.vendor;
    if (query.search) where.poNumber = { contains: query.search as string, mode: 'insensitive' };

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { orders, total };
  }

  async findById(id: string) {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: id } });
    if (!order) throw new Error('Purchase order not found');
    return order;
  }

  async create(data: Record<string, any>, userId: string) {
    const poNumber = generatePoNumber();

    let subtotal = 0;
    let items = data.items;
    if (items && items.length > 0) {
      items = items.map((item: any) => {
        const totalPrice = item.quantity * item.unitPrice;
        subtotal += totalPrice;
        return { ...item, totalPrice };
      });
    }

    const tax = data.tax || 0;
    const totalAmount = subtotal + tax;

    return prisma.purchaseOrder.create({
      data: {
        ...data,
        items: items || [],
        poNumber,
        subtotal,
        totalAmount,
        createdBy: userId,
      } as any,
    });
  }

  async update(id: string, data: Record<string, any>) {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: id } });
    if (!order) throw new Error('Purchase order not found');

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new Error(`Cannot update order in ${order.status} status`);
    }

    const updateData: Record<string, any> = { ...data };
    if (data.items) {
      let subtotal = 0;
      updateData.items = data.items.map((item: any) => {
        const totalPrice = item.quantity * item.unitPrice;
        subtotal += totalPrice;
        return { ...item, totalPrice };
      });
      updateData.subtotal = subtotal;
      updateData.totalAmount = subtotal + (data.tax !== undefined ? data.tax : order.tax);
    } else if (data.tax !== undefined) {
      updateData.totalAmount = order.subtotal + data.tax;
    }

    return prisma.purchaseOrder.update({ where: { id: id }, data: updateData });
  }

  async getStats() {
    const grouped = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { totalAmount: true },
    });
    const stats = grouped.map(g => ({ _id: g.status, count: g._count.status, totalValue: g._sum.totalAmount || 0 }));
    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    return { total, byStatus: stats };
  }
}

export default new PurchaseOrderService();
