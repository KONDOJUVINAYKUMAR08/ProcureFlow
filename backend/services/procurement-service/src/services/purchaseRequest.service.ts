import { prisma } from '../lib/prisma';

export class PurchaseRequestService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.department) where.department = query.department;
    if (query.priority) where.priority = query.priority;
    if (query.search) {
      const search = query.search as string;
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.purchaseRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.purchaseRequest.count({ where }),
    ]);

    return { requests, total };
  }

  async findById(id: string) {
    const request = await prisma.purchaseRequest.findUnique({ where: { id: id } });
    if (!request) throw new Error('Purchase request not found');
    return request;
  }

  async create(data: Record<string, any>, userId: string) {
    return prisma.purchaseRequest.create({
      data: { ...data, requestedBy: userId, status: 'draft' } as any,
    });
  }

  async update(id: string, data: Record<string, any>) {
    const request = await prisma.purchaseRequest.findUnique({ where: { id: id } });
    if (!request) throw new Error('Purchase request not found');

    if (['approved', 'rejected'].includes(request.status)) {
      throw new Error(`Cannot update request in ${request.status} status`);
    }

    return prisma.purchaseRequest.update({ where: { id: id }, data });
  }

  async submit(id: string) {
    const request = await prisma.purchaseRequest.findUnique({ where: { id: id } });
    if (!request) throw new Error('Purchase request not found');
    if (request.status !== 'draft') throw new Error('Only draft requests can be submitted');
    return prisma.purchaseRequest.update({ where: { id: id }, data: { status: 'pending' } });
  }

  async approve(id: string, userId: string) {
    const request = await prisma.purchaseRequest.findUnique({ where: { id: id } });
    if (!request) throw new Error('Purchase request not found');
    if (request.status !== 'pending') throw new Error('Only pending requests can be approved');
    return prisma.purchaseRequest.update({ where: { id: id }, data: { status: 'approved', approvedBy: userId } });
  }

  async reject(id: string, reason: string, userId: string) {
    const request = await prisma.purchaseRequest.findUnique({ where: { id: id } });
    if (!request) throw new Error('Purchase request not found');
    if (request.status !== 'pending') throw new Error('Only pending requests can be rejected');
    return prisma.purchaseRequest.update({
      where: { id: id },
      data: { status: 'rejected', rejectionReason: reason, approvedBy: userId },
    });
  }

  async getStats() {
    const grouped = await prisma.purchaseRequest.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { estimatedCost: true },
    });
    const stats = grouped.map(g => ({ _id: g.status, count: g._count.status, totalValue: g._sum.estimatedCost || 0 }));
    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    return { total, byStatus: stats };
  }
}

export default new PurchaseRequestService();
