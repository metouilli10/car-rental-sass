ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "permissionOverrides" JSONB;
