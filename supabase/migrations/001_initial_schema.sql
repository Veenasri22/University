-- Supabase Cloud Migration: Initial Schema & RLS Policies & Seed Data
-- University Academic Intelligence Platform
-- Migration: 001_initial_schema.sql

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. User Roles & Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'DEAN', 'FACULTY', 'ACADEMIC_ADVISOR', 'STUDENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE academic_status AS ENUM ('ACTIVE', 'PROBATION', 'SUSPENDED', 'GRADUATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tables Definition

-- Profiles Table (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'STUDENT',
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_code TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  enrollment_year INT NOT NULL,
  current_gpa NUMERIC(3,2) DEFAULT 0.00,
  attendance_rate NUMERIC(5,2) DEFAULT 100.00,
  credits_earned INT DEFAULT 0,
  credits_required INT DEFAULT 120,
  predicted_risk risk_level DEFAULT 'LOW',
  status academic_status DEFAULT 'ACTIVE',
  advisor_notes TEXT,
  gpa_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty Table
CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  workload_hours INT DEFAULT 0,
  max_workload_hours INT DEFAULT 40,
  teaching_rating NUMERIC(3,2) DEFAULT 5.00,
  research_publications INT DEFAULT 0,
  courses_taught TEXT[] DEFAULT '{}',
  evaluation_sentiment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses / Curriculum Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  credits INT NOT NULL,
  syllabus_progress NUMERIC(5,2) DEFAULT 0.00,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  prerequisites TEXT[] DEFAULT '{}',
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  student_name TEXT NOT NULL,
  department TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic Policy Documents (RAG Vector Store)
CREATE TABLE IF NOT EXISTS public.academic_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768), -- Dimensions for Gemini Text Embeddings
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Advisory Records
CREATE TABLE IF NOT EXISTS public.advisory_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  advisor_name TEXT,
  risk_assessment TEXT NOT NULL,
  action_plan JSONB NOT NULL,
  assumptions_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_records ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Public select profiles" ON public.profiles;
CREATE POLICY "Public select profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Students
DROP POLICY IF EXISTS "Public view students" ON public.students;
CREATE POLICY "Public view students" ON public.students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff insert students" ON public.students;
CREATE POLICY "Staff insert students" ON public.students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff update students" ON public.students;
CREATE POLICY "Staff update students" ON public.students FOR UPDATE USING (true);

-- Faculty
DROP POLICY IF EXISTS "Public view faculty" ON public.faculty;
CREATE POLICY "Public view faculty" ON public.faculty FOR SELECT USING (true);

-- Courses
DROP POLICY IF EXISTS "Public view courses" ON public.courses;
CREATE POLICY "Public view courses" ON public.courses FOR SELECT USING (true);

-- Attendance Records
DROP POLICY IF EXISTS "Public view attendance" ON public.attendance_records;
CREATE POLICY "Public view attendance" ON public.attendance_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert attendance" ON public.attendance_records;
CREATE POLICY "Public insert attendance" ON public.attendance_records FOR INSERT WITH CHECK (true);

-- Academic Policies
DROP POLICY IF EXISTS "Public view policies" ON public.academic_policies;
CREATE POLICY "Public view policies" ON public.academic_policies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff insert policies" ON public.academic_policies;
CREATE POLICY "Staff insert policies" ON public.academic_policies FOR INSERT WITH CHECK (true);

-- Advisory Records
DROP POLICY IF EXISTS "Public view advisory" ON public.advisory_records;
CREATE POLICY "Public view advisory" ON public.advisory_records FOR SELECT USING (true);

-- 6. Initial Seed Data Insertion (ON CONFLICT DO NOTHING)

