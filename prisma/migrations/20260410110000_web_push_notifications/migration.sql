DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'OIL_CHANGE',
      'INSURANCE_EXPIRY',
      'TECH_INSPECTION',
      'VIGNETTE',
      'RESERVATION_STARTING_SOON'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'NotificationChannel'::regtype
      AND enumlabel = 'PUSH'
  ) THEN
    ALTER TYPE "NotificationChannel" ADD VALUE 'PUSH';
  END IF;
END $$;

ALTER TABLE "notifications"
  ADD COLUMN "bookingId" TEXT,
  ADD COLUMN "dedupeKey" TEXT,
  ADD COLUMN "actionUrl" TEXT,
  ADD COLUMN "sentPushAt" TIMESTAMP(3),
  ADD COLUMN "lastEvaluatedAt" TIMESTAMP(3);

UPDATE "notifications"
SET
  "dedupeKey" = CONCAT('vehicle:', "vehicleId", ':', "type"::text),
  "actionUrl" = CONCAT('/vehicles/', "vehicleId")
WHERE "dedupeKey" IS NULL;

ALTER TABLE "notifications"
  ALTER COLUMN "vehicleId" DROP NOT NULL;

ALTER TABLE "notifications"
  ALTER COLUMN "dedupeKey" SET NOT NULL;

ALTER TABLE "notifications"
  ALTER COLUMN "type" TYPE "NotificationType"
  USING ("type"::text::"NotificationType");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "notifications_agencyId_vehicleId_type_key";

CREATE UNIQUE INDEX IF NOT EXISTS "notifications_agencyId_dedupeKey_key"
  ON "notifications"("agencyId", "dedupeKey");

CREATE INDEX IF NOT EXISTS "notifications_agency_status_severity_due_at_idx"
  ON "notifications"("agencyId", "status", "severity", "dueAt");

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "userAgent" TEXT,
  "deviceLabel" TEXT,
  "platform" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "push_subscriptions_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "push_subscriptions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_key"
  ON "push_subscriptions"("endpoint");

CREATE INDEX IF NOT EXISTS "push_subscriptions_agencyId_userId_isActive_idx"
  ON "push_subscriptions"("agencyId", "userId", "isActive");

ALTER TABLE "notification_events"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "pushSubscriptionId" TEXT;

ALTER TABLE "notification_events"
  ADD CONSTRAINT "notification_events_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification_events"
  ADD CONSTRAINT "notification_events_pushSubscriptionId_fkey"
  FOREIGN KEY ("pushSubscriptionId") REFERENCES "push_subscriptions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "notification_events_userId_idx"
  ON "notification_events"("userId");

CREATE INDEX IF NOT EXISTS "notification_events_pushSubscriptionId_idx"
  ON "notification_events"("pushSubscriptionId");
