-- AlterTable
ALTER TABLE "booking_requests"
  ADD COLUMN IF NOT EXISTS "bookingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "booking_requests_bookingId_key" ON "booking_requests"("bookingId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_requests_bookingId_fkey'
  ) THEN
    ALTER TABLE "booking_requests"
      ADD CONSTRAINT "booking_requests_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
