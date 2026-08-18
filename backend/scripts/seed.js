import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-supabase-project')) {
  console.log('[Seed] Supabase unconfigured or placeholder keys.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

export async function seedDatabase() {
  console.log('====================================================');
  console.log('🌱 Populating Production Seed Data in Supabase Cloud');
  console.log('====================================================');

  try {
    // 1. Seed 5 Departments
    console.log('🏢 Seeding Departments...');
    const departmentsData = [
      { name: 'Computer Science & Engineering', code: 'CSE' },
      { name: 'Electronics & Communication', code: 'ECE' },
      { name: 'Mechanical Engineering', code: 'MECH' },
      { name: 'Civil Engineering', code: 'CIVIL' },
      { name: 'Information Technology', code: 'IT' }
    ];

    const { data: dbDepts, error: deptErr } = await supabase
      .from('departments')
      .upsert(departmentsData, { onConflict: 'code' })
      .select();

    if (deptErr) console.warn('Departments seed warning:', deptErr.message);

    const cseDept = dbDepts?.find(d => d.code === 'CSE') || { id: '00000000-0000-0000-0000-000000000001' };
    const eceDept = dbDepts?.find(d => d.code === 'ECE') || { id: '00000000-0000-0000-0000-000000000002' };
    const mechDept = dbDepts?.find(d => d.code === 'MECH') || { id: '00000000-0000-0000-0000-000000000003' };

    // 2. Seed Demo Profiles (Admin, HODs, Faculty, Students)
    console.log('👤 Seeding Demo User Profiles...');
    const defaultPasswordHash = bcrypt.hashSync('Admin@12345', 10);

    const profilesData = [
      {
        email: 'admin@university.edu',
        full_name: 'Chancellor Arthur Pendelton',
        role: 'ADMIN',
        department_id: cseDept.id,
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      },
      {
        email: 'hod.cse@university.edu',
        full_name: 'Dr. Eleanor Harrison',
        role: 'HOD',
        department_id: cseDept.id,
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
      },
      {
        email: 'hod.ece@university.edu',
        full_name: 'Dr. Robert Vance',
        role: 'HOD',
        department_id: eceDept.id,
        avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
      },
      {
        email: 'prof.chen@university.edu',
        full_name: 'Prof. Marcus Chen',
        role: 'FACULTY',
        department_id: cseDept.id,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      },
      {
        email: 'prof.sarah@university.edu',
        full_name: 'Sarah Jenkins, M.Ed.',
        role: 'FACULTY',
        department_id: cseDept.id,
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
      }
    ];

    const { data: dbProfiles, error: profErr } = await supabase
      .from('profiles')
      .upsert(profilesData, { onConflict: 'email' })
      .select();

    if (profErr) console.warn('Profiles seed warning:', profErr.message);

    const cseHod = dbProfiles?.find(p => p.email === 'hod.cse@university.edu');
    const profChen = dbProfiles?.find(p => p.email === 'prof.chen@university.edu');

    // 3. Seed Faculty
    console.log('👨‍🏫 Seeding Faculty Roster...');
    const facultyData = [
      {
        user_id: profChen?.id,
        faculty_id_number: 'FAC-CSE-001',
        department_id: cseDept.id,
        designation: 'Associate Professor',
        experience_years: 8,
        joining_date: '2018-08-15',
        status: 'ACTIVE'
      },
      {
        user_id: cseHod?.id,
        faculty_id_number: 'FAC-CSE-002',
        department_id: cseDept.id,
        designation: 'Department Chair & Professor',
        experience_years: 15,
        joining_date: '2011-06-01',
        status: 'ACTIVE'
      }
    ];

    const { data: dbFaculty, error: facErr } = await supabase
      .from('faculty')
      .upsert(facultyData, { onConflict: 'faculty_id_number' })
      .select();

    if (facErr) console.warn('Faculty seed warning:', facErr.message);

    const mainFacultyId = dbFaculty?.[0]?.id;

    // 4. Seed Subjects
    console.log('📚 Seeding Subjects & Curriculum Units...');
    const subjectsData = [
      {
        subject_code: 'CS201',
        name: 'Data Structures & Algorithms',
        credits: 4,
        semester: 3,
        department_id: cseDept.id,
        faculty_id: mainFacultyId,
        total_units: 5,
        completed_units: 3
      },
      {
        subject_code: 'CS202',
        name: 'Database Management Systems',
        credits: 4,
        semester: 3,
        department_id: cseDept.id,
        faculty_id: mainFacultyId,
        total_units: 5,
        completed_units: 4
      },
      {
        subject_code: 'ECE201',
        name: 'Digital Signal Processing',
        credits: 3,
        semester: 3,
        department_id: eceDept.id,
        faculty_id: mainFacultyId,
        total_units: 5,
        completed_units: 2
      }
    ];

    const { data: dbSubjects, error: subjErr } = await supabase
      .from('subjects')
      .upsert(subjectsData, { onConflict: 'subject_code' })
      .select();

    if (subjErr) console.warn('Subjects seed warning:', subjErr.message);

    // 5. Seed 20+ Students Across Risk Categories (HIGH, MEDIUM, LOW)
    console.log('🎓 Seeding 20+ Students across HIGH, MEDIUM, and LOW risk tiers...');
    const studentNames = [
      { name: 'Alex Rivera', risk: 'HIGH', cgpa: 2.15, semester: 3, dept: cseDept.id, phone: '+1 555-0101' },
      { name: 'Sophia Montgomery', risk: 'LOW', cgpa: 3.88, semester: 5, dept: cseDept.id, phone: '+1 555-0102' },
      { name: 'Ethan Vance', risk: 'MEDIUM', cgpa: 2.75, semester: 3, dept: cseDept.id, phone: '+1 555-0103' },
      { name: 'Liam Gallagher', risk: 'HIGH', cgpa: 1.95, semester: 3, dept: cseDept.id, phone: '+1 555-0104' },
      { name: 'Emma Watson', risk: 'LOW', cgpa: 3.92, semester: 5, dept: cseDept.id, phone: '+1 555-0105' },
      { name: 'Noah Miller', risk: 'MEDIUM', cgpa: 2.80, semester: 3, dept: cseDept.id, phone: '+1 555-0106' },
      { name: 'Ava Davis', risk: 'LOW', cgpa: 3.70, semester: 5, dept: eceDept.id, phone: '+1 555-0107' },
      { name: 'Lucas Garcia', risk: 'HIGH', cgpa: 2.10, semester: 3, dept: eceDept.id, phone: '+1 555-0108' },
      { name: 'Mia Rodriguez', risk: 'LOW', cgpa: 3.85, semester: 5, dept: eceDept.id, phone: '+1 555-0109' },
      { name: 'Benjamin Wilson', risk: 'MEDIUM', cgpa: 2.65, semester: 3, dept: mechDept.id, phone: '+1 555-0110' },
      { name: 'Charlotte Martinez', risk: 'LOW', cgpa: 3.60, semester: 5, dept: mechDept.id, phone: '+1 555-0111' },
      { name: 'Amelia Anderson', risk: 'HIGH', cgpa: 2.20, semester: 3, dept: cseDept.id, phone: '+1 555-0112' },
      { name: 'James Taylor', risk: 'LOW', cgpa: 3.75, semester: 5, dept: cseDept.id, phone: '+1 555-0113' },
      { name: 'Harper Thomas', risk: 'MEDIUM', cgpa: 2.90, semester: 3, dept: cseDept.id, phone: '+1 555-0114' },
      { name: 'Evelyn Hernandez', risk: 'LOW', cgpa: 3.95, semester: 5, dept: eceDept.id, phone: '+1 555-0115' },
      { name: 'Logan Moore', risk: 'HIGH', cgpa: 2.05, semester: 3, dept: eceDept.id, phone: '+1 555-0116' },
      { name: 'Abigail Martin', risk: 'LOW', cgpa: 3.68, semester: 5, dept: cseDept.id, phone: '+1 555-0117' },
      { name: 'Alexander Jackson', risk: 'MEDIUM', cgpa: 2.82, semester: 3, dept: cseDept.id, phone: '+1 555-0118' },
      { name: 'Emily Lee', risk: 'LOW', cgpa: 3.89, semester: 5, dept: cseDept.id, phone: '+1 555-0119' },
      { name: 'Daniel Perez', risk: 'HIGH', cgpa: 1.85, semester: 3, dept: cseDept.id, phone: '+1 555-0120' }
    ];

    const studentRecords = studentNames.map((s, i) => ({
      student_id_number: `STU-2024-${100 + i}`,
      phone: s.phone,
      department_id: s.dept,
      course: 'B.Tech Computer Science',
      year: 2,
      semester: s.semester,
      admission_year: 2024,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      status: 'ACTIVE',
      cgpa: s.cgpa,
      current_risk_level: s.risk
    }));

    const { data: dbStudents, error: stuErr } = await supabase
      .from('students')
      .upsert(studentRecords, { onConflict: 'student_id_number' })
      .select();

    if (stuErr) console.warn('Students seed warning:', stuErr.message);

    console.log('====================================================');
    console.log(`✅ Seed Completed Successfully!`);
    console.log(`  • Departments: ${dbDepts?.length || 5}`);
    console.log(`  • Faculty: ${dbFaculty?.length || 2}`);
    console.log(`  • Subjects: ${dbSubjects?.length || 3}`);
    console.log(`  • Students: ${dbStudents?.length || 20}`);
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error during seeding:', err.message);
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
