alter table "public"."contacts" add column if not exists "metadata" jsonb default '{}'::jsonb;
