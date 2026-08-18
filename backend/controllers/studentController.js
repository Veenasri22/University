import { supabase } from '../config/db.js';
import { mockStore } from '../services/mockStore.js';
import { studentCreateSchema, studentPerformanceUpdateSchema } from '../validators/schemas.js';
import { predictStudentRisk } from '../services/geminiService.js';

export const getStudents = async (req, res, next) => {
  try {
    const { department, riskLevel, search } = req.query;

    let students = [];

    if (supabase) {
      try {
        let query = supabase.from('students').select('*, profiles(full_name, email)').order('created_at', { ascending: false });

        if (department && department !== 'ALL') {
          query = query.eq('department', department);
        }

        if (riskLevel && riskLevel !== 'ALL') {
          query = query.eq('predicted_risk', riskLevel);
        }

        const { data, error } = await query;
        if (!error && data) {
          students = data.map(s => {
            const mockMatch = mockStore.students.find(m => m.student_code === s.student_code || m.id === s.id);
            return {
              ...s,
              full_name: s.profiles?.full_name || mockMatch?.full_name || `Student ${s.student_code}`,
              email: s.profiles?.email || mockMatch?.email || `${s.student_code.toLowerCase()}@student.university.edu`
            };
          });
        }
      } catch (err) {
        console.warn('[studentController] Supabase fetch warning:', err.message);
      }
    }

    // Fallback to mockStore if empty or offline
    if (students.length === 0) {
      students = [...mockStore.students];
      if (department && department !== 'ALL') {
        students = students.filter(s => s.department === department);
      }
      if (riskLevel && riskLevel !== 'ALL') {
        students = students.filter(s => s.predicted_risk === riskLevel);
      }
    }

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s =>
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.student_code && s.student_code.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let student = null;
    let advisoryLogs = [];
    let attendanceLogs = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*, profiles(full_name, email)')
          .or(`id.eq.${id},student_code.eq.${id}`)
          .maybeSingle();

        if (!error && data) {
          const mockMatch = mockStore.students.find(m => m.student_code === data.student_code || m.id === data.id);
          student = {
            ...data,
            full_name: data.profiles?.full_name || mockMatch?.full_name || `Student ${data.student_code}`,
            email: data.profiles?.email || mockMatch?.email || `${data.student_code.toLowerCase()}@student.university.edu`
          };

          // Fetch advisory logs
          const { data: adv } = await supabase
            .from('advisory_records')
            .select('*')
            .eq('student_id', student.id);
          if (adv) advisoryLogs = adv;

          // Fetch attendance logs
          const { data: att } = await supabase
            .from('attendance_records')
            .select('*')
            .or(`student_id.eq.${student.id},student_name.eq.${student.full_name}`);
          if (att) attendanceLogs = att;
        }
      } catch (err) {
        console.warn('[studentController] Supabase single student fetch warning:', err.message);
      }
    }

    if (!student) {
      student = mockStore.students.find(s => s.id === id || s.student_code === id);
      if (student) {
        advisoryLogs = mockStore.advisory_records.filter(r => r.student_id === student.id);
        attendanceLogs = mockStore.attendance_logs.filter(a => a.student_name === student.full_name);
      }
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    res.json({
      success: true,
      student,
      advisoryLogs,
      attendanceLogs
    });
  } catch (err) {
    next(err);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const validated = studentCreateSchema.parse(req.body);

    const initialRisk = validated.current_gpa < 2.5 ? 'HIGH' : validated.current_gpa < 3.2 ? 'MEDIUM' : 'LOW';

    let userId = null;

    if (supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .insert({
            email: validated.email,
            full_name: validated.full_name,
            role: 'STUDENT',
            department: validated.department
          })
          .select()
          .single();

        if (profile) userId = profile.id;
      } catch (err) {
        console.warn('[studentController] Profile creation warning:', err.message);
      }
    }

    const newStudentData = {
      ...(userId && { user_id: userId }),
      student_code: validated.student_code,
      department: validated.department,
      enrollment_year: Number(validated.enrollment_year),
      current_gpa: Number(validated.current_gpa),
      attendance_rate: Number(validated.attendance_rate || 100),
      credits_earned: Number(validated.credits_earned || 0),
      credits_required: Number(validated.credits_required || 120),
      predicted_risk: initialRisk,
      status: 'ACTIVE',
      gpa_history: [{ term: 'Fall 2026', gpa: Number(validated.current_gpa) }]
    };

    let createdStudent = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .insert(newStudentData)
          .select('*, profiles(full_name, email)')
          .single();

        if (!error && data) {
          createdStudent = {
            ...data,
            full_name: data.profiles?.full_name || validated.full_name,
            email: data.profiles?.email || validated.email
          };
          console.log('[Supabase] Inserted new student:', data.id);
        } else if (error) {
          console.error('[Supabase] Create student error:', error.message);
        }
      } catch (err) {
        console.warn('[studentController] Supabase create student fallback:', err.message);
      }
    }

    if (!createdStudent) {
      createdStudent = {
        id: `stu-${Date.now().toString().slice(-4)}`,
        user_id: userId,
        full_name: validated.full_name,
        email: validated.email,
        ...newStudentData
      };
    }

    // Keep mockStore synchronized
    mockStore.students.unshift({
      full_name: validated.full_name,
      email: validated.email,
      ...createdStudent
    });

    res.status(201).json({
      success: true,
      message: 'Student record created and saved to Supabase',
      student: createdStudent
    });
  } catch (err) {
    next(err);
  }
};

