-- 1. Any successful events today?
SELECT created_at, device_name, company_id, project_name 
FROM device_events 
WHERE created_at >= CURRENT_DATE 
ORDER BY created_at DESC;

-- 2. Give me 5 real companies to test with
SELECT id, name FROM companies LIMIT 5;
