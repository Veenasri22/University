import express from 'express';
import { getCourses, createCourse, updateSyllabusProgress } from '../controllers/courseController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getCourses);
router.post('/', authorizeRoles('SUPER_ADMIN', 'DEAN', 'FACULTY'), createCourse);
router.patch('/:id/progress', authorizeRoles('SUPER_ADMIN', 'DEAN', 'FACULTY'), updateSyllabusProgress);

export default router;
