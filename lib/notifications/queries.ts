import { unstable_cache } from "next/cache";
import type { Notification, Prisma, Vehicle } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NotificationWithVehicle = Notification & {
  vehicle: Pick<Vehicle, "make" | "model" | "plate" | "id">;
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
  items: NotificationWithVehicle[];
}> {
  const where = buildSummaryWhere(agencyId);

  const [items, count] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        vehicle: { select: { id: true, make: true, model: true, plate: true } },
      },
      orderBy: [{ severity: "desc" }, { updatedAt: "asc" }],
      take: 5,
    }),
    prisma.notification.count({ where }),
  ]);

  return { count, items };
}

const getNotificationsSummaryCached = unstable_cache(
  async (agencyId: string) => getNotificationsSummaryUncached(agencyId),
  ["notifications-summary-v1"],
  { revalidate: NOTIFICATIONS_SUMMARY_CACHE_SECONDS }
);

export async function getNotificationsSummary(agencyId: string): Promise<{
  count: number;
  items: NotificationWithVehicle[];
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

