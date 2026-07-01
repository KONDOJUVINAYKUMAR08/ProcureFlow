import { Router } from 'express';
import contractController from '../controllers/contract.controller';
import { authenticate, authorize, validate, auditLog } from '@procurement/middleware';
import { contractSchema } from '../validators';
import { ROLES } from '@procurement/types';

const router: import('express').Router = Router();

router.use(authenticate);

router.get('/contracts', contractController.findAll);
router.get('/contracts/stats', contractController.getStats);
router.get('/contracts/expiring', contractController.getExpiring);
router.get('/contracts/:id', contractController.findById);
router.post('/contracts', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), validate(contractSchema), auditLog('create', 'contract'), contractController.create);
router.put('/contracts/:id', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), auditLog('update', 'contract'), contractController.update);

export default router;
