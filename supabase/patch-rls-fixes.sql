-- ================================================================
-- HMS — Schema Patch: Missing INSERT Policies + Packages Fix
-- Run this in: Supabase Dashboard → SQL Editor
-- Run this AFTER the main schema.sql if you already applied it
-- ================================================================

-- 1. Allow authenticated users to CREATE a clinic (needed during signup)
DROP POLICY IF EXISTS "Authenticated users can create a clinic" ON public.clinics;
CREATE POLICY "Authenticated users can create a clinic"
  ON public.clinics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Allow users to INSERT their own profile row (fallback if trigger is slow)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3. Open package management to all clinic staff (not just admins)
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
DROP POLICY IF EXISTS "Clinic staff can manage packages" ON public.packages;
CREATE POLICY "Clinic staff can manage packages"
  ON public.packages FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- Done!
