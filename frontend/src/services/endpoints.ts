/**
 * API Service Layer
 *
 * All functions in this file normalize the backend response shape so that
 * callers always receive clean, typed data — never nested API wrapper objects.
 *
 * Backend response shape (from sendSuccess / sendError in @procurement/utils):
 *   Single item:  { success, message, data: T }
 *   List:         { success, message, data: { data: T[], pagination: {...} } }
 *
 * Axios stores the HTTP body in response.data.
 * So the full chain is:
 *   axiosResponse.data            → { success, message, data: ... }
 *   axiosResponse.data.data       → inner payload (item or { data, pagination })
 *   axiosResponse.data.data.data  → array of items (for list endpoints)
 */

import api from './api';
import {
  AuthResponse,
  Vendor,
  PurchaseRequest,
  PurchaseOrder,
  Contract,
  Invoice,
  Notification,
  AuditLog,
  DashboardStats,
  PaginatedResponse,
  User,
  Document,
} from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Unwrap { success, message, data: T } → T */
const item = <T>(res: any): T => res.data.data as T;

/** Unwrap { success, message, data: { data: T[], pagination } } → { items, pagination } */
const list = <T>(res: any): { items: T[]; pagination: PaginatedResponse<T>['pagination'] } => {
  const payload = res.data?.data ?? res.data ?? {};
  const items: T[] = Array.isArray(payload?.data) ? payload.data : [];
  const pagination = payload?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 };
  return { items, pagination };
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return item<AuthResponse>(res);
  },
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  getProfile: async (): Promise<User> => {
    const res = await api.get('/auth/profile');
    return item<User>(res);
  },
  updateProfile: async (data: any): Promise<User> => {
    const res = await api.put('/auth/profile', data);
    return item<User>(res);
  },
  logout: () => api.post('/auth/logout'),
  changePassword: (data: any) => api.post('/auth/change-password', data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

// Dashboard stats are aggregated CLIENT-SIDE from each domain service's own
// endpoints (no central gateway/aggregator). This mirrors the previous
// gateway dashboard controller's logic, moved to the frontend.
const arr = (res: any): any[] => {
  const payload = res.data?.data ?? res.data ?? {};
  return Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const BIG = { limit: 1000 };
    const [vRes, prRes, poRes, cRes, iRes, aRes] = await Promise.all([
      api.get('/vendors', { params: BIG }),
      api.get('/purchase-requests', { params: BIG }),
      api.get('/purchase-orders', { params: BIG }),
      api.get('/contracts', { params: BIG }),
      api.get('/invoices', { params: BIG }),
      api.get('/audit-logs', { params: { limit: 10 } }).catch(() => ({ data: { data: { data: [] } } })),
    ]);
    const vendors = arr(vRes), prs = arr(prRes), pos = arr(poRes), contracts = arr(cRes), invoices = arr(iRes), audits = arr(aRes);

    const now = Date.now();
    const in30 = new Date(new Date().setDate(new Date().getDate() + 30)).getTime();
    const groupCount = (items: any[], key: (x: any) => string, extra?: (acc: any, x: any) => void) => {
      const m: Record<string, any> = {};
      items.forEach(x => { const k = key(x); if (!m[k]) { m[k] = { _id: k, count: 0 }; } m[k].count++; if (extra) extra(m[k], x); });
      return Object.values(m);
    };

    const monthlyMap: Record<string, any> = {};
    pos.forEach(p => {
      if (['completed', 'shipped'].includes(p.status)) {
        const d = new Date(p.orderDate);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (!monthlyMap[key]) monthlyMap[key] = { _id: { year: d.getFullYear(), month: d.getMonth() + 1 }, total: 0, count: 0 };
        monthlyMap[key].total += p.totalAmount || 0; monthlyMap[key].count++;
      }
    });
    const monthlySpend = Object.values(monthlyMap).sort((a: any, b: any) => a._id.year !== b._id.year ? b._id.year - a._id.year : b._id.month - a._id.month).slice(0, 12);

    return {
      overview: {
        totalVendors: vendors.length,
        activeVendors: vendors.filter(v => v.status === 'active').length,
        purchaseRequests: prs.length,
        pendingApprovals: prs.filter(p => p.status === 'pending').length,
        purchaseOrders: pos.length,
        pendingPurchaseOrders: pos.filter(p => ['draft', 'issued'].includes(p.status)).length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
        expiringContracts: contracts.filter(c => c.status === 'active' && c.expiryDate && new Date(c.expiryDate).getTime() <= in30 && new Date(c.expiryDate).getTime() >= now).length,
        totalInvoices: invoices.length,
        pendingInvoices: invoices.filter(i => i.status === 'pending').length,
      },
      invoiceStats: groupCount(invoices, (i) => i.status, (acc, i) => { acc.totalAmount = (acc.totalAmount || 0) + (i.totalAmount || 0); }),
      monthlySpend,
      procurementByDepartment: groupCount(prs.filter(p => p.status === 'approved'), (p) => p.department, (acc, p) => { acc.totalCost = (acc.totalCost || 0) + (p.estimatedCost || 0); }),
      vendorByStatus: groupCount(vendors, (v) => v.status),
      recentActivity: audits.slice(0, 10),
    } as unknown as DashboardStats;
  },
};

