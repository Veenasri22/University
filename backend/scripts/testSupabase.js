import { register, login } from '../controllers/authController.js';
import { getStudents } from '../controllers/studentController.js';

async function testAuthAndStudentCreation() {
  console.log('--- TESTING USER REGISTRATION ---');

  const regEmail = `newuser.${Date.now().toString().slice(-4)}@student.university.edu`;
  const reqReg = {
    body: {
      email: regEmail,
      password: 'password123',
      full_name: 'New Registered Student',
      role: 'STUDENT',
      department: 'Computer Science'
    }
  };

  const resReg = {
    status: (code) => ({
      json: (data) => console.log(`Register status ${code}:`, data)
    }),
    json: (data) => console.log('Register response:', data)
  };

  await register(reqReg, resReg, console.error);

  console.log('\n--- VERIFYING STUDENTS TABLE AFTER REGISTRATION ---');
  const reqGet = { query: {} };
  const resGet = {
    json: (data) => console.log('Total students in Supabase DB now:', data.count, data.students.map(s => ({ id: s.id, code: s.student_code, name: s.full_name, email: s.email })))
  };
  await getStudents(reqGet, resGet, console.error);
}

testAuthAndStudentCreation();
