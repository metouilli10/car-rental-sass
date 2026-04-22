import { addDays, addMinutes, differenceInDays, differenceInMinutes } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions } from "@/lib/permissions";
import { DEFAULT_LEAD_DAYS } from "@/lib/reminders/types";
import {
  buildBookingNotificationDedupeKey,
  buildVehicleNotificationDedupeKey,
  clearAgencyNotificationIfOpen,
  upsertAgencyNotification,
} from "@/lib/notifications/store";
import {
  buildNotificationPushPayload,
  type PushNotificationPayload,
} from "@/lib/push/payloads";
import { sendPushToMany } from "@/lib/push/webpush";

function getEnvInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPushProcessorConfig() {
  return {
    reservationStartsSoonMinutes: getEnvInt("PUSH_RESERVATION_STARTS_SOON_MINUTES", 60),
    insuranceExpiryDays: getEnvInt("PUSH_INSURANCE_EXPIRY_DAYS", 7),
  };
}

function getReservationSoonSeverity(startDate: Date, now: Date) {
  return differenceInMinutes(startDate, now) <= 15 ? "DUE" : "WARNING";
}

async function refreshReservationStartingSoonNotifications(now: Date) {
  const { reservationStartsSoonMinutes } = getPushProcessorConfig();
  const windowEnd = addMinutes(now, reservationStartsSoonMinutes);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "ACTIVE"] },
      startDate: {
        gte: now,
        lte: windowEnd,
      },
    },
    include: {
      customer: { select: { name: true } },
      vehicle: { select: { make: true, model: true, plate: true } },
    },
  });

  const activeDedupeKeys = new Set<string>();

  for (const booking of bookings) {
    const dedupeKey = buildBookingNotificationDedupeKey(
      booking.id,
      "RESERVATION_STARTING_SOON",
    );
    activeDedupeKeys.add(dedupeKey);

    const vehicleName = `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.plate})`;
    const minutesLeft = Math.max(0, differenceInMinutes(booking.startDate, now));
    const startsLabel =
      minutesLeft <= 0
        ? "Le départ doit commencer maintenant."
        : `Le départ est prévu dans ${minutesLeft} min.`;

    await upsertAgencyNotification({
      agencyId: booking.agencyId,
      vehicleId: booking.vehicleId,
      bookingId: booking.id,
      type: "RESERVATION_STARTING_SOON",
      dedupeKey,
      title: "Réservation à démarrer bientôt",
      body: `${booking.customer.name} arrive pour ${vehicleName}. ${startsLabel}`,
      severity: getReservationSoonSeverity(booking.startDate, now),
      actionUrl: `/reservations/${booking.id}`,
      dueAt: booking.startDate,
      evaluatedAt: now,
    });
  }

  const staleNotifications = await prisma.notification.findMany({
    where: {
      type: "RESERVATION_STARTING_SOON",
      status: "OPEN",
    },
    select: { id: true, dedupeKey: true },
  });

  const staleIds = staleNotifications
    .filter((notification) => !activeDedupeKeys.has(notification.dedupeKey))
    .map((notification) => notification.id);

  if (staleIds.length > 0) {
    await prisma.notification.deleteMany({
      where: { id: { in: staleIds } },
    });
  }

  return {
    refreshed: bookings.length,
    cleared: staleIds.length,
  };
}

