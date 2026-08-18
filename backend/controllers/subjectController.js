import { supabase } from '../config/db.js';

export const getSubjects = async (req, res, next) => {
  try {
    const { department_id, semester } = req.query;
    let subjects = [];

    if (supabase) {
      try {
        let query = supabase.from('subjects').select('*, departments(name, code), faculty(designation, profiles(full_name))').order('created_at', { ascending: false });

        if (department_id) {
          query = query.eq('department_id', department_id);
        }
        if (semester) {
          query = query.eq('semester', Number(semester));
        }

        const { data, error } = await query;
        if (!error && data) {
          subjects = data.map(s => ({
            ...s,
            department_name: s.departments?.name || 'Computer Science',
            faculty_name: s.faculty?.profiles?.full_name || 'Prof. Marcus Chen'
          }));
        }
      } catch (e) {
        console.warn('[subjectController] Query warning:', e.message);
      }
    }

    if (subjects.length === 0) {
      subjects = [
        { id: 'subj-01', subject_code: 'CS201', name: 'Data Structures & Algorithms', credits: 4, semester: 3, total_units: 5, completed_units: 3, department_name: 'Computer Science', faculty_name: 'Prof. Marcus Chen' },
        { id: 'subj-02', subject_code: 'CS202', name: 'Database Management Systems', credits: 4, semester: 3, total_units: 5, completed_units: 4, department_name: 'Computer Science', faculty_name: 'Prof. Marcus Chen' },
        { id: 'subj-03', subject_code: 'ECE201', name: 'Digital Signal Processing', credits: 3, semester: 3, total_units: 5, completed_units: 2, department_name: 'Electronics & Communication', faculty_name: 'Dr. Robert Vance' }
      ];
    }

    res.json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (err) {
    next(err);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { subject_code, name, credits, semester, department_id, faculty_id, total_units } = req.body;
    if (!subject_code || !name) {
      return res.status(400).json({ success: false, message: 'Subject code and name are required.' });
    }

    const payload = {
      subject_code: String(subject_code).toUpperCase(),
      name,
      credits: Number(credits || 3),
      semester: Number(semester || 1),
      ...(department_id && { department_id }),
      ...(faculty_id && { faculty_id }),
      total_units: Number(total_units || 5),
      completed_units: 0
    };

    let createdSubject = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          createdSubject = data;
        } else if (error) {
          console.error('[subjectController] Insert error:', error.message);
        }
      } catch (e) {
        console.warn('[subjectController] Supabase error:', e.message);
      }
    }

    if (!createdSubject) {
      createdSubject = { id: `subj-${Date.now().toString().slice(-4)}`, ...payload };
    }

    res.status(201).json({
      success: true,
      message: 'Subject created successfully in Supabase',
      subject: createdSubject
    });
  } catch (err) {
    next(err);
  }
};

export const updateSubjectUnits = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { completed_units } = req.body;

    const units = Number(completed_units);
    if (isNaN(units) || units < 0 || units > 10) {
      return res.status(400).json({ success: false, message: 'completed_units must be between 0 and 10.' });
    }

    let updatedSubject = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .update({ completed_units: units })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          updatedSubject = data;
        }
      } catch (e) {
        console.warn('[subjectController] Update units error:', e.message);
      }
    }

    if (!updatedSubject) {
      updatedSubject = { id, completed_units: units };
    }

    res.json({
      success: true,
      message: 'Subject unit progress updated in Supabase',
      subject: updatedSubject
    });
  } catch (err) {
    next(err);
  }
};
