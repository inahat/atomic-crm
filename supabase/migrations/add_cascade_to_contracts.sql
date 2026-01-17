-- Drop the existing restriction
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_company_id_fkey;

-- Re-add with CASCADE DELETE
ALTER TABLE public.contracts 
    ADD CONSTRAINT contracts_company_id_fkey 
    FOREIGN KEY (company_id) 
    REFERENCES public.companies(id) 
    ON DELETE CASCADE;
