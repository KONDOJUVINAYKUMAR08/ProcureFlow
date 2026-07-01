import { Router } from 'express';
import purchaseRequestController from '../controllers/purchaseRequest.controller';
import { authenticate, authorize, auditLog, validate } from '@procurement/middleware';
import { purchaseRequestSchema } from '../validators';
import { ROLES } from '@procurement/types';

const router: import('express').Router = Router();

router.use(authenticate);

router.get('/purchase-requests', purchaseRequestController.findAll);
router.get('/purchase-requests/stats', purchaseRequestController.getStats);
router.get('/purchase-requests/:id', purchaseRequestController.findById);
router.post('/purchase-requests', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), validate(purchaseRequestSchema), purchaseRequestController.create);
router.put('/purchase-requests/:id', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), purchaseRequestController.update);
router.post('/purchase-requests/:id/submit', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), auditLog('submit', 'purchase_request'), purchaseRequestController.submit);
router.post('/purchase-requests/:id/approve', authorize(ROLES.ADMIN), auditLog('approve', 'purchase_request'), purchaseRequestController.approve);
router.post('/purchase-requests/:id/reject', authorize(ROLES.ADMIN), auditLog('reject', 'purchase_request'), purchaseRequestController.reject);

export default router;
