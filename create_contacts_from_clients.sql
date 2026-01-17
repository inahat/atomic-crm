
-- Identify specific orphans and insert them as contacts
WITH orphans AS (
    SELECT
        c.id as company_id,
        c.name,
        -- Simple split: First part is First Name, the rest is Last Name
        split_part(c.name, ' ', 1) as first_name,
        substring(c.name from position(' ' in c.name) + 1) as last_name,
        c.phone_number,
        c.address,
        c.city,
        c.zipcode, -- mapped to postcode
        c.country,
        c."stateAbbr"
    FROM
        public.companies c
    WHERE
        c.id IN (32, 84, 272, 298) -- IDs from the screenshot
)
INSERT INTO public.contacts (
    company_id,
    first_name,
    last_name,
    phone_1_number,
    address_line_1,
    city,
    postcode,
    country,
    first_seen,
    last_seen,
    status
)
SELECT
    company_id,
    first_name,
    COALESCE(NULLIF(last_name, ''), '.'),
    phone_number,
    address,
    city,
    zipcode,
    country,
    now(),
    now(),
    'Cold'
FROM
    orphans;
