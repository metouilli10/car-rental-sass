-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "currentKm" INTEGER;
ALTER TABLE "vehicles" ADD COLUMN "nextMaintenanceKm" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "actualReturnDate" DATETIME,
    "pricePerDay" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "depositAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "depositStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("agencyId", "createdAt", "customerId", "depositAmount", "endDate", "id", "notes", "pricePerDay", "startDate", "status", "totalPrice", "updatedAt", "vehicleId") SELECT "agencyId", "createdAt", "customerId", "depositAmount", "endDate", "id", "notes", "pricePerDay", "startDate", "status", "totalPrice", "updatedAt", "vehicleId" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE INDEX "bookings_agencyId_idx" ON "bookings"("agencyId");
CREATE INDEX "bookings_vehicleId_idx" ON "bookings"("vehicleId");
CREATE INDEX "bookings_customerId_idx" ON "bookings"("customerId");
CREATE INDEX "bookings_startDate_idx" ON "bookings"("startDate");
CREATE INDEX "bookings_endDate_idx" ON "bookings"("endDate");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_paymentStatus_idx" ON "bookings"("paymentStatus");
CREATE INDEX "bookings_vehicleId_status_idx" ON "bookings"("vehicleId", "status");
CREATE INDEX "bookings_agencyId_status_idx" ON "bookings"("agencyId", "status");
CREATE TABLE "new_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'RENTAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "bookingId", "createdAt", "id", "paidAt", "status", "type", "updatedAt") SELECT "amount", "bookingId", "createdAt", "id", "paidAt", "status", "type", "updatedAt" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payments_category_idx" ON "payments"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
