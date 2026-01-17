-- Create table to store chat history
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  messages jsonb not null default '[]'::jsonb
);

-- RPC function to execute read-only SQL
-- This function is SECURITY DEFINER to allow reading data that might be RLS-protected
-- BUT we strictly enforce READ ONLY transaction mode.
create or replace function exec_sql_readonly(sql_query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  -- 1. Enforce Read-Only Mode for this transaction
  set transaction read only;
  
  -- 2. Execute the query
  -- We wrap the query in a select to return JSON
  execute 'select json_agg(t) from (' || sql_query || ') t' into result;
  
  -- Return empty array if null (no rows)
  if result is null then
    result := '[]'::jsonb;
  end if;

  return result;
exception when others then
  -- Return the error message as a JSON object
  return jsonb_build_object('error', SQLERRM, 'details', SQLSTATE);
end;
$$;

-- Grant access to authenticated users (so the App/Server can call it)
grant execute on function exec_sql_readonly to authenticated;
grant execute on function exec_sql_readonly to service_role;
