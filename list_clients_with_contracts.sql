
SELECT
    c.id,
    c.name,
    COUNT(ctr.id) as total_contracts,
    STRING_AGG(ctr.contract_number, ', ') as contract_numbers,
    STRING_AGG(ctr.status, ', ') as statuses
FROM
    public.companies c
JOIN
    public.contracts ctr ON c.id = ctr.company_id
GROUP BY
    c.id, c.name
ORDER BY
    c.name;
