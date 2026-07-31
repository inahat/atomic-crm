-- Add role column to sales table for 3-tier permissions (admin, manager, user)
ALTER TABLE "public"."sales" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user';

-- Sync role for existing records where administrator is true
UPDATE "public"."sales" SET "role" = 'admin' WHERE "administrator" = TRUE AND ("role" IS NULL OR "role" = 'user');
