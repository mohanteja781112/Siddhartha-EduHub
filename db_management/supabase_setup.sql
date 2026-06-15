-- ==============================================================================
-- UNIFIED SQL SETUP FOR SIDDHARTHA EDUHUB (PRODUCTION SECURE)
-- This single file contains EVERYTHING: Schema, Exams, Fees, and all bug fixes.
-- ==============================================================================

-- ==============================================================================
-- 1. CORE SCHEMA (Profiles & Students)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  is_active boolean DEFAULT true
);

-- Safely add columns if the table already exists from an older version
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  dob date NOT NULL, 
  full_name text NOT NULL,
  class text, 
  section text,
  roll_number text UNIQUE NOT NULL,
  parent_name text,
  status text DEFAULT 'Active',
  email text,
  phone text,
  address text,
  student_photo text,
  attendance_percentage integer DEFAULT 0,
  overall_marks integer DEFAULT 0,
  pending_fees integer DEFAULT 0,
  total_fees integer DEFAULT 0,
  previous_dues integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Safely add new columns if table already exists
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS previous_dues integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.student_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  marks_obtained integer NOT NULL,
  total_marks integer NOT NULL,
  exam_type text NOT NULL, 
  term text DEFAULT 'FA1',
  exam_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Safely add new columns to student_marks
ALTER TABLE public.student_marks ADD COLUMN IF NOT EXISTS term text DEFAULT 'FA1';

-- ==============================================================================
-- 2. FEES MANAGEMENT SCHEMA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  payment_type text DEFAULT 'Standard',
  payment_date timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Safely add payment_type to fee_payments
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'Standard';

-- ==============================================================================
-- 3. EXAMS SCHEMA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  class text NOT NULL,
  subject text NOT NULL,
  time_limit_minutes integer NOT NULL DEFAULT 30,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL,
  marks integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Drop the restrictive correct option check so we can support multiple formats
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_correct_option_check;

CREATE TABLE IF NOT EXISTS public.student_exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  total_marks_obtained integer NOT NULL DEFAULT 0,
  total_marks integer NOT NULL DEFAULT 0,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(exam_id, student_id)
);

-- ==============================================================================
-- 4. ROLE-BASED ACCESS CONTROL (RBAC) HELPER FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_teacher() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_student() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_results ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- PROFILES 
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- --------------------------------------------------------
-- STUDENTS
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Admins have full access to students" ON public.students;
CREATE POLICY "Admins have full access to students" ON public.students FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Students can view own profile" ON public.students;
CREATE POLICY "Students can view own profile" ON public.students FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can read students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view all students" ON public.students;
CREATE POLICY "Teachers can read students" ON public.students 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- --------------------------------------------------------
-- STUDENT MARKS
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Admins have full access to student_marks" ON public.student_marks;
CREATE POLICY "Admins have full access to student_marks" ON public.student_marks FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage student marks" ON public.student_marks;
CREATE POLICY "Teachers can manage student marks" ON public.student_marks FOR ALL USING (public.is_teacher());

DROP POLICY IF EXISTS "Students can view own marks" ON public.student_marks;
CREATE POLICY "Students can view own marks" ON public.student_marks FOR SELECT USING (
  student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
);

-- --------------------------------------------------------
-- FEE PAYMENTS
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Admins have full access to fee_payments" ON public.fee_payments;
CREATE POLICY "Admins have full access to fee_payments" ON public.fee_payments FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Students can view own fee payments" ON public.fee_payments;
CREATE POLICY "Students can view own fee payments" ON public.fee_payments FOR SELECT USING (
  student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
);

-- --------------------------------------------------------
-- EXAMS
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Admins have full access to exams" ON public.exams;
CREATE POLICY "Admins have full access to exams" ON public.exams FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage exams" ON public.exams;
CREATE POLICY "Teachers can manage exams" ON public.exams 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Students can view active exams for their class" ON public.exams;
CREATE POLICY "Students can view active exams for their class" ON public.exams FOR SELECT USING (
  is_active = true AND class = (SELECT class FROM public.students WHERE auth_user_id = auth.uid())
);

-- --------------------------------------------------------
-- QUESTIONS
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Admins have full access to questions" ON public.questions;
CREATE POLICY "Admins have full access to questions" ON public.questions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage questions" ON public.questions;
CREATE POLICY "Teachers can manage questions" ON public.questions 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Students can view questions for active exams" ON public.questions;
CREATE POLICY "Students can view questions for active exams" ON public.questions FOR SELECT USING (
  exam_id IN (SELECT id FROM public.exams WHERE is_active = true)
);

-- --------------------------------------------------------
-- STUDENT EXAM RESULTS
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Admins have full access to exam results" ON public.student_exam_results;
CREATE POLICY "Admins have full access to exam results" ON public.student_exam_results FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can view all exam results" ON public.student_exam_results;
CREATE POLICY "Teachers can view all exam results" ON public.student_exam_results FOR SELECT USING (public.is_teacher());

DROP POLICY IF EXISTS "Students can view own exam results" ON public.student_exam_results;
CREATE POLICY "Students can view own exam results" ON public.student_exam_results FOR SELECT USING (
  student_id = (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Students can insert own exam results" ON public.student_exam_results;
CREATE POLICY "Students can insert own exam results" ON public.student_exam_results FOR INSERT WITH CHECK (
  student_id = (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
);

-- ==============================================================================
-- 6. ADMIN PROFILE MIGRATION HELPER
-- ==============================================================================
INSERT INTO public.profiles (id, email, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin16@siddhartha.edu' LIMIT 1),
  'admin16@siddhartha.edu',
  'admin'
) ON CONFLICT DO NOTHING;

-- Update admin email if it's missing
UPDATE public.profiles SET email = 'admin16@siddhartha.edu' WHERE role = 'admin' AND email IS NULL;

-- ==============================================================================
-- 7. AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'student'); -- Defaults to student for safety
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 8. SECURE USER DELETION FUNCTION (RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.delete_admin_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Verify the caller is an admin
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;

  -- Delete from dependent tables first to avoid foreign key violations
  DELETE FROM public.students WHERE auth_user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete the user from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 9. ONE-TIME CLEANUP SCRIPT (Safe to run multiple times)
-- ==============================================================================
-- Deletes orphaned profiles
DELETE FROM public.profiles 
WHERE role = 'student' 
  AND id NOT IN (SELECT auth_user_id FROM public.students WHERE auth_user_id IS NOT NULL);

-- Deletes orphaned auth users
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
  AND id NOT IN (SELECT auth_user_id FROM public.students WHERE auth_user_id IS NOT NULL);
