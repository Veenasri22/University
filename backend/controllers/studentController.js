import { mockStore } from '../services/mockStore.js';
import { studentCreateSchema, studentPerformanceUpdateSchema } from '../validators/schemas.js';
import { predictStudentRisk } from '../services/geminiService.js';

export const getStudents = async (req, res, next) => {
  try {
    const { department, riskLevel, search } = req.query;

    let result = [...mockStore.students];

    if (department && department !== 'ALL') {
      result = result.filter(s => s.department === department);
    }

    if (riskLevel && riskLevel !== 'ALL') {
      result = result.filter(s => s.predicted_risk === riskLevel);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.student_code.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: result.length,
      students: result
    });
  } catch (err) {
    next(err);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = mockStore.students.find(s => s.id === id || s.student_code === id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const advisoryLogs = mockStore.advisory_records.filter(r => r.student_id === student.id);
    const attendanceLogs = mockStore.attendance_logs.filter(a => a.student_name === student.full_name);

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

    const newStudent = {
      id: `stu-${Date.now().toString().slice(-4)}`,
      user_id: null,
      ...validated,
      predicted_risk: validated.current_gpa < 2.5 ? 'HIGH' : validated.current_gpa < 3.2 ? 'MEDIUM' : 'LOW',
      status: 'ACTIVE',
      gpa_history: [{ term: 'Fall 2026', gpa: validated.current_gpa }]
    };

    mockStore.students.unshift(newStudent);

    res.status(201).json({
      success: true,
      message: 'Student record created',
      student: newStudent
    });
  } catch (err) {
    next(err);
  }
};

export const updateStudentPerformance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = studentPerformanceUpdateSchema.parse(req.body);

    const index = mockStore.students.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const current = mockStore.students[index];
    const updated = {
      ...current,
      ...(validated.current_gpa !== undefined && { current_gpa: validated.current_gpa }),
      ...(validated.attendance_rate !== undefined && { attendance_rate: validated.attendance_rate }),
      ...(validated.advisor_notes !== undefined && { advisor_notes: validated.advisor_notes })
    };

    // Recompute predictive risk with Gemini or heuristic model
    const aiPrediction = await predictStudentRisk(updated);
    updated.predicted_risk = aiPrediction.riskLevel;

    mockStore.students[index] = updated;

    res.json({
      success: true,
      message: 'Student performance updated & risk trajectory recomputed',
      student: updated,
      aiPrediction
    });
  } catch (err) {
    next(err);
  }
};

export const triggerStudentRiskPrediction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = mockStore.students.find(s => s.id === id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const prediction = await predictStudentRisk(student);

    // Update risk level in student record
    student.predicted_risk = prediction.riskLevel;

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
