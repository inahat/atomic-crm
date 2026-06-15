-- Create identities table
create table if not exists public.identities (
    id uuid not null default gen_random_uuid(),
    contact_id uuid references public.contacts(id) on delete cascade,
    type text not null,
    value text not null,
    is_primary boolean default false,
    meta jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id),
    unique (type, value)
);

-- Enable RLS
alter table public.identities enable row level security;

-- Create policy for identities
create policy "Enable read access for authenticated users"
    on public.identities for select
    to authenticated
    using (true);

create policy "Enable insert for authenticated users"
    on public.identities for insert
    to authenticated
    with check (true);

create policy "Enable update for authenticated users"
    on public.identities for update
    to authenticated
    using (true);

create policy "Enable delete for authenticated users"
    on public.identities for delete
    to authenticated
    using (true);

-- Add tags and organization_id to contacts if not exists
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'contacts' and column_name = 'tags') then
        alter table public.contacts add column tags text[];
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'contacts' and column_name = 'organization_id') then
        alter table public.contacts add column organization_id uuid references public.organizations(id);
    end if;
end $$;
