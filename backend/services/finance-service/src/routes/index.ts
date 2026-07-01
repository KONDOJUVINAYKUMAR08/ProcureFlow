import { Router } from 'express';
import invoiceController from '../controllers/invoice.controller';
import paymentController from '../controllers/payment.controller';
import customerController from '../controllers/customer.controller';
import purchaseController from '../controllers/purchase.controller';
import issuerProfileController from '../controllers/issuerProfile.controller';
import { authenticate, authorize, validate, auditLog } from '@procurement/middleware';
import { invoiceSchema, paymentSchema, purchaseSchema } from '../validators';
import { ROLES } from '@procurement/types';

const router: Router = Router();

router.use(authenticate);

// ── Invoice Routes ────────────────────────────────────────────────────────────
router.get('/invoices', invoiceController.findAll);
router.get('/invoices/stats', invoiceController.getStats);
router.get('/invoices/dashboard', invoiceController.getDashboard);
router.get('/invoices/export', authorize(ROLES.ADMIN, ROLES.FINANCE), invoiceController.exportExcel);
router.get('/invoices/:id', invoiceController.findById);
router.get('/invoices/:id/file', invoiceController.getFile);
router.post('/invoices', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE), validate(invoiceSchema), auditLog('create', 'invoice'), invoiceController.create);
router.put('/invoices/:id', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE), invoiceController.update);
router.delete('/invoices/:id', authorize(ROLES.ADMIN, ROLES.FINANCE), invoiceController.delete);
router.post('/invoices/:id/approve', authorize(ROLES.ADMIN, ROLES.FINANCE), auditLog('approve', 'invoice'), invoiceController.approve);
router.post('/invoices/:id/pay', authorize(ROLES.ADMIN, ROLES.FINANCE), auditLog('pay', 'invoice'), invoiceController.markAsPaid);
router.post('/invoices/:id/pdf', invoiceController.generatePdf);

// ── Payment Routes ────────────────────────────────────────────────────────────
router.get('/payments', authorize(ROLES.ADMIN, ROLES.FINANCE), paymentController.findAll);
router.get('/payments/stats', authorize(ROLES.ADMIN, ROLES.FINANCE), paymentController.getStats);
router.get('/payments/:id', authorize(ROLES.ADMIN, ROLES.FINANCE), paymentController.findById);
router.post('/payments', authorize(ROLES.ADMIN, ROLES.FINANCE), validate(paymentSchema), auditLog('create', 'payment'), paymentController.create);

// ── Customer Routes ───────────────────────────────────────────────────────────
router.get('/customers', authorize(ROLES.ADMIN, ROLES.FINANCE, ROLES.PROCUREMENT_MANAGER), customerController.findAll);
router.get('/customers/stats', authorize(ROLES.ADMIN, ROLES.FINANCE), customerController.getStats);
router.get('/customers/:id', authorize(ROLES.ADMIN, ROLES.FINANCE, ROLES.PROCUREMENT_MANAGER), customerController.findById);
router.post('/customers', authorize(ROLES.ADMIN, ROLES.FINANCE), auditLog('create', 'customer'), customerController.create);
router.put('/customers/:id', authorize(ROLES.ADMIN, ROLES.FINANCE), customerController.update);
router.delete('/customers/:id', authorize(ROLES.ADMIN), customerController.delete);

// ── Purchases Routes (vendor-invoice ledger) ──────────────────────────────────
router.get('/purchases', authorize(ROLES.ADMIN, ROLES.FINANCE), purchaseController.findAll);
router.get('/purchases/:id', authorize(ROLES.ADMIN, ROLES.FINANCE), purchaseController.findById);
router.post('/purchases', authorize(ROLES.ADMIN, ROLES.FINANCE), validate(purchaseSchema), auditLog('create', 'purchase'), purchaseController.create);
router.delete('/purchases/:id', authorize(ROLES.ADMIN, ROLES.FINANCE), purchaseController.delete);

// ── Issuer Profile Routes (fixed letterhead/bank/signature per template) ─────
router.get('/issuer-profiles', authorize(ROLES.ADMIN), issuerProfileController.findAll);
router.put('/issuer-profiles/:type', authorize(ROLES.ADMIN), issuerProfileController.upsert);

export default router;
