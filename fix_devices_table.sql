-- Add context columns to devices table so we can store the latest status details
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS job_code TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS contract_id BIGINT REFERENCES public.contracts(id) ON DELETE SET NULL;

-- Ensure mac_address is nullable as per previous fix
ALTER TABLE public.devices ALTER COLUMN mac_address DROP NOT NULL;
