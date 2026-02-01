-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "plate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "pricePerDay" REAL NOT NULL,
    "depositAmount" REAL NOT NULL DEFAULT 2000,
    "gearbox" TEXT NOT NULL DEFAULT 'MANUAL',
    "seats" INTEGER NOT NULL DEFAULT 5,
    "hasAC" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL DEFAULT 'Citadine',
    "photoUrl" TEXT,
    "mileage" INTEGER,
    "currentKm" INTEGER,
    "nextMaintenanceKm" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vehicles_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_vehicles" ("agencyId", "color", "createdAt", "currentKm", "id", "make", "mileage", "model", "nextMaintenanceKm", "plate", "pricePerDay", "status", "updatedAt", "year") SELECT "agencyId", "color", "createdAt", "currentKm", "id", "make", "mileage", "model", "nextMaintenanceKm", "plate", "pricePerDay", "status", "updatedAt", "year" FROM "vehicles";
DROP TABLE "vehicles";
ALTER TABLE "new_vehicles" RENAME TO "vehicles";
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");
CREATE INDEX "vehicles_agencyId_idx" ON "vehicles"("agencyId");
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
