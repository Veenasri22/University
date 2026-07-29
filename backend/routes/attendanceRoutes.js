import express from 'express';
import { getAttendanceLogs, logAttendance } from '../controllers/attendanceController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getAttendanceLogs);
router.post('/', authorizeRoles('SUPER_ADMIN', 'DEAN', 'FACULTY'), logAttendance);

export default router;
