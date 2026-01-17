
-- 1. Identify matches using the same logic as before
WITH matches AS (
    WITH clients_with_contracts AS (
        SELECT DISTINCT c.id as company_id, c.name as company_name
        FROM public.companies c
        JOIN public.contracts ctr ON c.id = ctr.company_id
    )
    SELECT
        c.company_id,
        p.id as contact_id
    FROM
        clients_with_contracts c
    JOIN
        public.contacts p ON
        (p.first_name || ' ' || p.last_name) ILIKE c.company_name
        OR (p.last_name || ', ' || p.first_name) ILIKE c.company_name
        OR (
            c.company_name ILIKE ('%' || p.last_name)
            AND length(p.last_name) > 3
        )
)

-- 2. Insert into contact_companies (Junction Table) checking for duplicates
INSERT INTO public.contact_companies (contact_id, company_id, role)
SELECT
    m.contact_id,
    m.company_id,
    'Contract Holder' -- Identifying role
FROM
    matches m
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.contact_companies cc
        WHERE cc.contact_id = m.contact_id
        AND cc.company_id = m.company_id
    );

-- 3. (Optional but recommended) Set as Primary Company if the contact has none
WITH matches AS (
    WITH clients_with_contracts AS (
        SELECT DISTINCT c.id as company_id, c.name as company_name
        FROM public.companies c
        JOIN public.contracts ctr ON c.id = ctr.company_id
    )
    SELECT
        c.company_id,
        p.id as contact_id
    FROM
        clients_with_contracts c
    JOIN
        public.contacts p ON
        (p.first_name || ' ' || p.last_name) ILIKE c.company_name
        OR (p.last_name || ', ' || p.first_name) ILIKE c.company_name
        OR (
            c.company_name ILIKE ('%' || p.last_name)
            AND length(p.last_name) > 3
        )
)
UPDATE public.contacts c
SET company_id = m.company_id
FROM matches m
WHERE c.id = m.contact_id
AND c.company_id IS NULL;
