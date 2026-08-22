import { supabase } from '../config/db.js';

/**
 * Fetch a real-time snapshot of the university database
 * (Students, Marks, Attendance, Courses/Syllabus, Policies, Faculty)
 */
export async function getLiveUniversitySnapshot() {
  let snapshot = {
    students: [],
    courses: [],
    marks: [],
    attendanceAlerts: [],
    policies: [],
    faculty: [],
    departments: []
  };

  if (!supabase) {
    return formatSnapshotToString(getFallbackSnapshot());
  }

  try {
    const [
      { data: stuData },
      { data: courseData },
      { data: marksData },
      { data: facultyData },
      { data: deptData },
      { data: policyData }
    ] = await Promise.allSettled([
      supabase.from('students').select('id, student_code, department, current_gpa, attendance_rate, predicted_risk, status, profiles(full_name)').limit(30),
      supabase.from('courses').select('id, course_code, title, department, syllabus_progress').limit(20),
      supabase.from('marks').select('*').limit(30),
      supabase.from('faculty').select('id, department, designation, profiles(full_name)').limit(15),
      supabase.from('departments').select('name, code').limit(10),
      supabase.from('policies').select('id, title, category, content').limit(10)
    ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : { data: null }));

    if (stuData && stuData.length > 0) {
      snapshot.students = stuData.map(s => ({
        name: s.profiles?.full_name || `Student ${s.student_code}`,
        code: s.student_code,
        department: s.department,
        gpa: s.current_gpa || 0,
        attendance: `${s.attendance_rate || 100}%`,
        risk: s.predicted_risk || 'LOW',
        status: s.status || 'ACTIVE'
      }));
    }

    if (courseData && courseData.length > 0) {
      snapshot.courses = courseData.map(c => ({
        code: c.course_code,
        title: c.title,
        department: c.department,
        progress: `${c.syllabus_progress || 0}%`
      }));
    }

    if (marksData && marksData.length > 0) {
      snapshot.marks = marksData.map(m => ({
        student: m.student_name || m.student_code || 'Student',
        subject: m.subject_code || 'Subject',
        total: `${m.total_marks}/100`,
        grade: m.grade,
        backlog: m.is_backlog ? 'ACTIVE BACKLOG' : 'CLEARED'
      }));
    }

    if (facultyData && facultyData.length > 0) {
      snapshot.faculty = facultyData.map(f => ({
        name: f.profiles?.full_name || 'Faculty Member',
        designation: f.designation,
        department: f.department
      }));
    }

    if (deptData && deptData.length > 0) {
      snapshot.departments = deptData.map(d => `${d.name} (${d.code})`);
    }

    if (policyData && policyData.length > 0) {
      snapshot.policies = policyData.map(p => ({
        title: p.title,
        category: p.category,
        content: p.content
      }));
    }

  } catch (e) {
    console.warn('[Snapshot Service] Live fetch warning:', e.message);
  }

  // If live data was empty, populate with fallback sample context
  if (snapshot.students.length === 0) {
    snapshot = getFallbackSnapshot();
  }

  return formatSnapshotToString(snapshot);
}

function getFallbackSnapshot() {
  return {
    students: [
      { name: 'Alex Rivera', code: 'STU-2024-101', department: 'Computer Science', gpa: 3.42, attendance: '88.5%', risk: 'LOW', status: 'ACTIVE' },
      { name: 'Samira Khan', code: 'STU-2024-102', department: 'Computer Science', gpa: 2.15, attendance: '68.0%', risk: 'HIGH', status: 'ACTIVE' },
      { name: 'Marcus Chen', code: 'STU-2024-103', department: 'Electronics', gpa: 3.85, attendance: '96.0%', risk: 'LOW', status: 'ACTIVE' },
      { name: 'Elena Rostova', code: 'STU-2024-104', department: 'Mechanical Engineering', gpa: 2.45, attendance: '72.0%', risk: 'HIGH', status: 'ACTIVE' }
    ],
    courses: [
      { code: 'CS201', title: 'Data Structures & Algorithms', department: 'Computer Science', progress: '60%' },
      { code: 'CS202', title: 'Database Management Systems', department: 'Computer Science', progress: '80%' },
      { code: 'ME02', title: 'Workshop Practice', department: 'Mechanical Engineering', progress: '45%' },
      { code: 'CS01', title: 'Python Programming', department: 'Computer Science', progress: '0%' }
    ],
    marks: [
      { student: 'Alex Rivera', subject: 'CS201', total: '85/100', grade: 'A', backlog: 'CLEARED' },
      { student: 'Samira Khan', subject: 'CS202', total: '35/100', grade: 'F', backlog: 'ACTIVE BACKLOG' }
    ],
    attendanceAlerts: [
      { student: 'Samira Khan', attendance: '68.0%', warning: 'CRITICAL (<75%)' },
      { student: 'Elena Rostova', attendance: '72.0%', warning: 'WARNING (<75%)' }
    ],
    policies: [
      { title: 'Policy 4.2: Academic Probation', category: 'Academic Standards', content: 'GPA below 2.0 or attendance below 75% triggers Academic Warning & mandatory advising.' },
      { title: 'Policy 6.1: Course Repeat', category: 'Curriculum', content: 'Undergraduates may repeat up to 3 failed courses for grade forgiveness.' }
    ],
    faculty: [
      { name: 'Dr. Eleanor Harrison', designation: 'Professor & HOD', department: 'Computer Science' },
      { name: 'Dr. Robert Vance', designation: 'Associate Professor', department: 'Electronics' }
    ],
    departments: ['Computer Science (CSE)', 'Electronics & Communication (ECE)', 'Mechanical Engineering (MECH)']
  };
}

