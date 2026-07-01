import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import purchaseService from '../services/purchase.service';
import { sendSuccess, sendError } from '@procurement/utils';

export class PurchaseController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await purchaseService.findAll(req.query);
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async findById(req: IAuthenticatedRequest, res: Response) {
    try {
      const purchase = await purchaseService.findById(req.params.id);
      return sendSuccess(res, purchase);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const purchase = await purchaseService.create(req.body, req.user!.userId);
      return sendSuccess(res, purchase, 'Purchase recorded successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async delete(req: IAuthenticatedRequest, res: Response) {
    try {
      await purchaseService.delete(req.params.id);
      return sendSuccess(res, null, 'Purchase deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new PurchaseController();
