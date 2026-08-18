-- Production PostgreSQL 15+ Migration Schema with RLS
-- University Academic Intelligence & Risk Management Platform
-- Migration: 001_initial_schema.sql

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'HOD', 'FACULTY', 'STUDENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LEAVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  hod_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Profiles Table (Linked to Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'STUDENT',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add circular FK for HOD on departments
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS fk_departments_hod;
ALTER TABLE public.departments ADD CONSTRAINT fk_departments_hod FOREIGN KEY (hod_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_id_number TEXT UNIQUE NOT NULL,
  phone TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  course TEXT NOT NULL DEFAULT 'B.Tech Computer Science',
  year INT NOT NULL DEFAULT 1,
  semester INT NOT NULL DEFAULT 1,
  dob DATE,
  admission_year INT NOT NULL DEFAULT 2024,
  gender TEXT DEFAULT 'Male',
  status TEXT DEFAULT 'ACTIVE',
  cgpa NUMERIC(3,2) DEFAULT 0.00,
  current_risk_level risk_level DEFAULT 'LOW',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Faculty Table
CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  faculty_id_number TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  designation TEXT NOT NULL DEFAULT 'Assistant Professor',
  experience_years INT DEFAULT 0,
  joining_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  credits INT NOT NULL DEFAULT 3,
  semester INT NOT NULL DEFAULT 1,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  total_units INT DEFAULT 5,
  completed_units INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'PRESENT',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Marks Table
CREATE TABLE IF NOT EXISTS public.marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
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

-- 10. Risk Evaluations Table
CREATE TABLE IF NOT EXISTS public.risk_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL,
  reasons JSONB DEFAULT '[]'::jsonb,
  recommended_action TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'ALERT',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Speed
CREATE INDEX IF NOT EXISTS idx_students_dept ON public.students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_risk ON public.students(current_risk_level);
CREATE INDEX IF NOT EXISTS idx_faculty_dept ON public.faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_dept ON public.subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_fac ON public.subjects(faculty_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_marks_student ON public.marks(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for App Integration
DROP POLICY IF EXISTS "Public select departments" ON public.departments;
CREATE POLICY "Public select departments" ON public.departments FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select profiles" ON public.profiles;
CREATE POLICY "Public select profiles" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select students" ON public.students;
CREATE POLICY "Public select students" ON public.students FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select faculty" ON public.faculty;
CREATE POLICY "Public select faculty" ON public.faculty FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select subjects" ON public.subjects;
CREATE POLICY "Public select subjects" ON public.subjects FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select attendance" ON public.attendance;
CREATE POLICY "Public select attendance" ON public.attendance FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select marks" ON public.marks;
CREATE POLICY "Public select marks" ON public.marks FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select risk_evaluations" ON public.risk_evaluations;
CREATE POLICY "Public select risk_evaluations" ON public.risk_evaluations FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select notifications" ON public.notifications;
CREATE POLICY "Public select notifications" ON public.notifications FOR ALL USING (true);
