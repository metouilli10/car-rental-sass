/**
 * Notification delivery channel service interfaces.
 *
 * Email is implemented through Resend.
 * WhatsApp remains a placeholder until the provider integration is added.
 */

import { prisma } from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/auth-utils";
import { sendNotificationReminderEmail } from "@/lib/mail";

type NotificationDeliveryEventType = "CREATED" | "ESCALATED_DUE";

export interface NotificationDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Email (placeholder) ────────────────────────────────────────────────────

export async function sendEmailNotification(
  notificationId: string,
  eventType: NotificationDeliveryEventType = "CREATED"
): Promise<NotificationDeliveryResult> {
  const existingSentEvent = await prisma.notificationEvent.findFirst({
    where: {
      notificationId,
      channel: "EMAIL",
      eventType,
      status: "SENT",
    },
    select: { id: true },
  });

  if (existingSentEvent) {
    return { success: true };
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: {
      id: true,
      title: true,
      body: true,
      dueAt: true,
      dueMileageKm: true,
      vehicle: {
        select: {
          make: true,
          model: true,
          plate: true,
        },
      },
      agency: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!notification) {
    return { success: false, error: "NOT_FOUND" };
  }

  const recipient = notification.agency.email?.trim();
  if (!recipient) {
    const error = "AGENCY_EMAIL_MISSING";
    await prisma.notificationEvent.create({
      data: {
        notificationId,
        channel: "EMAIL",
        eventType,
        status: "FAILED",
        lastError: error,
      },
    });
    return { success: false, error };
  }

  if (!notification.vehicle) {
    const error = "VEHICLE_CONTEXT_MISSING";
    await prisma.notificationEvent.create({
      data: {
        notificationId,
        channel: "EMAIL",
        eventType,
        status: "FAILED",
        lastError: error,
      },
    });
    return { success: false, error };
  }

  const dueLabel = notification.dueAt
    ? `Échéance : ${new Intl.DateTimeFormat("fr-MA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(notification.dueAt)}`
    : notification.dueMileageKm
    ? `Seuil kilométrique : ${notification.dueMileageKm.toLocaleString("fr-FR")} km`
    : null;

  try {
    const result = await sendNotificationReminderEmail({
      to: recipient,
      agencyName: notification.agency.name,
      vehicleName: `${notification.vehicle.make} ${notification.vehicle.model}`,
      plate: notification.vehicle.plate,
      title: notification.title,
      body: notification.body,
      dueLabel,
      dashboardUrl: `${getPublicAppUrl()}/notifications`,
    });

    await prisma.notificationEvent.create({
      data: {
        notificationId,
        channel: "EMAIL",
        eventType,
        status: "SENT",
        providerMessageId: result.messageId ?? null,
      },
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "EMAIL_SEND_FAILED";
    await prisma.notificationEvent.create({
      data: {
        notificationId,
        channel: "EMAIL",
        eventType,
        status: "FAILED",
        lastError: message,
      },
    });
    return { success: false, error: message };
  }
}

// ─── WhatsApp (placeholder) ────────────────────────────────────────────────

export async function sendWhatsAppNotification(
  notificationId: string,
  eventType: NotificationDeliveryEventType = "CREATED"
): Promise<NotificationDeliveryResult> {
  console.log(
    `[channels] WhatsApp notification requested for notificationId=${notificationId} — NOT_IMPLEMENTED`
  );

  await prisma.notificationEvent.create({
    data: {
      notificationId,
      channel: "WHATSAPP",
      eventType,
      status: "PENDING",
      lastError: "WhatsApp delivery not implemented yet",
    },
  });

  return { success: false, error: "NOT_IMPLEMENTED" };
}
