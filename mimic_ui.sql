-- Mimic how the UI fetches the list
-- It joins devices with companies and contracts
-- Sorts by last_seen DESC
-- Filters should be empty by default

SELECT 
    d.name as "Device Name",
    d.last_seen as "Last Seen",
    d.status as "Status",
    c.name as "Company Name",
    contr.contract_name as "Contract Name",
    d.job_code as "Job Code"
FROM 
    public.devices d
LEFT JOIN 
    public.companies c ON d.company_id = c.id
LEFT JOIN 
    public.contracts contr ON d.contract_id = contr.id
ORDER BY 
    d.last_seen DESC
LIMIT 20;

-- Check explicitly for the "missing" one from user report
SELECT 
    d.name, 
    d.last_seen,
    c.name as "Company",
    contr.contract_name as "Contract"
FROM 
    public.devices d
LEFT JOIN 
    public.companies c ON d.company_id = c.id
LEFT JOIN
    public.contracts contr ON d.contract_id = contr.id
WHERE 
    d.name = 'WAP 1st Living Room';
