
SELECT 
    de.occurred_at as time,
    c.name as client,
    d.name as device,
    de.event_type as status,
    de.description as message,
    substring(de.raw_email_body from 1 for 100) as raw_snippet
FROM 
    public.device_events de
JOIN 
    public.devices d ON de.device_id = d.id
JOIN 
    public.companies c ON d.company_id = c.id
ORDER BY 
    de.occurred_at DESC;
