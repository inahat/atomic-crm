ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_frequency TEXT DEFAULT 'Annual';
