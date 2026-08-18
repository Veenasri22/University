import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { mockStore } from '../services/mockStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-supabase-project')) {
  console.log('[Seed] Supabase unconfigured or placeholder keys. Skipping cloud seed.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

export async function seedDatabase() {
  console.log('====================================================');
  console.log('🌱 Supabase Cloud Data Seeder');
  console.log('====================================================');

  try {
    // 1. Seed Courses
    const { data: existingCourses, error: courseCheckErr } = await supabase.from('courses').select('id');
    if (!courseCheckErr && (!existingCourses || existingCourses.length === 0)) {
      console.log('📦 Seeding courses table...');
      const coursesToInsert = mockStore.courses.map(c => {
        const item = {
          course_code: c.course_code,
          title: c.title,
          department: c.department,
          credits: c.credits,
          syllabus_progress: c.syllabus_progress,
          learning_outcomes: c.learning_outcomes,
          prerequisites: c.prerequisites || []
        };
        if (c.id && c.id.length === 36) item.id = c.id;
        return item;
      });
      const { error: insertCourseErr } = await supabase.from('courses').upsert(coursesToInsert, { onConflict: 'course_code' });
      if (insertCourseErr) {
        console.warn('⚠️ Error seeding courses:', insertCourseErr.message);
      } else {
        console.log('✅ Courses seeded successfully.');
      }
    } else {
      console.log(`ℹ️ Courses table already contains ${existingCourses?.length || 0} records.`);
    }

    // 2. Seed Faculty
    const { data: existingFaculty, error: facCheckErr } = await supabase.from('faculty').select('id');
    if (!facCheckErr && (!existingFaculty || existingFaculty.length === 0)) {
      console.log('👨‍🏫 Seeding faculty table...');
      const facultyToInsert = mockStore.faculty.map(f => ({
        id: f.id.length === 36 ? f.id : undefined,
        department: f.department,
        designation: f.designation,
        workload_hours: f.workload_hours,
        max_workload_hours: f.max_workload_hours || 40,
        teaching_rating: f.teaching_rating,
        research_publications: f.research_publications,
        courses_taught: f.courses_taught || [],
        evaluation_sentiment: f.evaluation_sentiment || null
      }));
      const { error: insertFacErr } = await supabase.from('faculty').insert(facultyToInsert);
      if (insertFacErr) {
        console.warn('⚠️ Error seeding faculty:', insertFacErr.message);
      } else {
        console.log('✅ Faculty seeded successfully.');
      }
    } else {
      console.log(`ℹ️ Faculty table already contains ${existingFaculty?.length || 0} records.`);
    }

    // 3. Seed Students
    const { data: existingStudents, error: stuCheckErr } = await supabase.from('students').select('id');
    if (!stuCheckErr && (!existingStudents || existingStudents.length === 0)) {
      console.log('🎓 Seeding students table...');
      const studentsToInsert = mockStore.students.map(s => ({
        student_code: s.student_code,
        department: s.department,
        enrollment_year: s.enrollment_year,
        current_gpa: s.current_gpa,
        attendance_rate: s.attendance_rate,
        credits_earned: s.credits_earned,
        credits_required: s.credits_required || 120,
        predicted_risk: s.predicted_risk,
        status: s.status,
        advisor_notes: s.advisor_notes || null,
        gpa_history: s.gpa_history || []
      }));
      const { error: insertStuErr } = await supabase.from('students').upsert(studentsToInsert, { onConflict: 'student_code' });
      if (insertStuErr) {
        console.warn('⚠️ Error seeding students:', insertStuErr.message);
      } else {
        console.log('✅ Students seeded successfully.');
      }
    } else {
      console.log(`ℹ️ Students table already contains ${existingStudents?.length || 0} records.`);
    }

    // 4. Seed Attendance Records
    const { data: existingAtt, error: attCheckErr } = await supabase.from('attendance_records').select('id');
    if (!attCheckErr && (!existingAtt || existingAtt.length === 0)) {
      console.log('📋 Seeding attendance_records table...');
      const attToInsert = mockStore.attendance_logs.map(a => ({
        course_code: a.course_code,
        student_name: a.student_name,
        department: a.department,
        date: a.date,
        status: (a.status || 'PRESENT').toUpperCase()
      }));
      const { error: insertAttErr } = await supabase.from('attendance_records').insert(attToInsert);
      if (insertAttErr) {
        console.warn('⚠️ Error seeding attendance_records:', insertAttErr.message);
      } else {
        console.log('✅ Attendance records seeded successfully.');
      }
    } else {
      console.log(`ℹ️ Attendance records table contains ${existingAtt?.length || 0} records.`);
    }

    // 5. Seed Course Syllabus
    const { data: existingSyl, error: sylCheckErr } = await supabase.from('course_syllabus').select('id');
    if (!sylCheckErr && (!existingSyl || existingSyl.length === 0)) {
      console.log('📚 Seeding course_syllabus table...');
      // Get real course & faculty IDs from database
      const { data: dbCourses } = await supabase.from('courses').select('id, course_code');
      const { data: dbFaculty } = await supabase.from('faculty').select('id').limit(1);

      const defaultCourseId = dbCourses && dbCourses.length > 0 ? dbCourses[0].id : '00000000-0000-0000-0000-000000000000';
      const defaultFacultyId = dbFaculty && dbFaculty.length > 0 ? dbFaculty[0].id : '00000000-0000-0000-0000-000000000000';

      const sylToInsert = mockStore.course_syllabus.map(s => {
        const foundCourse = dbCourses?.find(c => c.course_code === s.course_id || c.id === s.course_id);
        return {
          course_id: foundCourse ? foundCourse.id : defaultCourseId,
          faculty_id: defaultFacultyId,
          unit_title: s.unit_title,
          topics_covered: s.topics_covered,
          completion_percentage: s.completion_percentage,
          status: s.status
        };
      });

      const { error: insertSylErr } = await supabase.from('course_syllabus').insert(sylToInsert);
      if (insertSylErr) {
        console.warn('⚠️ Error seeding course_syllabus:', insertSylErr.message);
      } else {
        console.log('✅ Course syllabus seeded successfully.');
      }
    } else {
      console.log(`ℹ️ Course syllabus table contains ${existingSyl?.length || 0} records.`);
    }

  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  }
  console.log('====================================================');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
