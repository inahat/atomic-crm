
-- Enable RLS on tables if not already (safeguard)
ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."companies";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."contracts";

-- Create permissive policies for both anon and authenticated users
CREATE POLICY "Enable read access for all users" ON "public"."companies" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."contracts" FOR SELECT USING (true);

-- Ensure inserts/updates are still restricted (optional, but good practice for now we open read)
-- For development speed, we might want to allow write for authenticated users
CREATE POLICY "Enable write access for authenticated users" ON "public"."companies" FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable write access for authenticated users" ON "public"."contracts" FOR ALL TO authenticated USING (true);
