SELECT created_at, subject, error_reason 
FROM failed_events 
WHERE subject LIKE '%AutoTest%' 
ORDER BY created_at DESC 
LIMIT 1;
