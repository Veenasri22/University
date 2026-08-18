import express from 'express';
import { getFaculty, createFaculty, getFacultyInsights } from '../controllers/facultyController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getFaculty);
router.post('/', authorizeRoles('SUPER_ADMIN', 'DEAN', 'FACULTY'), createFaculty);
router.get('/insights', getFacultyInsights);

export default router;