-- Profiles
INSERT INTO public.profiles (id, email, password_hash, full_name, role, department, avatar_url)
VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'dean.harrison@university.edu', '$2a$10$7v1b1W.Xg5C0gJvJ4K3J/e8VfPZpQ1Xg5C0gJvJ4K3J/e8VfPZpQ1', 'Dr. Eleanor Harrison', 'DEAN', 'Computer Science', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'prof.chen@university.edu', '$2a$10$7v1b1W.Xg5C0gJvJ4K3J/e8VfPZpQ1Xg5C0gJvJ4K3J/e8VfPZpQ1', 'Prof. Marcus Chen', 'FACULTY', 'Computer Science', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'advisor.sarah@university.edu', '$2a$10$7v1b1W.Xg5C0gJvJ4K3J/e8VfPZpQ1Xg5C0gJvJ4K3J/e8VfPZpQ1', 'Sarah Jenkins, M.Ed.', 'ACADEMIC_ADVISOR', 'Business Administration', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'alex.rivera@student.university.edu', '$2a$10$7v1b1W.Xg5C0gJvJ4K3J/e8VfPZpQ1Xg5C0gJvJ4K3J/e8VfPZpQ1', 'Alex Rivera', 'STUDENT', 'Computer Science', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150')
ON CONFLICT (email) DO NOTHING;

-- Students
INSERT INTO public.students (id, user_id, student_code, department, enrollment_year, current_gpa, attendance_rate, credits_earned, credits_required, predicted_risk, status, advisor_notes, gpa_history)
VALUES
  ('b2c3d4e5-0001-4000-8000-000000000001', 'a1b2c3d4-0004-4000-8000-000000000004', 'CS-2023-089', 'Computer Science', 2023, 2.34, 68.50, 48, 120, 'HIGH', 'PROBATION', 'Struggling with Data Structures (CS201) and Discrete Math. Attendance dipped below 70%.', '[{"term": "Fall 2023", "gpa": 3.10}, {"term": "Spring 2024", "gpa": 2.70}, {"term": "Fall 2024", "gpa": 2.34}]'::jsonb),
  ('b2c3d4e5-0002-4000-8000-000000000002', NULL, 'BA-2022-045', 'Business Administration', 2022, 3.88, 96.20, 82, 120, 'LOW', 'ACTIVE', 'High performer. Candidate for Dean’s Honor List and Honors Thesis.', '[{"term": "Fall 2022", "gpa": 3.80}, {"term": "Spring 2023", "gpa": 3.90}, {"term": "Fall 2023", "gpa": 3.85}, {"term": "Spring 2024", "gpa": 3.88}]'::jsonb),
  ('b2c3d4e5-0003-4000-8000-000000000003', NULL, 'ME-2023-112', 'Mechanical Engineering', 2023, 2.85, 76.00, 42, 128, 'MEDIUM', 'ACTIVE', 'Moderate risk due to Thermodynamics midterm. Requires peer tutoring support.', '[{"term": "Fall 2023", "gpa": 3.00}, {"term": "Spring 2024", "gpa": 2.85}]'::jsonb)
ON CONFLICT (student_code) DO NOTHING;

-- Faculty
INSERT INTO public.faculty (id, user_id, department, designation, workload_hours, max_workload_hours, teaching_rating, research_publications, courses_taught, evaluation_sentiment)
VALUES
  ('c3d4e5f6-0001-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'Computer Science', 'Associate Professor', 38, 40, 4.82, 14, ARRAY['CS101 Intro to CS', 'CS201 Data Structures'], 'Students appreciate interactive coding labs and clear grading rubrics.'),
  ('c3d4e5f6-0002-4000-8000-000000000002', NULL, 'Business Administration', 'Department Chair & Professor', 42, 40, 4.65, 22, ARRAY['BUS301 Corporate Finance', 'BUS490 Senior Capstone'], 'Strong industry connections; workload slightly above recommended maximum.')
ON CONFLICT DO NOTHING;

-- Academic Policies for RAG
INSERT INTO public.academic_policies (id, title, category, content)
VALUES
  ('d4e5f6a7-0001-4000-8000-000000000001', 'Academic Standing & Probation Policy Section 4.2', 'Academic Standards', 'Any undergraduate student whose cumulative GPA falls below 2.00 or semester GPA falls below 2.25 will be placed on Academic Probation. Students on probation must complete a mandatory Academic Recovery Plan with an Assigned Advisor. Attendance rates below 75% trigger automatic alert warnings to the Dean of Students.'),
  ('d4e5f6a7-0002-4000-8000-000000000002', 'Course Repeat & Grade Replacement Policy', 'Curriculum & Grading', 'Undergraduate students may repeat up to 4 courses (maximum 16 credit hours) for grade replacement. The higher grade will be calculated into the cumulative GPA, although all course attempts remain permanently on the official transcript.')
ON CONFLICT DO NOTHING;
