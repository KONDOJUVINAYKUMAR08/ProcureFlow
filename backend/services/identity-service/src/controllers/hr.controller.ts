import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import employeeService from '../services/employee.service';
import attendanceService from '../services/attendance.service';
import payrollService from '../services/payroll.service';
import letterService from '../services/letter.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';
import { readFile } from '@procurement/common';

// ── Employee ──────────────────────────────────────────────────────────────────

export const employeeController = {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(+req.query.page! || 1, +req.query.limit! || 20);
      const result = await employeeService.findAll(req.query, skip, limit);
      return sendSuccess(res, { data: result.employees, pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
    } catch (e: any) { return sendError(res, e.message); }
  },
  async findById(req: IAuthenticatedRequest, res: Response) {
    try { return sendSuccess(res, await employeeService.findById(req.params.id)); }
    catch (e: any) { return sendError(res, e.message, 404); }
  },
  async create(req: IAuthenticatedRequest, res: Response) {
    try { return sendSuccess(res, await employeeService.create(req.body, req.user!.userId), 'Employee created', 201); }
    catch (e: any) { return sendError(res, e.message, 400); }
  },
  async update(req: IAuthenticatedRequest, res: Response) {
    try { return sendSuccess(res, await employeeService.update(req.params.id, req.body), 'Employee updated'); }
    catch (e: any) { return sendError(res, e.message, 400); }
  },
  async delete(req: IAuthenticatedRequest, res: Response) {
    try { await employeeService.delete(req.params.id); return sendSuccess(res, null, 'Employee deleted'); }
    catch (e: any) { return sendError(res, e.message, 400); }
  },
  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try { return sendSuccess(res, await employeeService.getStats()); }
    catch (e: any) { return sendError(res, e.message); }
  },
};

// ── Attendance ────────────────────────────────────────────────────────────────

export const attendanceController = {
  async checkIn(req: IAuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.params.employeeId || req.user!.userId;
      const record = await attendanceService.checkIn(employeeId, req.body);
      return sendSuccess(res, record, 'Check-in successful', 201);
    } catch (e: any) { return sendError(res, e.message, 400); }
  },
  async checkOut(req: IAuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.params.employeeId || req.user!.userId;
      const record = await attendanceService.checkOut(employeeId);
      return sendSuccess(res, record, 'Check-out successful');
    } catch (e: any) { return sendError(res, e.message, 400); }
  },
  async getMyAttendance(req: IAuthenticatedRequest, res: Response) {
    try {
      const { month, year } = req.query;
      const records = await attendanceService.getMyAttendance(req.user!.userId, month ? +month : undefined, year ? +year : undefined);
      return sendSuccess(res, records);
    } catch (e: any) { return sendError(res, e.message); }
  },
  async getAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(+req.query.page! || 1, +req.query.limit! || 50);
      const query = { ...req.query };
      if (req.user!.role === 'employee') {
        query.employeeId = req.user!.userId;
      }
      const result = await attendanceService.getAll(query, skip, limit);
      return sendSuccess(res, { data: result.records, pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
    } catch (e: any) { return sendError(res, e.message); }
  },
  async getSummary(req: IAuthenticatedRequest, res: Response) {
    try {
      const { month, year, employeeId } = req.query as any;
      const targetEmpId = req.user!.role === 'employee' ? req.user!.userId : (employeeId || req.user!.userId);
      const summary = await attendanceService.getSummary(targetEmpId, +month, +year);
      return sendSuccess(res, summary);
    } catch (e: any) { return sendError(res, e.message); }
  },
};

// ── Payroll ───────────────────────────────────────────────────────────────────

