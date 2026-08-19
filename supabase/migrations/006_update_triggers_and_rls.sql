-- Migration 006: Automated updated_at triggers, Role Escalation Protection, and Strict RLS Update Policies
-- File: /supabase/migrations/006_update_triggers_and_rls.sql

-- 1. Create Reusable PostgreSQL Function for Automated updated_at Timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create User Preferences Table (if not existing)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_warnings BOOLEAN DEFAULT TRUE,
  risk_escalations BOOLEAN DEFAULT TRUE,
  weekly_digest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Attach BEFORE UPDATE Triggers for Automatic Timestamp Updates
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_faculty_updated_at ON public.faculty;
CREATE TRIGGER trg_faculty_updated_at
  BEFORE UPDATE ON public.faculty
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Role Escalation Prevention Guard Trigger
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent non-SUPER_ADMIN users from changing their role
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' NOT IN ('SUPER_ADMIN', 'service_role') THEN
      RAISE EXCEPTION 'Unauthorized: Role modification is restricted to Administrators.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 5. Enable RLS on User Preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 6. Strict RLS UPDATE Policies
-- Profiles: Users update their own profile; Super Admin updates any
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid()::text OR (SELECT role FROM public.profiles WHERE id = auth.uid()::text) = 'SUPER_ADMIN')
  WITH CHECK (id = auth.uid()::text OR (SELECT role FROM public.profiles WHERE id = auth.uid()::text) = 'SUPER_ADMIN');

-- User Preferences: Users manage their own preferences
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE
  USING (user_id = auth.uid()::text OR id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text OR id = auth.uid()::text);

-- Students: Staff can update performance metrics
DROP POLICY IF EXISTS "Staff can update student records" ON public.students;
CREATE POLICY "Staff can update student records" ON public.students
  FOR UPDATE
  USING (
    user_id = auth.uid()::text OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()::text) IN ('SUPER_ADMIN', 'DEAN', 'FACULTY', 'ACADEMIC_ADVISOR')
  )
  WITH CHECK (
    user_id = auth.uid()::text OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()::text) IN ('SUPER_ADMIN', 'DEAN', 'FACULTY', 'ACADEMIC_ADVISOR')
  );

-- Enable Supabase Realtime for profiles and user_preferences
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_preferences;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
