import { prisma } from '../lib/prisma';
import { generateVendorCode } from '@procurement/utils';

export class VendorService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      const search = query.search as string;
      where.OR = [
        { vendorName: { contains: search, mode: 'insensitive' } },
        { vendorCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.vendor.count({ where }),
    ]);

    return { vendors, total };
  }

  async findById(id: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: id } });
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  }

  async create(data: Record<string, any>, userId: string) {
    const vendorCode = generateVendorCode();
    return prisma.vendor.create({
      data: {
        ...data,
        vendorCode,
        createdBy: userId,
        activities: [
          {
            action: 'created',
            description: 'Vendor record created',
            performedBy: userId,
            timestamp: new Date(),
          },
        ],
      } as any,
    });
  }

  async update(id: string, data: Record<string, any>, userId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: id } });
    if (!vendor) throw new Error('Vendor not found');

    const updatedFields = Object.keys(data).filter(key => key !== 'activities');
    const existingActivities = Array.isArray(vendor.activities) ? vendor.activities : [];
    const newActivities = [
      ...existingActivities,
      {
        action: 'updated',
        description: `Updated fields: ${updatedFields.join(', ')}`,
        performedBy: userId,
        timestamp: new Date(),
      },
    ];

    return prisma.vendor.update({ where: { id: id }, data: { ...data, activities: newActivities } });
  }

  async delete(id: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: id } });
    if (!vendor) throw new Error('Vendor not found');
    await prisma.vendor.delete({ where: { id: id } });
    return vendor;
  }

  async getStats() {
    const grouped = await prisma.vendor.groupBy({ by: ['status'], _count: { status: true } });
    const stats = grouped.map(g => ({ _id: g.status, count: g._count.status }));
    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    return { total, byStatus: stats };
  }
}

export default new VendorService();
