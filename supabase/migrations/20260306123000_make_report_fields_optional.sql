-- Make contract_id nullable for ad-hoc service reports
ALTER TABLE service_reports ALTER COLUMN contract_id DROP NOT NULL;

-- Make service_task_id nullable for ad-hoc service reports
ALTER TABLE service_reports ALTER COLUMN service_task_id DROP NOT NULL;
