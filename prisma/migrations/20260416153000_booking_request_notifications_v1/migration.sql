ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BOOKING_REQUEST_CREATED';

ALTER TABLE "booking_requests"
ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "booking_requests_agency_is_read_created_at_idx"
ON "booking_requests"("agencyId", "isRead", "createdAt");
