
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('companies', 'company_addresses')
ORDER BY table_name, ordinal_position;
