
-- 1. Reload the API Schema Cache (Essential after creating tables)
NOTIFY pgrst, 'reload schema';

-- 2. Ensure permissions are granted to the API user
GRANT ALL ON public.devices TO authenticated;
GRANT ALL ON public.device_events TO authenticated;

-- 3. Verify the row exists (for your sanity)
SELECT * FROM public.devices;

-- 4. Check active policies
SELECT * FROM pg_policies WHERE tablename = 'devices';
