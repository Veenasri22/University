-- Supabase SQL Data Injection Seed Script
-- University Academic Intelligence & Risk Management Platform
-- File: /supabase/seed.sql

-- 1. Departments
INSERT INTO public.departments (id, name, code)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Computer Science & Engineering', 'CSE'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Electronics & Communication', 'ECE'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Mechanical Engineering', 'MECH'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Civil Engineering', 'CIVIL'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Information Technology', 'IT')
ON CONFLICT (code) DO NOTHING;

-- 2. User Profiles
INSERT INTO public.profiles (id, email, full_name, role, department_id, avatar_url)
VALUES
  ('p0eebc99-0001-4ef8-bb6d-6bb9bd380a01', 'admin@university.edu', 'Chancellor Arthur Pendelton', 'ADMIN', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
  ('p0eebc99-0002-4ef8-bb6d-6bb9bd380a02', 'hod.cse@university.edu', 'Dr. Eleanor Harrison', 'HOD', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
  ('p0eebc99-0003-4ef8-bb6d-6bb9bd380a03', 'hod.ece@university.edu', 'Dr. Robert Vance', 'HOD', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'),
  ('p0eebc99-0004-4ef8-bb6d-6bb9bd380a04', 'prof.chen@university.edu', 'Prof. Marcus Chen', 'FACULTY', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
  ('p0eebc99-0005-4ef8-bb6d-6bb9bd380a05', 'alex.rivera@student.university.edu', 'Alex Rivera', 'STUDENT', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150')
ON CONFLICT (email) DO NOTHING;

-- Link HODs
UPDATE public.departments SET hod_id = 'p0eebc99-0002-4ef8-bb6d-6bb9bd380a02' WHERE code = 'CSE';
UPDATE public.departments SET hod_id = 'p0eebc99-0003-4ef8-bb6d-6bb9bd380a03' WHERE code = 'ECE';

-- 3. Faculty
INSERT INTO public.faculty (id, user_id, faculty_id_number, department_id, designation, experience_years)
VALUES
  ('f0eebc99-0001-4ef8-bb6d-6bb9bd380f01', 'p0eebc99-0004-4ef8-bb6d-6bb9bd380a04', 'FAC-CSE-001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Associate Professor', 8),
  ('f0eebc99-0002-4ef8-bb6d-6bb9bd380f02', 'p0eebc99-0002-4ef8-bb6d-6bb9bd380a02', 'FAC-CSE-002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Department Chair & Professor', 15)
ON CONFLICT (faculty_id_number) DO NOTHING;

-- 4. Subjects
INSERT INTO public.subjects (id, subject_code, name, credits, semester, department_id, faculty_id, total_units, completed_units)
VALUES
  ('s0eebc99-0001-4ef8-bb6d-6bb9bd380s01', 'CS201', 'Data Structures & Algorithms', 4, 3, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f0eebc99-0001-4ef8-bb6d-6bb9bd380f01', 5, 3),
  ('s0eebc99-0002-4ef8-bb6d-6bb9bd380s02', 'CS202', 'Database Management Systems', 4, 3, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f0eebc99-0001-4ef8-bb6d-6bb9bd380f01', 5, 4),
  ('s0eebc99-0003-4ef8-bb6d-6bb9bd380s03', 'ECE201', 'Digital Signal Processing', 3, 3, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'f0eebc99-0002-4ef8-bb6d-6bb9bd380f02', 5, 2)
ON CONFLICT (subject_code) DO NOTHING;

-- 5. Students
INSERT INTO public.students (id, user_id, student_id_number, phone, department_id, course, year, semester, admission_year, gender, status, cgpa, current_risk_level)
VALUES
  ('st0eebc99-0001-4ef8-bb6d-6bb9bd380001', 'p0eebc99-0005-4ef8-bb6d-6bb9bd380a05', 'STU-2024-101', '+1 555-0101', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B.Tech Computer Science', 2, 3, 2024, 'Male', 'ACTIVE', 2.15, 'HIGH'),
  ('st0eebc99-0002-4ef8-bb6d-6bb9bd380002', NULL, 'STU-2024-102', '+1 555-0102', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B.Tech Computer Science', 3, 5, 2023, 'Female', 'ACTIVE', 3.88, 'LOW'),
  ('st0eebc99-0003-4ef8-bb6d-6bb9bd380003', NULL, 'STU-2024-103', '+1 555-0103', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B.Tech Computer Science', 2, 3, 2024, 'Male', 'ACTIVE', 2.75, 'MEDIUM')
ON CONFLICT (student_id_number) DO NOTHING;
