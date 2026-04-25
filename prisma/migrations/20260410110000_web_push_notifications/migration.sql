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
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'NotificationChannel'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum enum_value
    INNER JOIN pg_type enum_type
      ON enum_type.oid = enum_value.enumtypid
    WHERE enum_type.typname = 'NotificationChannel'
      AND enum_value.enumlabel = 'PUSH'
  ) THEN
    ALTER TYPE "NotificationChannel" ADD VALUE 'PUSH';
  END IF;
END $$;

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "bookingId" TEXT,
  ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT,
  ADD COLUMN IF NOT EXISTS "actionUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "sentPushAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastEvaluatedAt" TIMESTAMP(3);

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_bookingId_fkey'
  ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

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
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS "pushSubscriptionId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notification_events_userId_fkey'
  ) THEN
    ALTER TABLE "notification_events"
      ADD CONSTRAINT "notification_events_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notification_events_pushSubscriptionId_fkey'
  ) THEN
    ALTER TABLE "notification_events"
      ADD CONSTRAINT "notification_events_pushSubscriptionId_fkey"
      FOREIGN KEY ("pushSubscriptionId") REFERENCES "push_subscriptions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "notification_events_userId_idx"
  ON "notification_events"("userId");

CREATE INDEX IF NOT EXISTS "notification_events_pushSubscriptionId_idx"
  ON "notification_events"("pushSubscriptionId");
