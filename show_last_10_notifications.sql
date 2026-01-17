-- 1. Successful Events (Parsed & Processed)
SELECT 
    occurred_at as "Time",
    device_name as "Device",
    event_type as "Status",
    description as "Event Details",
    project_name as "Project",
    contract_id,
    company_id
FROM public.device_events
ORDER BY occurred_at DESC
LIMIT 10;

-- 2. Failed / Raw Events (If parsing failed)
SELECT 
    created_at as "Received At",
    subject as "Email Subject",
    error_reason as "Error",
    raw_body as "Body Snippet" 
FROM public.failed_events
ORDER BY created_at DESC
LIMIT 10;
