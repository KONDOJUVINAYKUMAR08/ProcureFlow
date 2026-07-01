import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import contractService from '../services/contract.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';

export class ContractController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      
      const { contracts, total } = await contractService.findAll(req.query, skip, limit);
      
      return sendSuccess(res, {
        data: contracts,
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
      const contract = await contractService.findById(req.params.id);
      return sendSuccess(res, contract);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const contract = await contractService.create(req.body, req.user!.userId);
      return sendSuccess(res, contract, 'Contract created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const contract = await contractService.update(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, contract, 'Contract updated successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getExpiring(req: IAuthenticatedRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const contracts = await contractService.getExpiring(days);
      return sendSuccess(res, contracts);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await contractService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }
}

export default new ContractController();
