
-- Create Devices table (Inventory)
CREATE TABLE public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id BIGINT REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mac_address TEXT UNIQUE NOT NULL, -- The unique identifier for hardware
    status TEXT DEFAULT 'Unknown', -- 'Online', 'Offline', 'Rebooting'
    last_seen TIMESTAMPTZ DEFAULT now(),
    device_type TEXT, -- 'Switch', 'Router', 'WAP', etc.
    metadata JSONB DEFAULT '{}'::jsonb, -- Store raw parsed data here
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view devices" ON public.devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can edit devices" ON public.devices FOR ALL TO authenticated USING (true);


-- Create Device Events table (History/Logs)
CREATE TABLE public.device_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'Status Change', 'Alert'
    description TEXT,
    raw_email_body TEXT, -- Optional: keep the email text for debugging regex later
    occurred_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view events" ON public.device_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert events" ON public.device_events FOR INSERT TO authenticated WITH CHECK (true);
