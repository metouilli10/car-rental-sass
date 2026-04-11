"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationType, Prisma } from "@prisma/client";
import { addDays } from "date-fns";
import { getNotificationsSummary } from "@/lib/notifications/queries";

type NotificationWithVehicle = Prisma.NotificationGetPayload<{
  include: {
    vehicle: { select: { id: true; make: true; model: true; plate: true } };
  };
}>;

// ─── Read ──────────────────────────────────────────────────────────────────

export { getNotificationsSummary };

export async function getAllNotifications(
  agencyId: string,
  params?: {
    status?: "OPEN" | "SNOOZED" | "DONE" | "DISMISSED";
    type?: NotificationType;
    severity?: "INFO" | "WARNING" | "DUE";
  }
): Promise<NotificationWithVehicle[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      agencyId,
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.type ? { type: params.type } : {}),
      ...(params?.severity ? { severity: params.severity } : {}),
    },
    include: {
      vehicle: { select: { id: true, make: true, model: true, plate: true } },
    },
    orderBy: [{ severity: "desc" }, { updatedAt: "asc" }],
  });

  return notifications.filter(
    (
      notification,
    ): notification is NotificationWithVehicle & {
      vehicle: NonNullable<NotificationWithVehicle["vehicle"]>;
    } => notification.vehicle !== null,
  );
}

// ─── Mutations ─────────────────────────────────────────────────────────────

async function getAuthorizedNotification(id: string, agencyId: string) {
  return prisma.notification.findFirst({
    where: { id, agencyId },
  });
}

export async function markNotificationDone(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");

  const notif = await getAuthorizedNotification(id, session.user.agencyId);
  if (!notif) return { error: "Notification introuvable" };

  await prisma.notification.update({
    where: { id },
    data: { status: "DONE" },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function dismissNotification(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");

  const notif = await getAuthorizedNotification(id, session.user.agencyId);
  if (!notif) return { error: "Notification introuvable" };

  await prisma.notification.update({
    where: { id },
    data: { status: "DISMISSED" },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function snoozeNotification(id: string, days: number) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");

  const notif = await getAuthorizedNotification(id, session.user.agencyId);
  if (!notif) return { error: "Notification introuvable" };

  const snoozedUntil = addDays(new Date(), days);

  await prisma.notification.update({
    where: { id },
    data: { status: "SNOOZED", snoozedUntil },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");

  return { snoozedUntil };
}

export async function snoozeNotificationUntil(id: string, until: Date) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");

  const notif = await getAuthorizedNotification(id, session.user.agencyId);
  if (!notif) return { error: "Notification introuvable" };

  await prisma.notification.update({
    where: { id },
    data: { status: "SNOOZED", snoozedUntil: until },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");

  return { snoozedUntil: until };
}

export async function reopenNotification(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");

  const notif = await getAuthorizedNotification(id, session.user.agencyId);
  if (!notif) return { error: "Notification introuvable" };

  await prisma.notification.update({
    where: { id },
    data: { status: "OPEN", snoozedUntil: null },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
