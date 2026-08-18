import { supabase } from '../config/db.js';
import { mockStore } from '../services/mockStore.js';

export const getCourses = async (req, res, next) => {
  try {
    const { department } = req.query;

    let courses = [];

    if (supabase) {
      try {
        let query = supabase.from('courses').select('*').order('created_at', { ascending: false });

        if (department && department !== 'ALL') {
          query = query.eq('department', department);
        }

        const { data, error } = await query;
        if (!error && data) {
          courses = data;
        }
      } catch (err) {
        console.warn('[courseController] Supabase fetch courses warning:', err.message);
      }
    }

    if (courses.length === 0) {
      courses = [...mockStore.courses];
      if (department && department !== 'ALL') {
        courses = courses.filter(c => c.department === department);
      }
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

    let currentCourse = null;

    if (supabase) {
      try {
        const { data } = await supabase
          .from('courses')
          .select('*')
          .or(`id.eq.${id},course_code.eq.${id}`)
          .maybeSingle();

        if (data) currentCourse = data;
      } catch (err) {
        console.warn('[courseController] Fetch course warning:', err.message);
      }
    }

    if (!currentCourse) {
      const found = mockStore.courses.find(c => c.id === id || c.course_code === id);
      if (found) currentCourse = found;
    }

    if (!currentCourse) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let updatedProgress = currentCourse.syllabus_progress;
    if (syllabus_progress !== undefined) {
      updatedProgress = Math.min(100, Math.max(0, Number(syllabus_progress)));
    }

    let updatedOutcomes = [...(currentCourse.learning_outcomes || [])];
    if (outcome_index !== undefined && updatedOutcomes[outcome_index]) {
      updatedOutcomes[outcome_index] = {
        ...updatedOutcomes[outcome_index],
        completed: !updatedOutcomes[outcome_index].completed
      };
    }

    let finalCourse = {
      ...currentCourse,
      syllabus_progress: updatedProgress,
      learning_outcomes: updatedOutcomes
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .update({
            syllabus_progress: updatedProgress,
            learning_outcomes: updatedOutcomes
          })
          .eq('id', currentCourse.id)
          .select()
          .single();

        if (!error && data) {
          finalCourse = data;
          console.log('[Supabase] Updated course progress:', data.id);
        } else if (error) {
          console.error('[Supabase] Update course error:', error.message);
        }
      } catch (err) {
        console.warn('[courseController] Supabase update course fallback:', err.message);
      }
    }

    // Keep mockStore synced
    const mockIdx = mockStore.courses.findIndex(c => c.id === id || c.course_code === id);
    if (mockIdx !== -1) {
      mockStore.courses[mockIdx] = finalCourse;
    }

    res.json({
      success: true,
      message: 'Course curriculum progress updated and saved to Supabase',
      course: finalCourse
    });
  } catch (err) {
    next(err);
  }
};
