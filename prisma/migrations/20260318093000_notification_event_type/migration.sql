-- Add event type to notification delivery events for idempotent channel sends.
CREATE TYPE "NotificationEventType" AS ENUM ('CREATED', 'ESCALATED_DUE');

ALTER TABLE "notification_events"
ADD COLUMN "eventType" "NotificationEventType" NOT NULL DEFAULT 'CREATED';

CREATE INDEX "notification_events_notificationId_channel_eventType_status_idx"
ON "notification_events"("notificationId", "channel", "eventType", "status");
