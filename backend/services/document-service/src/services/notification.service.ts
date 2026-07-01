import { prisma } from '../lib/prisma';

export class NotificationService {
  async findAll(userId: string, skip = 0, limit = 20) {
    const where = { userId };
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id: id } });
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    return prisma.notification.update({ where: { id: id }, data: { isRead: true } });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createSystemNotification(data: { title: string; message: string; type: string; relatedId?: string; relatedModel?: string }) {
    return prisma.notification.create({
      data: { ...data, type: data.type as any, userId: 'SYSTEM' },
    });
  }
}

export default new NotificationService();
