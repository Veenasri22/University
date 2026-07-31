
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-supabase-project.supabase.co') {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Database] Supabase client initialized.');
  } catch (e) {
    console.warn('[Database] Supabase init failed:', e.message);
  }
} else {
  console.log('[Database] Supabase URL/Key unconfigured. Operating in stateful local memory mode.');
}

export { supabase };
