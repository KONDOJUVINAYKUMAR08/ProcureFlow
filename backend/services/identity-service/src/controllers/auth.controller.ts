import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { sendSuccess, sendError } from '@procurement/utils';
import { IAuthenticatedRequest } from '@procurement/types';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000,
      });
      return sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      return sendError(res, error.message, 401);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return sendError(res, 'Refresh token required', 400);
      const result = await authService.refreshToken(refreshToken);
      return sendSuccess(res, result, 'Token refreshed');
    } catch (error: any) {
      return sendError(res, error.message, 401);
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      await authService.forgotPassword(req.body.email);
      return sendSuccess(res, null, 'If an account exists with that email, a reset link has been sent.');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      return sendSuccess(res, null, 'Password reset successful');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getProfile(req: IAuthenticatedRequest, res: Response) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      return sendSuccess(res, user);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async updateProfile(req: IAuthenticatedRequest, res: Response) {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      return sendSuccess(res, user, 'Profile updated');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async changePassword(req: IAuthenticatedRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return sendError(res, 'Current and new password are required', 400);
      }
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      return sendSuccess(res, null, 'Password updated successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async logout(_req: Request, res: Response) {
    res.clearCookie('token');
    return sendSuccess(res, null, 'Logged out successfully');
  }
}

export default new AuthController();
