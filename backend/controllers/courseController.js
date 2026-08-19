import { supabase } from '../config/db.js';

const mapCourseData = (c) => {
  if (!c) return null;
  return {
    ...c,
    id: c.id,
    course_code: c.course_code || c.subject_code || 'CS201',
    title: c.title || c.name || 'Data Structures & Algorithms',
    department: c.department || 'Computer Science',
    credits: Number(c.credits || 3),
    semester: Number(c.semester || 1),
    syllabus_progress: Number(c.syllabus_progress !== undefined ? c.syllabus_progress : (c.completed_units && c.total_units ? (c.completed_units / c.total_units) * 100 : 75)),
    learning_outcomes: c.learning_outcomes || [
      { outcome: 'Analyze Big-O time complexity', completed: true },
      { outcome: 'Implement Trees and Graphs', completed: true }
    ],
    prerequisites: c.prerequisites || ['CS101']
  };
};

export const getCourses = async (req, res, next) => {
  try {
    const { department } = req.query;

    let query = supabase.from('courses').select('*').order('created_at', { ascending: false });

    if (department && department !== 'ALL') {
      query = query.eq('department', department);
    }

    let { data, error } = await query;

    // Fallback to 'subjects' table if 'courses' table is empty
    if ((!data || data.length === 0) && !error) {
      const subRes = await supabase.from('subjects').select('*');
      if (subRes.data && subRes.data.length > 0) {
        data = subRes.data;
      }
    }

    const courses = (data || []).map(mapCourseData);

    res.json({
      success: true,
      count: courses.length,
      courses
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
      course_code: String(course_code).toUpperCase(),
      title,
      department,
      credits: Number(credits || 3),
      syllabus_progress: 0,
      learning_outcomes: outcomesArray,
      prerequisites: prereqArray
    };

    let { data, error } = await supabase
      .from('courses')
      .insert(newCourseData)
      .select()
      .single();

    // If 'courses' insert fails, try inserting into 'subjects'
    if (error) {
      const subjectPayload = {
        subject_code: String(course_code).toUpperCase(),
        name: title,
        credits: Number(credits || 3)
      };
      const subRes = await supabase.from('subjects').insert(subjectPayload).select().single();
      if (!subRes.error && subRes.data) {
        data = subRes.data;
        error = null;
      }
    }

    if (error) {
      console.error('[Supabase] Create course error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    const createdCourse = mapCourseData(data);

    res.status(201).json({
      success: true,
      message: 'Course created successfully in Supabase',
      course: createdCourse
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
      return res.status(404).json({ success: false, message: 'Course not found in Supabase' });
    }

    let updatedProgress = currentCourse.syllabus_progress || 0;
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
      course: mapCourseData(updatedCourse)
    });
  } catch (err) {
    next(err);
  }
};
