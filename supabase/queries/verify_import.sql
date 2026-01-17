
-- 1. Check Companies count
SELECT count(*) as total_companies FROM companies;

-- 2. Check Contacts count
SELECT count(*) as total_contacts FROM contacts;

-- 3. View Companies with their new address fields
SELECT 
    id,
    name, 
    website, 
    phone_number,
    address,
    city, 
    zipcode,
    country 
FROM companies 
ORDER BY id DESC 
LIMIT 10;

-- 4. View Contacts linked to Companies (joined)
-- Showing ALL key imported fields: Name, Email, Phones, Address, Owner
SELECT 
    c.id,
    c.first_name, 
    c.last_name, 
    c.email, 
    c.phone_1_number as business_phone,
    c.phone_2_number as mobile_phone,
    comp.name as company_name,
    c.address_line_1,
    c.city,
    c.postcode,
    c.country,
    c.owner_company
FROM contacts c
LEFT JOIN companies comp ON c.company_id = comp.id
ORDER BY c.id DESC
LIMIT 50;
