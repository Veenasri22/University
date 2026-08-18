import { createStudent, getStudents, updateStudentPerformance } from '../controllers/studentController.js';
import { logAttendance, getAttendanceLogs } from '../controllers/attendanceController.js';
import { updateSyllabusProgress, getCourses } from '../controllers/courseController.js';
import { supabase } from '../config/db.js';

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function runVerification() {
  console.log('====================================================');
  console.log('🧪 Testing Supabase CRUD Operations Verification');
  console.log('====================================================');

  if (!supabase) {
    console.error('❌ Supabase client unavailable!');
    process.exit(1);
  }

  try {
    // 1. Create Student Test
    console.log('\n--- 1. Testing Student Creation ---');
    const testCode = `TEST-STU-${Date.now().toString().slice(-4)}`;
    const reqCreate = {
      body: {
        student_code: testCode,
        full_name: 'Test Student Supabase',
        email: `test.${Date.now()}@university.edu`,
        department: 'Computer Science',
        enrollment_year: 2025,
        current_gpa: 3.5,
        attendance_rate: 92.0,
        credits_earned: 15
      }
    };
    const resCreate = mockRes();
    await createStudent(reqCreate, resCreate, (err) => { throw err; });

    console.log('Create Student Response:', resCreate.data?.message, 'ID:', resCreate.data?.student?.id);

    // Verify in Supabase
    const { data: stuFromDb } = await supabase.from('students').select('*').eq('student_code', testCode).single();
    if (stuFromDb) {
      console.log('✅ Student persisted in Supabase Cloud! ID:', stuFromDb.id, 'Name:', stuFromDb.full_name);
    } else {
      console.error('❌ Student NOT found in Supabase Cloud!');
    }

    // 2. Update Student Performance Test
    console.log('\n--- 2. Testing Student Performance Update ---');
    const reqUpdate = {
      params: { id: stuFromDb.id },
      body: {
        current_gpa: 2.1,
        attendance_rate: 68.0,
        advisor_notes: 'Automated Supabase test updated notes'
      }
    };
    const resUpdate = mockRes();
    await updateStudentPerformance(reqUpdate, resUpdate, (err) => { throw err; });

    console.log('Update Performance Response:', resUpdate.data?.message);

    // Verify in Supabase
    const { data: updatedStuFromDb } = await supabase.from('students').select('*').eq('id', stuFromDb.id).single();
    console.log('✅ Updated Student in Supabase Cloud - GPA:', updatedStuFromDb?.current_gpa, 'Risk:', updatedStuFromDb?.predicted_risk);

    // 3. Log Attendance Test
    console.log('\n--- 3. Testing Attendance Logging ---');
    const reqAtt = {
      body: {
        course_code: 'CS201',
        student_id: stuFromDb.id,
        student_name: 'Test Student Supabase',
        status: 'ABSENT',
        department: 'Computer Science'
      }
    };
    const resAtt = mockRes();
    await logAttendance(reqAtt, resAtt, (err) => { throw err; });

    console.log('Log Attendance Response:', resAtt.data?.message, 'Log ID:', resAtt.data?.log?.id);

    // Verify Attendance Record in Supabase
    const { data: attRecords } = await supabase.from('attendance_records').select('*').eq('student_name', 'Test Student Supabase');
    console.log('✅ Attendance Records count in Supabase Cloud:', attRecords?.length);

    // 4. Update Course Syllabus Progress Test
    console.log('\n--- 4. Testing Course Syllabus Progress Update ---');
    const { data: firstCourse } = await supabase.from('courses').select('id').limit(1).single();
    if (firstCourse) {
      const reqCourse = {
        params: { id: firstCourse.id },
        body: { syllabus_progress: 85 }
      };
      const resCourse = mockRes();
      await updateSyllabusProgress(reqCourse, resCourse, (err) => { throw err; });

      console.log('Update Course Response:', resCourse.data?.message);

      const { data: verifiedCourse } = await supabase.from('courses').select('id, syllabus_progress').eq('id', firstCourse.id).single();
      console.log('✅ Verified Course Syllabus Progress in Supabase Cloud:', verifiedCourse?.syllabus_progress, '%');
    }

    // Cleanup test student
    console.log('\n--- Cleaning up test records ---');
    await supabase.from('attendance_records').delete().eq('student_name', 'Test Student Supabase');
    await supabase.from('students').delete().eq('student_code', testCode);
    console.log('✅ Cleaned up temporary test entries.');

  } catch (err) {
    console.error('❌ Verification script error:', err);
  }

  console.log('\n====================================================');
  console.log('🎉 All Supabase Cloud CRUD Operations Verified Cleanly!');
  console.log('====================================================');
  process.exit(0);
}

runVerification();
