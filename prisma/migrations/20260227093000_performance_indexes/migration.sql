-- Performance indexes for dashboard/module load hotspots
CREATE INDEX IF NOT EXISTS "vehicles_agency_status_idx" ON "vehicles"("agencyId", "status");

CREATE INDEX IF NOT EXISTS "bookings_agency_status_start_end_idx" ON "bookings"("agencyId", "status", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "bookings_agency_status_end_idx" ON "bookings"("agencyId", "status", "endDate");

CREATE INDEX IF NOT EXISTS "payments_status_category_paid_at_idx" ON "payments"("status", "category", "paidAt");
CREATE INDEX IF NOT EXISTS "payments_status_updated_at_idx" ON "payments"("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "payments_booking_status_category_idx" ON "payments"("bookingId", "status", "category");

CREATE INDEX IF NOT EXISTS "deposits_status_held_at_idx" ON "deposits"("status", "heldAt");
CREATE INDEX IF NOT EXISTS "deposits_status_returned_at_idx" ON "deposits"("status", "returnedAt");

CREATE INDEX IF NOT EXISTS "notifications_agency_status_severity_updated_at_idx" ON "notifications"("agencyId", "status", "severity", "updatedAt");
