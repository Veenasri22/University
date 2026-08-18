import express from 'express';
import { getSubjects, createSubject, updateSubjectUnits } from '../controllers/subjectController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getSubjects);
router.post('/', authorizeRoles('ADMIN', 'SUPER_ADMIN', 'DEAN', 'HOD'), createSubject);
router.patch('/:id/units', authorizeRoles('ADMIN', 'SUPER_ADMIN', 'DEAN', 'HOD', 'FACULTY'), updateSubjectUnits);

export default router;
