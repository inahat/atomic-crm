
-- Add contact_id to contracts table
ALTER TABLE "public"."contracts"
ADD COLUMN "contact_id" bigint REFERENCES "public"."contacts"("id") ON DELETE SET NULL;