export const payrollController = {
  async generate(req: IAuthenticatedRequest, res: Response) {
    try {
      const { employeeId, month, year, ...overrides } = req.body;
      const payslip = await payrollService.generate(employeeId, +month, +year, req.user!.userId, overrides);
      return sendSuccess(res, payslip, 'Payslip generated', 201);
    } catch (e: any) { return sendError(res, e.message, 400); }
  },
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(+req.query.page! || 1, +req.query.limit! || 20);
      const query = { ...req.query };
      if (req.user!.role === 'employee') {
        query.employeeId = req.user!.userId;
      }
      const result = await payrollService.findAll(query, skip, limit);
      return sendSuccess(res, { data: result.payslips, pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
    } catch (e: any) { return sendError(res, e.message); }
  },
  async findById(req: IAuthenticatedRequest, res: Response) {
    try {
      const payslip = await payrollService.findById(req.params.id);
      if (req.user!.role === 'employee' && payslip.employeeId !== req.user!.userId) {
        return sendError(res, 'Access denied', 403);
      }
      return sendSuccess(res, payslip);
    }
    catch (e: any) { return sendError(res, e.message, 404); }
  },
  async markPaid(req: IAuthenticatedRequest, res: Response) {
    try { return sendSuccess(res, await payrollService.markPaid(req.params.id), 'Payslip marked as paid'); }
    catch (e: any) { return sendError(res, e.message, 400); }
  },
  async generatePdf(req: IAuthenticatedRequest, res: Response) {
    try {
      const payslip = await payrollService.findById(req.params.id);
      if (req.user!.role === 'employee' && payslip.employeeId !== req.user!.userId) {
        return sendError(res, 'Access denied', 403);
      }
      const result = await payrollService.generatePdf(req.params.id);
      return sendSuccess(res, result, 'PDF generated');
    } catch (e: any) { return sendError(res, e.message, 400); }
  },
  async getFile(req: IAuthenticatedRequest, res: Response) {
    try {
      const payslip = await payrollService.getFilePath(req.params.id);
      if (req.user!.role === 'employee' && payslip.employeeId !== req.user!.userId) {
        return sendError(res, 'Access denied', 403);
      }
      const buffer = await readFile(payslip.pdfKey!);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${payslip.payslipNumber}.pdf"`);
      return res.send(buffer);
    } catch (e: any) { return sendError(res, e.message, 404); }
  },
};

// ── Letters ───────────────────────────────────────────────────────────────────

export const letterController = {
  async create(req: IAuthenticatedRequest, res: Response) {
    try { return sendSuccess(res, await letterService.create(req.body, req.user!.userId), 'Letter created', 201); }
    catch (e: any) { return sendError(res, e.message, 400); }
  },
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(+req.query.page! || 1, +req.query.limit! || 20);
      const query = { ...req.query };
      if (req.user!.role === 'employee') {
        query.employeeId = req.user!.userId;
      }
      const result = await letterService.findAll(query, skip, limit);
      return sendSuccess(res, { data: result.letters, pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
    } catch (e: any) { return sendError(res, e.message); }
  },
  async findById(req: IAuthenticatedRequest, res: Response) {
    try {
      const letter = await letterService.findById(req.params.id);
      if (req.user!.role === 'employee' && letter.employeeId !== req.user!.userId) {
        return sendError(res, 'Access denied', 403);
      }
      return sendSuccess(res, letter);
    }
    catch (e: any) { return sendError(res, e.message, 404); }
  },
  async delete(req: IAuthenticatedRequest, res: Response) {
    try { await letterService.delete(req.params.id); return sendSuccess(res, null, 'Letter deleted'); }
    catch (e: any) { return sendError(res, e.message, 400); }
  },
  async generatePdf(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await letterService.generatePdf(req.params.id);
      return sendSuccess(res, result, 'PDF generated');
    } catch (e: any) { return sendError(res, e.message, 400); }
  },
  async getFile(req: IAuthenticatedRequest, res: Response) {
    try {
      const letter = await letterService.getFilePath(req.params.id);
      if (req.user!.role === 'employee' && letter.employeeId !== req.user!.userId) {
        return sendError(res, 'Access denied', 403);
      }
      const buffer = await readFile(letter.pdfKey!);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${letter.letterNumber}.pdf"`);
      return res.send(buffer);
    } catch (e: any) { return sendError(res, e.message, 404); }
  },
};
