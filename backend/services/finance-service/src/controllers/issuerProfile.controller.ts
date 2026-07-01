import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import issuerProfileService from '../services/issuerProfile.service';
import { sendSuccess, sendError } from '@procurement/utils';

export class IssuerProfileController {
  async findAll(_req: IAuthenticatedRequest, res: Response) {
    try {
      const profiles = await issuerProfileService.findAll();
      return sendSuccess(res, profiles);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async upsert(req: IAuthenticatedRequest, res: Response) {
    try {
      const type = req.params.type as 'individual' | 'beulix';
      if (type !== 'individual' && type !== 'beulix') {
        return sendError(res, "type must be 'individual' or 'beulix'", 400);
      }
      const profile = await issuerProfileService.upsert(type, req.body);
      return sendSuccess(res, profile, 'Issuer profile saved successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new IssuerProfileController();
