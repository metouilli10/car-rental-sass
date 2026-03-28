CREATE TABLE IF NOT EXISTS "booking_comments" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "booking_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "booking_comments_bookingId_createdAt_idx"
  ON "booking_comments"("bookingId", "createdAt");

CREATE INDEX IF NOT EXISTS "booking_comments_agency_booking_created_at_idx"
  ON "booking_comments"("agencyId", "bookingId", "createdAt");

CREATE INDEX IF NOT EXISTS "booking_comments_author_created_at_idx"
  ON "booking_comments"("authorUserId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'booking_comments_bookingId_fkey'
  ) THEN
    ALTER TABLE "booking_comments"
      ADD CONSTRAINT "booking_comments_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'booking_comments_agencyId_fkey'
  ) THEN
    ALTER TABLE "booking_comments"
      ADD CONSTRAINT "booking_comments_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "agencies"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'booking_comments_authorUserId_fkey'
  ) THEN
    ALTER TABLE "booking_comments"
      ADD CONSTRAINT "booking_comments_authorUserId_fkey"
      FOREIGN KEY ("authorUserId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
