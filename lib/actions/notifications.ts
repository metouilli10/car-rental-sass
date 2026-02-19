"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Notification, Vehicle } from "@prisma/client";
import { addDays } from "date-fns";

export type NotificationWithVehicle = Notification & {
  vehicle: Pick<Vehicle, "make" | "model" | "plate" | "id">;
};

// ─── Read ──────────────────────────────────────────────────────────────────

export async function getNotificationsSummary(agencyId: string): Promise<{
  count: number;
  items: NotificationWithVehicle[];
}> {
  const items = await prisma.notification.findMany({
    where: {
      agencyId,
      status: "OPEN",
      severity: { in: ["WARNING", "DUE"] },
    },
    include: {
      vehicle: { select: { id: true, make: true, model: true, plate: true } },
    },
    orderBy: [{ severity: "desc" }, { updatedAt: "asc" }],
    take: 5,
  });

  const count = await prisma.notification.count({
    where: {
      agencyId,
      status: "OPEN",
      severity: { in: ["WARNING", "DUE"] },
    },
  });

  return { count, items };
}

export async function getAllNotifications(
  agencyId: string,
  params?: {
    status?: "OPEN" | "SNOOZED" | "DONE" | "DISMISSED";
    type?: "OIL_CHANGE" | "INSURANCE_EXPIRY" | "TECH_INSPECTION" | "VIGNETTE";
    severity?: "INFO" | "WARNING" | "DUE";
  }
): Promise<NotificationWithVehicle[]> {
  return prisma.notification.findMany({
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
