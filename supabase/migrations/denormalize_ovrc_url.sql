-- Add ovrc_url to devices and device_events for denormalized access
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS ovrc_url TEXT;
ALTER TABLE public.device_events ADD COLUMN IF NOT EXISTS ovrc_url TEXT;
