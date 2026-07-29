import express from 'express';
import { getFaculty, getFacultyInsights } from '../controllers/facultyController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getFaculty);
router.get('/insights', getFacultyInsights);

export default router;
