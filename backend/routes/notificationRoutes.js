import express from 'express';
import { getNotifications, createNotification, markAsRead } from '../controllers/notificationController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getNotifications);
router.post('/', authorizeRoles('ADMIN', 'SUPER_ADMIN', 'DEAN', 'HOD', 'FACULTY'), createNotification);
router.patch('/:id/read', markAsRead);

export default router;
