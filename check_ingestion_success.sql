
-- Check if any devices were updated/created in the last hour
SELECT id, name, status, last_seen, company_id 
FROM devices 
WHERE last_seen > (now() - interval '1 hour')
UNION ALL
SELECT id, name, status, last_seen, company_id 
FROM devices 
WHERE created_at > (now() - interval '1 hour');

-- Check for success events
SELECT * FROM device_events 
WHERE created_at > (now() - interval '1 hour');

-- Check for stuck failures (did the error change?)
SELECT created_at, error_reason 
FROM failed_events 
WHERE created_at > (now() - interval '1 hour')
ORDER BY created_at DESC;
