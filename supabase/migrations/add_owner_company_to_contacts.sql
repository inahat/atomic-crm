
ALTER TABLE contacts 
ADD COLUMN owner_company text;

-- If you want to enforce security so users only see their own company's data,
-- you will need to enable RLS and create a policy using this column.
-- For example:
-- CREATE POLICY "Tenant Isolation" ON contacts
-- USING (owner_company = current_setting('app.current_tenant', true));
