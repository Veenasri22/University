-- Complete Production PostgreSQL Database Schema with RLS for Supabase
-- University Academic Intelligence & Risk Management Platform
-- File: /supabase/schema.sql

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enums (Safe creation)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'DEAN', 'HOD', 'FACULTY', 'ACADEMIC_ADVISOR', 'STUDENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE academic_status AS ENUM ('ACTIVE', 'PROBATION', 'SUSPENDED', 'GRADUATED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'LEAVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Profiles Table (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'STUDENT',
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  department TEXT NOT NULL,
  program TEXT DEFAULT 'B.Tech Computer Science',
  semester INT NOT NULL DEFAULT 1,
  enrollment_year INT NOT NULL DEFAULT 2024,
  current_gpa NUMERIC(3,2) DEFAULT 0.00,
  attendance_rate NUMERIC(5,2) DEFAULT 100.00,
  credits_earned INT DEFAULT 0,
  credits_required INT DEFAULT 120,
  predicted_risk risk_level DEFAULT 'LOW',
  status academic_status DEFAULT 'ACTIVE',
  advisor_notes TEXT,
  gpa_history JSONB DEFAULT '[]'::jsonb,
  phone TEXT,
  dob DATE,
  gender TEXT DEFAULT 'Male',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Faculty Table
CREATE TABLE IF NOT EXISTS public.faculty (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  department TEXT NOT NULL,
  designation TEXT NOT NULL DEFAULT 'Assistant Professor',
  workload_hours INT DEFAULT 0,
  max_workload_hours INT DEFAULT 40,
  teaching_rating NUMERIC(3,2) DEFAULT 5.00,
  research_publications INT DEFAULT 0,
  courses_taught JSONB DEFAULT '[]'::jsonb,
  evaluation_sentiment TEXT,
  faculty_id_number TEXT,
  experience_years INT DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Courses / Curriculum Table
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  course_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  credits INT NOT NULL DEFAULT 3,
  semester INT NOT NULL DEFAULT 1,
  syllabus_progress NUMERIC(5,2) DEFAULT 0.00,
  total_modules INT DEFAULT 10,
  completed_modules INT DEFAULT 0,
  prerequisites JSONB DEFAULT '[]'::jsonb,
  faculty_name TEXT,
  faculty_id TEXT REFERENCES public.faculty(id) ON DELETE SET NULL,
  enrolled_count INT DEFAULT 0,
  average_attendance NUMERIC(5,2) DEFAULT 100.00,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Attendance Logs Table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  course_code TEXT NOT NULL,
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'PRESENT',
  department TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Assessments Table
CREATE TABLE IF NOT EXISTS public.assessments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  score_obtained NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  weightage_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  recorded_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Academic Policies Table (RAG Store)
CREATE TABLE IF NOT EXISTS public.policies (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Advisory Records Table
CREATE TABLE IF NOT EXISTS public.advisory_records (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  advisor_name TEXT NOT NULL,
  advisor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  risk_assessment TEXT NOT NULL,
  action_plan JSONB DEFAULT '{}'::jsonb,
  assumptions_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AI Academic Reports Table
CREATE TABLE IF NOT EXISTS public.ai_academic_reports (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  university_id TEXT DEFAULT 'uni-001',
  department TEXT NOT NULL,
  generated_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  raw_input_payload JSONB DEFAULT '{}'::jsonb,
  ai_response JSONB DEFAULT '{}'::jsonb,
  assumptions JSONB DEFAULT '[]'::jsonb,
  confidence_score NUMERIC(3,2) DEFAULT 0.85,
  is_verified_by_admin BOOLEAN DEFAULT FALSE,
  verified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  actor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT DEFAULT '127.0.0.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Student Attendance Tracker Table
CREATE TABLE IF NOT EXISTS public.student_attendance (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Present',
  verification_status TEXT DEFAULT 'Verified',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Course Syllabus Tracker Table
CREATE TABLE IF NOT EXISTS public.course_syllabus (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id TEXT REFERENCES public.faculty(id) ON DELETE SET NULL,
  unit_title TEXT NOT NULL,
  topics_covered TEXT NOT NULL,
  completion_percentage INT NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  status TEXT NOT NULL DEFAULT 'Pending',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. AI Generated Advisories Table
CREATE TABLE IF NOT EXISTS public.ai_generated_advisories (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  entity_id TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  summary TEXT NOT NULL,
  ai_output_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Interactive Advisor Chats & Messages Tables
CREATE TABLE IF NOT EXISTS public.advisor_chats (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.advisor_messages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  chat_id TEXT REFERENCES public.advisor_chats(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. AI Sessions & Chat Messages Tables
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  session_id TEXT REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  hod_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  subject_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  credits INT NOT NULL DEFAULT 3,
  semester INT NOT NULL DEFAULT 1,
  department_id TEXT REFERENCES public.departments(id) ON DELETE CASCADE,
  faculty_id TEXT REFERENCES public.faculty(id) ON DELETE SET NULL,
  total_units INT DEFAULT 5,
  completed_units INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Marks Table
CREATE TABLE IF NOT EXISTS public.marks (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
  semester INT NOT NULL DEFAULT 1,
  internal_marks NUMERIC(5,2) DEFAULT 0.00,
  assignment_marks NUMERIC(5,2) DEFAULT 0.00,
  midterm_marks NUMERIC(5,2) DEFAULT 0.00,
  external_marks NUMERIC(5,2) DEFAULT 0.00,
  total_marks NUMERIC(5,2) DEFAULT 0.00,
  grade TEXT DEFAULT 'F',
  is_backlog BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'ALERT',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_dept ON public.students(department);
CREATE INDEX IF NOT EXISTS idx_students_risk ON public.students(predicted_risk);
CREATE INDEX IF NOT EXISTS idx_faculty_dept ON public.faculty(department);
CREATE INDEX IF NOT EXISTS idx_courses_dept ON public.courses(department);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_student ON public.attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON public.attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_assessments_student ON public.assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_messages_chat ON public.advisor_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session ON public.ai_chat_messages(session_id);

-- Enable Row Level Security (RLS) across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_academic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Application Access
DO $$ DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Public access policy" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
