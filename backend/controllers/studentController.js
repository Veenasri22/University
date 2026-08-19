import { supabase } from '../config/db.js';
import { studentCreateSchema, studentPerformanceUpdateSchema } from '../validators/schemas.js';
import { predictStudentRisk } from '../services/geminiService.js';

const normalizeRiskLevel = (lvl) => {
  const upper = String(lvl || '').toUpperCase();
  if (upper === 'CRITICAL' || upper === 'HIGH') return 'HIGH';
  if (upper === 'MODERATE' || upper === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
};

const mapStudentData = (s) => {
  if (!s) return null;
  const fullName = s.profiles?.full_name || s.full_name || `Student ${s.student_id_number || s.student_code || ''}`;
  const email = s.profiles?.email || s.email || `${(s.student_id_number || s.student_code || 'student').toLowerCase()}@student.university.edu`;
  const code = s.student_id_number || s.student_code || s.id;
  const dept = s.course || s.department || 'Computer Science';
  const gpa = Number(s.cgpa !== undefined ? s.cgpa : s.current_gpa !== undefined ? s.current_gpa : 0.00);
  const risk = s.current_risk_level || s.predicted_risk || 'LOW';

  return {
    ...s,
    id: s.id,
    user_id: s.user_id || null,
    student_code: code,
    student_id_number: code,
    full_name: fullName,
    email: email,
    department: dept,
    course: dept,
    current_gpa: gpa,
    cgpa: gpa,
    attendance_rate: Number(s.attendance_rate || 100),
    credits_earned: Number(s.credits_earned || 0),
    credits_required: Number(s.credits_required || 120),
    predicted_risk: risk,
    current_risk_level: risk,
    status: s.status || 'ACTIVE',
    advisor_notes: s.advisor_notes || null,
    gpa_history: s.gpa_history || [{ term: 'Fall 2026', gpa }]
  };
};

export const getStudents = async (req, res, next) => {
  try {
    const { department, riskLevel, search } = req.query;

    let query = supabase
      .from('students')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    if (department && department !== 'ALL') {
      // Query both course and department column filters
      query = query.or(`course.eq.${department},department.eq.${department}`);
    }

    if (riskLevel && riskLevel !== 'ALL') {
      query = query.or(`current_risk_level.eq.${riskLevel},predicted_risk.eq.${riskLevel}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[studentController] Supabase fetch error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    let students = (data || []).map(mapStudentData);

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
      .or(`id.eq.${id},student_id_number.eq.${id},student_code.eq.${id}`)
      .maybeSingle();

    if (error) {
      console.error('[studentController] Supabase single fetch error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const student = mapStudentData(data);

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

    // 1. Create or link profile in Supabase profiles
    if (validated.email) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', validated.email)
        .maybeSingle();

      if (existingProfile) {
        userId = existingProfile.id;
      } else {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            email: validated.email,
            full_name: validated.full_name,
            role: 'STUDENT'
          })
          .select()
          .single();

        if (newProfile) userId = newProfile.id;
      }
    }

    // 2. Build schema-compatible insertion payload for Supabase 'students' table
    const payload = {
      ...(userId && { user_id: userId }),
      student_id_number: validated.student_code,
      course: validated.department,
      cgpa: Number(validated.current_gpa),
      current_risk_level: initialRisk,
      status: 'ACTIVE'
    };

    console.log('[studentController] Inserting student payload into Supabase:', payload);

    let { data, error } = await supabase
      .from('students')
      .insert(payload)
      .select('*, profiles(full_name, email)')
      .single();

    // Fallback if schema has extra or custom columns
    if (error && error.message.includes('column')) {
      console.warn('[studentController] Retrying insertion with alternate column names...');
      const altPayload = {
        ...(userId && { user_id: userId }),
        student_code: validated.student_code,
        student_id_number: validated.student_code,
        full_name: validated.full_name,
        email: validated.email,
        department: validated.department,
        course: validated.department,
        current_gpa: Number(validated.current_gpa),
        cgpa: Number(validated.current_gpa),
        predicted_risk: initialRisk,
        current_risk_level: initialRisk,
        status: 'ACTIVE'
      };
      const retryRes = await supabase.from('students').insert(altPayload).select('*, profiles(full_name, email)').single();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error('[Supabase] Create student failed:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    const createdStudent = mapStudentData(data);

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
      .or(`id.eq.${id},student_id_number.eq.${id},student_code.eq.${id}`)
      .maybeSingle();

    if (fetchErr || !currentData) {
      return res.status(404).json({ success: false, message: 'Student record not found in Supabase' });
    }

    const currentStudent = mapStudentData(currentData);

    const updatedFields = {
      ...(validated.current_gpa !== undefined && { cgpa: Number(validated.current_gpa), current_gpa: Number(validated.current_gpa) }),
      ...(validated.attendance_rate !== undefined && { attendance_rate: Number(validated.attendance_rate) }),
      ...(validated.advisor_notes !== undefined && { advisor_notes: validated.advisor_notes }),
      updated_at: new Date().toISOString()
    };

    const studentForAi = { ...currentStudent, ...updatedFields };
    const aiPrediction = await predictStudentRisk(studentForAi);
    const normalizedRisk = normalizeRiskLevel(aiPrediction.riskLevel);
    updatedFields.current_risk_level = normalizedRisk;
    updatedFields.predicted_risk = normalizedRisk;

    const { data: updatedData, error: updateErr } = await supabase
      .from('students')
      .update(updatedFields)
      .eq('id', currentStudent.id)
      .select('*, profiles(full_name, email)')
      .single();

    if (updateErr) {
      return res.status(500).json({ success: false, message: updateErr.message });
    }

    const finalStudent = mapStudentData(updatedData);

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
      .or(`id.eq.${id},student_id_number.eq.${id},student_code.eq.${id}`)
      .maybeSingle();

    if (fetchErr || !currentData) {
      return res.status(404).json({ success: false, message: 'Student not found in Supabase' });
    }

    const student = mapStudentData(currentData);

    const prediction = await predictStudentRisk(student);
    const normalizedRisk = normalizeRiskLevel(prediction.riskLevel);

    await supabase
      .from('students')
      .update({
        current_risk_level: normalizedRisk,
        predicted_risk: normalizedRisk,
        updated_at: new Date().toISOString()
      })
      .eq('id', student.id);

    student.predicted_risk = normalizedRisk;
    student.current_risk_level = normalizedRisk;

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
