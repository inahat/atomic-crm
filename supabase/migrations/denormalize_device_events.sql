-- Add context columns to device_events for efficient feed display
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS contract_id BIGINT REFERENCES public.contracts(id) ON DELETE SET NULL;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS job_code TEXT;
