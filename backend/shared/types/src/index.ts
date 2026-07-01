import { Request } from 'express';

/* ─── User & Auth ──────────────────────────────────────────────── */

export type UserRole = 'admin' | 'procurement_manager' | 'finance' | 'vendor' | 'auditor' | 'employee';

export interface IUser {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  /** For role==='vendor' users: links the login to a specific Procurement_Vendor._id.
   *  Used by the AI service to scope a vendor's data access to only their own records. */
  vendorId?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface IAuthenticatedRequest extends Request {
  user?: IAuthPayload;
}

/* ─── Vendor ───────────────────────────────────────────────────── */

export type VendorStatus = 'active' | 'inactive' | 'pending' | 'blacklisted';

export interface IVendor {
  _id: string;
  vendorName: string;
  vendorCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  taxId: string;
  bankAccount: string;
  status: VendorStatus;
  rating: number;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Purchase Request ─────────────────────────────────────────── */

export type PRStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type PRPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IPurchaseRequest {
  _id: string;
  title: string;
  department: string;
  priority: PRPriority;
  description: string;
  estimatedCost: number;
  vendor?: string;
  status: PRStatus;
  requestedBy: string;
  approvedBy?: string;
  rejectionReason?: string;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Purchase Order ───────────────────────────────────────────── */

export type POStatus = 'draft' | 'issued' | 'acknowledged' | 'shipped' | 'completed' | 'cancelled';

export interface IPurchaseOrder {
  _id: string;
  poNumber: string;
  vendor: string;
  purchaseRequest?: string;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: POStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Contract ─────────────────────────────────────────────────── */

export type ContractStatus = 'active' | 'expired' | 'terminated' | 'pending_renewal';

export interface IContract {
  _id: string;
  contractName: string;
  vendor: string;
  contractNumber: string;
  effectiveDate: Date;
  expiryDate: Date;
  contractValue: number;
  status: ContractStatus;
  description: string;
  documentUrl?: string;
  versions: Array<{
    version: number;
    documentUrl: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Invoice ──────────────────────────────────────────────────── */

export type InvoiceStatus = 'pending' | 'approved' | 'paid' | 'overdue' | 'disputed';

export interface IInvoice {
  _id: string;
  invoiceNumber: string;
  vendor: string;
  purchaseOrder?: string;
  contract?: string;
  amount: number;
  tax: number;
  totalAmount: number;
  dueDate: Date;
  status: InvoiceStatus;
  description: string;
  documentUrl?: string;
  paymentDate?: Date;
  paymentMethod?: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Payment ──────────────────────────────────────────────────── */

export type PaymentMethod = 'wire_transfer' | 'check' | 'ach' | 'credit_card';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface IPayment {
  _id: string;
  paymentReference: string;
  invoice: string;
  vendor: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  status: PaymentStatus;
  notes: string;
  processedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Notification ─────────────────────────────────────────────── */

export type NotificationType = 'contract_expiry' | 'invoice_due' | 'vendor_approval' | 'purchase_approval' | 'payment_processed' | 'system';

export interface INotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  userId?: string;
  isRead: boolean;
  relatedId?: string;
  relatedModel?: string;
  createdAt: Date;
}

/* ─── Audit Log ────────────────────────────────────────────────── */

export interface IAuditLog {
  _id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

/* ─── Document ─────────────────────────────────────────────────── */

export type DocumentCategory = 'contract' | 'invoice' | 'purchase_order' | 'vendor_certificate';

export interface IDocument {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  category: DocumentCategory;
  relatedId?: string;
  uploadedBy: string;
  createdAt: Date;
}

/* ─── Shared Response Types ────────────────────────────────────── */

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* ─── App Config ───────────────────────────────────────────────── */

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiry: string;
  jwtRefreshExpiry: string;
  corsOrigin: string;
  uploadsDir: string;
  encryptionKey: string;
  sendgrid: {
    apiKey: string;
    from: string;
  };
  admin: {
    email: string;
    password: string;
  };
}

/* ─── RBAC Definitions ─────────────────────────────────────────── */

export const ROLES = {
  ADMIN: 'admin' as const,
  PROCUREMENT_MANAGER: 'procurement_manager' as const,
  FINANCE: 'finance' as const,
  VENDOR: 'vendor' as const,
  AUDITOR: 'auditor' as const,
  EMPLOYEE: 'employee' as const,
};

export const ALL_ROLES: UserRole[] = ['admin', 'procurement_manager', 'finance', 'vendor', 'auditor', 'employee'];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  procurement_manager: [
    'vendors:read', 'vendors:write',
    'purchase_requests:read', 'purchase_requests:write',
    'purchase_orders:read', 'purchase_orders:write',
    'contracts:read', 'contracts:write',
    'invoices:read',
    'documents:read', 'documents:write',
    'notifications:read', 'notifications:write',
    'dashboard:read', 'reports:read',
  ],
  finance: [
    'invoices:read', 'invoices:write', 'invoices:approve',
    'payments:read', 'payments:write',
    'vendors:read',
    'purchase_orders:read',
    'contracts:read',
    'documents:read', 'documents:write',
    'notifications:read', 'notifications:write',
    'dashboard:read', 'reports:read',
  ],
  vendor: [
    'contracts:read:own',
    'purchase_orders:read:own',
    'invoices:read:own',
    'documents:read', 'documents:write',
    'notifications:read',
  ],
  auditor: [
    'vendors:read',
    'purchase_requests:read',
    'purchase_orders:read',
    'contracts:read',
    'invoices:read',
    'payments:read',
    'documents:read',
    'audit:read',
    'notifications:read',
    'dashboard:read', 'reports:read',
  ],
  employee: [
    'attendance:read:own', 'attendance:write:own',
    'payroll:read:own',
    'letters:read:own',
    'documents:read:own',
  ],
};
