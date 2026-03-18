"use server";

import { addDays } from "date-fns";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import type { ReminderType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { getPublicAppUrl } from "@/lib/auth-utils";
import { sendNotificationReminderEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

const REMINDER_TYPES: ReminderType[] = [
  "OIL_CHANGE",
  "INSURANCE_EXPIRY",
  "TECH_INSPECTION",
  "VIGNETTE",
];

type NotificationTestResult =
  | {
      success: true;
      recipient: string;
      providerMessageId?: string;
      notificationId: string;
      eventId: string;
    }
  | {
      success: false;
      error: string;
    };

export async function sendTestNotificationEmail(): Promise<NotificationTestResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, error: "Non autorisé" };
  }

  if (!process.env.RESEND_API_KEY?.trim() || !process.env.RESEND_FROM_EMAIL?.trim()) {
    return {
      success: false,
      error: "Resend n'est pas configuré pour l'environnement local.",
    };
  }

  const agencyId = session.user.agencyId;
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { id: true, name: true, email: true },
  });

  const recipient = agency?.email?.trim();
  if (!agency || !recipient) {
    return {
      success: false,
      error: "L'email de l'agence est manquant.",
    };
  }

  const notification = await ensureTestableNotification(agencyId);
  if (!notification) {
    return {
      success: false,
      error: "Ajoutez au moins un véhicule pour envoyer un email de test.",
    };
  }

  try {
    const result = await sendNotificationReminderEmail({
      to: recipient,
      agencyName: agency.name,
      vehicleName: `${notification.vehicle.make} ${notification.vehicle.model}`,
      plate: notification.vehicle.plate,
      title: notification.title,
      body: notification.body,
      dueLabel: `Test envoyé le ${new Intl.DateTimeFormat("fr-MA", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date())}`,
      dashboardUrl: `${getPublicAppUrl()}/notifications`,
    });

    const event = await prisma.notificationEvent.create({
      data: {
        notificationId: notification.id,
        channel: "EMAIL",
        eventType: "ESCALATED_DUE",
        status: "SENT",
        providerMessageId: result.messageId ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/settings/notifications");
    revalidatePath("/notifications");

    return {
      success: true,
      recipient,
      providerMessageId: result.messageId,
      notificationId: notification.id,
      eventId: event.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "EMAIL_SEND_FAILED";

    const event = await prisma.notificationEvent.create({
      data: {
        notificationId: notification.id,
        channel: "EMAIL",
        eventType: "ESCALATED_DUE",
        status: "FAILED",
        lastError: message,
      },
      select: { id: true },
    });

    revalidatePath("/settings/notifications");

    return {
      success: false,
      error: `Envoi échoué (${event.id}): ${message}`,
    };
  }
}

async function ensureTestableNotification(agencyId: string) {
  const existing = await prisma.notification.findFirst({
    where: { agencyId },
    select: {
      id: true,
      title: true,
      body: true,
      vehicle: {
        select: {
          make: true,
          model: true,
          plate: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  if (existing) {
    return existing;
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { agencyId },
    select: {
      id: true,
      make: true,
      model: true,
      plate: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!vehicle) {
    return null;
  }

  const usedTypes = await prisma.notification.findMany({
    where: { agencyId, vehicleId: vehicle.id },
    select: { type: true },
  });

  const availableType = REMINDER_TYPES.find(
    (type) => !usedTypes.some((used) => used.type === type)
  );

  if (!availableType) {
    return null;
  }

  return prisma.notification.create({
    data: {
      agencyId,
      vehicleId: vehicle.id,
      type: availableType,
      title: "Email de test Locaryx",
      body: `Ceci est un email de test pour ${vehicle.make} ${vehicle.model} (${vehicle.plate}).`,
      severity: "INFO",
      dueAt: addDays(new Date(), 1),
      status: "OPEN",
    },
    select: {
      id: true,
      title: true,
      body: true,
      vehicle: {
        select: {
          make: true,
          model: true,
          plate: true,
        },
      },
    },
  });
}
