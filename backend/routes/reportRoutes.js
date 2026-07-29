import express from 'express';
import { generateReport } from '../controllers/reportController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticateToken);
router.post('/generate', authorizeRoles('SUPER_ADMIN', 'DEAN', 'FACULTY', 'ACADEMIC_ADVISOR'), aiLimiter, generateReport);

export default router;
