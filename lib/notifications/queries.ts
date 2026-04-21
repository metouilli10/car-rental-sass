import { unstable_cache } from "next/cache";
import type {
  NotificationSeverity,
  NotificationStatus,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ReminderNotificationSummaryItem = {
  kind: "reminder";
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  severity: NotificationSeverity;
  status: NotificationStatus;
  dueAt: Date | null;
  dueMileageKm: number | null;
  snoozedUntil: Date | null;
  updatedAt: Date;
  vehicle: {
    id: string;
    make: string;
    model: string;
    plate: string;
  };
};

export type BookingRequestNotificationSummaryItem = {
  kind: "booking-request";
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  severity: NotificationSeverity;
  status: NotificationStatus;
  dueAt: null;
  dueMileageKm: null;
  snoozedUntil: null;
  updatedAt: Date;
};

export type NotificationSummaryItem =
  | ReminderNotificationSummaryItem
  | BookingRequestNotificationSummaryItem;

const NOTIFICATIONS_SUMMARY_CACHE_SECONDS = 60;

function buildReminderSummaryWhere(agencyId: string): Prisma.NotificationWhereInput {
  return {
    agencyId,
    status: "OPEN",
    severity: { in: ["WARNING", "DUE"] },
    type: { not: "BOOKING_REQUEST_CREATED" },
  };
}

function buildBookingRequestSummaryWhere(agencyId: string): Prisma.NotificationWhereInput {
  return {
    agencyId,
    status: "OPEN",
    type: "BOOKING_REQUEST_CREATED",
  };
}

async function getNotificationsSummaryUncached(
  agencyId: string
): Promise<{
  count: number;
  items: NotificationSummaryItem[];
}> {
  const reminderWhere = buildReminderSummaryWhere(agencyId);
  const bookingRequestWhere = buildBookingRequestSummaryWhere(agencyId);

  const [rawReminderItems, rawBookingRequestItems, reminderCount, bookingRequestCount] =
    await Promise.all([
      prisma.notification.findMany({
        where: reminderWhere,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          actionUrl: true,
          severity: true,
          status: true,
          dueAt: true,
          dueMileageKm: true,
          snoozedUntil: true,
          updatedAt: true,
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              plate: true,
            },
          },
        },
        orderBy: [{ severity: "desc" }, { updatedAt: "asc" }],
        take: 5,
      }),
      prisma.notification.findMany({
        where: bookingRequestWhere,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          actionUrl: true,
          severity: true,
          status: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.notification.count({ where: reminderWhere }),
      prisma.notification.count({ where: bookingRequestWhere }),
    ]);

  const reminderItems = rawReminderItems
    .filter(
      (
        item,
      ): item is typeof item & {
        vehicle: NonNullable<typeof item.vehicle>;
      } => item.vehicle !== null,
    )
    .map((item) => ({
      kind: "reminder" as const,
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      href: "/notifications",
      severity: item.severity,
      status: item.status,
      dueAt: item.dueAt,
      dueMileageKm: item.dueMileageKm,
      snoozedUntil: item.snoozedUntil,
      updatedAt: item.updatedAt,
      vehicle: item.vehicle,
    }));

  const bookingRequestItems = rawBookingRequestItems.map((item) => ({
    kind: "booking-request" as const,
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    href: item.actionUrl ?? "/booking-requests",
    severity: item.severity,
    status: item.status,
    dueAt: null,
    dueMileageKm: null,
    snoozedUntil: null,
    updatedAt: item.updatedAt,
  }));

  return {
    count: reminderCount + bookingRequestCount,
    items: [...bookingRequestItems, ...reminderItems].slice(0, 5),
  };
}

const getNotificationsSummaryCached = unstable_cache(
  async (agencyId: string) => getNotificationsSummaryUncached(agencyId),
  ["notifications-summary-v3"],
  { revalidate: NOTIFICATIONS_SUMMARY_CACHE_SECONDS }
);

export async function getNotificationsSummary(agencyId: string): Promise<{
  count: number;
  items: NotificationSummaryItem[];
}> {
  try {
    return await getNotificationsSummaryCached(agencyId);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("incrementalCache missing")
    ) {
      return getNotificationsSummaryUncached(agencyId);
    }
    throw error;
  }
}
