// Stateful in-memory database store for rapid evaluation and local execution
import bcrypt from 'bcryptjs';

const defaultPasswordHash = bcrypt.hashSync('password123', 10);

export const mockStore = {
  profiles: [
    {
      id: 'prof-001',
      email: 'dean.harrison@university.edu',
      password_hash: defaultPasswordHash,
      full_name: 'Dr. Eleanor Harrison',
      role: 'DEAN',
      department: 'Computer Science',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      created_at: new Date().toISOString()
    },
    {
      id: 'prof-002',
      email: 'prof.chen@university.edu',
      password_hash: defaultPasswordHash,
      full_name: 'Prof. Marcus Chen',
      role: 'FACULTY',
      department: 'Computer Science',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      created_at: new Date().toISOString()
    },
    {
      id: 'prof-003',
      email: 'advisor.sarah@university.edu',
      password_hash: defaultPasswordHash,
      full_name: 'Sarah Jenkins, M.Ed.',
      role: 'ACADEMIC_ADVISOR',
      department: 'Business Administration',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      created_at: new Date().toISOString()
    },
    {
      id: 'prof-004',
      email: 'alex.rivera@student.university.edu',
      password_hash: defaultPasswordHash,
      full_name: 'Alex Rivera',
      role: 'STUDENT',
      department: 'Computer Science',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      created_at: new Date().toISOString()
    },
    {
      id: 'prof-005',
      email: 'admin.director@university.edu',
      password_hash: defaultPasswordHash,
      full_name: 'Chancellor Arthur Pendelton',
      role: 'SUPER_ADMIN',
      department: 'University Administration',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      created_at: new Date().toISOString()
    }
  ],

  students: [
    {
      id: 'stu-101',
      user_id: 'prof-004',
      student_code: 'CS-2023-089',
      full_name: 'Alex Rivera',
      email: 'alex.rivera@student.university.edu',
      department: 'Computer Science',
      program: 'B.Tech Computer Science',
      semester: 5,
      enrollment_year: 2023,
      current_gpa: 2.34,
      attendance_rate: 68.5,
      credits_earned: 48,
      credits_required: 120,
      predicted_risk: 'HIGH',
      status: 'PROBATION',
      advisor_notes: 'Struggling with Data Structures (CS201) and Discrete Math. Attendance dipped below 70%.',
      gpa_history: [
        { term: 'Fall 2023', gpa: 3.10 },
        { term: 'Spring 2024', gpa: 2.70 },
        { term: 'Fall 2024', gpa: 2.34 }
      ]
    },
    {
      id: 'stu-102',
      user_id: null,
      student_code: 'BA-2022-045',
      full_name: 'Sophia Montgomery',
      email: 'sophia.m@student.university.edu',
      department: 'Business Administration',
      program: 'B.Sc Business Administration',
      semester: 7,
      enrollment_year: 2022,
      current_gpa: 3.88,
      attendance_rate: 96.2,
      credits_earned: 82,
      credits_required: 120,
      predicted_risk: 'LOW',
      status: 'ACTIVE',
      advisor_notes: 'High performer. Candidate for Dean\'s Honor List and Honors Thesis.',
      gpa_history: [
        { term: 'Fall 2022', gpa: 3.80 },
        { term: 'Spring 2023', gpa: 3.90 },
        { term: 'Fall 2023', gpa: 3.85 },
        { term: 'Spring 2024', gpa: 3.88 }
      ]
    },
    {
      id: 'stu-103',
      user_id: null,
      student_code: 'ME-2023-112',
      full_name: 'Liam Vance',
      email: 'liam.vance@student.university.edu',
      department: 'Mechanical Engineering',
      program: 'B.Tech Mechanical Engineering',
      semester: 5,
      enrollment_year: 2023,
      current_gpa: 2.85,
      attendance_rate: 76.0,
      credits_earned: 42,
      credits_required: 128,
      predicted_risk: 'MEDIUM',
      status: 'ACTIVE',
      advisor_notes: 'Moderate risk due to Thermodynamics midterm. Requires peer tutoring support.',
      gpa_history: [
        { term: 'Fall 2023', gpa: 3.00 },
        { term: 'Spring 2024', gpa: 2.85 }
      ]
    },
    {
      id: 'stu-104',
      user_id: null,
      student_code: 'LS-2024-019',
      full_name: 'Maya Patel',
      email: 'maya.patel@student.university.edu',
      department: 'Life Sciences',
      program: 'B.Sc Life Sciences',
      semester: 3,
      enrollment_year: 2024,
      current_gpa: 3.65,
      attendance_rate: 94.0,
      credits_earned: 28,
      credits_required: 120,
      predicted_risk: 'LOW',
      status: 'ACTIVE',
      advisor_notes: 'Excelling in Organic Chemistry lab. Expressed interest in pre-med research.',
      gpa_history: [
        { term: 'Fall 2024', gpa: 3.65 }
      ]
    },
    {
      id: 'stu-105',
      user_id: null,
      student_code: 'HUM-2022-077',
      full_name: 'Ethan Blackwood',
      email: 'ethan.b@student.university.edu',
      department: 'Humanities',
      program: 'B.A Humanities',
      semester: 7,
      enrollment_year: 2022,
      current_gpa: 2.15,
      attendance_rate: 62.0,
      credits_earned: 54,
      credits_required: 120,
      predicted_risk: 'HIGH',
      status: 'PROBATION',
      advisor_notes: 'Missed 4 essay submissions in World History. Urgent academic counseling scheduled.',
      gpa_history: [
        { term: 'Fall 2022', gpa: 2.80 },
        { term: 'Spring 2023', gpa: 2.40 },
        { term: 'Fall 2023', gpa: 2.15 }
      ]
    }
  ],

  faculty: [
    {
      id: 'fac-201',
      user_id: 'prof-002',
      full_name: 'Prof. Marcus Chen',
      email: 'prof.chen@university.edu',
      department: 'Computer Science',
      designation: 'Associate Professor',
      workload_hours: 38,
      max_workload_hours: 40,
      teaching_rating: 4.82,
      research_publications: 14,
      courses_taught: ['CS101 Intro to CS', 'CS201 Data Structures & Algorithms'],
      evaluation_sentiment: 'Students appreciate interactive coding labs and clear grading rubrics. Note heavy assignment workload.'
    },
    {
      id: 'fac-202',
      user_id: null,
      full_name: 'Dr. Aris Thorne',
      email: 'aris.thorne@university.edu',
      department: 'Business Administration',
      designation: 'Department Chair & Professor',
      workload_hours: 42,
      max_workload_hours: 40,
      teaching_rating: 4.65,
      research_publications: 22,
      courses_taught: ['BUS301 Corporate Finance', 'BUS490 Senior Capstone'],
      evaluation_sentiment: 'Strong industry connections; workload slightly above recommended maximum due to capstone advising.'
    },
    {
      id: 'fac-203',
      user_id: null,
      full_name: 'Dr. Elena Rostova',
      email: 'elena.r@university.edu',
      department: 'Mechanical Engineering',
      designation: 'Assistant Professor',
      workload_hours: 32,
      max_workload_hours: 40,
      teaching_rating: 4.90,
      research_publications: 9,
      courses_taught: ['ME202 Thermodynamics', 'ME310 Fluid Dynamics'],
      evaluation_sentiment: 'Exceptional visual demonstrations and responsive office hours. Highly rated by sophomore cohort.'
    },
    {
      id: 'fac-204',
      user_id: null,
      full_name: 'Dr. Samuel Vance',
      email: 'samuel.vance@university.edu',
      department: 'Life Sciences',
      designation: 'Professor',
      workload_hours: 35,
      max_workload_hours: 40,
      teaching_rating: 4.40,
      research_publications: 31,
      courses_taught: ['BIO210 Genetics', 'BIO401 Molecular Cell Biology'],
      evaluation_sentiment: 'Rigorous exam standards. Active NIH grant recipient with heavy lab oversight duties.'
    }
  ],

  courses: [
    {
      id: 'crs-301',
      course_code: 'CS201',
      title: 'Data Structures & Algorithms',
      department: 'Computer Science',
      credits: 4,
      semester: 3,
      syllabus_progress: 75.0,
      total_modules: 12,
      completed_modules: 9,
      prerequisites: ['CS101'],
      faculty_name: 'Prof. Marcus Chen',
      enrolled_count: 64,
      average_attendance: 84.2,
      learning_outcomes: [
        { outcome: 'Analyze Big-O time complexity', completed: true },
        { outcome: 'Implement Trees and Graphs', completed: true },
        { outcome: 'Master Dynamic Programming', completed: false }
      ]
    },
    {
      id: 'crs-302',
      course_code: 'BUS301',
      title: 'Corporate Finance & Valuation',
      department: 'Business Administration',
      credits: 3,
      semester: 5,
      syllabus_progress: 82.5,
      total_modules: 10,
      completed_modules: 8,
      prerequisites: ['BUS101'],
      faculty_name: 'Dr. Aris Thorne',
      enrolled_count: 88,
      average_attendance: 91.0,
      learning_outcomes: [
        { outcome: 'Discounted Cash Flow (DCF) Analysis', completed: true },
        { outcome: 'Capital Budgeting Models', completed: true },
        { outcome: 'Mergers & Acquisitions Structuring', completed: false }
      ]
    },
    {
      id: 'crs-303',
      course_code: 'ME202',
      title: 'Engineering Thermodynamics',
      department: 'Mechanical Engineering',
      credits: 4,
      semester: 3,
      syllabus_progress: 68.0,
      total_modules: 8,
      completed_modules: 5,
      prerequisites: ['PHYS101', 'MATH201'],
      faculty_name: 'Dr. Elena Rostova',
      enrolled_count: 52,
      average_attendance: 78.4,
      learning_outcomes: [
        { outcome: 'Apply 1st and 2nd Laws of Thermodynamics', completed: true },
        { outcome: 'Rankine and Brayton Cycle Analysis', completed: false }
      ]
    },
    {
      id: 'crs-304',
      course_code: 'BIO210',
      title: 'Genetics & Genomics',
      department: 'Life Sciences',
      credits: 4,
      semester: 3,
      syllabus_progress: 90.0,
      total_modules: 10,
      completed_modules: 9,
      prerequisites: ['BIO101'],
      faculty_name: 'Dr. Samuel Vance',
      enrolled_count: 75,
      average_attendance: 93.5,
      learning_outcomes: [
        { outcome: 'Mendelian Genetics and Mapping', completed: true },
        { outcome: 'CRISPR Gene Editing Foundations', completed: true }
      ]
    }
  ],

  attendance_logs: [
    { id: 'att-1', course_code: 'CS201', course_id: 'crs-301', student_id: 'stu-101', student_name: 'Alex Rivera', date: '2026-07-28', status: 'ABSENT', department: 'Computer Science' },
    { id: 'att-2', course_code: 'CS201', course_id: 'crs-301', student_id: 'stu-102', student_name: 'Sophia Montgomery', date: '2026-07-28', status: 'PRESENT', department: 'Business Administration' },
    { id: 'att-3', course_code: 'ME202', course_id: 'crs-303', student_id: 'stu-103', student_name: 'Liam Vance', date: '2026-07-27', status: 'LATE', department: 'Mechanical Engineering' },
    { id: 'att-4', course_code: 'HUM101', course_id: null, student_id: 'stu-105', student_name: 'Ethan Blackwood', date: '2026-07-27', status: 'ABSENT', department: 'Humanities' }
  ],

  assessments: [
    { id: 'asmt-1', student_id: 'stu-101', course_id: 'crs-301', title: 'Midterm Exam', score_obtained: 52, max_score: 100, weightage_percent: 30, recorded_by: 'prof-002', created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
    { id: 'asmt-2', student_id: 'stu-102', course_id: 'crs-302', title: 'Midterm Exam', score_obtained: 91, max_score: 100, weightage_percent: 30, recorded_by: 'prof-003', created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
    { id: 'asmt-3', student_id: 'stu-103', course_id: 'crs-303', title: 'Lab Assignment 1', score_obtained: 74, max_score: 100, weightage_percent: 15, recorded_by: 'prof-002', created_at: new Date(Date.now() - 86400000 * 5).toISOString() }
  ],

  policies: [
    {
      id: 'pol-501',
      title: 'Academic Standing & Probation Policy Section 4.2',
      category: 'Academic Standards',
      content: 'Any undergraduate student whose cumulative GPA falls below 2.00 or semester GPA falls below 2.25 will be placed on Academic Probation. Students on probation must complete a mandatory Academic Recovery Plan with an Assigned Advisor. Attendance rates below 75% trigger automatic alert warnings to the Dean of Students.',
      embedding_snippet: '[0.012, -0.045, 0.089...]'
    },
    {
      id: 'pol-502',
      title: 'Course Repeat & Grade Replacement Policy',
      category: 'Curriculum & Grading',
      content: 'Undergraduate students may repeat up to 4 courses (maximum 16 credit hours) for grade replacement. The higher grade will be calculated into the cumulative GPA, although all course attempts remain permanently on the official transcript.',
      embedding_snippet: '[-0.034, 0.078, 0.012...]'
    },
    {
      id: 'pol-503',
      title: 'Faculty Workload & Credit Allocation Guidelines',
      category: 'Faculty Governance',
      content: 'Standard full-time teaching workload is 24 credit hours per academic year (12 credits per semester). Research-active faculty with active external grants may request a teaching load reduction down to 18 credit hours annually upon Dean approval.',
      embedding_snippet: '[0.055, 0.021, -0.091...]'
    },
    {
      id: 'pol-504',
      title: 'Attendance Mandate & Financial Aid Eligibility',
      category: 'Compliance & Aid',
      content: 'Federal financial aid compliance requires verification of active class participation. Students accumulating more than 3 unexcused consecutive absences will be reported to the Registrar and may face mandatory withdrawal or loss of Title IV aid.',
      embedding_snippet: '[0.088, -0.012, 0.043...]'
    }
  ],

  advisory_records: [
    {
      id: 'adv-601',
      student_id: 'stu-101',
      advisor_name: 'Sarah Jenkins, M.Ed.',
      risk_assessment: 'High Academic Risk due to attendance drop (68.5%) and mid-term score decline in CS201.',
      action_plan: {
        steps: [
          'Enroll in CS201 peer tutoring 2x weekly',
          'Weekly check-in with Academic Advisor',
          'Submit time management log'
        ],
        target_gpa: 2.80,
        deadline: '2026-12-15'
      },
      assumptions_confirmed: true,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ],

  // ─── AI REPORTS STORE ────────────────────────────────────────────────────
  ai_academic_reports: [
    {
      id: 'rpt-701',
      university_id: 'uni-001',
      department: 'Computer Science',
      generated_by: 'prof-001',
      report_type: 'Prediction',
      raw_input_payload: { studentId: 'stu-101', department: 'Computer Science', program: 'B.Tech CS', semester: 5, cgpa: 2.34, attendancePct: 68.5, assessments: [] },
      ai_response: {
        predictedCGPA: 2.10,
        riskLevel: 'Critical',
        dropoutProbability: 0.38,
        keyRiskFactors: ['Attendance below 70%', 'GPA declining over 3 semesters', 'Midterm score 52%'],
        strengths: ['Peer engagement in lab sessions', 'Completed all prerequisite courses'],
        possibleRootCauses: ['Possible external socioeconomic pressures', 'Course load imbalance'],
        confidenceScore: 0.85,
        assumptions: ['Historical GPA trajectory extrapolated linearly', 'No major life event documented']
      },
      assumptions: ['Historical GPA trajectory extrapolated linearly', 'No major life event documented'],
      confidence_score: 0.85,
      is_verified_by_admin: false,
      verified_by: null,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ],

  // ─── AUDIT LOGS STORE ─────────────────────────────────────────────────────
  audit_logs: [
    {
      id: 'aud-001',
      actor_id: 'prof-001',
      actor_name: 'Dr. Eleanor Harrison',
      action: 'LOGIN',
      target_entity: 'auth',
      details: { email: 'dean.harrison@university.edu' },
      ip_address: '127.0.0.1',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: 'aud-002',
      actor_id: 'prof-002',
      actor_name: 'Prof. Marcus Chen',
      action: 'ATTENDANCE_RECORDED',
      target_entity: 'attendance_records',
      details: { course_code: 'CS201', date: '2026-07-28', count: 4 },
      ip_address: '127.0.0.1',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: 'aud-003',
      actor_id: 'prof-001',
      actor_name: 'Dr. Eleanor Harrison',
      action: 'AI_REPORT_GENERATED',
      target_entity: 'ai_academic_reports',
      details: { report_type: 'Prediction', department: 'Computer Science' },
      ip_address: '127.0.0.1',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ],

  ai_generated_advisories: [],
  advisor_chats: [],
  advisor_messages: [],
  ai_sessions: [],
  ai_chat_messages: [],

  // ─── PERFORMANCE & SYLLABUS TRACKER STORES ─────────────────────────────
  student_attendance: [
    { id: 'att-101', student_id: 'stu-101', course_id: 'crs-001', status: 'Present', date: '2026-07-25' },
    { id: 'att-102', student_id: 'stu-101', course_id: 'crs-001', status: 'Present', date: '2026-07-26' },
    { id: 'att-103', student_id: 'stu-101', course_id: 'crs-001', status: 'Absent', date: '2026-07-27' },
    { id: 'att-104', student_id: 'stu-101', course_id: 'crs-001', status: 'Present', date: '2026-07-28' },
    { id: 'att-105', student_id: 'stu-101', course_id: 'crs-002', status: 'Present', date: '2026-07-25' },
    { id: 'att-106', student_id: 'stu-101', course_id: 'crs-002', status: 'Absent', date: '2026-07-26' },
    { id: 'att-107', student_id: 'stu-101', course_id: 'crs-002', status: 'Present', date: '2026-07-27' },
    { id: 'att-108', student_id: 'stu-101', course_id: 'crs-002', status: 'Present', date: '2026-07-28' }
  ],

  course_syllabus: [
    { id: 'syl-001', course_id: 'crs-001', faculty_id: 'prof-002', unit_title: 'Unit 1: Data Structures Overview & Arrays', topics_covered: 'Arrays, Dynamic Memory, Multi-dimensional Arrays', completion_percentage: 100, status: 'Completed' },
    { id: 'syl-002', course_id: 'crs-001', faculty_id: 'prof-002', unit_title: 'Unit 2: Stacks, Queues & Linked Lists', topics_covered: 'Singly Linked Lists, Doubly Linked Lists, Circular Queues', completion_percentage: 85, status: 'In Progress' },
    { id: 'syl-003', course_id: 'crs-001', faculty_id: 'prof-002', unit_title: 'Unit 3: Trees, Binary Search Trees & Heaps', topics_covered: 'Tree Traversals, AVL Trees, Binary Heaps', completion_percentage: 40, status: 'In Progress' },
    { id: 'syl-004', course_id: 'crs-001', faculty_id: 'prof-002', unit_title: 'Unit 4: Graph Algorithms & Shortest Path', topics_covered: 'BFS, DFS, Dijkstra Algorithm, Bellman-Ford', completion_percentage: 0, status: 'Pending' },
    { id: 'syl-005', course_id: 'crs-002', faculty_id: 'prof-002', unit_title: 'Unit 1: Database System Concepts', topics_covered: 'Relational Model, ER Modeling, Relational Algebra', completion_percentage: 100, status: 'Completed' },
    { id: 'syl-006', course_id: 'crs-002', faculty_id: 'prof-002', unit_title: 'Unit 2: SQL Fundamentals & Normalization', topics_covered: 'DDL, DML, Joins, 1NF, 2NF, 3NF, BCNF', completion_percentage: 75, status: 'In Progress' },
    { id: 'syl-007', course_id: 'crs-002', faculty_id: 'prof-002', unit_title: 'Unit 3: Transaction Management & Concurrency', topics_covered: 'ACID Properties, Locking Protocols, Two-Phase Commit', completion_percentage: 10, status: 'In Progress' }
  ]
};
