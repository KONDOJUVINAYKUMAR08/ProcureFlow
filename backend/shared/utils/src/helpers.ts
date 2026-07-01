import { Response } from 'express';

export const sendSuccess = (res: Response, data: unknown, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, message = 'Internal Server Error', statusCode = 500, errors?: unknown) => {
  const response: Record<string, unknown> = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

export const generateVendorCode = (): string => {
  const prefix = 'VND';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const generatePoNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PO-${year}${month}-${random}`;
};

export const generateContractNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CTR-${year}-${random}`;
};

export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
};

export const generatePaymentReference = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PAY-${year}${month}-${random}`;
};

export const paginate = (page: number, limit: number): { page: number; limit: number; skip: number } => {
  const pageNum = Math.max(1, page);
  const limitNum = Math.min(Math.max(1, limit), 100);
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
