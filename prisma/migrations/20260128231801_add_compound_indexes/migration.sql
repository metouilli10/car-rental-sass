-- CreateIndex
CREATE INDEX "bookings_vehicleId_status_idx" ON "bookings"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "bookings_agencyId_status_idx" ON "bookings"("agencyId", "status");
