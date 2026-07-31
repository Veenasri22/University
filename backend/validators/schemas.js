import { z } from 'zod';

// ─── AUTH SCHEMAS ───────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  full_name: z.string().min(2, { message: 'Full name is required' }),
  role: z.enum(['Admin', 'Department_Head', 'Faculty', 'Student', 'SUPER_ADMIN', 'DEAN', 'FACULTY', 'ACADEMIC_ADVISOR', 'STUDENT']).default('Student'),
  department: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  universityId: z.string().uuid().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required')
});

// ─── STUDENT SCHEMAS ─────────────────────────────────────────────────────────

export const studentCreateSchema = z.object({
  student_code: z.string().min(3),
  full_name: z.string().min(2),
  email: z.string().email(),
  department: z.string(),
  enrollment_year: z.number().int().min(2000).max(2035),
  current_gpa: z.number().min(0).max(4.0).default(0.0),
  attendance_rate: z.number().min(0).max(100).default(100.0),
  credits_earned: z.number().int().min(0).default(0)
});

export const studentPerformanceUpdateSchema = z.object({
  credits_attempted: z.number().optional(),
  current_gpa: z.number().min(0).max(4.0).optional(),
  attendance_rate: z.number().min(0).max(100).optional(),
  assignments_missed: z.number().int().min(0).optional(),
  midterm_scores: z.array(z.number()).optional(),
  advisor_notes: z.string().optional()
});

// ─── TRACKING SCHEMAS ─────────────────────────────────────────────────────────

export const attendanceRecordSchema = z.object({
  studentId: z.string().min(1, { message: 'Student ID is required' }),
  courseId: z.string().min(1, { message: 'Course ID is required' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date format must be YYYY-MM-DD' }),
  status: z.enum(['Present', 'Absent', 'PRESENT', 'ABSENT', 'LATE'])
});

export const batchAttendanceSchema = z.object({
  courseId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(['Present', 'Absent', 'PRESENT', 'ABSENT', 'LATE'])
  })).min(1, 'At least one attendance record is required')
});

export const assessmentRecordSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1, { message: 'Assessment title is required' }),
  scoreObtained: z.number().min(0),
  maxScore: z.number().min(1).default(100),
  weightagePercent: z.number().min(0).max(100)
});

// ─── POLICY / RAG SCHEMAS ────────────────────────────────────────────────────

export const policyUploadSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  content: z.string().min(10)
});

export const policySearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  department: z.string().optional()
});

// ─── AI ADVISOR CHAT SCHEMA ───────────────────────────────────────────────────

export const aiAdvisorChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  agent_type: z.enum(['COURSE_PLANNER', 'FINANCIAL_AID', 'CAREER_PATHWAY', 'GENERAL', 'ACADEMIC_ADVISOR']).default('GENERAL'),
  student_id: z.string().optional(),
  chat_history: z.array(z.object({
    sender: z.enum(['user', 'ai', 'assistant']),
    text: z.string(),
    message_text: z.string().optional()
  })).optional()
});

// ─── AI PREDICTION & REPORT SCHEMAS ──────────────────────────────────────────

export const aiPredictionRequestSchema = z.object({
  studentId: z.string().min(1),
  department: z.string().min(1),
  program: z.string().min(1),
  semester: z.number().int().min(1).max(12),
  cgpa: z.number().min(0.0).max(4.0),
  attendancePct: z.number().min(0.0).max(100.0),
  assessments: z.array(z.object({
    title: z.string(),
    scoreObtained: z.number(),
    maxScore: z.number()
  })).default([])
});

export const advisorRecommendationSchema = z.object({
  studentId: z.string().min(1),
  department: z.string().min(1),
  program: z.string().min(1),
  semester: z.number().int().min(1).max(12),
  cgpa: z.number().min(0.0).max(4.0),
  attendancePct: z.number().min(0.0).max(100.0),
  riskLevel: z.enum(['Critical', 'High', 'Moderate', 'Low', 'On-Track', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  specificConcerns: z.array(z.string()).optional()
});

export const facultyInsightSchema = z.object({
  facultyId: z.string().min(1),
  facultyName: z.string().min(1),
  department: z.string().min(1),
  academicTerm: z.string().min(1),
  weeklyTeachingHours: z.number().min(0).max(80),
  avgStudentFeedback: z.number().min(0).max(5).default(0),
  courseCount: z.number().int().min(0).default(0),
  researchPublications: z.number().int().min(0).default(0)
});

export const executiveReportSchema = z.object({
  universityName: z.string().default('University'),
  department: z.string().min(1),
  academicTerm: z.string().default('2026 Academic Year'),
  reportType: z.enum([
    'EXECUTIVE_AUDIT', 'ACCREDITATION', 'FACULTY_EVALUATION',
    'STUDENT_RISK_SUMMARY', 'Prediction', 'Advisory',
    'Faculty_Insight', 'Executive_Summary'
  ]).default('EXECUTIVE_AUDIT'),
  departmentData: z.object({
    totalStudents: z.number().optional(),
    avgGpa: z.number().optional(),
    avgAttendance: z.number().optional(),
    atRiskCount: z.number().optional(),
    facultyCount: z.number().optional(),
    avgFacultyRating: z.number().optional(),
    avgSyllabusCoverage: z.number().optional()
  }).optional()
});

export const diagnosticQuestionsSchema = z.object({
  context: z.string().min(1),
  entityType: z.enum(['Student', 'Faculty', 'Department', 'Course']).default('Student'),
  dataSnapshot: z.record(z.any()).optional()
});

// ─── REPORT SCHEMAS ───────────────────────────────────────────────────────────

export const generateReportSchema = z.object({
  department: z.string().min(1),
  timeframe: z.string().default('2026 Academic Year'),
  report_type: z.enum([
    'ACCREDITATION', 'EXECUTIVE_AUDIT', 'FACULTY_EVALUATION', 'STUDENT_RISK_SUMMARY'
  ]).default('EXECUTIVE_AUDIT')
});
