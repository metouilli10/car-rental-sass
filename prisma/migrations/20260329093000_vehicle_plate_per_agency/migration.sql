DROP INDEX IF EXISTS "vehicles_plate_key";

CREATE UNIQUE INDEX IF NOT EXISTS "vehicles_agencyId_plate_key"
ON "vehicles"("agencyId", "plate");
