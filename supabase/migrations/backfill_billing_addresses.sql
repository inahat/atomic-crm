
-- Backfill missing Billing addresses for companies that have a Site address
-- Logic: If a company has a 'Site' address but no 'Billing' address, duplicate the Site address as Billing.

INSERT INTO company_addresses (
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
    'Billing',
    false -- Do not set duplicate as primary to avoid conflicts
FROM 
    company_addresses ca_site
WHERE 
    address_type = 'Site'
    AND NOT EXISTS (
        SELECT 1 
        FROM company_addresses ca_billing 
        WHERE ca_billing.company_id = ca_site.company_id 
        AND ca_billing.address_type = 'Billing'
    );
