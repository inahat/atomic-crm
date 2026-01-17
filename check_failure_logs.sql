
-- Check most recent Failed Events
SELECT 
    created_at, 
    subject, 
    error_reason, 
    raw_body 
FROM failed_events 
ORDER BY created_at DESC 
LIMIT 5;
