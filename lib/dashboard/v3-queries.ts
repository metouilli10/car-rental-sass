import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { computeBookingDue, computeOutstanding } from "./rules";
import { resolveDashboardV3Period, type DashboardV3PeriodInput } from "./ranges";
import type {
  DashboardV3ActiveBookingsDTO,
  DashboardV3DTO,
  DashboardV3Period,
} from "./types";
import {
  buildActiveBookingTabs,
  computeAverageDailyOccupancyFallback,
  computeFleetSnapshot,
  computeRiskExposure,
  getCollectionDueDate,
  getSeverityRank,
  isCollectionOverdue,
  isDepositReleaseDue,
  sortCollectionItems,
  sortDepositItems,
  sortLateReturnItems,
  sortUrgentNotificationItems,
} from "./v3-rules";
import {
  isAgencyEligibleForGuidedOnboarding,
  syncAgencyOnboardingState,
} from "@/lib/onboarding/agency-onboarding";

const DASHBOARD_V3_CORE_CACHE_SECONDS = 60;
const DASHBOARD_V3_INSIGHTS_CACHE_SECONDS = 120;
const DASHBOARD_V3_PERF = process.env.DASHBOARD_PERF === "1";

function logPerf(step: string, startedAt: number, metadata?: Record<string, unknown>) {
  if (!DASHBOARD_V3_PERF) return;
  console.log("[dashboard:v3]", {
    step,
    durationMs: Date.now() - startedAt,
    ...metadata,
  });
}

function isIncrementalCacheMissing(error: unknown): boolean {
  return error instanceof Error && error.message.includes("incrementalCache missing");
}

function buildPeriodQuery(input: {
  period: DashboardV3Period;
  start: string;
  end: string;
}): string {
  const params = new URLSearchParams({ period: input.period });
  if (input.period === "custom") {
    params.set("start", input.start);
    params.set("end", input.end);
  }
  return params.toString();
}

