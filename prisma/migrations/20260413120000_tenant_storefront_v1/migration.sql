-- CreateEnum
CREATE TYPE "BookingRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "BookingRequestSource" AS ENUM ('WEBSITE');

-- AlterTable
ALTER TABLE "vehicles"
  ADD COLUMN "publishedToWebsite" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "website_settings" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "agencySlug" TEXT NOT NULL,
  "siteTitle" TEXT,
  "heroTitle" TEXT,
  "heroSubtitle" TEXT,
  "heroImageUrl" TEXT,
  "contactPhone" TEXT,
  "whatsappPhone" TEXT,
  "contactEmail" TEXT,
  "address" TEXT,
  "pickupLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isWebsiteEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "website_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "pickupDate" TIMESTAMP(3) NOT NULL,
  "returnDate" TIMESTAMP(3) NOT NULL,
  "pickupLocation" TEXT NOT NULL,
  "returnLocation" TEXT NOT NULL,
  "note" TEXT,
  "status" "BookingRequestStatus" NOT NULL DEFAULT 'PENDING',
  "source" "BookingRequestSource" NOT NULL DEFAULT 'WEBSITE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "website_settings_agencyId_key" ON "website_settings"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "website_settings_agencySlug_key" ON "website_settings"("agencySlug");

-- CreateIndex
CREATE INDEX "vehicles_agency_published_to_website_idx" ON "vehicles"("agencyId", "publishedToWebsite");

-- CreateIndex
CREATE INDEX "booking_requests_agencyId_idx" ON "booking_requests"("agencyId");

-- CreateIndex
CREATE INDEX "booking_requests_vehicleId_idx" ON "booking_requests"("vehicleId");

-- CreateIndex
CREATE INDEX "booking_requests_agency_status_created_at_idx" ON "booking_requests"("agencyId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "website_settings"
  ADD CONSTRAINT "website_settings_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "agencies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests"
  ADD CONSTRAINT "booking_requests_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "agencies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests"
  ADD CONSTRAINT "booking_requests_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
