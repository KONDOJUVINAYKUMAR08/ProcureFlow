import { prisma } from '../lib/prisma';
import { generateContractNumber } from '@procurement/utils';

export class ContractService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.vendor) where.vendor = query.vendor;
    if (query.search) {
      const search = query.search as string;
      where.OR = [
        { contractName: { contains: search, mode: 'insensitive' } },
        { contractNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.contract.count({ where }),
    ]);

    return { contracts, total };
  }

  async findById(id: string) {
    const contract = await prisma.contract.findUnique({ where: { id: id } });
    if (!contract) throw new Error('Contract not found');
    return contract;
  }

  async create(data: Record<string, any>, userId: string) {
    const contractNumber = generateContractNumber();
    const contractData: Record<string, any> = { ...data, contractNumber, createdBy: userId };

    if (data.documentUrl) {
      contractData.versions = [
        { version: 1, documentUrl: data.documentUrl, uploadedBy: userId, uploadedAt: new Date() },
      ];
    }

    return prisma.contract.create({ data: contractData as any });
  }

  async update(id: string, data: Record<string, any>, userId: string) {
    const contract = await prisma.contract.findUnique({ where: { id: id } });
    if (!contract) throw new Error('Contract not found');

    const existingVersions = Array.isArray(contract.versions) ? contract.versions : [];
    const newVersions: any[] = [...existingVersions];
    if (data.documentUrl && data.documentUrl !== contract.documentUrl) {
      newVersions.push({
        version: newVersions.length + 1,
        documentUrl: data.documentUrl,
        uploadedBy: userId,
        uploadedAt: new Date(),
      });
    }

    return prisma.contract.update({ where: { id: id }, data: { ...data, versions: newVersions } });
  }

  async getExpiring(days = 30) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const expiring = await prisma.contract.findMany({
      where: {
        status: 'active',
        expiryDate: { lte: targetDate, gte: new Date() },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return expiring;
  }

  async getStats() {
    const grouped = await prisma.contract.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { contractValue: true },
    });
    const stats = grouped.map(g => ({ _id: g.status, count: g._count.status, totalValue: g._sum.contractValue || 0 }));
    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    return { total, byStatus: stats };
  }
}

export default new ContractService();
