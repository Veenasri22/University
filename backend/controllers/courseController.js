import { mockStore } from '../services/mockStore.js';

export const getCourses = async (req, res, next) => {
  try {
    const { department } = req.query;
    let courses = [...mockStore.courses];

    if (department && department !== 'ALL') {
      courses = courses.filter(c => c.department === department);
    }

    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (err) {
    next(err);
  }
};

export const updateSyllabusProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { syllabus_progress, outcome_index } = req.body;

    const course = mockStore.courses.find(c => c.id === id || c.course_code === id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (syllabus_progress !== undefined) {
      course.syllabus_progress = Math.min(100, Math.max(0, Number(syllabus_progress)));
    }

    if (outcome_index !== undefined && course.learning_outcomes[outcome_index]) {
      course.learning_outcomes[outcome_index].completed = !course.learning_outcomes[outcome_index].completed;
    }

    res.json({
      success: true,
      message: 'Course curriculum progress updated',
      course
    });
  } catch (err) {
    next(err);
  }
};
