
-- 1. Remove the unique constraint on mac_address (since Ref ID varies)
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_mac_address_key;

-- 2. Add a new unique constraint on (company_id, name) to identify devices
ALTER TABLE public.devices ADD CONSTRAINT devices_company_name_key UNIQUE (company_id, name);

-- 3. Add new columns for context
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS project_name text;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS job_code text;

-- 4. Clean up existing 'unknown' data if necessary (optional, avoiding data loss for now)
-- DELETE FROM public.devices WHERE mac_address = 'unknown'; 
