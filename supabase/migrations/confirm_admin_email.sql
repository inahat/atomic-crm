
-- Confirm the admin user's email so they can log in immediately
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'admin@atomic.ltd';
