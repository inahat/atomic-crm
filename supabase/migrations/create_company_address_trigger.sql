-- Trigger to sync new company address to company_addresses
CREATE OR REPLACE FUNCTION public.handle_new_company_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.address IS NOT NULL THEN
        INSERT INTO public.company_addresses (company_id, address_line_1, city, postal_code, address_type, is_primary)
        VALUES (NEW.id, NEW.address, NEW.city, NEW.zipcode, 'Main', true);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_company_created_add_address ON public.companies;
CREATE TRIGGER on_company_created_add_address
    AFTER INSERT ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_company_address();