async function getDashboardDataV3Uncached(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardV3DTO> {
  const startedAt = Date.now();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const resolvedPeriod = resolveDashboardV3Period(input.periodInput, now);
  const periodQuery = buildPeriodQuery({
    period: resolvedPeriod.key,
    start: resolvedPeriod.range.start.toISOString(),
    end: resolvedPeriod.range.end.toISOString(),
  });

  const queryStart = Date.now();
  const [
    payments,
    deposits,
    bookings,
    vehicles,
    notifications,
    agency,
    departuresToday,
    returnsToday,
    overdueReturnsToday,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: {
        booking: { agencyId: input.agencyId },
        OR: [
          {
            status: "PAID",
            OR: [
              {
                paidAt: {
                  gte: resolvedPeriod.range.start,
                  lte: resolvedPeriod.range.end,
                },
              },
              {
                paidAt: null,
                createdAt: {
                  gte: resolvedPeriod.range.start,
                  lte: resolvedPeriod.range.end,
                },
              },
            ],
          },
          {
            status: "REFUNDED",
            updatedAt: {
              gte: resolvedPeriod.range.start,
              lte: resolvedPeriod.range.end,
            },
          },
        ],
      },
      select: {
        amount: true,
        status: true,
        category: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId: input.agencyId },
        status: { in: ["HELD", "RETURNED", "PARTIAL_RETURNED"] },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        heldAt: true,
        returnedAt: true,
        bookingId: true,
        booking: {
          select: {
            id: true,
            status: true,
            endDate: true,
            actualReturnDate: true,
            customer: { select: { name: true } },
            vehicle: { select: { make: true, model: true, plate: true } },
          },
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        agencyId: input.agencyId,
        status: { not: "CANCELED" },
        OR: [
          {
            startDate: { lte: resolvedPeriod.range.end },
            endDate: { gte: resolvedPeriod.range.start },
          },
          {
            status: { in: ["CONFIRMED", "ACTIVE"] },
          },
        ],
      },
      select: {
        id: true,
        vehicleId: true,
        startDate: true,
        endDate: true,
        actualReturnDate: true,
        status: true,
        totalPrice: true,
        totalTtc: true,
        taxEnabled: true,
        discountAmount: true,
        addonsTotal: true,
        remainingAmount: true,
        paidNow: true,
        customer: { select: { name: true } },
        vehicle: { select: { make: true, model: true, plate: true } },
        payments: {
          where: {
            status: "PAID",
            category: "RENTAL",
          },
          select: {
            amount: true,
          },
        },
      },
    }),
    prisma.vehicle.findMany({
      where: {
        agencyId: input.agencyId,
      },
      select: {
        id: true,
        status: true,
      },
    }),
    prisma.notification.findMany({
      where: {
        agencyId: input.agencyId,
        status: "OPEN",
        severity: { in: ["WARNING", "DUE"] },
      },
      orderBy: [{ severity: "desc" }, { updatedAt: "asc" }],
      take: 6,
      select: {
        id: true,
        title: true,
        body: true,
        severity: true,
        dueAt: true,
        vehicle: { select: { id: true, make: true, model: true, plate: true } },
      },
    }),
    prisma.agency.findUnique({
      where: { id: input.agencyId },
      select: {
        createdAt: true,
        onboardingVehicleAdded: true,
        onboardingReservationCreated: true,
        onboardingPaymentRecorded: true,
        onboardingDashboardExplored: true,
        onboardingCompleted: true,
        onboardingDismissed: true,
      },
    }),
    prisma.booking.count({
      where: {
        agencyId: input.agencyId,
        status: { not: "CANCELED" },
        startDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),
    prisma.booking.count({
      where: {
        agencyId: input.agencyId,
        status: { not: "CANCELED" },
        endDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),
    prisma.booking.count({
      where: {
        agencyId: input.agencyId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        endDate: {
          lt: now,
        },
      },
    }),
  ]);
  logPerf("core-queries", queryStart, {
    agencyId: input.agencyId,
    period: resolvedPeriod.key,
    payments: payments.length,
    deposits: deposits.length,
    bookings: bookings.length,
    vehicles: vehicles.length,
    notifications: notifications.length,
    departuresToday,
    returnsToday,
    overdueReturnsToday,
  });

  let paidInflows = 0;
  let refundedOutflows = 0;
  for (const payment of payments) {
    if (payment.status === "PAID") {
      paidInflows += payment.amount;
    } else if (payment.status === "REFUNDED") {
      refundedOutflows += payment.amount;
    }
  }

  let depositInflows = 0;
  let depositOutflows = 0;
  const depositDueItems: Array<{
    id: string;
    amount: number;
    label: string;
    customerName: string;
    vehicleLabel: string;
    plate: string;
    sublabel: string;
    dueLabel: string;
    isOverdue: boolean;
    depositId: string;
    primaryHref: string;
  }> = [];
  let depositDueAmountTotal = 0;

  for (const deposit of deposits) {
    if (
      deposit.status === "HELD" &&
      deposit.heldAt.getTime() >= resolvedPeriod.range.start.getTime() &&
      deposit.heldAt.getTime() <= resolvedPeriod.range.end.getTime()
    ) {
      depositInflows += deposit.amount;
    }
    if (
      (deposit.status === "RETURNED" || deposit.status === "PARTIAL_RETURNED") &&
      deposit.returnedAt &&
      deposit.returnedAt.getTime() >= resolvedPeriod.range.start.getTime() &&
      deposit.returnedAt.getTime() <= resolvedPeriod.range.end.getTime()
    ) {
      depositOutflows += deposit.amount;
    }

    if (!isDepositReleaseDue(deposit, deposit.booking, now)) continue;
    depositDueAmountTotal += deposit.amount;
    const dueDate = deposit.booking.actualReturnDate ?? deposit.booking.endDate;
    const isOverdue = dueDate.getTime() < now.getTime();
    const customerName = deposit.booking.customer.name;
    const vehicleLabel = `${deposit.booking.vehicle.make} ${deposit.booking.vehicle.model}`;
    const plate = deposit.booking.vehicle.plate;
    depositDueItems.push({
      id: deposit.id,
      customerName,
      vehicleLabel,
      plate,
      amount: deposit.amount,
      label: `${customerName} - ${vehicleLabel}`,
      sublabel: `${plate} - caution en attente`,
      dueLabel: isOverdue
        ? `En retard depuis ${formatDateTime(dueDate)}`
        : `A liberer le ${formatDateTime(dueDate)}`,
      isOverdue,
      depositId: deposit.id,
      primaryHref: `/bookings/${deposit.bookingId}`,
    });
  }

  const netAmount = paidInflows + depositInflows - refundedOutflows - depositOutflows;

  let toCollectAmount = 0;
  let toCollectCount = 0;
  let overdueCollectionsCount = 0;
  const collectionItems: Array<{
    id: string;
    amount: number;
    label: string;
    customerName: string;
    vehicleLabel: string;
    plate: string;
    sublabel: string;
    dueLabel: string;
    isOverdue: boolean;
    bookingId: string;
    primaryHref: string;
  }> = [];
  const lateReturnItems: Array<{
    id: string;
    amount?: number;
    label: string;
    sublabel: string;
    dueLabel: string;
    isOverdue: boolean;
    primaryHref: string;
  }> = [];
  let lateReturnCount = 0;
  const currentRentedVehicleIds = new Set<string>();

  for (const booking of bookings) {
    const overlapsNow =
      booking.startDate.getTime() <= now.getTime() &&
      booking.endDate.getTime() >= now.getTime();
    if (
      overlapsNow &&
      (booking.status === "ACTIVE" || booking.status === "CONFIRMED")
    ) {
      currentRentedVehicleIds.add(booking.vehicleId);
    }

    const isCollectible =
      booking.status === "ACTIVE" || booking.status === "CONFIRMED";
    const due = computeBookingDue({
      totalPrice: booking.totalPrice,
      totalTtc: booking.totalTtc,
      taxEnabled: booking.taxEnabled,
      discountAmount: booking.discountAmount,
      addonsTotal: booking.addonsTotal,
    });
    const paidAmount = booking.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstanding = computeOutstanding(due, paidAmount);

    if (isCollectible && outstanding > 0) {
      toCollectAmount += outstanding;
      toCollectCount += 1;
      const dueDate = getCollectionDueDate(booking);
      const overdue = isCollectionOverdue(booking, outstanding, now);
      if (overdue) overdueCollectionsCount += 1;
      const customerName = booking.customer.name;
      const vehicleLabel = `${booking.vehicle.make} ${booking.vehicle.model}`;
      const plate = booking.vehicle.plate;
      collectionItems.push({
        id: booking.id,
        customerName,
        vehicleLabel,
        plate,
        amount: outstanding,
        label: `${customerName} - ${vehicleLabel}`,
        sublabel: plate,
        dueLabel: overdue
          ? `En retard depuis ${formatDateTime(dueDate)}`
          : `A encaisser avant ${formatDateTime(dueDate)}`,
        isOverdue: overdue,
        bookingId: booking.id,
        primaryHref: `/bookings/${booking.id}`,
      });
    }

    const isLateReturn =
      booking.status !== "COMPLETED" &&
      booking.endDate.getTime() < now.getTime();
    if (isLateReturn) {
      lateReturnCount += 1;
      lateReturnItems.push({
        id: booking.id,
        amount: outstanding > 0 ? outstanding : undefined,
        label: `${booking.customer.name} - ${booking.vehicle.make} ${booking.vehicle.model}`,
        sublabel: booking.vehicle.plate,
        dueLabel: `Retour en retard depuis ${formatDateTime(booking.endDate)}`,
        isOverdue: true,
        primaryHref: `/bookings/${booking.id}`,
      });
    }
  }

  const fleetSnapshot = computeFleetSnapshot({
    vehicles,
    rentedVehicleIds: currentRentedVehicleIds,
  });

  const occupancyRate =
    resolvedPeriod.key === "today"
      ? fleetSnapshot.totalActive > 0
        ? Math.round((fleetSnapshot.rented / fleetSnapshot.totalActive) * 100)
        : 0
      : computeAverageDailyOccupancyFallback({
          rangeStart: resolvedPeriod.range.start,
          rangeEnd: resolvedPeriod.range.end,
          activeVehicleCount: fleetSnapshot.totalActive,
          bookings: bookings
            .filter((booking) => booking.status !== "CANCELED")
            .map((booking) => ({
              vehicleId: booking.vehicleId,
              startDate: booking.startDate,
              endDate: booking.endDate,
            })),
        });

  const notificationItems = sortUrgentNotificationItems(
    notifications.map((notification) => ({
      id: notification.id,
      label: `${notification.vehicle.make} ${notification.vehicle.model}`,
      sublabel: `${notification.title} - ${notification.vehicle.plate}`,
      dueLabel: notification.dueAt ? `Echeance ${formatDateTime(notification.dueAt)}` : undefined,
      primaryAction: "Voir",
      primaryHref: `/notifications?filter=urgent`,
      actionType: "link" as const,
      severityRank: getSeverityRank(notification.severity),
    }))
  ).slice(0, 3);

  const riskExposure = computeRiskExposure({
    unpaidAmountTotal: toCollectAmount,
    depositDueAmountTotal,
  });

  const actionGroups = [
    {
      id: "collections" as const,
      title: "A encaisser",
      count: collectionItems.length,
      totalAmount: toCollectAmount,
      ctaLabel: "Voir tout",
      ctaHref: `/bookings?filter=unpaid&${periodQuery}`,
      items: sortCollectionItems(
        collectionItems.map((item) => ({
          id: item.id,
          label: item.label,
          sublabel: item.sublabel,
          amount: item.amount,
          dueLabel: item.dueLabel,
          isOverdue: item.isOverdue,
          primaryAction: "Encaisser",
          primaryHref: item.primaryHref,
          actionType: "collection" as const,
          bookingId: item.bookingId,
          customerName: item.customerName,
          vehicleLabel: item.vehicleLabel,
          plate: item.plate,
        }))
      ).slice(0, 3),
    },
    {
      id: "deposits" as const,
      title: "Cautions a rendre",
      count: depositDueItems.length,
      totalAmount: depositDueAmountTotal,
      ctaLabel: "Voir tout",
      ctaHref: `/finance?tab=deposits&filter=due&${periodQuery}`,
      items: sortDepositItems(
        depositDueItems.map((item) => ({
          id: item.id,
          label: item.label,
          sublabel: item.sublabel,
          amount: item.amount,
          dueLabel: item.dueLabel,
          isOverdue: item.isOverdue,
          primaryAction: "Liberer",
          primaryHref: item.primaryHref,
          actionType: "deposit_release" as const,
          depositId: item.depositId,
          customerName: item.customerName,
          vehicleLabel: item.vehicleLabel,
          plate: item.plate,
        }))
      ).slice(0, 3),
    },
    {
      id: "late_returns" as const,
      title: "Retours en retard",
      count: lateReturnItems.length,
      ctaLabel: "Voir tout",
      ctaHref: `/bookings?filter=late&${periodQuery}`,
      items: sortLateReturnItems(
        lateReturnItems.map((item) => ({
          id: item.id,
          label: item.label,
          sublabel: item.sublabel,
          amount: item.amount,
          dueLabel: item.dueLabel,
          isOverdue: item.isOverdue,
          primaryAction: "Relancer",
          primaryHref: item.primaryHref,
          actionType: "link" as const,
        }))
      ).slice(0, 3),
    },
    {
      id: "notifications" as const,
      title: "Entretien / Docs urgents",
      count: notifications.length,
      ctaLabel: "Voir tout",
      ctaHref: `/notifications?filter=urgent`,
      items: notificationItems.map((item) => ({
        id: item.id,
        label: item.label,
        sublabel: item.sublabel,
        dueLabel: item.dueLabel,
        primaryAction: "Voir",
        primaryHref: item.primaryHref,
        actionType: "link" as const,
      })),
    },
  ];

  const vehicleAdded =
    Boolean(agency?.onboardingVehicleAdded) ||
    vehicles.some((vehicle) => vehicle.status !== "UNAVAILABLE");
  const reservationCreated =
    Boolean(agency?.onboardingReservationCreated) ||
    bookings.some((booking) => booking.status === "CONFIRMED" || booking.status === "ACTIVE");
  const paymentRecorded =
    Boolean(agency?.onboardingPaymentRecorded) ||
    bookings.some(
      (booking) => booking.paidNow > 0 || booking.payments.some((payment) => payment.amount > 0),
    );
  const dashboardExplored = Boolean(agency?.onboardingDashboardExplored);
  const onboardingEligible = Boolean(
    agency && isAgencyEligibleForGuidedOnboarding(agency.createdAt),
  );
  const onboardingCompleted =
    onboardingEligible &&
    (Boolean(agency?.onboardingCompleted) ||
      (vehicleAdded && reservationCreated && paymentRecorded && dashboardExplored));

  const dto: DashboardV3DTO = {
    period: {
      key: resolvedPeriod.key,
      label: resolvedPeriod.label,
      start: resolvedPeriod.range.start.toISOString(),
      end: resolvedPeriod.range.end.toISOString(),
    },
    pulse: {
      net: {
        amount: Math.round(netAmount * 100) / 100,
        subtitle: `${formatCurrency(paidInflows + depositInflows)} entrees / ${formatCurrency(
          refundedOutflows + depositOutflows
        )} sorties`,
      },
      toCollect: {
        amount: Math.round(toCollectAmount * 100) / 100,
        bookingCount: toCollectCount,
        overdueCount: overdueCollectionsCount,
        subtitle: `${toCollectCount} dossiers, ${overdueCollectionsCount} en retard`,
      },
      occupancy: {
        rate: occupancyRate,
        rented: fleetSnapshot.rented,
        total: fleetSnapshot.totalActive,
        subtitle: `${fleetSnapshot.rented}/${fleetSnapshot.totalActive} vehicules loues`,
      },
      risks: {
        count: toCollectCount + depositDueItems.length + lateReturnCount,
        exposureAmount: Math.round(riskExposure * 100) / 100,
        breakdown: {
          unpaidCount: toCollectCount,
          depositDueCount: depositDueItems.length,
          lateReturnCount,
        },
        subtitle: `${toCollectCount} impayes, ${depositDueItems.length} cautions, ${lateReturnCount} retours`,
      },
    },
    todayOperations: {
      departures: departuresToday,
      returns: returnsToday,
      overdueReturns: overdueReturnsToday,
      availableVehicles: fleetSnapshot.available,
    },
    actionCenter: {
      groups: actionGroups,
      isAllClear: actionGroups.every((group) => group.count === 0),
    },
    fleetSnapshot,
    onboarding: {
      eligible: onboardingEligible,
      vehicleAdded: onboardingEligible ? vehicleAdded : false,
      reservationCreated: onboardingEligible ? reservationCreated : false,
      paymentRecorded: onboardingEligible ? paymentRecorded : false,
      dashboardExplored: onboardingEligible ? dashboardExplored : false,
      completed: onboardingCompleted,
      dismissed: !onboardingEligible || Boolean(agency?.onboardingDismissed),
    },
  };

  void syncAgencyOnboardingState(input.agencyId).catch((error) => {
    console.error("syncAgencyOnboardingState failed", {
      agencyId: input.agencyId,
      error,
    });
  });

  logPerf("core-total", startedAt, {
    agencyId: input.agencyId,
    period: resolvedPeriod.key,
  });

  return dto;
}

async function getDashboardActiveBookingsV3Uncached(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardV3ActiveBookingsDTO> {
  const startedAt = Date.now();
  void input.periodInput;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      agencyId: input.agencyId,
      status: { in: ["CONFIRMED", "ACTIVE"] },
      OR: [
        { status: "ACTIVE" },
        {
          startDate: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },
        {
          endDate: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      paidNow: true,
      remainingAmount: true,
      totalPrice: true,
      totalTtc: true,
      taxEnabled: true,
      discountAmount: true,
      addonsTotal: true,
      customer: {
        select: {
          name: true,
        },
      },
      vehicle: {
        select: {
          make: true,
          model: true,
          plate: true,
        },
      },
    },
  });

  const dto = buildActiveBookingTabs({
    bookings: bookings.map((booking) => ({
      id: booking.id,
      bookingId: booking.id,
      customerName: booking.customer.name,
      vehicleLabel: `${booking.vehicle.make} ${booking.vehicle.model}`,
      plate: booking.vehicle.plate,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      remainingAmount:
        booking.remainingAmount ??
        computeOutstanding(
          computeBookingDue({
            totalTtc: booking.totalTtc,
            taxEnabled: booking.taxEnabled,
            totalPrice: booking.totalPrice,
            discountAmount: booking.discountAmount ?? 0,
            addonsTotal: booking.addonsTotal ?? 0,
          }),
          booking.paidNow ?? 0
        ),
    })),
    now,
  });

  logPerf("active-bookings-total", startedAt, {
    agencyId: input.agencyId,
    bookings: bookings.length,
    activeCount: dto.tabs.find((tab) => tab.key === "active")?.count ?? 0,
    overdueCount: dto.tabs.find((tab) => tab.key === "overdue")?.count ?? 0,
  });

  return dto;
}

const getDashboardDataV3Cached = unstable_cache(
  async (
    agencyId: string,
    period: string,
    start: string,
    end: string
  ) =>
    getDashboardDataV3Uncached({
      agencyId,
      periodInput: { period, start, end },
    }),
  ["dashboard-v3-core"],
  { revalidate: DASHBOARD_V3_CORE_CACHE_SECONDS }
);

const getDashboardActiveBookingsV3Cached = unstable_cache(
  async (agencyId: string, dayStart: string) =>
    getDashboardActiveBookingsV3Uncached({
      agencyId,
      periodInput: {
        period: "today",
        start: dayStart,
        end: dayStart,
      },
    }),
  ["dashboard-v3-active-bookings"],
  { revalidate: DASHBOARD_V3_INSIGHTS_CACHE_SECONDS }
);

export async function getDashboardDataV3(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardV3DTO> {
  const resolvedPeriod = resolveDashboardV3Period(input.periodInput);
  try {
    return await getDashboardDataV3Cached(
      input.agencyId,
      resolvedPeriod.key,
      resolvedPeriod.range.start.toISOString(),
      resolvedPeriod.range.end.toISOString()
    );
  } catch (error) {
    if (isIncrementalCacheMissing(error)) {
      return getDashboardDataV3Uncached(input);
    }
    throw error;
  }
}

export async function getDashboardActiveBookingsV3(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardV3ActiveBookingsDTO> {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  try {
    return await getDashboardActiveBookingsV3Cached(
      input.agencyId,
      dayStart.toISOString()
    );
  } catch (error) {
    if (isIncrementalCacheMissing(error)) {
      return getDashboardActiveBookingsV3Uncached(input);
    }
    throw error;
  }
}
