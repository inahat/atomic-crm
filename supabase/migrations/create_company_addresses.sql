-- Create company_addresses table
CREATE TABLE IF NOT EXISTS company_addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT,
    address_type TEXT CHECK (address_type IN ('Site', 'Billing', 'Other', 'Main')),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE company_addresses ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (Permissive for now, matching other tables)
CREATE POLICY "Enable read access for all users" ON company_addresses FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON company_addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON company_addresses FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON company_addresses FOR DELETE USING (true);

-- Migrate existing company addresses
INSERT INTO company_addresses (company_id, address_line_1, city, postal_code, address_type, is_primary)
SELECT 
    id, 
    address, 
    city, 
    zipcode, 
    'Main', 
    true 
FROM companies 
WHERE address IS NOT NULL;

-- Add address columns to contracts
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS site_address_id UUID REFERENCES company_addresses(id),
ADD COLUMN IF NOT EXISTS billing_address_id UUID REFERENCES company_addresses(id);

-- Optional: Create an index for performance
CREATE INDEX IF NOT EXISTS idx_company_addresses_company_id ON company_addresses(company_id);
