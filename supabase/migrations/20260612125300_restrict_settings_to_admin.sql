-- Drop old policies on crm_settings
DROP POLICY IF EXISTS "Auth users can update settings" ON public.crm_settings;
DROP POLICY IF EXISTS "Auth users can insert settings" ON public.crm_settings;

-- Create new policies checking for administrator status
CREATE POLICY "Admins can update settings" ON public.crm_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM sales WHERE sales.user_id = auth.uid() AND sales.administrator = true));

CREATE POLICY "Admins can insert settings" ON public.crm_settings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM sales WHERE sales.user_id = auth.uid() AND sales.administrator = true));
