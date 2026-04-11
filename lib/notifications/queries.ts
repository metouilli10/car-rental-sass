import { unstable_cache } from "next/cache";
import type {
  NotificationSeverity,
  NotificationStatus,
  ReminderType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NotificationSummaryItem = {
  id: string;
  type: ReminderType;
  title: string;
  body: string;
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

const NOTIFICATIONS_SUMMARY_CACHE_SECONDS = 60;

function buildSummaryWhere(agencyId: string): Prisma.NotificationWhereInput {
  return {
    agencyId,
    status: "OPEN",
    severity: { in: ["WARNING", "DUE"] },
  };
}

async function getNotificationsSummaryUncached(
  agencyId: string
): Promise<{
  count: number;
  items: NotificationSummaryItem[];
}> {
  const where = buildSummaryWhere(agencyId);

  const [rawItems, count] = await Promise.all([
    prisma.notification.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
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
    prisma.notification.count({ where }),
  ]);

  const items = rawItems.filter(
    (
      item,
    ): item is typeof item & {
      vehicle: NonNullable<typeof item.vehicle>;
    } => item.vehicle !== null,
  );

  return { count, items };
}

const getNotificationsSummaryCached = unstable_cache(
  async (agencyId: string) => getNotificationsSummaryUncached(agencyId),
  ["notifications-summary-v2"],
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
