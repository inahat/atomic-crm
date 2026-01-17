SELECT 
    occurred_at, 
    device_name, 
    company_id, 
    contract_id, 
    project_name, 
    event_type 
FROM device_events 
ORDER BY occurred_at DESC 
LIMIT 1;
