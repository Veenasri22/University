import express from 'express';
import {
  handleAdvisorChat,
  handlePolicySearch,
  handlePolicyUpload,
  scheduleMeetingDirect,
  handleGenerateAdvisory,
  handleAskAi,
  getAiSessions,
  getSessionMessages
} from '../controllers/aiController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public / Unauthenticated AI Assistant endpoints
router.post('/generate-advisory', handleGenerateAdvisory);
router.post('/ask', handleAskAi);
router.get('/sessions', getAiSessions);
router.get('/sessions/:sessionId/messages', getSessionMessages);

// Authenticated Endpoints
router.use(authenticateToken);
router.post('/advisor-chat', aiLimiter, handleAdvisorChat);
router.post('/policy-search', aiLimiter, handlePolicySearch);
router.post('/policy-upload', authorizeRoles('SUPER_ADMIN', 'DEAN'), handlePolicyUpload);
router.post('/schedule-meeting', scheduleMeetingDirect);

export default router;


