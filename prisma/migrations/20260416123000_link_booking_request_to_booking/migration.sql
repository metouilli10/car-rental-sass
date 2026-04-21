-- AlterTable
ALTER TABLE "booking_requests"
  ADD COLUMN "bookingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "booking_requests_bookingId_key" ON "booking_requests"("bookingId");

-- AddForeignKey
ALTER TABLE "booking_requests"
  ADD CONSTRAINT "booking_requests_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