// ── Vendors ───────────────────────────────────────────────────────────────────

export const vendorApi = {
  getAll: async (params?: any): Promise<{ items: Vendor[]; pagination: any }> => {
    const res = await api.get('/vendors', { params });
    return list<Vendor>(res);
  },
  getById: async (id: string): Promise<Vendor> => {
    const res = await api.get(`/vendors/${id}`);
    return item<Vendor>(res);
  },
  create: async (data: any): Promise<Vendor> => {
    const res = await api.post('/vendors', data);
    return item<Vendor>(res);
  },
  update: async (id: string, data: any): Promise<Vendor> => {
    const res = await api.put(`/vendors/${id}`, data);
    return item<Vendor>(res);
  },
  delete: (id: string) => api.delete(`/vendors/${id}`),
  getStats: async () => {
    const res = await api.get('/vendors/stats');
    return item<any>(res);
  },
};

// ── Purchase Requests ─────────────────────────────────────────────────────────

export const purchaseRequestApi = {
  getAll: async (params?: any): Promise<{ items: PurchaseRequest[]; pagination: any }> => {
    const res = await api.get('/purchase-requests', { params });
    return list<PurchaseRequest>(res);
  },
  getById: async (id: string): Promise<PurchaseRequest> => {
    const res = await api.get(`/purchase-requests/${id}`);
    return item<PurchaseRequest>(res);
  },
  create: async (data: any): Promise<PurchaseRequest> => {
    const res = await api.post('/purchase-requests', data);
    return item<PurchaseRequest>(res);
  },
  update: async (id: string, data: any): Promise<PurchaseRequest> => {
    const res = await api.put(`/purchase-requests/${id}`, data);
    return item<PurchaseRequest>(res);
  },
  submit: (id: string) => api.post(`/purchase-requests/${id}/submit`),
  approve: (id: string) => api.post(`/purchase-requests/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post(`/purchase-requests/${id}/reject`, { reason }),
};

// ── Purchase Orders ───────────────────────────────────────────────────────────

export const purchaseOrderApi = {
  getAll: async (params?: any): Promise<{ items: PurchaseOrder[]; pagination: any }> => {
    const res = await api.get('/purchase-orders', { params });
    return list<PurchaseOrder>(res);
  },
  getById: async (id: string): Promise<PurchaseOrder> => {
    const res = await api.get(`/purchase-orders/${id}`);
    return item<PurchaseOrder>(res);
  },
  create: async (data: any): Promise<PurchaseOrder> => {
    const res = await api.post('/purchase-orders', data);
    return item<PurchaseOrder>(res);
  },
  update: async (id: string, data: any): Promise<PurchaseOrder> => {
    const res = await api.put(`/purchase-orders/${id}`, data);
    return item<PurchaseOrder>(res);
  },
};

// ── Contracts ─────────────────────────────────────────────────────────────────

export const contractApi = {
  getAll: async (params?: any): Promise<{ items: Contract[]; pagination: any }> => {
    const res = await api.get('/contracts', { params });
    return list<Contract>(res);
  },
  getById: async (id: string): Promise<Contract> => {
    const res = await api.get(`/contracts/${id}`);
    return item<Contract>(res);
  },
  create: async (data: any): Promise<Contract> => {
    const res = await api.post('/contracts', data);
    return item<Contract>(res);
  },
  update: async (id: string, data: any): Promise<Contract> => {
    const res = await api.put(`/contracts/${id}`, data);
    return item<Contract>(res);
  },
  getExpiring: async (): Promise<Contract[]> => {
    const res = await api.get('/contracts/expiring');
    const payload = res.data?.data;
    return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  },
};

// ── Invoices ──────────────────────────────────────────────────────────────────

export const invoiceApi = {
  getAll: async (params?: any): Promise<{ items: Invoice[]; pagination: any }> => {
    const res = await api.get('/invoices', { params });
    return list<Invoice>(res);
  },
  getById: async (id: string): Promise<Invoice> => {
    const res = await api.get(`/invoices/${id}`);
    return item<Invoice>(res);
  },
  create: async (data: any): Promise<Invoice> => {
    const res = await api.post('/invoices', data);
    return item<Invoice>(res);
  },
  update: async (id: string, data: any): Promise<Invoice> => {
    const res = await api.put(`/invoices/${id}`, data);
    return item<Invoice>(res);
  },
  approve: (id: string) => api.post(`/invoices/${id}/approve`),
  markAsPaid: (id: string, paymentMethod: string) =>
    api.post(`/invoices/${id}/pay`, { paymentMethod }),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  generatePdf: async (id: string): Promise<{ url: string; fileName: string }> => {
    const res = await api.post(`/invoices/${id}/pdf`);
    return item<{ url: string; fileName: string }>(res);
  },
  getStats: async (): Promise<any> => {
    const res = await api.get('/invoices/stats');
    return item<any>(res);
  },
  getDashboard: async (params?: any): Promise<any> => {
    const res = await api.get('/invoices/dashboard', { params });
    return item<any>(res);
  },
};

// ── Payments ──────────────────────────────────────────────────────────────────

export const paymentApi = {
  getAll: async (params?: any): Promise<{ items: any[]; pagination: any }> => {
    const res = await api.get('/payments', { params });
    return list<any>(res);
  },
  getById: async (id: string): Promise<any> => {
    const res = await api.get(`/payments/${id}`);
    return item<any>(res);
  },
  create: async (data: any): Promise<any> => {
    const res = await api.post('/payments', data);
    return item<any>(res);
  },
  getStats: async (): Promise<any> => {
    const res = await api.get('/payments/stats');
    return item<any>(res);
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationApi = {
  getAll: async (params?: any): Promise<{ items: Notification[]; pagination: any }> => {
    const res = await api.get('/notifications', { params });
    return list<Notification>(res);
  },
  getUnreadCount: async (): Promise<number> => {
    const res = await api.get('/notifications/unread-count');
    const payload = item<{ count: number }>(res);
    return payload?.count ?? 0;
  },
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

export const auditApi = {
  getAll: async (params?: any): Promise<{ items: AuditLog[]; pagination: any }> => {
    const res = await api.get('/audit-logs', { params });
    return list<AuditLog>(res);
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get('/users');
    const payload = res.data?.data;
    return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  },
  getById: async (id: string): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    return item<User>(res);
  },
  // Admin-only — there is no public registration route.
  create: async (data: any): Promise<User> => {
    const res = await api.post('/users', data);
    return item<User>(res);
  },
  update: async (id: string, data: any): Promise<User> => {
    const res = await api.put(`/users/${id}`, data);
    return item<User>(res);
  },
  delete: (id: string) => api.delete(`/users/${id}`),
};

// ── Documents ─────────────────────────────────────────────────────────────────

export const documentApi = {
  upload: async (formData: FormData): Promise<Document> => {
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return item<Document>(res);
  },
  getAll: async (params?: any): Promise<{ items: Document[]; pagination: any }> => {
    const res = await api.get('/documents', { params });
    return list<Document>(res);
  },
  getDownloadUrl: async (id: string): Promise<{ url: string; fileName: string }> => {
    const res = await api.get(`/documents/${id}/download`);
    return item<{ url: string; fileName: string }>(res);
  },
  delete: (id: string) => api.delete(`/documents/${id}`),
};

// ── Customers ─────────────────────────────────────────────────────────────────

export const customerApi = {
  getAll: async (params?: any): Promise<{ items: any[]; pagination: any }> => {
    const res = await api.get('/customers', { params });
    return list<any>(res);
  },
  getById: async (id: string): Promise<any> => {
    const res = await api.get(`/customers/${id}`);
    return item<any>(res);
  },
  create: async (data: any): Promise<any> => {
    const res = await api.post('/customers', data);
    return item<any>(res);
  },
  update: async (id: string, data: any): Promise<any> => {
    const res = await api.put(`/customers/${id}`, data);
    return item<any>(res);
  },
  delete: (id: string) => api.delete(`/customers/${id}`),
  getStats: async (): Promise<any> => {
    const res = await api.get('/customers/stats');
    return item<any>(res);
  },
};

// ── Reports ───────────────────────────────────────────────────────────────────

// Reports are likewise composed CLIENT-SIDE from each service's list endpoint
// (replaces the old gateway /reports/* controllers).
const groupBy = (items: any[], key: (x: any) => string, init: () => any, acc: (a: any, x: any) => void) => {
  const m: Record<string, any> = {};
  items.forEach(x => { const k = key(x); if (!m[k]) m[k] = { _id: k, ...init() }; acc(m[k], x); });
  return Object.values(m);
};

export const reportApi = {
  vendor: async (): Promise<{ data: any[]; summary: any[] }> => {
    const vendors = arr(await api.get('/vendors', { params: { limit: 1000 } }));
    const data = vendors.map((v: any) => ({ _id: v._id, vendorName: v.vendorName, vendorCode: v.vendorCode, status: v.status, rating: v.rating, country: v.address?.country, createdAt: v.createdAt }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const summaryRaw = groupBy(vendors, v => v.status, () => ({ count: 0, totalRating: 0 }), (a, v) => { a.count++; a.totalRating += v.rating || 0; });
    const summary = summaryRaw.map((s: any) => ({ _id: s._id, count: s.count, avgRating: s.count ? s.totalRating / s.count : 0 }));
    return { data, summary };
  },
  procurement: async (params?: any): Promise<{ data: any[]; summary: any[] }> => {
    let prs = arr(await api.get('/purchase-requests', { params: { limit: 1000, department: params?.department } }));
    if (params?.startDate && params?.endDate) {
      const s = new Date(params.startDate).getTime(), e = new Date(params.endDate).getTime();
      prs = prs.filter((r: any) => { const t = new Date(r.createdAt).getTime(); return t >= s && t <= e; });
    }
    const data = [...prs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const summary = groupBy(prs, r => r.department, () => ({ totalRequests: 0, approvedRequests: 0, totalValue: 0 }), (a, r) => { a.totalRequests++; if (r.status === 'approved') a.approvedRequests++; a.totalValue += r.estimatedCost || 0; });
    return { data, summary };
  },
  invoice: async (params?: any): Promise<{ data: any[]; summary: any[] }> => {
    let invs = arr(await api.get('/invoices', { params: { limit: 1000, status: params?.status } }));
    if (params?.startDate && params?.endDate) {
      const s = new Date(params.startDate).getTime(), e = new Date(params.endDate).getTime();
      invs = invs.filter((r: any) => { const t = new Date(r.createdAt).getTime(); return t >= s && t <= e; });
    }
    const data = [...invs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const summary = groupBy(invs, i => i.status, () => ({ count: 0, totalAmount: 0, totalTax: 0 }), (a, i) => { a.count++; a.totalAmount += i.totalAmount || 0; a.totalTax += i.tax || 0; });
    return { data, summary };
  },
  contract: async (): Promise<{ data: any[]; summary: any[] }> => {
    const contracts = arr(await api.get('/contracts', { params: { limit: 1000 } }));
    const data = [...contracts].sort((a, b) => (a.expiryDate ? new Date(a.expiryDate).getTime() : 0) - (b.expiryDate ? new Date(b.expiryDate).getTime() : 0));
    const summary = groupBy(contracts, c => c.status, () => ({ count: 0, totalValue: 0 }), (a, c) => { a.count++; a.totalValue += c.contractValue || 0; });
    return { data, summary };
  },
};

// ── Purchases (vendor-invoice ledger) ─────────────────────────────────────────

export const purchaseApi = {
  getAll: async (params?: any): Promise<{ purchases: any[]; total: number; totalPurchases: number; invoiceValue: number; totalTds: number }> => {
    const res = await api.get('/purchases', { params });
    return item<any>(res);
  },
  getById: async (id: string): Promise<any> => {
    const res = await api.get(`/purchases/${id}`);
    return item<any>(res);
  },
  create: async (data: any): Promise<any> => {
    const res = await api.post('/purchases', data);
    return item<any>(res);
  },
  delete: (id: string) => api.delete(`/purchases/${id}`),
};

// ── Issuer Profiles (fixed letterhead/bank/signature per invoice template) ──

export const issuerProfileApi = {
  getAll: async (): Promise<any[]> => {
    const res = await api.get('/issuer-profiles');
    return item<any[]>(res);
  },
  upsert: async (type: 'individual' | 'beulix', data: any): Promise<any> => {
    const res = await api.put(`/issuer-profiles/${type}`, data);
    return item<any>(res);
  },
};

// ── HR API ────────────────────────────────────────────────────────────────────

export const hrApi = {
  // Employees
  employees: {
    getAll: async (params?: any) => { const res = await api.get('/hr/employees', { params }); return list<any>(res); },
    getById: async (id: string) => { const res = await api.get(`/hr/employees/${id}`); return item<any>(res); },
    create: async (data: any) => { const res = await api.post('/hr/employees', data); return item<any>(res); },
    update: async (id: string, data: any) => { const res = await api.put(`/hr/employees/${id}`, data); return item<any>(res); },
    delete: (id: string) => api.delete(`/hr/employees/${id}`),
    getStats: async () => { const res = await api.get('/hr/employees/stats'); return item<any>(res); },
  },

  // Attendance
  attendance: {
    getAll: async (params?: any) => { const res = await api.get('/hr/attendance', { params }); return list<any>(res); },
    getMy: async (params?: any) => { const res = await api.get('/hr/attendance/my', { params }); return (res.data?.data || res.data) as any[]; },
    getSummary: async (params?: any) => { const res = await api.get('/hr/attendance/summary', { params }); return item<any>(res); },
    checkIn: async (data: { photoBase64?: string; latitude?: number; longitude?: number; address?: string; notes?: string }) => {
      const res = await api.post('/hr/attendance/checkin', data);
      return item<any>(res);
    },
    checkOut: async () => { const res = await api.post('/hr/attendance/checkout', {}); return item<any>(res); },
  },

  // Payroll
  payroll: {
    getAll: async (params?: any) => { const res = await api.get('/hr/payroll', { params }); return list<any>(res); },
    getById: async (id: string) => { const res = await api.get(`/hr/payroll/${id}`); return item<any>(res); },
    generate: async (data: any) => { const res = await api.post('/hr/payroll/generate', data); return item<any>(res); },
    markPaid: async (id: string) => { const res = await api.post(`/hr/payroll/${id}/mark-paid`, {}); return item<any>(res); },
    generatePdf: async (id: string) => { const res = await api.post(`/hr/payroll/${id}/pdf`, {}); return item<any>(res); },
  },

  // Letters & Certificates
  letters: {
    getAll: async (params?: any) => { const res = await api.get('/hr/letters', { params }); return list<any>(res); },
    getById: async (id: string) => { const res = await api.get(`/hr/letters/${id}`); return item<any>(res); },
    create: async (data: any) => { const res = await api.post('/hr/letters', data); return item<any>(res); },
    delete: (id: string) => api.delete(`/hr/letters/${id}`),
    generatePdf: async (id: string) => { const res = await api.post(`/hr/letters/${id}/pdf`, {}); return item<any>(res); },
  },
};

