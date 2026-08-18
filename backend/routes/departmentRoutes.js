import express from 'express';
import { getDepartments, createDepartment } from '../controllers/departmentController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getDepartments);
router.post('/', authorizeRoles('ADMIN', 'SUPER_ADMIN', 'DEAN', 'HOD'), createDepartment);

export default router;
