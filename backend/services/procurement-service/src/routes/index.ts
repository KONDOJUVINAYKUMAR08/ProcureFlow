import { Router } from 'express';
import vendorRoutes from './vendor.routes';
import purchaseRequestRoutes from './purchaseRequest.routes';
import purchaseOrderRoutes from './purchaseOrder.routes';
import contractRoutes from './contract.routes';

const router: import('express').Router = Router();

router.use(vendorRoutes);
router.use(purchaseRequestRoutes);
router.use(purchaseOrderRoutes);
router.use(contractRoutes);

export default router;
