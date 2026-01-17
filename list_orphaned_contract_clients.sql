
SELECT
    c.id,
    c.name,
    COUNT(ctr.id) as contract_count,
    STRING_AGG(ctr.contract_number, ', ') as contract_numbers
FROM
    public.companies c
JOIN
    public.contracts ctr ON c.id = ctr.company_id
WHERE
    -- Check for NO entry in the junction table
    NOT EXISTS (
        SELECT 1
        FROM public.contact_companies cc
        WHERE cc.company_id = c.id
    )
    AND
    -- Check for NO contacts listing this as their primary company
    NOT EXISTS (
        SELECT 1
        FROM public.contacts p
        WHERE p.company_id = c.id
    )
GROUP BY
    c.id, c.name
ORDER BY
    c.name;