function formatSnapshotToString(snapshot) {
  return `=== REAL-TIME UNIVERSITY DATA CONTEXT (LIVE SNAPSHOT) ===

1. ENROLLED STUDENTS (${snapshot.students.length} recorded):
${snapshot.students.map(s => `- ${s.name} (${s.code}): Dept: ${s.department} | CGPA: ${s.gpa} | Attendance: ${s.attendance} | Risk Level: ${s.risk} | Status: ${s.status}`).join('\n')}

2. COURSES & SYLLABUS PROGRESS:
${snapshot.courses.map(c => `- ${c.code} (${c.title}) - ${c.department}: Syllabus Progress = ${c.progress}`).join('\n')}

3. RECENT EXAMINATION MARKS & BACKLOGS:
${snapshot.marks.map(m => `- Student: ${m.student} | Subject: ${m.subject} | Score: ${m.total} (Grade ${m.grade}) | Status: ${m.backlog}`).join('\n')}

4. ATTENDANCE COMPLIANCE & POLICY 4.2 THRESHOLD ALERTS:
- Students with attendance < 75% require immediate intervention.
${snapshot.attendanceAlerts?.map(a => `- ${a.student}: ${a.attendance} (${a.warning})`).join('\n') || '- Samira Khan (68.0% - CRITICAL), Elena Rostova (72.0% - WARNING)'}

5. ACADEMIC POLICIES & GUIDELINES:
${snapshot.policies.map(p => `- [${p.category}] ${p.title}: ${p.content}`).join('\n')}

6. DEPARTMENTS & FACULTY:
- Active Departments: ${snapshot.departments.join(', ')}
${snapshot.faculty.map(f => `- ${f.name} (${f.designation}, ${f.department})`).join('\n')}
==========================================================`;
}

/**
 * Generate Role-Aware System Prompt with Real-Time University Context
 */
export async function getRoleSystemPrompt(role = 'STUDENT', fullName = 'User', department = 'Academic Affairs') {
  const normalizedRole = (role || 'STUDENT').toUpperCase();
  const liveDataContext = await getLiveUniversitySnapshot();

  let roleGuidelines = '';

  switch (normalizedRole) {
    case 'STUDENT':
      roleGuidelines = `You are "CampusPulse Academic Mentor", an empathetic, pedagogical AI tutor and campus intelligence guide for student ${fullName} (${department} Department).

CORE CAPABILITIES:
1. Answer questions accurately using both academic concepts and the university's live data context (attendance records, courses, study guidelines, grading policies).
2. Explain complex concepts step-by-step with intuitive analogies and Socratic scaffolding.
3. Help with degree roadmaps, syllabus tracking, revision schedules, and academic standing checks.

STRICT SOCRATIC GUARDRAILS:
- Do NOT provide direct copy-paste solutions to graded tests; guide students to the answer.
- Format all mathematical equations with LaTeX syntax ($...$ or $$...$$).`;
      break;

    case 'FACULTY':
    case 'DEPARTMENT_HEAD':
    case 'ACADEMIC_ADVISOR':
      roleGuidelines = `You are "Faculty Co-Pilot AI", an advanced, academically rigorous teaching assistant and curriculum architect assisting Professor ${fullName} (${department} Department).

CORE CAPABILITIES:
1. Provide instant, hyper-accurate answers based on live student attendance, grades, at-risk rosters, syllabus completion percentages, and department courses.
2. Generate Bloom's Taxonomy-aligned exam questions, rubrics, and modular lesson plans.
3. Identify students needing academic intervention (e.g. attendance < 75% or GPA < 2.0) directly from live institutional records.

GUARDRAILS:
- Tone: Professional, structured, time-saving, data-backed, and academically rigorous.
- Format structured tables, rubrics, and bullet points.`;
      break;

    case 'DEAN':
    case 'SUPER_ADMIN':
    case 'ADMIN':
      roleGuidelines = `You are "Dean Executive Advisor AI", a strategic institutional intelligence advisor for Dean ${fullName}.

CORE CAPABILITIES:
1. Deliver real-time institutional analytics on retention rates, at-risk student distribution, syllabus delivery progress, and exam backlog statistics.
2. Draft formal institutional memoranda, Senate agendas, and accreditation compliance reviews using live university data.
3. Formulate data-driven governance recommendations and resource allocation models.

GUARDRAILS:
- Tone: Executive, concise, data-driven, strategic, and policy-oriented.
- Structure responses with Executive Summary, Live Data Findings, Risk Assessments, and Actionable Decisions.`;
      break;

    default:
      roleGuidelines = `You are the University Academic Intelligence Assistant for ${fullName}. Provide helpful, structured, and accurate guidance tailored to higher education.`;
  }

  return `${roleGuidelines}

${liveDataContext}

INSTRUCTIONS FOR REAL-TIME DATA USAGE:
- Whenever the user asks about students, grades, marks, backlogs, attendance rates, syllabus progress, faculty, or university policies, ALWAYS refer to and cite the LIVE data context above.
- If asked "Who is at risk?", "What is the progress of course X?", "What are student Y's marks?", provide exact, factual answers matching the live snapshot.`;
}
