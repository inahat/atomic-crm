-- MASTER SCHEMA FIX FOR OVRC INTEGRATION
-- Ensures all tables have required columns and constraints

-- 1. FIX DEVICES TABLE (Inventory)
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS job_code TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS contract_id BIGINT REFERENCES public.contracts(id) ON DELETE SET NULL;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS ovrc_url TEXT;
ALTER TABLE public.devices ALTER COLUMN mac_address DROP NOT NULL;

-- Ensure the Unique Constraint is there (for Upsert)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devices_company_id_name_key') THEN
        ALTER TABLE public.devices ADD CONSTRAINT devices_company_id_name_key UNIQUE (company_id, name);
    END IF;
END $$;

-- 2. FIX DEVICE_EVENTS TABLE (History)
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS contract_id BIGINT REFERENCES public.contracts(id) ON DELETE SET NULL;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS job_code TEXT;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS ovrc_url TEXT;

-- 3. Update RLS (Cleanly)
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select for debugging" ON public.devices;
CREATE POLICY "Allow public select for debugging" ON public.devices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select for debugging" ON public.device_events;
CREATE POLICY "Allow public select for debugging" ON public.device_events FOR SELECT USING (true);
