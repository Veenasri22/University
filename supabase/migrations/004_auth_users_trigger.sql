-- Migration: 004_auth_users_trigger.sql
-- Automatic Sync between Supabase Auth (auth.users) and Public Schema (public.profiles & public.students)

-- 1. Ensure public.profiles references auth.users(id) and password_hash is optional
ALTER TABLE public.profiles 
  ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Function to automatically create profile and student entry upon Supabase Auth sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role_val user_role;
BEGIN
  -- Parse user role from metadata or default to STUDENT
  BEGIN
    user_role_val := (new.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    user_role_val := 'STUDENT'::user_role;
  END;

  IF user_role_val IS NULL THEN
    user_role_val := 'STUDENT'::user_role;
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    department,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    user_role_val,
    COALESCE(new.raw_user_meta_data->>'department', 'Computer Science'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  -- If role is STUDENT, automatically create entry in public.students table
  IF user_role_val = 'STUDENT'::user_role THEN
    INSERT INTO public.students (
      user_id,
      student_code,
      department,
      enrollment_year,
      current_gpa,
      attendance_rate,
      status
    )
    VALUES (
      new.id,
      'STU-' || EXTRACT(YEAR FROM NOW())::text || '-' || floor(random() * 8999 + 1000)::text,
      COALESCE(new.raw_user_meta_data->>'department', 'Computer Science'),
      EXTRACT(YEAR FROM NOW())::int,
      3.20,
      90.0,
      'ACTIVE'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- 3. Create Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
