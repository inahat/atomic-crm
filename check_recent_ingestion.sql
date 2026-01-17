
-- Check the 5 most recent device events to see if ANY data is arriving
SELECT 
    de.occurred_at,
    d.name as device_name,
    de.event_type,
    de.description,
    de.created_at as db_inserted_at
FROM device_events de
JOIN devices d ON de.device_id = d.id
ORDER BY de.created_at DESC
LIMIT 5;

-- Also check if any devices were updated recently
SELECT name, status, last_seen, updated_at 
FROM devices 
ORDER BY updated_at DESC 
LIMIT 5;
