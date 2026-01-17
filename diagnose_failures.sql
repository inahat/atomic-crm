-- 1. Check if the 'devices' table allows NULL mac_address
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'devices' AND column_name = 'mac_address';

-- 2. Search for the missing client 'Sutterby, Phillip'
SELECT * 
FROM companies 
WHERE name ILIKE '%Sutterby%' OR name ILIKE '%Phillip%';
