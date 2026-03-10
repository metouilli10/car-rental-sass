CREATE TYPE "VehicleDocumentType" AS ENUM (
  'INSURANCE',
  'TECHNICAL_INSPECTION',
  'VIGNETTE',
  'REGISTRATION'
);

CREATE TABLE "vehicle_documents" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "type" "VehicleDocumentType" NOT NULL,
  "reference" TEXT,
  "startDate" TIMESTAMP(3),
  "expiryDate" TIMESTAMP(3),
  "fileUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vehicle_documents_agencyId_vehicleId_type_key"
ON "vehicle_documents"("agencyId", "vehicleId", "type");

CREATE INDEX "vehicle_documents_agencyId_idx"
ON "vehicle_documents"("agencyId");

CREATE INDEX "vehicle_documents_vehicleId_idx"
ON "vehicle_documents"("vehicleId");

ALTER TABLE "vehicle_documents"
ADD CONSTRAINT "vehicle_documents_agencyId_fkey"
FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicle_documents"
ADD CONSTRAINT "vehicle_documents_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
