-- Production PostgreSQL Database Schema with RLS and Vector Search
-- University Academic Intelligence Platform

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- User Roles & Enums
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

-- 1. Profiles Table (Users)
CREATE TABLE IF NOT EXISTS profiles (
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

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_code TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  enrollment_year INT NOT NULL,
  current_gpa NUMERIC(3,2) DEFAULT 0.00,
  attendance_rate NUMERIC(5,2) DEFAULT 100.00,
  credits_earned INT DEFAULT 0,
  credits_required INT DEFAULT 120,
  predicted_risk risk_level DEFAULT 'LOW',
  status academic_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  workload_hours INT DEFAULT 0,
  max_workload_hours INT DEFAULT 40,
  teaching_rating NUMERIC(3,2) DEFAULT 5.00,
  research_publications INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Courses / Curriculum
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  course_name TEXT,
  department TEXT NOT NULL,
  credits INT NOT NULL,
  syllabus_progress NUMERIC(5,2) DEFAULT 0.00,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  prerequisites TEXT[] DEFAULT '{}',
  faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Academic Policy Documents for RAG
CREATE TABLE IF NOT EXISTS academic_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768), -- Dimensions for Gemini Text Embeddings
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Student Advisory & Performance Records
CREATE TABLE IF NOT EXISTS advisory_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  risk_assessment TEXT NOT NULL,
  action_plan JSONB NOT NULL,
  assumptions_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies Definition
-- Profiles
CREATE POLICY "Users view own profile or Deans view all" ON profiles
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'DEAN'));

-- Students
CREATE POLICY "Students view own record or Staff view department" ON students
  FOR SELECT USING (
    user_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'DEAN', 'ACADEMIC_ADVISOR') OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'FACULTY' AND department = (SELECT department FROM profiles WHERE id = auth.uid()))
  );

-- Advisory Records
CREATE POLICY "Advisors and Deans write records" ON advisory_records
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'DEAN', 'ACADEMIC_ADVISOR') OR
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- Academic Policies
CREATE POLICY "Public read for policies" ON academic_policies
  FOR SELECT USING (true);

CREATE POLICY "Admin policy management" ON academic_policies
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'DEAN'));

-- 8. AI Generated Advisories Table
CREATE TABLE IF NOT EXISTS ai_generated_advisories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL,
  risk_level TEXT NOT NULL,
  summary TEXT NOT NULL,
  ai_output_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_generated_advisories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public or authenticated access to ai_generated_advisories" ON ai_generated_advisories
  FOR ALL USING (true);

-- 9. Interactive AI Academic Advisor Chat Tables
CREATE TABLE IF NOT EXISTS advisor_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS advisor_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES advisor_chats(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE advisor_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to advisor_chats" ON advisor_chats FOR ALL USING (true);
CREATE POLICY "Public access to advisor_messages" ON advisor_messages FOR ALL USING (true);

-- 10. Dynamic Google Gemini AI Assistant Tables
CREATE TABLE IF NOT EXISTS ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES ai_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to ai_sessions" ON ai_sessions FOR ALL USING (true);
CREATE POLICY "Public access to ai_chat_messages" ON ai_chat_messages FOR ALL USING (true);

-- 11. Performance & Syllabus Tracker Tables
CREATE TABLE IF NOT EXISTS student_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
  verification_status TEXT DEFAULT 'Verified',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_syllabus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL,
  faculty_id UUID NOT NULL,
  unit_title TEXT NOT NULL,
  topics_covered TEXT NOT NULL,
  completion_percentage INT NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  status TEXT NOT NULL CHECK (status IN ('Completed', 'In Progress', 'Pending')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_syllabus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to student_attendance" ON student_attendance FOR ALL USING (true);
CREATE POLICY "Public access to course_syllabus" ON course_syllabus FOR ALL USING (true);




