
-- 1. Function to ensure only one address is primary per company
CREATE OR REPLACE FUNCTION public.ensure_single_primary_company_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If the record being inserted/updated is marked as primary
    IF NEW.is_primary THEN
        -- Set is_primary = false for all OTHER addresses of this company
        UPDATE public.company_addresses
        SET is_primary = false
        WHERE company_id = NEW.company_id
        AND id <> NEW.id; -- Ensure we don't uncheck the one we just checked (though this is BEFORE trigger, so NEW isn't in DB yet, but ID check is safe for updates)
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Single Primary
DROP TRIGGER IF EXISTS on_company_address_primary_check ON public.company_addresses;
CREATE TRIGGER on_company_address_primary_check
BEFORE INSERT OR UPDATE ON public.company_addresses
FOR EACH ROW
WHEN (NEW.is_primary = true)
EXECUTE FUNCTION public.ensure_single_primary_company_address();


-- 2. Function to sync primary address details to the parent company table
CREATE OR REPLACE FUNCTION public.sync_company_address_to_parent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary THEN
        UPDATE public.companies
        SET
            address = NEW.address_line_1,
            city = NEW.city,
            zipcode = NEW.postal_code,
            "stateAbbr" = NEW.state_province, -- Using quotes for mixed-case column
            country = NEW.country
        WHERE id = NEW.company_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Sync (Run AFTER the insert/update so we know the data is committed)
DROP TRIGGER IF EXISTS on_company_address_sync ON public.company_addresses;
CREATE TRIGGER on_company_address_sync
AFTER INSERT OR UPDATE ON public.company_addresses
FOR EACH ROW
EXECUTE FUNCTION public.sync_company_address_to_parent();
