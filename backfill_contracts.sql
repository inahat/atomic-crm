-- 1. Backfill contract_id based on cleaned job_code
UPDATE devices d
SET contract_id = c.id
FROM contracts c
WHERE d.job_code = c.contract_number
  AND d.contract_id IS NULL;

-- 2. Backfill contract_id based on project_name (fallback)
-- Only for those still null
UPDATE devices d
SET contract_id = c.id
FROM contracts c
WHERE d.contract_id IS NULL
  AND d.project_name IS NOT NULL
  AND (
      c.contract_name = d.project_name
      OR c.contract_name = split_part(d.project_name, ' - ', 1) -- Handle "Verbier - Verbier"
  );

-- Verify the links
SELECT 
    d.name,
    d.job_code,
    d.project_name,
    c.contract_name as "Now Linked Contract"
FROM devices d
JOIN contracts c ON d.contract_id = c.id
WHERE d.last_seen > now() - interval '24 hours'
ORDER BY d.last_seen DESC;
