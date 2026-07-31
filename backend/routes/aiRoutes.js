import express from 'express';
import {
  // New spec-compliant AI endpoints
  handlePredictPerformance,
  handleAdvisorRecommendations,
  handleFacultyInsights,
  handleExecutiveReport,
  handleDiagnosticQuestions,
  getAiReports,
  verifyAiReport,
  handleGetAuditLogs,
  // Legacy handlers
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

// ─── Public/Unauthenticated AI Assistant ──────────────────────────────────────
router.post('/generate-advisory', handleGenerateAdvisory);
router.post('/ask', handleAskAi);
router.get('/sessions', getAiSessions);
router.get('/sessions/:sessionId/messages', getSessionMessages);

// ─── Authenticated AI Routes ──────────────────────────────────────────────────
router.use(authenticateToken);

// Core AI Prediction & Advisory Engine (Spec §12 — /api/ai/*)
router.post('/predict-performance', aiLimiter, handlePredictPerformance);
router.post('/advisor-recommendations', aiLimiter, handleAdvisorRecommendations);
router.post('/faculty-insights', aiLimiter, handleFacultyInsights);
router.post('/executive-report', aiLimiter, handleExecutiveReport);
router.post('/diagnostic-questions', aiLimiter, handleDiagnosticQuestions);

// AI Report History & Verification
router.get('/reports', getAiReports);
router.patch('/reports/:id/verify', authorizeRoles('SUPER_ADMIN', 'DEAN', 'Admin'), verifyAiReport);

// Audit Logs (Admin Only)
router.get('/audit-logs', authorizeRoles('SUPER_ADMIN', 'DEAN', 'Admin'), handleGetAuditLogs);

// Multi-Agent Advisor Chat
router.post('/advisor-chat', aiLimiter, handleAdvisorChat);

// Policy RAG
router.post('/policy-search', aiLimiter, handlePolicySearch);
router.post('/policy-upload', authorizeRoles('SUPER_ADMIN', 'DEAN', 'Admin'), handlePolicyUpload);

// MCP Calendar/Email
router.post('/schedule-meeting', scheduleMeetingDirect);

export default router;
