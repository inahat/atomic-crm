-- Check for ANY activity since 14:40 Jan 12 (Redeployment time)
SELECT 'SUCCESSFUL' as source, created_at, description as info, 'N/A' as error
FROM device_events 
WHERE created_at > '2026-01-12 14:40:00+00'
UNION ALL
SELECT 'FAILED' as source, created_at, subject as info, error_reason as error
FROM failed_events
WHERE created_at > '2026-01-12 14:40:00+00'
ORDER BY created_at DESC;

-- Proactive Check: Is there an exact match problem?
-- Use this if the above is empty to see what we DID receive recently
SELECT 'RECENT_FAILURES' as type, created_at, subject, error_reason
FROM failed_events
ORDER BY created_at DESC
LIMIT 5;
