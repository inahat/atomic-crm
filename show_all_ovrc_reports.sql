-- 1. SUCCESSFUL REPORTS (Processed Alerts)
SELECT 
    de.occurred_at as "Time",
    c.name as "Client",
    d.project_name as "Project",
    contr.contract_name as "Linked Contract",
    d.job_code as "Job Code",
    d.name as "Device Name",
    d.device_type as "Type",
    de.event_type as "Status",
    de.description as "Message"
    -- reference_id column missing in DB currently
FROM 
    public.device_events de
JOIN 
    public.devices d ON de.device_id = d.id
JOIN 
    public.companies c ON d.company_id = c.id
LEFT JOIN
    public.contracts contr ON d.contract_id = contr.id
ORDER BY 
    de.occurred_at DESC;

-- 2. FAILED PARSING ATTEMPTS (If any)
SELECT 
    created_at as "Attempted At",
    subject as "Email Subject",
    error_reason as "Failure Reason",
    extracted_client_name as "Extracted Client",
    extracted_project_name as "Extracted Project"
FROM 
    public.failed_events
ORDER BY 
    created_at DESC;
