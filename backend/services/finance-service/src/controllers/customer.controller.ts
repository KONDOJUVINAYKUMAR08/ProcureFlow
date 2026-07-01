import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import customerService from '../services/customer.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';

export class CustomerController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      const { customers, total } = await customerService.findAll(req.query, skip, limit);
      return sendSuccess(res, {
        data: customers,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async findById(req: IAuthenticatedRequest, res: Response) {
    try {
      const customer = await customerService.findById(req.params.id);
      return sendSuccess(res, customer);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const customer = await customerService.create(req.body, req.user!.userId);
      return sendSuccess(res, customer, 'Customer created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const customer = await customerService.update(req.params.id, req.body);
      return sendSuccess(res, customer, 'Customer updated successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async delete(req: IAuthenticatedRequest, res: Response) {
    try {
      await customerService.delete(req.params.id);
      return sendSuccess(res, null, 'Customer deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await customerService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }
}

export default new CustomerController();
