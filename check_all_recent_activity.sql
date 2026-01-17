-- check all recent activity to find the gap
SELECT 'SUCCESSFUL' as source, created_at, description as info, 'N/A' as error
FROM device_events 
ORDER BY created_at DESC
LIMIT 10;

SELECT 'FAILED' as source, created_at, subject as info, error_reason as error
FROM failed_events
ORDER BY created_at DESC
LIMIT 10;
