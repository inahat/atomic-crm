
-- Add Quickbooks ID column to companies table to store the link
ALTER TABLE "public"."companies"
ADD COLUMN "quickbooks_id" text UNIQUE;
