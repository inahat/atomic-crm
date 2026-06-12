-- ROLLBACK SCRIPT FOR DELETE RESTRICTION MIGRATION
-- Run this SQL to restore original RLS policies in case of any issues.

-- 1. Restore public.companies policies
DROP POLICY IF EXISTS "Company Delete Policy" ON public.companies;
CREATE POLICY "Company Delete Policy" ON public.companies FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.companies;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.companies;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.companies;
CREATE POLICY "Enable write access for authenticated users" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Restore public.contacts policies
DROP POLICY IF EXISTS "Contact Delete Policy" ON public.contacts;
CREATE POLICY "Contact Delete Policy" ON public.contacts FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.contacts;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.contacts;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.contacts;
CREATE POLICY "Enable write access for authenticated users" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Restore public.contracts policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.contracts;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.contracts;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON public.contracts;
DROP POLICY IF EXISTS "All access" ON public.contracts;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.contracts;

CREATE POLICY "All access" ON public.contracts FOR ALL USING (true);
CREATE POLICY "Enable write access for authenticated users" ON public.contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Restore public."contactNotes" policies
DROP POLICY IF EXISTS "Contact Notes Delete Policy" ON public."contactNotes";
CREATE POLICY "Contact Notes Delete Policy" ON public."contactNotes" FOR DELETE USING (true);

-- 5. Restore public."dealNotes" policies
DROP POLICY IF EXISTS "Deal Notes Delete Policy" ON public."dealNotes";
CREATE POLICY "Deal Notes Delete Policy" ON public."dealNotes" FOR DELETE USING (true);
