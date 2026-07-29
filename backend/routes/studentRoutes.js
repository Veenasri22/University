import express from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudentPerformance,
  triggerStudentRiskPrediction
} from '../controllers/studentController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/', authorizeRoles('SUPER_ADMIN', 'DEAN', 'ACADEMIC_ADVISOR'), createStudent);
router.patch('/:id/performance', authorizeRoles('SUPER_ADMIN', 'DEAN', 'FACULTY', 'ACADEMIC_ADVISOR'), updateStudentPerformance);
router.post('/:id/predict-performance', aiLimiter, triggerStudentRiskPrediction);

export default router;
