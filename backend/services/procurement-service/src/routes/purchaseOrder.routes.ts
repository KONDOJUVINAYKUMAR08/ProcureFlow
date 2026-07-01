import { Router } from 'express';
import purchaseOrderController from '../controllers/purchaseOrder.controller';
import { authenticate, authorize, validate, auditLog } from '@procurement/middleware';
import { purchaseOrderSchema } from '../validators';
import { ROLES } from '@procurement/types';

const router: import('express').Router = Router();

router.use(authenticate);

router.get('/purchase-orders', purchaseOrderController.findAll);
router.get('/purchase-orders/stats', purchaseOrderController.getStats);
router.get('/purchase-orders/:id', purchaseOrderController.findById);
router.post('/purchase-orders', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), validate(purchaseOrderSchema), auditLog('create', 'purchase_order'), purchaseOrderController.create);
router.put('/purchase-orders/:id', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), purchaseOrderController.update);

export default router;
