-- Complete Supabase SQL Seed Script
-- University Academic Intelligence & Risk Management Platform
-- File: /supabase/seed.sql

-- 1. Insert Profiles
INSERT INTO public.profiles (id, email, password_hash, full_name, role, department, avatar_url)
VALUES
  ('prof-001', 'dean.harrison@university.edu', '$2a$10$eE0m7h22Wc12345678901u8vWqgYhZ.1234567890123456789012', 'Dr. Eleanor Harrison', 'DEAN', 'Computer Science', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
  ('prof-002', 'prof.chen@university.edu', '$2a$10$eE0m7h22Wc12345678901u8vWqgYhZ.1234567890123456789012', 'Prof. Marcus Chen', 'FACULTY', 'Computer Science', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
  ('prof-003', 'advisor.sarah@university.edu', '$2a$10$eE0m7h22Wc12345678901u8vWqgYhZ.1234567890123456789012', 'Sarah Jenkins, M.Ed.', 'ACADEMIC_ADVISOR', 'Business Administration', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
  ('prof-004', 'alex.rivera@student.university.edu', '$2a$10$eE0m7h22Wc12345678901u8vWqgYhZ.1234567890123456789012', 'Alex Rivera', 'STUDENT', 'Computer Science', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'),
  ('prof-005', 'admin.director@university.edu', '$2a$10$eE0m7h22Wc12345678901u8vWqgYhZ.1234567890123456789012', 'Chancellor Arthur Pendelton', 'SUPER_ADMIN', 'University Administration', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Students
INSERT INTO public.students (id, user_id, student_code, full_name, email, department, program, semester, enrollment_year, current_gpa, attendance_rate, credits_earned, credits_required, predicted_risk, status, advisor_notes, gpa_history)
VALUES
  ('stu-101', 'prof-004', 'CS-2023-089', 'Alex Rivera', 'alex.rivera@student.university.edu', 'Computer Science', 'B.Tech Computer Science', 5, 2023, 2.34, 68.5, 48, 120, 'HIGH', 'PROBATION', 'Struggling with Data Structures (CS201) and Discrete Math. Attendance dipped below 70%.', '[{"term": "Fall 2023", "gpa": 3.10}, {"term": "Spring 2024", "gpa": 2.70}, {"term": "Fall 2024", "gpa": 2.34}]'::jsonb),
  ('stu-102', NULL, 'BA-2022-045', 'Sophia Montgomery', 'sophia.m@student.university.edu', 'Business Administration', 'B.Sc Business Administration', 7, 2022, 3.88, 96.2, 82, 120, 'LOW', 'ACTIVE', 'High performer. Candidate for Deans Honor List and Honors Thesis.', '[{"term": "Fall 2022", "gpa": 3.80}, {"term": "Spring 2023", "gpa": 3.90}, {"term": "Fall 2023", "gpa": 3.85}, {"term": "Spring 2024", "gpa": 3.88}]'::jsonb),
  ('stu-103', NULL, 'ME-2023-112', 'Liam Vance', 'liam.vance@student.university.edu', 'Mechanical Engineering', 'B.Tech Mechanical Engineering', 5, 2023, 2.85, 76.0, 42, 128, 'MEDIUM', 'ACTIVE', 'Moderate risk due to Thermodynamics midterm. Requires peer tutoring support.', '[{"term": "Fall 2023", "gpa": 3.00}, {"term": "Spring 2024", "gpa": 2.85}]'::jsonb),
  ('stu-104', NULL, 'LS-2024-019', 'Maya Patel', 'maya.patel@student.university.edu', 'Life Sciences', 'B.Sc Life Sciences', 3, 2024, 3.65, 94.0, 28, 120, 'LOW', 'ACTIVE', 'Excelling in Organic Chemistry lab. Expressed interest in pre-med research.', '[{"term": "Fall 2024", "gpa": 3.65}]'::jsonb),
  ('stu-105', NULL, 'HUM-2022-077', 'Ethan Blackwood', 'ethan.b@student.university.edu', 'Humanities', 'B.A Humanities', 7, 2022, 2.15, 62.0, 54, 120, 'HIGH', 'PROBATION', 'Missed 4 essay submissions in World History. Urgent academic counseling scheduled.', '[{"term": "Fall 2022", "gpa": 2.80}, {"term": "Spring 2023", "gpa": 2.40}, {"term": "Fall 2023", "gpa": 2.15}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Faculty
INSERT INTO public.faculty (id, user_id, full_name, email, department, designation, workload_hours, max_workload_hours, teaching_rating, research_publications, courses_taught, evaluation_sentiment)
VALUES
  ('fac-201', 'prof-002', 'Prof. Marcus Chen', 'prof.chen@university.edu', 'Computer Science', 'Associate Professor', 38, 40, 4.82, 14, '["CS101 Intro to CS", "CS201 Data Structures & Algorithms"]'::jsonb, 'Students appreciate interactive coding labs and clear grading rubrics. Note heavy assignment workload.'),
  ('fac-202', NULL, 'Dr. Aris Thorne', 'aris.thorne@university.edu', 'Business Administration', 'Department Chair & Professor', 42, 40, 4.65, 22, '["BUS301 Corporate Finance", "BUS490 Senior Capstone"]'::jsonb, 'Strong industry connections; workload slightly above recommended maximum due to capstone advising.'),
  ('fac-203', NULL, 'Dr. Elena Rostova', 'elena.r@university.edu', 'Mechanical Engineering', 'Assistant Professor', 32, 40, 4.90, 9, '["ME202 Thermodynamics", "ME310 Fluid Dynamics"]'::jsonb, 'Exceptional visual demonstrations and responsive office hours. Highly rated by sophomore cohort.'),
  ('fac-204', NULL, 'Dr. Samuel Vance', 'samuel.vance@university.edu', 'Life Sciences', 'Professor', 35, 40, 4.40, 31, '["BIO210 Genetics", "BIO401 Molecular Cell Biology"]'::jsonb, 'Rigorous exam standards. Active NIH grant recipient with heavy lab oversight duties.')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Courses
INSERT INTO public.courses (id, course_code, title, department, credits, semester, syllabus_progress, total_modules, completed_modules, prerequisites, faculty_name, faculty_id, enrolled_count, average_attendance, learning_outcomes)
VALUES
  ('crs-301', 'CS201', 'Data Structures & Algorithms', 'Computer Science', 4, 3, 75.0, 12, 9, '["CS101"]'::jsonb, 'Prof. Marcus Chen', 'fac-201', 64, 84.2, '[{"outcome": "Analyze Big-O time complexity", "completed": true}, {"outcome": "Implement Trees and Graphs", "completed": true}, {"outcome": "Master Dynamic Programming", "completed": false}]'::jsonb),
  ('crs-302', 'BUS301', 'Corporate Finance & Valuation', 'Business Administration', 3, 5, 82.5, 10, 8, '["BUS101"]'::jsonb, 'Dr. Aris Thorne', 'fac-202', 88, 91.0, '[{"outcome": "Discounted Cash Flow (DCF) Analysis", "completed": true}, {"outcome": "Capital Budgeting Models", "completed": true}, {"outcome": "Mergers & Acquisitions Structuring", "completed": false}]'::jsonb),
  ('crs-303', 'ME202', 'Engineering Thermodynamics', 'Mechanical Engineering', 4, 3, 68.0, 8, 5, '["PHYS101", "MATH201"]'::jsonb, 'Dr. Elena Rostova', 'fac-203', 52, 78.4, '[{"outcome": "Apply 1st and 2nd Laws of Thermodynamics", "completed": true}, {"outcome": "Rankine and Brayton Cycle Analysis", "completed": false}]'::jsonb),
  ('crs-304', 'BIO210', 'Genetics & Genomics', 'Life Sciences', 4, 3, 90.0, 10, 9, '["BIO101"]'::jsonb, 'Dr. Samuel Vance', 'fac-204', 75, 93.5, '[{"outcome": "Mendelian Genetics and Mapping", "completed": true}, {"outcome": "CRISPR Gene Editing Foundations", "completed": true}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Attendance Logs
INSERT INTO public.attendance_logs (id, course_code, course_id, student_id, student_name, date, status, department)
VALUES
  ('att-1', 'CS201', 'crs-301', 'stu-101', 'Alex Rivera', '2026-07-28', 'ABSENT', 'Computer Science'),
  ('att-2', 'CS201', 'crs-301', 'stu-102', 'Sophia Montgomery', '2026-07-28', 'PRESENT', 'Business Administration'),
  ('att-3', 'ME202', 'crs-303', 'stu-103', 'Liam Vance', '2026-07-27', 'PRESENT', 'Mechanical Engineering'),
  ('att-4', 'HUM101', NULL, 'stu-105', 'Ethan Blackwood', '2026-07-27', 'ABSENT', 'Humanities')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Assessments
INSERT INTO public.assessments (id, student_id, course_id, title, score_obtained, max_score, weightage_percent, recorded_by)
VALUES
  ('asmt-1', 'stu-101', 'crs-301', 'Midterm Exam', 52, 100, 30, 'prof-002'),
  ('asmt-2', 'stu-102', 'crs-302', 'Midterm Exam', 91, 100, 30, 'prof-003'),
  ('asmt-3', 'stu-103', 'crs-303', 'Lab Assignment 1', 74, 100, 15, 'prof-002')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Policies
INSERT INTO public.policies (id, title, category, content, embedding_snippet)
VALUES
  ('pol-501', 'Academic Standing & Probation Policy Section 4.2', 'Academic Standards', 'Any undergraduate student whose cumulative GPA falls below 2.00 or semester GPA falls below 2.25 will be placed on Academic Probation. Students on probation must complete a mandatory Academic Recovery Plan with an Assigned Advisor. Attendance rates below 75% trigger automatic alert warnings to the Dean of Students.', '[0.012, -0.045, 0.089...]'),
  ('pol-502', 'Course Repeat & Grade Replacement Policy', 'Curriculum & Grading', 'Undergraduate students may repeat up to 4 courses (maximum 16 credit hours) for grade replacement. The higher grade will be calculated into the cumulative GPA, although all course attempts remain permanently on the official transcript.', '[-0.034, 0.078, 0.012...]'),
  ('pol-503', 'Faculty Workload & Credit Allocation Guidelines', 'Faculty Governance', 'Standard full-time teaching workload is 24 credit hours per academic year (12 credits per semester). Research-active faculty with active external grants may request a teaching load reduction down to 18 credit hours annually upon Dean approval.', '[0.055, 0.021, -0.091...]'),
  ('pol-504', 'Attendance Mandate & Financial Aid Eligibility', 'Compliance & Aid', 'Federal financial aid compliance requires verification of active class participation. Students accumulating more than 3 unexcused consecutive absences will be reported to the Registrar and may face mandatory withdrawal or loss of Title IV aid.', '[0.088, -0.012, 0.043...]')
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Advisory Records
INSERT INTO public.advisory_records (id, student_id, advisor_name, risk_assessment, action_plan, assumptions_confirmed)
VALUES
  ('adv-601', 'stu-101', 'Sarah Jenkins, M.Ed.', 'High Academic Risk due to attendance drop (68.5%) and mid-term score decline in CS201.', '{"steps": ["Enroll in CS201 peer tutoring 2x weekly", "Weekly check-in with Academic Advisor", "Submit time management log"], "target_gpa": 2.80, "deadline": "2026-12-15"}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 9. Insert AI Academic Reports
INSERT INTO public.ai_academic_reports (id, university_id, department, generated_by, report_type, raw_input_payload, ai_response, assumptions, confidence_score, is_verified_by_admin)
VALUES
  ('rpt-701', 'uni-001', 'Computer Science', 'prof-001', 'Prediction', '{"studentId": "stu-101", "department": "Computer Science", "program": "B.Tech CS", "semester": 5, "cgpa": 2.34, "attendancePct": 68.5, "assessments": []}'::jsonb, '{"predictedCGPA": 2.10, "riskLevel": "Critical", "dropoutProbability": 0.38, "keyRiskFactors": ["Attendance below 70%", "GPA declining over 3 semesters", "Midterm score 52%"], "strengths": ["Peer engagement in lab sessions", "Completed all prerequisite courses"], "possibleRootCauses": ["Possible external socioeconomic pressures", "Course load imbalance"], "confidenceScore": 0.85, "assumptions": ["Historical GPA trajectory extrapolated linearly", "No major life event documented"]}'::jsonb, '["Historical GPA trajectory extrapolated linearly", "No major life event documented"]'::jsonb, 0.85, false)
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Audit Logs
INSERT INTO public.audit_logs (id, actor_id, actor_name, action, target_entity, details, ip_address)
VALUES
  ('aud-001', 'prof-001', 'Dr. Eleanor Harrison', 'LOGIN', 'auth', '{"email": "dean.harrison@university.edu"}'::jsonb, '127.0.0.1'),
  ('aud-002', 'prof-002', 'Prof. Marcus Chen', 'ATTENDANCE_RECORDED', 'attendance_records', '{"course_code": "CS201", "date": "2026-07-28", "count": 4}'::jsonb, '127.0.0.1'),
  ('aud-003', 'prof-001', 'Dr. Eleanor Harrison', 'AI_REPORT_GENERATED', 'ai_academic_reports', '{"report_type": "Prediction", "department": "Computer Science"}'::jsonb, '127.0.0.1')
ON CONFLICT (id) DO NOTHING;

-- 11. Insert Student Attendance Tracker Records
INSERT INTO public.student_attendance (id, student_id, course_id, status, verification_status, date)
VALUES
  ('att-101', 'stu-101', 'crs-301', 'Present', 'Biometric Verified', '2026-07-25'),
  ('att-102', 'stu-101', 'crs-301', 'Present', 'Verified', '2026-07-26'),
  ('att-103', 'stu-101', 'crs-301', 'Absent', 'Manual Verification', '2026-07-27'),
  ('att-104', 'stu-101', 'crs-301', 'Present', 'Classroom RFID', '2026-07-28'),
  ('att-105', 'stu-101', 'crs-302', 'Present', 'Biometric Verified', '2026-07-25'),
  ('att-106', 'stu-101', 'crs-302', 'Absent', 'Pending', '2026-07-26'),
  ('att-107', 'stu-101', 'crs-302', 'Present', 'Classroom RFID', '2026-07-27'),
  ('att-108', 'stu-101', 'crs-302', 'Present', 'Verified', '2026-07-28')
ON CONFLICT (id) DO NOTHING;

-- 12. Insert Course Syllabus Records
INSERT INTO public.course_syllabus (id, course_id, faculty_id, unit_title, topics_covered, completion_percentage, status)
VALUES
  ('syl-001', 'crs-301', 'fac-201', 'Unit 1: Data Structures Overview & Arrays', 'Arrays, Dynamic Memory, Multi-dimensional Arrays', 100, 'Completed'),
  ('syl-002', 'crs-301', 'fac-201', 'Unit 2: Stacks, Queues & Linked Lists', 'Singly Linked Lists, Doubly Linked Lists, Circular Queues', 85, 'In Progress'),
  ('syl-003', 'crs-301', 'fac-201', 'Unit 3: Trees, Binary Search Trees & Heaps', 'Tree Traversals, AVL Trees, Binary Heaps', 40, 'In Progress'),
  ('syl-004', 'crs-301', 'fac-201', 'Unit 4: Graph Algorithms & Shortest Path', 'BFS, DFS, Dijkstra Algorithm, Bellman-Ford', 0, 'Pending'),
  ('syl-005', 'crs-302', 'fac-202', 'Unit 1: Database System Concepts', 'Relational Model, ER Modeling, Relational Algebra', 100, 'Completed'),
  ('syl-006', 'crs-302', 'fac-202', 'Unit 2: SQL Fundamentals & Normalization', 'DDL, DML, Joins, 1NF, 2NF, 3NF, BCNF', 75, 'In Progress'),
  ('syl-007', 'crs-302', 'fac-202', 'Unit 3: Transaction Management & Concurrency', 'ACID Properties, Locking Protocols, Two-Phase Commit', 10, 'In Progress')
ON CONFLICT (id) DO NOTHING;
