import { supabase } from '../config/db.js';
import { studentCreateSchema, studentPerformanceUpdateSchema } from '../validators/schemas.js';
import { predictStudentRisk } from '../services/geminiService.js';

const normalizeRiskLevel = (lvl) => {
  const upper = String(lvl || '').toUpperCase();
  if (upper === 'CRITICAL' || upper === 'HIGH') return 'HIGH';
  if (upper === 'MODERATE' || upper === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
};

export const getStudents = async (req, res, next) => {
  try {
    const { department, riskLevel, search } = req.query;

    let query = supabase
      .from('students')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    if (department && department !== 'ALL') {
      query = query.eq('department', department);
    }

    if (riskLevel && riskLevel !== 'ALL') {
      query = query.eq('predicted_risk', riskLevel);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[studentController] Supabase fetch error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    let students = (data || []).map(s => ({
      ...s,
      full_name: s.profiles?.full_name || s.full_name || `Student ${s.student_code}`,
      email: s.profiles?.email || s.email || `${s.student_code.toLowerCase()}@student.university.edu`
    }));

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

    const { data, error } = await supabase
      .from('students')
      .select('*, profiles(full_name, email)')
      .or(`id.eq.${id},student_code.eq.${id}`)
      .maybeSingle();

    if (error) {
      console.error('[studentController] Supabase single fetch error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const student = {
      ...data,
      full_name: data.profiles?.full_name || data.full_name || `Student ${data.student_code}`,
      email: data.profiles?.email || data.email || `${data.student_code.toLowerCase()}@student.university.edu`
    };

    // Fetch advisory logs
    const { data: adv } = await supabase
      .from('advisory_records')
      .select('*')
      .eq('student_id', student.id);

    // Fetch attendance logs
    const { data: att } = await supabase
      .from('attendance_logs')
      .select('*')
      .or(`student_id.eq.${student.id},student_name.eq.${student.full_name}`);

    res.json({
      success: true,
      student,
      advisoryLogs: adv || [],
      attendanceLogs: att || []
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

    const newStudentData = {
      id: `stu-${Date.now().toString().slice(-4)}`,
      ...(userId && { user_id: userId }),
      student_code: validated.student_code,
      full_name: validated.full_name,
      email: validated.email,
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

    const { data, error } = await supabase
      .from('students')
      .insert(newStudentData)
      .select('*, profiles(full_name, email)')
      .single();

    if (error) {
      console.error('[Supabase] Create student error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    const createdStudent = {
      ...data,
      full_name: data.profiles?.full_name || validated.full_name,
      email: data.profiles?.email || validated.email
    };

    res.status(201).json({
      success: true,
      message: 'Student record created successfully in Supabase',
      student: createdStudent
    });
  } catch (err) {
    next(err);
  }
};

export const updateStudentPerformance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = studentPerformanceUpdateSchema.parse(req.body);

    const { data: currentData, error: fetchErr } = await supabase
      .from('students')
      .select('*, profiles(full_name, email)')
      .or(`id.eq.${id},student_code.eq.${id}`)
      .maybeSingle();

    if (fetchErr || !currentData) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const currentStudent = {
      ...currentData,
      full_name: currentData.profiles?.full_name || currentData.full_name || `Student ${currentData.student_code}`,
      email: currentData.profiles?.email || currentData.email || `${currentData.student_code.toLowerCase()}@student.university.edu`
    };

    const updatedFields = {
      ...(validated.current_gpa !== undefined && { current_gpa: Number(validated.current_gpa) }),
      ...(validated.attendance_rate !== undefined && { attendance_rate: Number(validated.attendance_rate) }),
      ...(validated.advisor_notes !== undefined && { advisor_notes: validated.advisor_notes }),
      updated_at: new Date().toISOString()
    };

    const studentForAi = { ...currentStudent, ...updatedFields };
    const aiPrediction = await predictStudentRisk(studentForAi);
    updatedFields.predicted_risk = normalizeRiskLevel(aiPrediction.riskLevel);

    const { data: updatedData, error: updateErr } = await supabase
      .from('students')
      .update(updatedFields)
      .eq('id', currentStudent.id)
      .select('*, profiles(full_name, email)')
      .single();

    if (updateErr) {
      return res.status(500).json({ success: false, message: updateErr.message });
    }

    const finalStudent = {
      ...updatedData,
      full_name: updatedData.profiles?.full_name || currentStudent.full_name,
      email: updatedData.profiles?.email || currentStudent.email
    };

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

    const { data: currentData, error: fetchErr } = await supabase
      .from('students')
      .select('*, profiles(full_name, email)')
      .or(`id.eq.${id},student_code.eq.${id}`)
      .maybeSingle();

    if (fetchErr || !currentData) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const student = {
      ...currentData,
      full_name: currentData.profiles?.full_name || currentData.full_name || `Student ${currentData.student_code}`,
      email: currentData.profiles?.email || currentData.email || `${currentData.student_code.toLowerCase()}@student.university.edu`
    };

    const prediction = await predictStudentRisk(student);
    const normalizedRisk = normalizeRiskLevel(prediction.riskLevel);

    await supabase
      .from('students')
      .update({ predicted_risk: normalizedRisk, updated_at: new Date().toISOString() })
      .eq('id', student.id);

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
