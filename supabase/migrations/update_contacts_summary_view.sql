
-- Drop the existing view
DROP VIEW IF EXISTS "public"."contacts_summary";

-- Recreate the view to include the new columns (address fields)
-- The 'co.*' will now pick up address_line_1, city, postcode, country, etc.
create view "public"."contacts_summary"
    with (security_invoker=on)
    as
select 
    co.*,
    c.name as company_name,
    count(distinct t.id) as nb_tasks
from
    "public"."contacts" co
left join
    "public"."tasks" t on co.id = t.contact_id
left join
    "public"."companies" c on co.company_id = c.id
group by
    co.id, c.name;
