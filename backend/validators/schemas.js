import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name is required'),
  role: z.enum(['SUPER_ADMIN', 'DEAN', 'FACULTY', 'ACADEMIC_ADVISOR', 'STUDENT']).default('STUDENT'),
  department: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required')
});

export const studentCreateSchema = z.object({
  student_code: z.string().min(3),
  full_name: z.string().min(2),
  email: z.string().email(),
  department: z.string(),
  enrollment_year: z.number().int().min(2000).max(2030),
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

export const policyUploadSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  content: z.string().min(10)
});

export const aiAdvisorChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  agent_type: z.enum(['COURSE_PLANNER', 'FINANCIAL_AID', 'CAREER_PATHWAY', 'GENERAL']).default('GENERAL'),
  student_id: z.string().optional(),
  chat_history: z.array(z.object({
    sender: z.enum(['user', 'ai']),
    text: z.string()
  })).optional()
});

export const policySearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  department: z.string().optional()
});

export const generateReportSchema = z.object({
  department: z.string().min(1),
  timeframe: z.string().default('2026 Academic Year'),
  report_type: z.enum(['ACCREDITATION', 'EXECUTIVE_AUDIT', 'FACULTY_EVALUATION', 'STUDENT_RISK_SUMMARY']).default('EXECUTIVE_AUDIT')
});
