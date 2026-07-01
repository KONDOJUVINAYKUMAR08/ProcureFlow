import { Router } from 'express';
import vendorController from '../controllers/vendor.controller';
import { authenticate, authorize, auditLog, validate } from '@procurement/middleware';
import { vendorSchema } from '../validators';
import { ROLES } from '@procurement/types';

const router: import('express').Router = Router();

router.use(authenticate);

router.get('/vendors', vendorController.findAll);
router.get('/vendors/stats', vendorController.getStats);
router.get('/vendors/:id', vendorController.findById);
router.post('/vendors', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), auditLog('create', 'vendor'), validate(vendorSchema), vendorController.create);
router.put('/vendors/:id', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), auditLog('update', 'vendor'), vendorController.update);
router.delete('/vendors/:id', authorize(ROLES.ADMIN), auditLog('delete', 'vendor'), vendorController.delete);

export default router;
