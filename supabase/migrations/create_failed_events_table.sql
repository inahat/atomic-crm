
-- Table to capture OvrC alerts that failed to parse or match a client
CREATE TABLE IF NOT EXISTS public.failed_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    subject TEXT,
    raw_body TEXT,
    error_reason TEXT,
    extracted_client_name TEXT,
    extracted_project_name TEXT
);

-- Enable RLS (allow read/write for service role, read for admins)
ALTER TABLE public.failed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view failed events" ON public.failed_events
    FOR SELECT USING (auth.role() = 'authenticated');

-- Service role can insert (for Edge Functions)
CREATE POLICY "Service role can insert failed events" ON public.failed_events
    FOR INSERT WITH CHECK (true);
