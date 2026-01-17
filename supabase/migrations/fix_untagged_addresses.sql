
-- 1. Create 'Billing' copies for untagged addresses
INSERT INTO public.company_addresses (
    company_id,
    address_line_1,
    address_line_2,
    city,
    state_province,
    postal_code,
    country,
    address_type,
    is_primary
)
SELECT
    company_id,
    address_line_1,
    address_line_2,
    city,
    state_province,
    postal_code,
    country,
    'Billing', -- Set type to Billing
    false      -- Ensure copy is not primary
FROM
    public.company_addresses
WHERE
    address_type IS NULL OR address_type NOT IN ('Site', 'Billing');

-- 2. Update the original untagged addresses to 'Site'
UPDATE public.company_addresses
SET address_type = 'Site'
WHERE
    address_type IS NULL OR address_type NOT IN ('Site', 'Billing');
