import { supabase } from '../config/db.js';

export const getCourses = async (req, res, next) => {
  try {
    const { department } = req.query;

    let query = supabase.from('courses').select('*').order('created_at', { ascending: false });

    if (department && department !== 'ALL') {
      query = query.eq('department', department);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[courseController] Supabase fetch error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({
      success: true,
      count: (data || []).length,
      courses: data || []
    });
  } catch (err) {
    next(err);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { course_code, title, department, credits, prerequisites, learning_outcomes } = req.body;

    if (!course_code || !title || !department) {
      return res.status(400).json({ success: false, message: 'Course code, title, and department are required.' });
    }

    const prereqArray = Array.isArray(prerequisites)
      ? prerequisites
      : (prerequisites ? String(prerequisites).split(',').map(p => p.trim()) : []);

    const outcomesArray = Array.isArray(learning_outcomes)
      ? learning_outcomes
      : (typeof learning_outcomes === 'string'
          ? learning_outcomes.split(',').map(o => ({ outcome: o.trim(), completed: false }))
          : []);

    const newCourseData = {
      id: `crs-${Date.now().toString().slice(-4)}`,
      course_code: String(course_code).toUpperCase(),
      title,
      department,
      credits: Number(credits || 3),
      syllabus_progress: 0,
      learning_outcomes: outcomesArray,
      prerequisites: prereqArray
    };

    const { data, error } = await supabase
      .from('courses')
      .insert(newCourseData)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Create course error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(201).json({
      success: true,
      message: 'Course created successfully in Supabase',
      course: data
    });
  } catch (err) {
    next(err);
  }
};

export const updateSyllabusProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { syllabus_progress, outcome_index } = req.body;

    const { data: currentCourse, error: fetchErr } = await supabase
      .from('courses')
      .select('*')
      .or(`id.eq.${id},course_code.eq.${id}`)
      .maybeSingle();

    if (fetchErr || !currentCourse) {
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

    const { data: updatedCourse, error: updateErr } = await supabase
      .from('courses')
      .update({
        syllabus_progress: updatedProgress,
        learning_outcomes: updatedOutcomes,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentCourse.id)
      .select()
      .single();

    if (updateErr) {
      console.error('[Supabase] Update course error:', updateErr.message);
      return res.status(500).json({ success: false, message: updateErr.message });
    }

    res.json({
      success: true,
      message: 'Course curriculum progress updated and saved to Supabase',
      course: updatedCourse
    });
  } catch (err) {
    next(err);
  }
};
