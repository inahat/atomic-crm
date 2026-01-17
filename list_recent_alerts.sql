
-- List the 10 most recent OvrC alerts
SELECT 
    de.created_at as "Ingested At",
    d.last_seen as "Event Time",
    c.name as "Client",
    d.project_name as "Project",
    d.name as "Device",
    de.event_type as "Status",
    de.description as "Details"
FROM device_events de
JOIN devices d ON de.device_id = d.id
LEFT JOIN companies c ON d.company_id = c.id
ORDER BY de.created_at DESC
LIMIT 10;
