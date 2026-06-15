-- Add service status columns to contracts table

-- Create an enum type for service status if it doesn't exist, generic enough to reuse
DO $$ BEGIN
    CREATE TYPE service_status AS ENUM ('pending', 'booked', 'completed', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE contracts
ADD COLUMN mid_year_service_status service_status DEFAULT 'pending',
ADD COLUMN end_year_service_status service_status DEFAULT 'pending';

-- Update existing records to have 'pending' status (handled by default, but ensuring consistency)
UPDATE contracts SET mid_year_service_status = 'pending' WHERE mid_year_service_status IS NULL;
UPDATE contracts SET end_year_service_status = 'pending' WHERE end_year_service_status IS NULL;
