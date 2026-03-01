ALTER TABLE "agencies"
  ALTER COLUMN "address" DROP NOT NULL,
  ALTER COLUMN "phone" DROP NOT NULL,
  ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "agencies"
  ADD COLUMN "rcNumber" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "setupCompletedAt" TIMESTAMP(3),
  ADD COLUMN "onboardingVehicleAdded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "onboardingReservationCreated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "onboardingPaymentRecorded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "onboardingDashboardExplored" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "onboardingDismissed" BOOLEAN NOT NULL DEFAULT false;

UPDATE "agencies"
SET "setupCompletedAt" = COALESCE("setupCompletedAt", NOW());
