-- Final verification of data population
SELECT 
    device_name, 
    project_name, 
    job_code, 
    contract_id, 
    company_id,
    occurred_at
FROM public.device_events 
ORDER BY created_at DESC 
LIMIT 10;
