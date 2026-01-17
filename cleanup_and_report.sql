-- Clean up existing messy job codes (remove HTML tags)
UPDATE devices
SET job_code = substring(job_code from '([A-Z]{3}-\d{3})')
WHERE job_code LIKE '%<span%';

-- Re-run the report to see clean data
SELECT 
    de.occurred_at as "Time",
    c.name as "Client",
    d.project_name as "Project",
    contr.contract_name as "Linked Contract",
    d.job_code as "Job Code",
    d.name as "Device Name",
    de.event_type as "Status",
    de.reference_id as "Ref ID"
FROM 
    public.device_events de
JOIN 
    public.devices d ON de.device_id = d.id
JOIN 
    public.companies c ON d.company_id = c.id
LEFT JOIN
    public.contracts contr ON d.contract_id = contr.id
ORDER BY 
    de.occurred_at DESC
LIMIT 10;
