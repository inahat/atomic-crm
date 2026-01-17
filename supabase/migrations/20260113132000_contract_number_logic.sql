-- Add unique constraint to contract_number
ALTER TABLE contracts ADD CONSTRAINT contracts_contract_number_key UNIQUE (contract_number);

-- Function to generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number(company_id bigint)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  company_name text;
  prefix text;
  next_seq int;
  new_number text;
BEGIN
  -- Get company name
  SELECT name INTO company_name FROM companies WHERE id = company_id;
  
  IF company_name IS NULL THEN
    RETURN NULL;
  END IF;

  -- Generate prefix: First 3 alphanumeric characters, uppercased
  prefix := upper(substring(regexp_replace(company_name, '[^a-zA-Z0-9]', '', 'g') from 1 for 3));
  
  -- Fallback if name is too short or empty (shouldn't happen with valid companies but good for safety)
  IF length(prefix) < 3 THEN
     prefix := rpad(prefix, 3, 'X');
  END IF;

  -- Find the max number for this prefix currently in use
  -- Matches pattern PREFIX-XXX using regex to extract the number part safely
  SELECT COALESCE(MAX(SUBSTRING(contract_number FROM '-(0*[0-9]+)$')::int), 0) + 1
  INTO next_seq
  FROM contracts
  WHERE contract_number LIKE prefix || '-%';

  -- Format new number as PREFIX-00X
  new_number := prefix || '-' || lpad(next_seq::text, 3, '0');

  RETURN new_number;
END;
$$;
