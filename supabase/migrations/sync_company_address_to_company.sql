-- Trigger to sync primary company address back to companies table
CREATE OR REPLACE FUNCTION public.sync_primary_company_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- Verify the company exists (safeguard)
        IF EXISTS (SELECT 1 FROM public.companies WHERE id = NEW.company_id) THEN
            UPDATE public.companies
            SET 
                address = NEW.address_line_1,
                city = NEW.city,
                zipcode = NEW.postal_code,
                "stateAbbr" = NEW.state_province,
                country = NEW.country
            WHERE id = NEW.company_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_company_address_update_sync ON public.company_addresses;

-- Create Trigger
CREATE TRIGGER on_company_address_update_sync
    AFTER INSERT OR UPDATE ON public.company_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_primary_company_address();
