ALTER TABLE "agencies"
ADD COLUMN "subscriptionPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3);
