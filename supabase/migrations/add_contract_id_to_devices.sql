
-- Add contract_id to devices to link network hardware to service agreements
ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS contract_id BIGINT REFERENCES public.contracts(id);
