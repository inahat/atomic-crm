-- Add an optional completed_date column to track SLA compliance
ALTER TABLE service_tasks ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP WITH TIME ZONE;
