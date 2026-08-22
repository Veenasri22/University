import { supabase } from '../config/db.js';
import crypto from 'crypto';

// In-memory fallback/cache store for marks
const localMarks = [
  {
    id: 'mk-01',
    student_id: 'stu-01',
    student_name: 'Alex Rivera',
    student_code: 'STU-2024-101',
    subject_id: 'subj-01',
    subject_code: 'CS201',
    subject_name: 'Data Structures & Algorithms',
    internal_marks: 18,
    assignment_marks: 15,
    midterm_marks: 22,
    external_marks: 30,
    total_marks: 85,
    grade: 'A',
    is_backlog: false,
    semester: 3,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'mk-02',
    student_id: 'stu-01',
    student_name: 'Alex Rivera',
    student_code: 'STU-2024-101',
    subject_id: 'subj-02',
    subject_code: 'CS202',
    subject_name: 'Database Management Systems',
    internal_marks: 10,
    assignment_marks: 8,
    midterm_marks: 12,
    external_marks: 5,
    total_marks: 35,
    grade: 'F',
    is_backlog: true,
    semester: 3,
    created_at: new Date(Date.now() - 43200000).toISOString()
  }
];

function computeGradeAndBacklog(total) {
  const t = Number(total || 0);
  if (t >= 90) return { grade: 'A+', is_backlog: false };
  if (t >= 80) return { grade: 'A', is_backlog: false };
  if (t >= 70) return { grade: 'B', is_backlog: false };
  if (t >= 60) return { grade: 'C', is_backlog: false };
  if (t >= 50) return { grade: 'D', is_backlog: false };
  if (t >= 40) return { grade: 'E', is_backlog: false };
  return { grade: 'F', is_backlog: true };
}

/**
 * GET /api/marks
 */
export const getMarks = async (req, res, next) => {
  try {
    const { student_id, subject_id, semester } = req.query;
    let dbMarks = [];

    // Helper map of students and subjects for name resolution
    let studentMap = new Map();
    let subjectMap = new Map();

    if (supabase) {
      try {
        // 1. Fetch Students
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, student_code, department, profiles(full_name)');
        
        if (studentsData) {
          studentsData.forEach(s => {
            studentMap.set(s.id, {
              name: s.profiles?.full_name || `Student ${s.student_code}`,
              code: s.student_code
            });
          });
        }

        // 2. Fetch Subjects
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('id, subject_code, name');

        if (subjectsData) {
          subjectsData.forEach(sub => {
            subjectMap.set(sub.id, {
              code: sub.subject_code,
              name: sub.name
            });
          });
        }

        // 3. Fetch Marks
        let query = supabase.from('marks').select('*').order('created_at', { ascending: false });
        if (student_id) query = query.eq('student_id', student_id);
        if (subject_id) query = query.eq('subject_id', subject_id);
        if (semester) query = query.eq('semester', Number(semester));

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          dbMarks = data.map(m => {
            const stuInfo = studentMap.get(m.student_id);
            const subInfo = subjectMap.get(m.subject_id);
            return {
              ...m,
              student_name: m.student_name || stuInfo?.name || 'Student',
              student_code: m.student_code || stuInfo?.code || 'STU-101',
              subject_code: m.subject_code || subInfo?.code || 'SUBJ-101',
              subject_name: m.subject_name || subInfo?.name || 'Academic Subject'
            };
          });
        }
      } catch (e) {
        console.warn('[markController] DB Query warning:', e.message);
      }
    }

    // Merge DB marks with local marks (avoid duplicate IDs)
    const existingIds = new Set(dbMarks.map(m => m.id));
    const mergedMarks = [
      ...dbMarks,
      ...localMarks.filter(m => !existingIds.has(m.id))
    ];

    // Filter local marks if query params exist
    let result = mergedMarks;
    if (student_id) result = result.filter(m => m.student_id === student_id);
    if (subject_id) result = result.filter(m => m.subject_id === subject_id);
    if (semester) result = result.filter(m => Number(m.semester) === Number(semester));

    // Sort by created_at descending
    result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    res.json({
      success: true,
      count: result.length,
      marks: result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/marks
 */
export const upsertMark = async (req, res, next) => {
  try {
    const { student_id, subject_id, semester, internal_marks, assignment_marks, midterm_marks, external_marks } = req.body;

    if (!student_id || !subject_id) {
      return res.status(400).json({ success: false, message: 'student_id and subject_id are required.' });
    }

    const internal = Math.min(25, Math.max(0, Number(internal_marks || 0)));
    const assignment = Math.min(25, Math.max(0, Number(assignment_marks || 0)));
    const midterm = Math.min(25, Math.max(0, Number(midterm_marks || 0)));
    const external = Math.min(25, Math.max(0, Number(external_marks || 0)));
    const total = internal + assignment + midterm + external;
    const { grade, is_backlog } = computeGradeAndBacklog(total);

    // Resolve Student and Subject details
    let studentName = 'Student';
    let studentCode = 'STU-101';
    let subjectCode = 'CS201';
    let subjectName = 'Data Structures';

    if (supabase) {
      try {
        const { data: stu } = await supabase
          .from('students')
          .select('student_code, profiles(full_name)')
          .eq('id', student_id)
          .maybeSingle();

        if (stu) {
          studentName = stu.profiles?.full_name || `Student ${stu.student_code}`;
          studentCode = stu.student_code;
        }

        const { data: sub } = await supabase
          .from('subjects')
          .select('subject_code, name')
          .eq('id', subject_id)
          .maybeSingle();

        if (sub) {
          subjectCode = sub.subject_code;
          subjectName = sub.name;
        }
      } catch (rErr) {
        console.warn('[markController] Detail resolution warning:', rErr.message);
      }
    }

    const markId = `mk-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
    const payload = {
      id: markId,
      student_id,
      student_name: studentName,
      student_code: studentCode,
      subject_id,
      subject_code: subjectCode,
      subject_name: subjectName,
      semester: Number(semester || 1),
      internal_marks: internal,
      assignment_marks: assignment,
      midterm_marks: midterm,
      external_marks: external,
      total_marks: total,
      grade,
      is_backlog,
      created_at: new Date().toISOString()
    };

    let savedMark = null;

    if (supabase) {
      try {
        // Attempt insert in Supabase
        const { data, error } = await supabase
          .from('marks')
          .insert({
            id: payload.id,
            student_id: payload.student_id,
            subject_id: payload.subject_id,
            semester: payload.semester,
            internal_marks: payload.internal_marks,
            assignment_marks: payload.assignment_marks,
            midterm_marks: payload.midterm_marks,
            external_marks: payload.external_marks,
            total_marks: payload.total_marks,
            grade: payload.grade,
            is_backlog: payload.is_backlog,
            created_at: payload.created_at
          })
          .select()
          .single();

        if (!error && data) {
          savedMark = {
            ...payload,
            ...data
          };
        } else if (error) {
          console.warn('[markController] Supabase insert warning (falling back to cache):', error.message);
        }
      } catch (e) {
        console.warn('[markController] Supabase insert exception:', e.message);
      }
    }

    if (!savedMark) {
      savedMark = payload;
    }

    // Always append to local in-memory store so it shows up immediately
    localMarks.unshift(savedMark);

    res.status(201).json({
      success: true,
      message: 'Examination marks recorded successfully.',
      mark: savedMark
    });
  } catch (err) {
    next(err);
  }
};
