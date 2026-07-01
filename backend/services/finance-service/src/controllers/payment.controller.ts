import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import paymentService from '../services/payment.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';

export class PaymentController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      
      const { payments, total } = await paymentService.findAll(req.query, skip, limit);
      
      return sendSuccess(res, {
        data: payments,
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

  async findById(req: IAuthenticatedRequest, res: Response) {
    try {
      const payment = await paymentService.findById(req.params.id);
      return sendSuccess(res, payment);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const payment = await paymentService.processPayment(req.body, req.user!.userId);
      return sendSuccess(res, payment, 'Payment processed successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await paymentService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }
}

export default new PaymentController();
