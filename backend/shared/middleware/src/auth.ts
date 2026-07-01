import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IAuthenticatedRequest, IAuthPayload } from '@procurement/types';
import { config, logger } from '@procurement/common';

export const authenticate = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as IAuthPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource.',
      });
    }

    next();
  };
};

export const generateToken = (payload: IAuthPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiry } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: IAuthPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiry } as jwt.SignOptions);
};
