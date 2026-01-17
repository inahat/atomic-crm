
-- OvrC alerts do not always provide a full MAC address (sometimes just a short Ref ID).
-- We must make this column optional to prevent ingestion failures.

ALTER TABLE public.devices 
ALTER COLUMN mac_address DROP NOT NULL;
