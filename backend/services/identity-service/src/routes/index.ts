import { Router } from 'express';
import authController from '../controllers/auth.controller';
import userController from '../controllers/user.controller';
import { employeeController, attendanceController, payrollController, letterController } from '../controllers/hr.controller';
import { authenticate, authorize, validate } from '@procurement/middleware';
import { loginSchema, createUserSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators';
import { ROLES } from '@procurement/types';

const router: Router = Router();

// ── Auth Routes ───────────────────────────────────────────────────────────────
// No public registration — the admin account is seeded on startup, and the
// admin creates any further (restricted-role) accounts via POST /users below.
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/auth/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/auth/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/auth/logout', authController.logout);
router.get('/auth/profile', authenticate, authController.getProfile);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.post('/auth/change-password', authenticate, authController.changePassword);

// ── User management (admin only) ──────────────────────────────────────────────
router.get('/users', authenticate, authorize(ROLES.ADMIN), userController.findAll);
router.get('/users/:id', authenticate, authorize(ROLES.ADMIN), userController.findById);
router.post('/users', authenticate, authorize(ROLES.ADMIN), validate(createUserSchema), userController.create);
router.put('/users/:id', authenticate, authorize(ROLES.ADMIN), userController.update);
router.delete('/users/:id', authenticate, authorize(ROLES.ADMIN), userController.delete);

// ── HR — Employees ────────────────────────────────────────────────────────────
router.get('/hr/employees/stats', authenticate, authorize(ROLES.ADMIN), employeeController.getStats);
router.get('/hr/employees', authenticate, authorize(ROLES.ADMIN), employeeController.findAll);
router.get('/hr/employees/:id', authenticate, authorize(ROLES.ADMIN), employeeController.findById);
router.post('/hr/employees', authenticate, authorize(ROLES.ADMIN), employeeController.create);
router.put('/hr/employees/:id', authenticate, authorize(ROLES.ADMIN), employeeController.update);
router.delete('/hr/employees/:id', authenticate, authorize(ROLES.ADMIN), employeeController.delete);

// ── HR — Attendance ───────────────────────────────────────────────────────────
router.get('/hr/attendance', authenticate, authorize(ROLES.ADMIN), attendanceController.getAll);
router.get('/hr/attendance/summary', authenticate, attendanceController.getSummary);
router.get('/hr/attendance/my', authenticate, attendanceController.getMyAttendance);
router.post('/hr/attendance/checkin', authenticate, attendanceController.checkIn);
router.post('/hr/attendance/checkout', authenticate, attendanceController.checkOut);
router.post('/hr/attendance/:employeeId/checkin', authenticate, authorize(ROLES.ADMIN), attendanceController.checkIn);
router.post('/hr/attendance/:employeeId/checkout', authenticate, authorize(ROLES.ADMIN), attendanceController.checkOut);

// ── HR — Payroll ──────────────────────────────────────────────────────────────
router.get('/hr/payroll', authenticate, authorize(ROLES.ADMIN, ROLES.FINANCE), payrollController.findAll);
router.get('/hr/payroll/:id', authenticate, authorize(ROLES.ADMIN, ROLES.FINANCE), payrollController.findById);
router.post('/hr/payroll/generate', authenticate, authorize(ROLES.ADMIN, ROLES.FINANCE), payrollController.generate);
router.post('/hr/payroll/:id/mark-paid', authenticate, authorize(ROLES.ADMIN, ROLES.FINANCE), payrollController.markPaid);
router.post('/hr/payroll/:id/pdf', authenticate, authorize(ROLES.ADMIN, ROLES.FINANCE), payrollController.generatePdf);
router.get('/hr/payroll/:id/file', authenticate, payrollController.getFile);

// ── HR — Letters & Certificates ───────────────────────────────────────────────
router.get('/hr/letters', authenticate, authorize(ROLES.ADMIN), letterController.findAll);
router.get('/hr/letters/:id', authenticate, authorize(ROLES.ADMIN), letterController.findById);
router.post('/hr/letters', authenticate, authorize(ROLES.ADMIN), letterController.create);
router.delete('/hr/letters/:id', authenticate, authorize(ROLES.ADMIN), letterController.delete);
router.post('/hr/letters/:id/pdf', authenticate, authorize(ROLES.ADMIN), letterController.generatePdf);
router.get('/hr/letters/:id/file', authenticate, authorize(ROLES.ADMIN), letterController.getFile);

export default router;

