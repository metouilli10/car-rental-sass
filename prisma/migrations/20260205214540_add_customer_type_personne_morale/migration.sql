-- CreateTable
CREATE TABLE "contract_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contract_templates_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "pickupLocation" TEXT,
    "returnLocation" TEXT,
    "hasFullInsurance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("actualReturnDate", "agencyId", "createdAt", "customerId", "depositAmount", "depositStatus", "endDate", "id", "notes", "paymentStatus", "pricePerDay", "startDate", "status", "totalPrice", "updatedAt", "vehicleId") SELECT "actualReturnDate", "agencyId", "createdAt", "customerId", "depositAmount", "depositStatus", "endDate", "id", "notes", "paymentStatus", "pricePerDay", "startDate", "status", "totalPrice", "updatedAt", "vehicleId" FROM "bookings";
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
CREATE TABLE "new_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "customerType" TEXT NOT NULL DEFAULT 'PERSONNE_PHYSIQUE',
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passportOrCIN" TEXT,
    "passportOrCINExpiry" DATETIME,
    "passportPhotoUrl" TEXT,
    "address" TEXT,
    "dateOfBirth" DATETIME,
    "nationality" TEXT NOT NULL DEFAULT 'Marocaine',
    "licenseNumber" TEXT,
    "licenseExpiry" DATETIME,
    "licensePhotoUrl" TEXT,
    "ice" TEXT,
    "rc" TEXT,
    "representativeName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customers_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_customers" ("agencyId", "createdAt", "email", "id", "name", "passportOrCIN", "passportPhotoUrl", "phone", "updatedAt") SELECT "agencyId", "createdAt", "email", "id", "name", "passportOrCIN", "passportPhotoUrl", "phone", "updatedAt" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
CREATE INDEX "customers_agencyId_idx" ON "customers"("agencyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "contract_templates_agencyId_key" ON "contract_templates"("agencyId");