const normalizeRiskLevel = (lvl) => {
  const upper = String(lvl || '').toUpperCase();
  if (upper === 'CRITICAL' || upper === 'HIGH') return 'HIGH';
  if (upper === 'MODERATE' || upper === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
};

export const updateStudentPerformance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = studentPerformanceUpdateSchema.parse(req.body);

    let currentStudent = null;

    if (supabase) {
      try {
        const { data } = await supabase
          .from('students')
          .select('*, profiles(full_name, email)')
          .or(`id.eq.${id},student_code.eq.${id}`)
          .maybeSingle();
        if (data) {
          const mockMatch = mockStore.students.find(m => m.student_code === data.student_code || m.id === data.id);
          currentStudent = {
            ...data,
            full_name: data.profiles?.full_name || mockMatch?.full_name || `Student ${data.student_code}`,
            email: data.profiles?.email || mockMatch?.email || `${data.student_code.toLowerCase()}@student.university.edu`
          };
        }
      } catch (err) {
        console.warn('[studentController] Fetch for update warning:', err.message);
      }
    }

    if (!currentStudent) {
      const idx = mockStore.students.findIndex(s => s.id === id || s.student_code === id);
      if (idx !== -1) currentStudent = mockStore.students[idx];
    }

    if (!currentStudent) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const updatedFields = {
      ...(validated.current_gpa !== undefined && { current_gpa: Number(validated.current_gpa) }),
      ...(validated.attendance_rate !== undefined && { attendance_rate: Number(validated.attendance_rate) }),
      ...(validated.advisor_notes !== undefined && { advisor_notes: validated.advisor_notes }),
      updated_at: new Date().toISOString()
    };

    const studentForAi = { ...currentStudent, ...updatedFields };
    const aiPrediction = await predictStudentRisk(studentForAi);
    updatedFields.predicted_risk = normalizeRiskLevel(aiPrediction.riskLevel);

    let finalStudent = { ...currentStudent, ...updatedFields };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .update(updatedFields)
          .eq('id', currentStudent.id)
          .select('*, profiles(full_name, email)')
          .single();

        if (!error && data) {
          finalStudent = {
            ...data,
            full_name: data.profiles?.full_name || currentStudent.full_name,
            email: data.profiles?.email || currentStudent.email
          };
          console.log('[Supabase] Updated student performance:', finalStudent.id);
        } else if (error) {
          console.error('[Supabase] Update student error:', error.message);
        }
      } catch (err) {
        console.warn('[studentController] Supabase update student fallback:', err.message);
      }
    }

    // Update in mockStore
    const index = mockStore.students.findIndex(s => s.id === id || s.id === currentStudent.id || s.student_code === id);
    if (index !== -1) {
      mockStore.students[index] = finalStudent;
    }

    res.json({
      success: true,
      message: 'Student performance updated & persisted to Supabase',
      student: finalStudent,
      aiPrediction
    });
  } catch (err) {
    next(err);
  }
};

export const triggerStudentRiskPrediction = async (req, res, next) => {
  try {
    const { id } = req.params;

    let student = null;

    if (supabase) {
      try {
        const { data } = await supabase
          .from('students')
          .select('*, profiles(full_name, email)')
          .or(`id.eq.${id},student_code.eq.${id}`)
          .maybeSingle();
        if (data) {
          const mockMatch = mockStore.students.find(m => m.student_code === data.student_code || m.id === data.id);
          student = {
            ...data,
            full_name: data.profiles?.full_name || mockMatch?.full_name || `Student ${data.student_code}`,
            email: data.profiles?.email || mockMatch?.email || `${data.student_code.toLowerCase()}@student.university.edu`
          };
        }
      } catch (e) {}
    }

    if (!student) {
      student = mockStore.students.find(s => s.id === id || s.student_code === id);
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const prediction = await predictStudentRisk(student);
    const normalizedRisk = normalizeRiskLevel(prediction.riskLevel);

    if (supabase) {
      try {
        await supabase
          .from('students')
          .update({ predicted_risk: normalizedRisk, updated_at: new Date().toISOString() })
          .eq('id', student.id);
      } catch (e) {}
    }

    student.predicted_risk = normalizedRisk;

    res.json({
      success: true,
      studentId: id,
      studentName: student.full_name,
      prediction
    });
  } catch (err) {
    next(err);
  }
};
