import { createStudent, getStudents } from '../controllers/studentController.js';
import { createFaculty, getFaculty } from '../controllers/facultyController.js';
import { createCourse, getCourses } from '../controllers/courseController.js';
import { logAttendance, getAttendanceLogs } from '../controllers/attendanceController.js';
import { supabase } from '../config/db.js';

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.data = payload; return this; }
  };
  return res;
}

async function testUserWorkflow() {
  console.log('====================================================');
  console.log('🧪 Testing User Data Creation Workflow in Supabase');
  console.log('====================================================');

  try {
    // 1. Fetch initially (should be empty 0 records)
    const resStu0 = mockRes();
    await getStudents({ query: {} }, resStu0, e => { throw e; });
    console.log('Initial Students Count:', resStu0.data.count);

    const resFac0 = mockRes();
    await getFaculty({ query: {} }, resFac0, e => { throw e; });
    console.log('Initial Faculty Count:', resFac0.data.count);

    const resCrs0 = mockRes();
    await getCourses({ query: {} }, resCrs0, e => { throw e; });
    console.log('Initial Courses Count:', resCrs0.data.count);

    // 2. Add User's Custom Course
    console.log('\n--- Adding Custom Course ---');
    const resCrs1 = mockRes();
    await createCourse({
      body: {
        course_code: 'AI301',
        title: 'Artificial Intelligence & Neural Networks',
        department: 'Computer Science',
        credits: 4,
        prerequisites: 'CS201',
        learning_outcomes: 'Deep Learning, Transformers, RAG Systems'
      }
    }, resCrs1, e => { throw e; });
    console.log('Created Course:', resCrs1.data.message, 'ID:', resCrs1.data.course.id);

    // 3. Add User's Custom Faculty
    console.log('\n--- Adding Custom Faculty ---');
    const resFac1 = mockRes();
    await createFaculty({
      body: {
        full_name: 'Dr. Sarah Connor',
        email: 'sarah.connor@university.edu',
        department: 'Computer Science',
        designation: 'Professor',
        workload_hours: 15,
        teaching_rating: 4.9,
        courses_taught: 'AI301'
      }
    }, resFac1, e => { throw e; });
    console.log('Created Faculty:', resFac1.data.message, 'ID:', resFac1.data.faculty.id);

    // 4. Enroll User's Custom Student
    console.log('\n--- Enrolling Custom Student ---');
    const resStu1 = mockRes();
    await createStudent({
      body: {
        student_code: 'STU-2026-999',
        full_name: 'John Doe',
        email: 'john.doe@student.university.edu',
        department: 'Computer Science',
        enrollment_year: 2026,
        current_gpa: 3.85,
        attendance_rate: 98.0,
        credits_earned: 60
      }
    }, resStu1, e => { throw e; });
    console.log('Created Student:', resStu1.data.message, 'ID:', resStu1.data.student.id);

    // 5. Log Attendance for the new Student
    console.log('\n--- Logging Attendance ---');
    const resAtt1 = mockRes();
    await logAttendance({
      body: {
        course_code: 'AI301',
        student_id: resStu1.data.student.id,
        student_name: 'John Doe',
        status: 'PRESENT',
        department: 'Computer Science'
      }
    }, resAtt1, e => { throw e; });
    console.log('Logged Attendance:', resAtt1.data.message);

    // 6. Verify Fetching User's Data
    console.log('\n--- Verifying Custom Data Retrieval ---');
    const resStuFinal = mockRes();
    await getStudents({ query: {} }, resStuFinal, e => { throw e; });
    console.log('✅ Final Students in Supabase:', resStuFinal.data.students.map(s => `${s.full_name} (${s.student_code})`));

    const resFacFinal = mockRes();
    await getFaculty({ query: {} }, resFacFinal, e => { throw e; });
    console.log('✅ Final Faculty in Supabase:', resFacFinal.data.faculty.map(f => `${f.full_name} (${f.designation})`));

    const resCrsFinal = mockRes();
    await getCourses({ query: {} }, resCrsFinal, e => { throw e; });
    console.log('✅ Final Courses in Supabase:', resCrsFinal.data.courses.map(c => `${c.title} (${c.course_code})`));

  } catch (err) {
    console.error('❌ Error testing workflow:', err);
  }
  process.exit(0);
}

testUserWorkflow();
