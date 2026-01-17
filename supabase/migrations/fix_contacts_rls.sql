
-- Enable RLS on contacts table
ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."contacts";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."contacts";
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON "public"."contacts";
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON "public"."contacts";

-- Create permissive policies
-- Allow read access for everyone (or restrictive depending on need, but keeping consistent with others)
CREATE POLICY "Enable read access for all users" ON "public"."contacts" FOR SELECT USING (true);

-- Allow full write access for authenticated users
CREATE POLICY "Enable write access for authenticated users" ON "public"."contacts" FOR ALL TO authenticated USING (true);
