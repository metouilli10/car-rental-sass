ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BOOKING_REQUEST_CREATED';

ALTER TABLE "booking_requests"
ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "readAt" TIMESTAMP(3);

CREATE INDEX "booking_requests_agency_is_read_created_at_idx"
ON "booking_requests"("agencyId", "isRead", "createdAt");
