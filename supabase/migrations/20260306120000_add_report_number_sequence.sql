-- Create a sequence starting from 2001
CREATE SEQUENCE IF NOT EXISTS service_report_number_seq START WITH 2001;

-- Add report_number column to service_reports table
ALTER TABLE service_reports 
ADD COLUMN IF NOT EXISTS report_number INTEGER DEFAULT nextval('service_report_number_seq');
