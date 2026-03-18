-- Align historical SQL migrations with the Prisma-managed schema shape.
-- These changes already exist in the current database; this migration makes
-- shadow-database replay and migration history agree without requiring a reset.

ALTER TABLE "booking_addons"
ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "expenses"
ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "expenses_vehicleId_idx" ON "expenses"("vehicleId");
