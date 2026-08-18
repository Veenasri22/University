import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-supabase-project')) {
  console.log('⚠️ Supabase unconfigured or placeholder keys.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function clearData() {
  console.log('====================================================');
  console.log('🧹 Clearing all dummy data from Supabase Cloud...');
  console.log('====================================================');

  try {
    // Delete dependent tables first
    const { error: e1 } = await supabase.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared attendance_records:', e1 ? e1.message : 'OK');

    const { error: e2 } = await supabase.from('student_attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared student_attendance:', e2 ? e2.message : 'OK');

    const { error: e3 } = await supabase.from('course_syllabus').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared course_syllabus:', e3 ? e3.message : 'OK');

    const { error: e4 } = await supabase.from('advisory_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared advisory_records:', e4 ? e4.message : 'OK');

    const { error: e5 } = await supabase.from('ai_generated_advisories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared ai_generated_advisories:', e5 ? e5.message : 'OK');

    const { error: e6 } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared students:', e6 ? e6.message : 'OK');

    const { error: e7 } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared courses:', e7 ? e7.message : 'OK');

    const { error: e8 } = await supabase.from('faculty').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared faculty:', e8 ? e8.message : 'OK');

    // Optionally keep profiles or clear non-admin profiles
    const { error: e9 } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared profiles:', e9 ? e9.message : 'OK');

    console.log('====================================================');
    console.log('✅ Supabase Cloud database is now completely clean!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Error clearing Supabase data:', err.message);
  }
}

clearData().then(() => process.exit(0));
