-- 1. Create Settings Table
CREATE TABLE IF NOT EXISTS public.crm_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_name TEXT,
    org_address TEXT, -- Multi-line address
    org_email TEXT,
    org_phone TEXT,
    org_website TEXT,
    org_logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Auth users can view settings" ON public.crm_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can update settings" ON public.crm_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can insert settings" ON public.crm_settings FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Seed Single Row (Singleton Pattern)
-- We will try to rely on the frontend finding the first row, or we can force a known ID if Supabase allowed static UUIDs easily, 
-- but identifying by 'single row' logic in the frontend is safer for auto-increment scenarios. 
-- However, for UUIDs, let's just insert one and the frontend will list it or we use a fixed ID concept if needed.
-- Easier approach: The frontend "Settings" page can just be a Resource List that redirects to the first Item, or a custom page that fetches the single row.

INSERT INTO public.crm_settings (org_name, org_email)
SELECT 'My Smart Home Co.', 'admin@mysmarthome.com'
WHERE NOT EXISTS (SELECT 1 FROM public.crm_settings);
