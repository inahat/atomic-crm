    -- Add reference_id to device_events to store the OvrC Ref ID
    ALTER TABLE public.device_events 
    ADD COLUMN IF NOT EXISTS reference_id TEXT;
