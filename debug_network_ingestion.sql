
-- 1. Check if the Company exists (using the name from the email)
SELECT id, name 
FROM public.companies 
WHERE name ILIKE '%Symonds%';

-- 2. Check if ANY device was created (ignoring the Company link)
SELECT * FROM public.devices;

-- 3. Check if ANY event was logged
SELECT * FROM public.device_events;
