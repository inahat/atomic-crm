
-- Run this in Supabase Dashboard > SQL Editor to fix missing profiles
insert into public.sales (user_id, first_name, last_name, email, administrator, disabled)
select id, 'Admin', 'User', email, true, false
from auth.users
where id not in (select user_id from public.sales);
