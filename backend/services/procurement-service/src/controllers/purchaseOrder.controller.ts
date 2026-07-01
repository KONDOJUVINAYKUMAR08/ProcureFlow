import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import purchaseOrderService from '../services/purchaseOrder.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';

export class PurchaseOrderController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      
      const { orders, total } = await purchaseOrderService.findAll(req.query, skip, limit);
      
      return sendSuccess(res, {
        data: orders,
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
      const order = await purchaseOrderService.findById(req.params.id);
      return sendSuccess(res, order);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const order = await purchaseOrderService.create(req.body, req.user!.userId);
      return sendSuccess(res, order, 'Purchase order created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const order = await purchaseOrderService.update(req.params.id, req.body);
      return sendSuccess(res, order, 'Purchase order updated successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await purchaseOrderService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }
}

export default new PurchaseOrderController();
