export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'admin' | 'procurement_manager' | 'finance' | 'vendor' | 'auditor' | 'employee';
  department: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface Vendor {
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
  status: 'active' | 'inactive' | 'pending' | 'blacklisted';
  rating: number;
  notes: string;
  activities: Array<{
    action: string;
    description: string;
    performedBy: string | User;
    timestamp: string;
  }>;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequest {
  _id: string;
  title: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  estimatedCost: number;
  vendor?: string | Vendor;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  requestedBy: string | User;
  approvedBy?: string | User;
  rejectionReason?: string;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  vendor: string | Vendor;
  purchaseRequest?: string | PurchaseRequest;
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
  status: 'draft' | 'issued' | 'acknowledged' | 'shipped' | 'completed' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate?: string;
  notes: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  _id: string;
  contractName: string;
  vendor: string | Vendor;
  contractNumber: string;
  effectiveDate: string;
  expiryDate: string;
  contractValue: number;
  status: 'active' | 'expired' | 'terminated' | 'pending_renewal';
  description: string;
  documentUrl?: string;
  versions: Array<{
    version: number;
    documentUrl: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  vendor: string | Vendor;
  purchaseOrder?: string | PurchaseOrder;
  contract?: string | Contract;
  amount: number;
  tax: number;
  totalAmount: number;
  dueDate: string;
  status: 'pending' | 'approved' | 'paid' | 'overdue' | 'disputed';
  description: string;
  documentUrl?: string;
  paymentDate?: string;
  paymentMethod?: string;
  approvedBy?: string | User;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;

  // Rich/GST fields
  invoiceType?: 'CUSTOMER_INVOICE' | 'VENDOR_INVOICE';
  vendorId?: string;
  customerId?: string;
  partyName?: string;
  partyGstin?: string;
  partyPan?: string;
  partyAddress?: string;
  purchaseOrderId?: string;
  contractId?: string;
  poNumber?: string;
  placeOfSupply?: string;
  vendorPayable?: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  upiId?: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'contract_expiry' | 'invoice_due' | 'vendor_approval' | 'purchase_approval' | 'system';
  userId?: string;
  isRead: boolean;
  relatedId?: string;
  relatedModel?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  userId: string | User;
  action: string;
  entity: string;
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface DashboardStats {
  overview: {
    totalVendors: number;
    activeVendors: number;
    purchaseRequests: number;
    pendingApprovals: number;
    purchaseOrders: number;
    pendingPurchaseOrders: number;
    activeContracts: number;
    expiringContracts: number;
    totalInvoices: number;
    pendingInvoices: number;
  };
  invoiceStats: Array<{ _id: string; count: number; totalAmount: number }>;
  monthlySpend: Array<{
    _id: { year: number; month: number };
    total: number;
    count: number;
  }>;
  procurementByDepartment: Array<{ _id: string; count: number; totalCost: number }>;
  vendorByStatus: Array<{ _id: string; count: number }>;
  recentActivity: AuditLog[];
}

export interface Document {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  s3Bucket: string;
  category: 'contract' | 'invoice' | 'purchase_order' | 'vendor_certificate';
  relatedId?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
