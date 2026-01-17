-- Ensure we can upsert by company and name
-- This is necessary for the Edge Function's current logic
ALTER TABLE public.devices 
ADD CONSTRAINT devices_company_id_name_key UNIQUE (company_id, name);

-- Also ensure mac_address is nullable just in case the previous migration was missed
ALTER TABLE public.devices ALTER COLUMN mac_address DROP NOT NULL;
