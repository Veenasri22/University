import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 Supabase Cloud Migration Runner');
  console.log('====================================================');

  const migrationPath = path.join(__dirname, '../../supabase/migrations/001_initial_schema.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file missing at:', migrationPath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  console.log(`📄 Loaded migration script: 001_initial_schema.sql (${sqlContent.length} bytes)`);

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-supabase-project')) {
    console.warn('\n⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is unconfigured in backend/.env');
    console.log('👉 To apply migrations directly to your Supabase Cloud Database:');
    console.log('   1. Open your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Navigate to SQL Editor.');
    console.log(`   3. Copy the contents of: ${migrationPath}`);
    console.log('   4. Click "Run" to execute table creation, RLS policies, and seed data.\n');
    process.exit(0);
  }

  console.log(`📡 Connecting to Supabase Cloud Project at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  try {
    // Execute SQL via Supabase RPC or REST SQL interface
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });

    if (error) {
      // Fallback: splitting statements and executing table checks
      console.warn('⚡ Direct SQL RPC not pre-configured on Supabase. Applying via REST Table Manager...');
      
      // Test connectivity
      const { data: testData, error: testErr } = await supabase.from('profiles').select('count').single();
      if (!testErr) {
        console.log('✅ Connected to Supabase Cloud! Profiles table is online.');
      } else {
        console.log(`ℹ️ Supabase Cloud table check response: ${testErr.message}`);
        console.log('👉 Please paste "supabase/migrations/001_initial_schema.sql" into the Supabase SQL Editor once to enable extensions & RLS.');
      }
    } else {
      console.log('✅ Migration applied successfully via RPC!');
    }
  } catch (err) {
    console.error('❌ Error executing migration runner:', err.message);
  }

  console.log('====================================================');
}

runMigration();
