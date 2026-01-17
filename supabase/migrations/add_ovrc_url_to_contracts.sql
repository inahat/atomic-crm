-- Add ovrc_url column to contracts
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS ovrc_url TEXT;
