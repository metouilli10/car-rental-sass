import type {
  NotificationSeverity,
  NotificationStatus,
  NotificationType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NotificationDeliveryEventType = "CREATED" | "ESCALATED_DUE";

export type UpsertAgencyNotificationInput = {
  agencyId: string;
  type: NotificationType;
  dedupeKey: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  vehicleId?: string | null;
  bookingId?: string | null;
  actionUrl?: string | null;
  dueAt?: Date | null;
  dueMileageKm?: number | null;
  evaluatedAt?: Date;
};

export type UpsertAgencyNotificationResult = {
  notificationId: string;
  deliveryEventType: NotificationDeliveryEventType | null;
};

export function buildVehicleNotificationDedupeKey(
  vehicleId: string,
  type: Exclude<NotificationType, "RESERVATION_STARTING_SOON">,
) {
  return `vehicle:${vehicleId}:${type}`;
}

export function buildBookingNotificationDedupeKey(
  bookingId: string,
  type: Extract<NotificationType, "RESERVATION_STARTING_SOON">,
) {
  return `booking:${bookingId}:${type}`;
}

export async function upsertAgencyNotification(
  input: UpsertAgencyNotificationInput,
): Promise<UpsertAgencyNotificationResult> {
  const evaluatedAt = input.evaluatedAt ?? new Date();

  const existing = await prisma.notification.findUnique({
    where: {
      agencyId_dedupeKey: {
        agencyId: input.agencyId,
        dedupeKey: input.dedupeKey,
      },
    },
  });

  if (!existing) {
    const created = await prisma.notification.create({
      data: {
        agencyId: input.agencyId,
        vehicleId: input.vehicleId ?? null,
        bookingId: input.bookingId ?? null,
        type: input.type,
        dedupeKey: input.dedupeKey,
        title: input.title,
        body: input.body,
        severity: input.severity,
        actionUrl: input.actionUrl ?? null,
        dueAt: input.dueAt ?? null,
        dueMileageKm: input.dueMileageKm ?? null,
        lastEvaluatedAt: evaluatedAt,
        status: "OPEN",
      },
      select: { id: true },
    });

    return {
      notificationId: created.id,
      deliveryEventType: "CREATED",
    };
  }

  if (existing.status === "DONE" || existing.status === "DISMISSED") {
    const updated = await prisma.notification.update({
      where: { id: existing.id },
      data: {
        vehicleId: input.vehicleId ?? null,
        bookingId: input.bookingId ?? null,
        title: input.title,
        body: input.body,
        severity: input.severity,
        actionUrl: input.actionUrl ?? null,
        dueAt: input.dueAt ?? null,
        dueMileageKm: input.dueMileageKm ?? null,
        lastEvaluatedAt: evaluatedAt,
      },
      select: { id: true },
    });

    return {
      notificationId: updated.id,
      deliveryEventType: null,
    };
  }

  const nextStatus: NotificationStatus =
    existing.status === "SNOOZED" &&
    existing.snoozedUntil != null &&
    existing.snoozedUntil > evaluatedAt
      ? "SNOOZED"
      : "OPEN";

  const updated = await prisma.notification.update({
    where: { id: existing.id },
    data: {
      vehicleId: input.vehicleId ?? null,
      bookingId: input.bookingId ?? null,
      title: input.title,
      body: input.body,
      severity: input.severity,
      actionUrl: input.actionUrl ?? null,
      dueAt: input.dueAt ?? null,
      dueMileageKm: input.dueMileageKm ?? null,
      lastEvaluatedAt: evaluatedAt,
      status: nextStatus,
    },
    select: { id: true },
  });

  const severityEscalatedToDue =
    existing.severity !== "DUE" && input.severity === "DUE" && nextStatus === "OPEN";

  return {
    notificationId: updated.id,
    deliveryEventType: severityEscalatedToDue ? "ESCALATED_DUE" : null,
  };
}

export async function clearAgencyNotificationIfOpen(params: {
  agencyId: string;
  dedupeKey: string;
}) {
  const existing = await prisma.notification.findUnique({
    where: {
      agencyId_dedupeKey: {
        agencyId: params.agencyId,
        dedupeKey: params.dedupeKey,
      },
    },
    select: { id: true, status: true },
  });

  if (existing?.status === "OPEN") {
    await prisma.notification.delete({ where: { id: existing.id } });
  }
}
