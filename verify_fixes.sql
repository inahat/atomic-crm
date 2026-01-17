-- 1. Verify mac_address is nullable
SELECT table_name, column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'devices' AND column_name = 'mac_address';

-- 2. Verify reference_id exists in device_events
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'device_events' AND column_name = 'reference_id';
