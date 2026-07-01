import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import { prisma } from '../lib/prisma';
import authService from '../services/auth.service';
import { sendSuccess, sendError } from '@procurement/utils';

const sanitize = (user: Record<string, any>) => {
  const copy = { ...user };
  delete copy.password;
  return copy;
};

export class UserController {
  async findAll(_req: IAuthenticatedRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
      return sendSuccess(res, users.map(sanitize));
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async findById(req: IAuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) return sendError(res, 'User not found', 404);
      return sendSuccess(res, sanitize(user));
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Admin-only account creation — there is no public registration route.
  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const { user } = await authService.createUser(req.body);
      return sendSuccess(res, user, 'User created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
      return sendSuccess(res, sanitize(user), 'User updated');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async delete(req: IAuthenticatedRequest, res: Response) {
    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      return sendSuccess(res, null, 'User deleted');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new UserController();
