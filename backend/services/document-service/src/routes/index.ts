import { Router } from 'express';
import documentController, { uploadMiddleware } from '../controllers/document.controller';
import auditController from '../controllers/audit.controller';
import notificationController from '../controllers/notification.controller';
import { authenticate, authorize } from '@procurement/middleware';
import { ROLES } from '@procurement/types';

const router: import('express').Router = Router();

router.use(authenticate);

// Document Routes
router.get('/documents', documentController.findAll);
router.post('/documents/upload', uploadMiddleware, documentController.upload);
router.get('/documents/:id/download', documentController.getDownloadUrl);
router.get('/documents/:id/file', documentController.getFile);
router.delete('/documents/:id', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE), documentController.delete);

// Audit Routes
router.get('/audit', authorize(ROLES.ADMIN, ROLES.AUDITOR), auditController.findAll);
// Backward compatibility redirect for old route
router.get('/audit-logs', authorize(ROLES.ADMIN, ROLES.AUDITOR), (req, res) => {
  res.redirect(301, `/api/audit${req.url.replace('/audit-logs', '')}`);
});

// Notification Routes
router.get('/notifications', notificationController.findAll);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);

export default router;
