
-- Force PostgREST to refresh its schema cache
-- This is necessary when columns are added via SQL so the API can serve them
NOTIFY pgrst, 'reload schema';
