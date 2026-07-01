import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import auditService from '../services/audit.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';

export class AuditController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 50
      );
      
      const { logs, total } = await auditService.findAll(req.query, skip, limit);
      
      return sendSuccess(res, {
        data: logs,
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
}

export default new AuditController();
