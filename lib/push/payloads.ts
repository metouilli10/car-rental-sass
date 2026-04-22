import type { NotificationType } from "@prisma/client";

export type PushNotificationKind = NotificationType | "TEST";

export type PushNotificationPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  kind: PushNotificationKind;
  agencyId: string;
  entityId?: string;
};

type NotificationPayloadSource = {
  agencyId: string;
  vehicleId: string | null;
  bookingId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
};

function normalizeUrl(url: string | null | undefined) {
  if (!url || !url.trim()) {
    return "/notifications";
  }

  return url.startsWith("/") ? url : `/${url}`;
}

export function buildPushTag(kind: PushNotificationKind, entityId?: string | null) {
  return entityId ? `${kind.toLowerCase()}-${entityId}` : kind.toLowerCase();
}

export function buildNotificationPushPayload(
  notification: NotificationPayloadSource,
): PushNotificationPayload {
  const entityId = notification.bookingId ?? notification.vehicleId ?? undefined;

  return {
    title: notification.title,
    body: notification.body,
    url: normalizeUrl(notification.actionUrl),
    tag: buildPushTag(notification.type, entityId),
    kind: notification.type,
    agencyId: notification.agencyId,
    entityId,
  };
}

export function buildTestPushPayload(agencyId: string): PushNotificationPayload {
  return {
    title: "Notification de test Locaryx",
    body: "Les notifications push sont bien activées sur cet appareil.",
    url: "/notifications",
    tag: buildPushTag("TEST", agencyId),
    kind: "TEST",
    agencyId,
  };
}
