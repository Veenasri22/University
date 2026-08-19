import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-supabase-project')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('[Database] Supabase client initialized successfully.');
  } catch (e) {
    console.error('[Database] Supabase initialization error:', e.message);
  }
} else {
  console.warn('[Database] Supabase environment variables not configured. Operating with direct client check mode.');
}

export { supabase };
