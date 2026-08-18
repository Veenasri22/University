import express from 'express';
import { getMarks, upsertMark } from '../controllers/markController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getMarks);
router.post('/', authorizeRoles('ADMIN', 'SUPER_ADMIN', 'DEAN', 'HOD', 'FACULTY'), upsertMark);

export default router;
