-- Create a view that joins contracts with companies to allow searching by company name
create or replace view "public"."contracts_summary"
    with (security_invoker=on)
    as
select 
    c.*,
    comp.name as company_name
from
    "public"."contracts" c
left join
    "public"."companies" comp on c.company_id = comp.id;