async function refreshInsuranceExpiryNotifications(now: Date) {
  const { insuranceExpiryDays } = getPushProcessorConfig();
  const threshold = addDays(now, insuranceExpiryDays);

  const candidateVehicles = await prisma.vehicle.findMany({
    where: {
      status: { in: ["AVAILABLE", "RENTED"] },
      OR: [
        {
          insuranceExpiryDate: {
            not: null,
            lte: threshold,
          },
        },
        {
          notifications: {
            some: {
              type: "INSURANCE_EXPIRY",
              status: "OPEN",
            },
          },
        },
      ],
    },
    select: {
      id: true,
      agencyId: true,
      make: true,
      model: true,
      plate: true,
      insuranceExpiryDate: true,
      insuranceReminderDays: true,
    },
  });

  const agencyIds = [...new Set(candidateVehicles.map((vehicle) => vehicle.agencyId))];
  const reminderRules = await prisma.reminderRule.findMany({
    where: {
      agencyId: { in: agencyIds },
      type: "INSURANCE_EXPIRY",
    },
    select: {
      agencyId: true,
      enabled: true,
      leadDays: true,
    },
  });
  const rulesByAgency = new Map(reminderRules.map((rule) => [rule.agencyId, rule]));

  for (const vehicle of candidateVehicles) {
    const rule = rulesByAgency.get(vehicle.agencyId);
    if (rule && !rule.enabled) {
      continue;
    }

    const dedupeKey = buildVehicleNotificationDedupeKey(vehicle.id, "INSURANCE_EXPIRY");
    const leadDays =
      vehicle.insuranceReminderDays.length > 0
        ? vehicle.insuranceReminderDays
        : rule?.leadDays?.length
          ? rule.leadDays
          : DEFAULT_LEAD_DAYS;

    if (!vehicle.insuranceExpiryDate) {
      await clearAgencyNotificationIfOpen({
        agencyId: vehicle.agencyId,
        dedupeKey,
      });
      continue;
    }

    const daysLeft = differenceInDays(vehicle.insuranceExpiryDate, now);
    const triggered = leadDays.some((leadDay) => daysLeft <= leadDay);

    if (!triggered) {
      await clearAgencyNotificationIfOpen({
        agencyId: vehicle.agencyId,
        dedupeKey,
      });
      continue;
    }

    const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.plate})`;
    const dueLabel =
      daysLeft <= 0
        ? `Assurance expirée de ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? "s" : ""}`
        : `Expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`;

    await upsertAgencyNotification({
      agencyId: vehicle.agencyId,
      vehicleId: vehicle.id,
      type: "INSURANCE_EXPIRY",
      dedupeKey,
      title: "Assurance à renouveler",
      body: `${vehicleName} — ${dueLabel}`,
      severity: daysLeft <= 0 ? "DUE" : daysLeft <= 7 ? "WARNING" : "INFO",
      actionUrl: `/vehicles/${vehicle.id}?tab=documents`,
      dueAt: vehicle.insuranceExpiryDate,
      evaluatedAt: now,
    });
  }

  return {
    refreshed: candidateVehicles.length,
  };
}

type PushNotificationRecord = Prisma.NotificationGetPayload<{
  select: {
    id: true;
    agencyId: true;
    bookingId: true;
    vehicleId: true;
    type: true;
    title: true;
    body: true;
    actionUrl: true;
  };
}>;

async function loadNotificationsToPush(now: Date) {
  const { insuranceExpiryDays } = getPushProcessorConfig();
  const threshold = addDays(now, insuranceExpiryDays);

  return prisma.notification.findMany({
    where: {
      status: "OPEN",
      sentPushAt: null,
      actionUrl: { not: null },
      OR: [
        { type: "RESERVATION_STARTING_SOON" },
        {
          type: "INSURANCE_EXPIRY",
          dueAt: {
            not: null,
            lte: threshold,
          },
        },
      ],
    },
    select: {
      id: true,
      agencyId: true,
      bookingId: true,
      vehicleId: true,
      type: true,
      title: true,
      body: true,
      actionUrl: true,
    },
    orderBy: [{ severity: "desc" }, { dueAt: "asc" }, { updatedAt: "asc" }],
  });
}

async function loadAgencyRecipientMap(agencyIds: string[]) {
  const users = await prisma.user.findMany({
    where: {
      agencyId: { in: agencyIds },
      isActive: true,
    },
    select: {
      id: true,
      agencyId: true,
      role: true,
      permissionOverrides: true,
    },
  });

  const recipientsByAgency = new Map<string, string[]>();

  for (const user of users) {
    const permissions = getEffectivePermissions(user.role, user.permissionOverrides);
    if (!permissions["notifications.view"]) {
      continue;
    }

    const current = recipientsByAgency.get(user.agencyId) ?? [];
    current.push(user.id);
    recipientsByAgency.set(user.agencyId, current);
  }

  return recipientsByAgency;
}

async function loadSubscriptionMap(agencyIds: string[], userIds: string[]) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      agencyId: { in: agencyIds },
      userId: { in: userIds },
      isActive: true,
    },
    orderBy: [{ userId: "asc" }, { createdAt: "asc" }],
  });

  const subscriptionsByAgency = new Map<string, typeof subscriptions>();

  for (const subscription of subscriptions) {
    const current = subscriptionsByAgency.get(subscription.agencyId) ?? [];
    current.push(subscription);
    subscriptionsByAgency.set(subscription.agencyId, current);
  }

  return subscriptionsByAgency;
}

function toPushPayload(notification: PushNotificationRecord): PushNotificationPayload {
  return buildNotificationPushPayload({
    agencyId: notification.agencyId,
    bookingId: notification.bookingId,
    vehicleId: notification.vehicleId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    actionUrl: notification.actionUrl,
  });
}

export async function processPushNotifications() {
  const now = new Date();
  const reservationResult = await refreshReservationStartingSoonNotifications(now);
  const insuranceResult = await refreshInsuranceExpiryNotifications(now);
  // TODO: Plug future urgent categories here (late returns, technical inspection expired,
  // urgent maintenance) by reusing the shared notification store helpers above.

  const notifications = await loadNotificationsToPush(now);
  if (notifications.length === 0) {
    return {
      scanned: 0,
      pushed: 0,
      failed: 0,
      deactivatedSubscriptions: 0,
      reservationNotificationsRefreshed: reservationResult.refreshed,
      reservationNotificationsCleared: reservationResult.cleared,
      insuranceNotificationsRefreshed: insuranceResult.refreshed,
    };
  }

  const agencyIds = [...new Set(notifications.map((notification) => notification.agencyId))];
  const recipientsByAgency = await loadAgencyRecipientMap(agencyIds);
  const recipientUserIds = [...new Set([...recipientsByAgency.values()].flat())];
  const subscriptionsByAgency =
    recipientUserIds.length > 0
      ? await loadSubscriptionMap(agencyIds, recipientUserIds)
      : new Map<string, Awaited<ReturnType<typeof prisma.pushSubscription.findMany>>>();

  let pushed = 0;
  let failed = 0;
  let deactivatedSubscriptions = 0;

  for (const notification of notifications) {
    const agencySubscriptions = subscriptionsByAgency.get(notification.agencyId) ?? [];

    if (agencySubscriptions.length === 0) {
      continue;
    }

    const payload = toPushPayload(notification);
    const delivery = await sendPushToMany(agencySubscriptions, payload, {
      notificationId: notification.id,
      eventType: "CREATED",
    });

    pushed += delivery.successCount;
    failed += delivery.failureCount;
    deactivatedSubscriptions += delivery.deactivatedCount;

    if (delivery.successCount > 0) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          sentPushAt: now,
        },
      });
    }
  }

  return {
    scanned: notifications.length,
    pushed,
    failed,
    deactivatedSubscriptions,
    reservationNotificationsRefreshed: reservationResult.refreshed,
    reservationNotificationsCleared: reservationResult.cleared,
    insuranceNotificationsRefreshed: insuranceResult.refreshed,
  };
}
