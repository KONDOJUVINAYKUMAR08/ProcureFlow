import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import purchaseRequestService from '../services/purchaseRequest.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';

export class PurchaseRequestController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      
      const { requests, total } = await purchaseRequestService.findAll(req.query, skip, limit);
      
      return sendSuccess(res, {
        data: requests,
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
      const request = await purchaseRequestService.findById(req.params.id);
      return sendSuccess(res, request);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const request = await purchaseRequestService.create(req.body, req.user!.userId);
      return sendSuccess(res, request, 'Purchase request created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const request = await purchaseRequestService.update(req.params.id, req.body);
      return sendSuccess(res, request, 'Purchase request updated successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async submit(req: IAuthenticatedRequest, res: Response) {
    try {
      const request = await purchaseRequestService.submit(req.params.id);
      return sendSuccess(res, request, 'Purchase request submitted successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async approve(req: IAuthenticatedRequest, res: Response) {
    try {
      const request = await purchaseRequestService.approve(req.params.id, req.user!.userId);
      return sendSuccess(res, request, 'Purchase request approved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async reject(req: IAuthenticatedRequest, res: Response) {
    try {
      const { reason } = req.body;
      if (!reason) return sendError(res, 'Rejection reason is required', 400);
      
      const request = await purchaseRequestService.reject(req.params.id, reason, req.user!.userId);
      return sendSuccess(res, request, 'Purchase request rejected');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await purchaseRequestService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }
}

export default new PurchaseRequestController();
