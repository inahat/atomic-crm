
-- Check Devices Inventory
SELECT 
    d.name as device_name, 
    d.mac_address, 
    d.status, 
    d.last_seen, 
    c.name as company_name
FROM 
    public.devices d
JOIN 
    public.companies c ON d.company_id = c.id;

-- Check Event Logs
SELECT 
    de.occurred_at, 
    d.name as device_name, 
    de.event_type, 
    de.description
FROM 
    public.device_events de
JOIN 
    public.devices d ON de.device_id = d.id
ORDER BY 
    de.occurred_at DESC;
