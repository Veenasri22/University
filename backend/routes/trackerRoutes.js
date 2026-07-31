import express from 'express';
import {
  getStudentTracker,
  getFacultyTracker,
  updateSyllabusTopic
} from '../controllers/trackerController.js';

const router = express.Router();

// Student performance metrics and syllabus tracker
router.get('/student/:studentId', getStudentTracker);

// Faculty syllabus management and class attendance stats
router.get('/faculty/:facultyId', getFacultyTracker);

// Faculty syllabus topic completion update
router.post('/syllabus/update', updateSyllabusTopic);

export default router;
