import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import invoiceService from '../services/invoice.service';
import reportService from '../services/report.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';
import { readFile } from '@procurement/common';

export class InvoiceController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      
      const { invoices, total } = await invoiceService.findAll(req.query, skip, limit);
      
      return sendSuccess(res, {
        data: invoices,
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
      const invoice = await invoiceService.findById(req.params.id);
      return sendSuccess(res, invoice);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const invoice = await invoiceService.create(req.body, req.user!.userId);
      return sendSuccess(res, invoice, 'Invoice created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const invoice = await invoiceService.update(req.params.id, req.body);
      return sendSuccess(res, invoice, 'Invoice updated successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async delete(req: IAuthenticatedRequest, res: Response) {
    try {
      await invoiceService.delete(req.params.id);
      return sendSuccess(res, null, 'Invoice deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async approve(req: IAuthenticatedRequest, res: Response) {
    try {
      const invoice = await invoiceService.approve(req.params.id, req.user!.userId);
      return sendSuccess(res, invoice, 'Invoice approved successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async markAsPaid(req: IAuthenticatedRequest, res: Response) {
    try {
      const { paymentMethod } = req.body;
      const invoice = await invoiceService.markAsPaid(req.params.id, paymentMethod || 'Bank Transfer');
      return sendSuccess(res, invoice, 'Invoice marked as paid successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async generatePdf(req: IAuthenticatedRequest, res: Response) {
    try {
      const { url, fileName } = await invoiceService.generatePdf(req.params.id);
      return sendSuccess(res, { url, fileName }, 'PDF generated successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await invoiceService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async getDashboard(req: IAuthenticatedRequest, res: Response) {
    try {
      const dashboard = await invoiceService.getDashboard(req.query);
      return sendSuccess(res, dashboard);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async exportExcel(req: IAuthenticatedRequest, res: Response) {
    try {
      const { year, month } = req.query as { year?: string; month?: string };
      const buffer = await reportService.exportWorkbook(year, month);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="procureflow-report-${year || 'all'}${month ? '-' + month : ''}.xlsx"`);
      return res.send(buffer);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  // Streams the generated PDF from local storage — replaces the old S3
  // presigned download URL.
  async getFile(req: IAuthenticatedRequest, res: Response) {
    try {
      const invoice = await invoiceService.getFilePath(req.params.id);
      const buffer = await readFile(invoice.pdfKey!);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
      return res.send(buffer);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }
}

export default new InvoiceController();
