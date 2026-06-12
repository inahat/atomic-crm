-- Restrict delete operations to administrators only for contacts, companies (clients), notes, and service contracts.

-- 1. Restrict delete on public.companies
DROP POLICY IF EXISTS "Company Delete Policy" ON public.companies;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.companies;

CREATE POLICY "Company Delete Policy" 
ON public.companies 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE user_id = auth.uid() 
    AND administrator = true
  )
);

-- 2. Restrict delete on public.contacts
DROP POLICY IF EXISTS "Contact Delete Policy" ON public.contacts;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.contacts;

CREATE POLICY "Enable insert for authenticated users only"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
ON public.contacts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Contact Delete Policy" 
ON public.contacts 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE user_id = auth.uid() 
    AND administrator = true
  )
);

-- 3. Restrict delete on public.contracts
DROP POLICY IF EXISTS "All access" ON public.contracts;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.contracts;

CREATE POLICY "Enable insert for authenticated users only"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
ON public.contracts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for admin users only"
ON public.contracts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE user_id = auth.uid() 
    AND administrator = true
  )
);

-- 4. Restrict delete on public."contactNotes"
DROP POLICY IF EXISTS "Contact Notes Delete Policy" ON public."contactNotes";

CREATE POLICY "Contact Notes Delete Policy" 
ON public."contactNotes" 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE user_id = auth.uid() 
    AND administrator = true
  )
);

-- 5. Restrict delete on public."dealNotes"
DROP POLICY IF EXISTS "Deal Notes Delete Policy" ON public."dealNotes";

CREATE POLICY "Deal Notes Delete Policy" 
ON public."dealNotes" 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE user_id = auth.uid() 
    AND administrator = true
  )
);
