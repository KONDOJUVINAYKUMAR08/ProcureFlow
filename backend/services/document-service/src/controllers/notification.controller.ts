import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import notificationService from '../services/notification.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';

export class NotificationController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      
      const { notifications, total } = await notificationService.findAll(req.user!.userId, skip, limit);
      
      return sendSuccess(res, {
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async getUnreadCount(req: IAuthenticatedRequest, res: Response) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.userId);
      return sendSuccess(res, count);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async markAsRead(req: IAuthenticatedRequest, res: Response) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user!.userId);
      return sendSuccess(res, notification, 'Notification marked as read');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async markAllAsRead(req: IAuthenticatedRequest, res: Response) {
    try {
      await notificationService.markAllAsRead(req.user!.userId);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }
}

export default new NotificationController();
