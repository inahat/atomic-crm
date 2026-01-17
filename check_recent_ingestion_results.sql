
-- Check for both Successes AND Failures in the last hour
SELECT 
    'SUCCESS' as type, 
    created_at, 
    event_type as status, 
    description as details 
FROM device_events 
WHERE created_at > (now() - interval '1 hour') 

UNION ALL 

SELECT 
    'FAILURE' as type, 
    created_at, 
    error_reason as status, 
    subject as details 
FROM failed_events 
WHERE created_at > (now() - interval '1 hour') 

ORDER BY created_at DESC;
