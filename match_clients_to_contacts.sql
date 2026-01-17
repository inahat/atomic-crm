
WITH clients_with_contracts AS (
    SELECT DISTINCT c.id as company_id, c.name as company_name
    FROM public.companies c
    JOIN public.contracts ctr ON c.id = ctr.company_id
)
SELECT
    c.company_name,
    c.company_id,
    p.id as contact_id,
    p.first_name,
    p.last_name,
    p.email
FROM
    clients_with_contracts c
JOIN
    public.contacts p ON
    (
        -- Check for "First Last" matching "Company Name"
        (p.first_name || ' ' || p.last_name) ILIKE c.company_name
    )
    OR
    (
        -- Check for "Last, First" matching "Company Name" (common in some imports)
        (p.last_name || ', ' || p.first_name) ILIKE c.company_name
    )
    OR
    (
        -- Check if Company Name contains the Last Name (broader search, good for potential matches)
        c.company_name ILIKE ('%' || p.last_name)
        AND length(p.last_name) > 3 -- Avoid noise with short names
    )
ORDER BY
    c.company_name;
