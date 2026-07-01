import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import vendorService from '../services/vendor.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';

export class VendorController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      
      const { vendors, total } = await vendorService.findAll(req.query, skip, limit);
      
      return sendSuccess(res, {
        data: vendors,
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
      const vendor = await vendorService.findById(req.params.id);
      return sendSuccess(res, vendor);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const vendor = await vendorService.create(req.body, req.user!.userId);
      return sendSuccess(res, vendor, 'Vendor created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const vendor = await vendorService.update(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, vendor, 'Vendor updated successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async delete(req: IAuthenticatedRequest, res: Response) {
    try {
      await vendorService.delete(req.params.id);
      return sendSuccess(res, null, 'Vendor deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await vendorService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }
}

export default new VendorController();
