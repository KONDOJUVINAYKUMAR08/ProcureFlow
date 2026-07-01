import { Response, NextFunction } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import { logger } from '@procurement/common';
import { auditPrisma } from './auditLog.model';

export const createAuditLog = async (data: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
}) => {
  try {
    await auditPrisma.auditLog.create({ data });
  } catch (err) {
    logger.error('Audit log creation failed:', err);
  }
};

export const auditLog = (action: string, entity: string) => {
  return async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalEnd = res.end;
    const requestData = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    res.end = function (this: Response, ...args: unknown[]) {
      if (req.user && res.statusCode < 400) {
        createAuditLog({
          userId: req.user.userId,
          action,
          entity,
          entityId: req.params?.id,
          details: {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            ...requestData,
          },
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        });
      }

      return (originalEnd as Function).apply(this, args);
    };

    next();
  };
};
