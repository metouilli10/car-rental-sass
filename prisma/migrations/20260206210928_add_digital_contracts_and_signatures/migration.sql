/*
  Warnings:

  - You are about to drop the column `content` on the `contract_templates` table. All the data in the column will be lost.
  - Added the required column `companyAddress` to the `contract_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyEmail` to the `contract_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyName` to the `contract_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyPhone` to the `contract_templates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "contract_signatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "signerType" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signatureDataUrl" TEXT NOT NULL,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contract_signatures_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicle_checklists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "pickupFuelLevel" TEXT,
    "pickupKilometers" INTEGER NOT NULL,
    "pickupCleanliness" TEXT,
    "pickupDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pickupNotes" TEXT,
    "hasCarteGrise" BOOLEAN NOT NULL DEFAULT false,
    "hasAssurance" BOOLEAN NOT NULL DEFAULT false,
    "hasSecurityKit" BOOLEAN NOT NULL DEFAULT false,
    "hasSpareWheel" BOOLEAN NOT NULL DEFAULT false,
    "returnFuelLevel" TEXT,
    "returnKilometers" INTEGER,
    "returnCleanliness" TEXT,
    "returnDate" DATETIME,
    "returnNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vehicle_checklists_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "damage_markers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "xPercent" REAL NOT NULL,
    "yPercent" REAL NOT NULL,
    "damageType" TEXT NOT NULL,
    "description" TEXT,
    "isPickup" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "damage_markers_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contract_signing_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "signerType" TEXT NOT NULL,
    "signerEmail" TEXT,
    "signerPhone" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contract_signing_links_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_contract_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "companyPhone" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "termsAndConditions" TEXT NOT NULL DEFAULT 'La franchise est égale au montant de la caution. En cas de vol ou accident responsable la franchise reste acquise au loueur. Le Client déclare louer, sous son entière responsabilité, le véhicule et n''est pas autorisé à le prêter. Le client utilisera le véhicule loué avec soin, réglera tous frais, amendes et dépenses pour toutes infractions à la circulation, au stationnement, etc.',
    "franchiseAmount" TEXT NOT NULL DEFAULT '10%',
    "checklistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contract_templates_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_contract_templates" ("agencyId", "createdAt", "id", "updatedAt") SELECT "agencyId", "createdAt", "id", "updatedAt" FROM "contract_templates";
DROP TABLE "contract_templates";
ALTER TABLE "new_contract_templates" RENAME TO "contract_templates";
CREATE UNIQUE INDEX "contract_templates_agencyId_key" ON "contract_templates"("agencyId");
CREATE TABLE "new_contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "draftPdfUrl" TEXT,
    "signedPdfUrl" TEXT,
    "pdfUrl" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "signedAt" DATETIME,
    "voidedAt" DATETIME,
    "contractNumber" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contracts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_contracts" ("bookingId", "createdAt", "generatedAt", "id", "pdfUrl", "updatedAt") SELECT "bookingId", "createdAt", "generatedAt", "id", "pdfUrl", "updatedAt" FROM "contracts";
DROP TABLE "contracts";
ALTER TABLE "new_contracts" RENAME TO "contracts";
CREATE UNIQUE INDEX "contracts_bookingId_key" ON "contracts"("bookingId");
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");
CREATE INDEX "contracts_status_idx" ON "contracts"("status");
CREATE INDEX "contracts_contractNumber_idx" ON "contracts"("contractNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "contract_signatures_contractId_idx" ON "contract_signatures"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_checklists_contractId_key" ON "vehicle_checklists"("contractId");

-- CreateIndex
CREATE INDEX "damage_markers_contractId_idx" ON "damage_markers"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_signing_links_token_key" ON "contract_signing_links"("token");

-- CreateIndex
CREATE INDEX "contract_signing_links_token_idx" ON "contract_signing_links"("token");

-- CreateIndex
CREATE INDEX "contract_signing_links_contractId_idx" ON "contract_signing_links"("contractId");
