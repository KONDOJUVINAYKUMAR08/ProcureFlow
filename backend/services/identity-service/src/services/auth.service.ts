import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { generateToken, generateRefreshToken } from '@procurement/middleware';
import { IAuthPayload } from '@procurement/types';
import { logger, config, sendEmail } from '@procurement/common';

const sanitize = (user: Record<string, any>) => {
  const copy = { ...user };
  delete copy.password;
  delete copy.resetPasswordToken;
  delete copy.resetPasswordExpires;
  return copy;
};

export class AuthService {
  // Used both by the admin-only "create user" endpoint and the one-time
  // admin bootstrap on startup — there is no public self-registration route.
  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new Error('User with this email already exists');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: data.role as any,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost';
    sendEmail(
      user.email,
      'Welcome to ProcureFlow — Your Account is Ready',
      `<p>Hi ${user.firstName},</p>
       <p>Your ProcureFlow account has been created by the administrator.</p>
       <table style="border-collapse:collapse;margin:16px 0">
         <tr><td style="padding:4px 12px 4px 0;color:#666">Login URL</td><td><a href="${frontendUrl}">${frontendUrl}</a></td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${user.email}</td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#666">Temporary Password</td><td><strong>${data.password}</strong></td></tr>
         <tr><td style="padding:4px 12px 4px 0;color:#666">Role</td><td>${user.role}</td></tr>
       </table>
       <p>Please log in and change your password immediately via <em>Settings → Change Password</em>.</p>
       <p>Regards,<br/>ProcureFlow Team</p>`
    ).catch(err => logger.error('Failed to send welcome email', err));

    const payload: IAuthPayload = { userId: user.id, email: user.email, role: user.role };

    return {
      user: sanitize(user),
      token: generateToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async bootstrapAdmin() {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (existingAdmin) return;

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(config.admin.password, salt);

    await prisma.user.create({
      data: {
        email: config.admin.email.toLowerCase(),
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        department: 'Administration',
      },
    });

    logger.info(`Seeded admin account: ${config.admin.email}`);
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new Error('Invalid credentials');
    if (!user.isActive) throw new Error('Account is deactivated');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const payload: IAuthPayload = { userId: user.id, email: user.email, role: user.role };

    logger.info(`User logged in: ${user.email}`);

    return {
      user: sanitize(user),
      token: generateToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async refreshToken(token: string) {
    const jwt = (await import('jsonwebtoken')).default;

    const decoded = jwt.verify(token, config.jwtRefreshSecret) as IAuthPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.isActive) throw new Error('Invalid refresh token');

    const payload: IAuthPayload = { userId: decoded.userId, email: decoded.email, role: decoded.role };

    return {
      token: generateToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: hashedToken, resetPasswordExpires: new Date(Date.now() + 3600000) },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost'}/reset-password?token=${resetToken}`;
    await sendEmail(
      user.email,
      'ProcureFlow — Password Reset Request',
      `<p>Hi ${user.firstName},</p><p>Click the link below to reset your ProcureFlow password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    ).catch(err => logger.error('Failed to send password reset email', err));

    logger.info(`Password reset requested for: ${user.email}`);
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: { resetPasswordToken: hashedToken, resetPasswordExpires: { gt: new Date() } },
    });

    if (!user) throw new Error('Invalid or expired reset token');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null },
    });

    logger.info(`Password reset successful for: ${user.email}`);
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return sanitize(user);
  }

  async updateProfile(userId: string, data: Record<string, any>) {
    const user = await prisma.user.update({ where: { id: userId }, data });
    if (!user) throw new Error('User not found');
    return sanitize(user);
  }

  async changePassword(userId: string, current: string, replacement: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch) throw new Error('Incorrect current password');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(replacement, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: false },
    });
  }
}

export default new AuthService();
