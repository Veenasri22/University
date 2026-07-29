import express from 'express';
import {
  handleAdvisorChat,
  handlePolicySearch,
  handlePolicyUpload,
  scheduleMeetingDirect
} from '../controllers/aiController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticateToken);
router.post('/advisor-chat', aiLimiter, handleAdvisorChat);
router.post('/policy-search', aiLimiter, handlePolicySearch);
router.post('/policy-upload', authorizeRoles('SUPER_ADMIN', 'DEAN'), handlePolicyUpload);
router.post('/schedule-meeting', scheduleMeetingDirect);

export default router;
