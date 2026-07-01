import { prisma } from '../lib/prisma';

export class AuditService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 50) {
    const where: Record<string, any> = {};
    if (query.entity) where.entity = query.entity;
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate as string);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}

export default new AuditService();
