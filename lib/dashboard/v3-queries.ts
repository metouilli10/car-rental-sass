import { unstable_cache } from "next/cache";
import type { BookingStatus, DepositStatus, NotificationSeverity, VehicleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { computeBookingDue, computeOutstanding } from "./rules";
import { resolveDashboardV3Period, type DashboardV3PeriodInput } from "./ranges";
import type {
  DashboardV3ActiveBookingsDTO,
  DashboardV3CollectionsSheetDTO,
  DashboardV3DTO,
  DashboardV3DueDepositsSheetDTO,
  DashboardV3LateReturnsSheetDTO,
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
} from "@/lib/onboarding/agency-onboarding";
import {
  calculateFinanceTotals,
  resolveRetainedDepositAmount,
} from "./finance";

const DASHBOARD_V3_CORE_CACHE_SECONDS = 60;
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

export interface DashboardLiveBookingRow {
  id: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  actualReturnDate: Date | null;
  status: "CONFIRMED" | "ACTIVE";
  totalPrice: number;
  totalTtc: number;
  taxEnabled: boolean;
  discountAmount: number | null;
  addonsTotal: number | null;
  remainingAmount: number | null;
  paidNow: number;
  customer: { name: string };
  vehicle: { make: string; model: string; plate: string };
  payments: Array<{ amount: number }>;
}

export interface DashboardLiveData {
  liveBookings: DashboardLiveBookingRow[];
  deposits: Array<{
    id: string;
    amount: number;
    status: DepositStatus;
    heldAt: Date;
    returnedAt: Date | null;
    bookingId: string;
    booking: {
      id: string;
      status: BookingStatus;
      endDate: Date;
      actualReturnDate: Date | null;
      customer: { name: string };
      vehicle: { make: string; model: string; plate: string };
      damageReports: Array<{
        deductFromDeposit: boolean;
        deductedAmount: number;
      }>;
    };
  }>;
  vehicles: Array<{
    id: string;
    status: VehicleStatus;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    severity: NotificationSeverity;
    dueAt: Date | null;
    vehicle: { id: string; make: string; model: string; plate: string };
  }>;
  agency: {
    createdAt: Date;
    onboardingVehicleAdded: boolean;
    onboardingReservationCreated: boolean;
    onboardingPaymentRecorded: boolean;
    onboardingDashboardExplored: boolean;
    onboardingCompleted: boolean;
    onboardingDismissed: boolean;
  } | null;
  departuresToday: number;
  returnsToday: number;
  overdueReturnsToday: number;
  historicalReservationCount: number;
  historicalPaidPaymentCount: number;
}

interface DashboardPeriodData {
  resolvedPeriod: ReturnType<typeof resolveDashboardV3Period>;
  paidInflows: number;
  refundedOutflows: number;
  cashExpensesOutflows: number;
  periodBookings: Array<{
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    status: BookingStatus;
  }>;
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function deserializeDashboardLiveData(data: DashboardLiveData): DashboardLiveData {
  return {
    ...data,
    liveBookings: data.liveBookings.map((booking) => ({
      ...booking,
      startDate: asDate(booking.startDate),
      endDate: asDate(booking.endDate),
      actualReturnDate: booking.actualReturnDate ? asDate(booking.actualReturnDate) : null,
    })),
    deposits: data.deposits.map((deposit) => ({
      ...deposit,
      heldAt: asDate(deposit.heldAt),
      returnedAt: deposit.returnedAt ? asDate(deposit.returnedAt) : null,
      booking: {
        ...deposit.booking,
        endDate: asDate(deposit.booking.endDate),
        actualReturnDate: deposit.booking.actualReturnDate
          ? asDate(deposit.booking.actualReturnDate)
          : null,
      },
    })),
    notifications: data.notifications.map((notification) => ({
      ...notification,
      dueAt: notification.dueAt ? asDate(notification.dueAt) : null,
    })),
    agency: data.agency
      ? {
          ...data.agency,
          createdAt: asDate(data.agency.createdAt),
        }
      : null,
  };
}

function deserializeDashboardPeriodData(data: DashboardPeriodData): DashboardPeriodData {
  return {
    ...data,
    resolvedPeriod: {
      ...data.resolvedPeriod,
      range: {
        start: asDate(data.resolvedPeriod.range.start),
        end: asDate(data.resolvedPeriod.range.end),
      },
    },
    periodBookings: data.periodBookings.map((booking) => ({
      ...booking,
      startDate: asDate(booking.startDate),
      endDate: asDate(booking.endDate),
    })),
  };
}

function computeBookingDueAmount(booking: DashboardLiveBookingRow): number {
  return computeBookingDue({
    totalTtc: booking.totalTtc,
    taxEnabled: booking.taxEnabled,
    totalPrice: booking.totalPrice,
    discountAmount: booking.discountAmount ?? 0,
    addonsTotal: booking.addonsTotal ?? 0,
  });
}

function computeBookingRemainingAmountFromPaidNow(booking: DashboardLiveBookingRow): number {
  return (
    booking.remainingAmount ??
    computeOutstanding(
      computeBookingDueAmount(booking),
      booking.paidNow ?? 0
    )
  );
}

function computeBookingRemainingAmountFromPayments(booking: DashboardLiveBookingRow): number {
  return (
    booking.remainingAmount ??
    computeOutstanding(
      computeBookingDueAmount(booking),
      booking.payments.reduce((sum, payment) => sum + payment.amount, 0)
    )
  );
}

function isWithinDayRange(value: Date, start: Date, endExclusive: Date): boolean {
  const time = value.getTime();
  return time >= start.getTime() && time < endExclusive.getTime();
}

export function buildActiveBookingsDTOFromLiveData(input: {
  liveBookings: DashboardLiveData["liveBookings"];
  now: Date;
}): DashboardV3ActiveBookingsDTO {
  const todayStart = new Date(input.now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  return buildActiveBookingTabs({
    bookings: input.liveBookings
      .filter((booking) => {
        const bookingStartsToday =
          booking.startDate.getTime() >= todayStart.getTime() &&
          booking.startDate.getTime() < tomorrowStart.getTime();
        const bookingEndsToday =
          booking.endDate.getTime() >= todayStart.getTime() &&
          booking.endDate.getTime() < tomorrowStart.getTime();

        return booking.status === "ACTIVE" || bookingStartsToday || bookingEndsToday;
      })
      .map((booking) => ({
        id: booking.id,
        bookingId: booking.id,
        customerName: booking.customer.name,
        vehicleLabel: `${booking.vehicle.make} ${booking.vehicle.model}`,
        plate: booking.vehicle.plate,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        remainingAmount: computeBookingRemainingAmountFromPaidNow(booking),
      })),
    now: input.now,
  });
}

export function buildCollectionsSheetDTO(input: {
  liveBookings: DashboardLiveData["liveBookings"];
  now: Date;
}): DashboardV3CollectionsSheetDTO {
  const items = sortCollectionItems(
    input.liveBookings
      .map((booking) => {
        const outstanding = computeBookingRemainingAmountFromPayments(booking);
        if (outstanding <= 0) return null;

        const dueDate = getCollectionDueDate(booking);
        const isOverdue = isCollectionOverdue(booking, outstanding, input.now);
        const customerName = booking.customer.name;
        const vehicleLabel = `${booking.vehicle.make} ${booking.vehicle.model}`;

        return {
          id: booking.id,
          bookingId: booking.id,
          customerName,
          vehicleLabel,
          plate: booking.vehicle.plate,
          amount: outstanding,
          dueLabel: isOverdue
            ? `En retard depuis ${formatDateTime(dueDate)}`
            : `A encaisser avant ${formatDateTime(dueDate)}`,
          isOverdue,
          primaryHref: `/bookings/${booking.id}`,
          label: `${customerName} - ${vehicleLabel}`,
          sublabel: booking.vehicle.plate,
          primaryAction: "Encaisser",
          actionType: "collection" as const,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  ).map((item) => ({
    id: item.id,
    bookingId: item.bookingId!,
    customerName: item.customerName!,
    vehicleLabel: item.vehicleLabel!,
    plate: item.plate!,
    amount: item.amount ?? 0,
    dueLabel: item.dueLabel ?? "",
    isOverdue: Boolean(item.isOverdue),
    primaryHref: item.primaryHref,
  }));

  return {
    count: items.length,
    overdueCount: items.filter((item) => item.isOverdue).length,
    totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
    items,
  };
}

export function buildDueDepositsSheetDTO(input: {
  deposits: DashboardLiveData["deposits"];
  now: Date;
}): DashboardV3DueDepositsSheetDTO {
  const items = sortDepositItems(
    input.deposits
      .filter((deposit) => isDepositReleaseDue(deposit, deposit.booking, input.now))
      .map((deposit) => {
        const dueDate = deposit.booking.actualReturnDate ?? deposit.booking.endDate;
        const isOverdue = dueDate.getTime() < input.now.getTime();
        const customerName = deposit.booking.customer.name;
        const vehicleLabel = `${deposit.booking.vehicle.make} ${deposit.booking.vehicle.model}`;

        return {
          id: deposit.id,
          depositId: deposit.id,
          bookingId: deposit.bookingId,
          customerName,
          vehicleLabel,
          plate: deposit.booking.vehicle.plate,
          amount: deposit.amount,
          dueLabel: isOverdue
            ? `En retard depuis ${formatDateTime(dueDate)}`
            : `A liberer le ${formatDateTime(dueDate)}`,
          isOverdue,
          primaryHref: `/bookings/${deposit.bookingId}`,
          label: `${customerName} - ${vehicleLabel}`,
          sublabel: `${deposit.booking.vehicle.plate} - caution en attente`,
          primaryAction: "Liberer",
          actionType: "deposit_release" as const,
        };
      })
  ).map((item) => ({
    id: item.id,
    depositId: item.depositId!,
    bookingId: item.bookingId!,
    customerName: item.customerName!,
    vehicleLabel: item.vehicleLabel!,
    plate: item.plate!,
    amount: item.amount ?? 0,
    dueLabel: item.dueLabel ?? "",
    isOverdue: Boolean(item.isOverdue),
    primaryHref: item.primaryHref,
  }));

  return {
    count: items.length,
    totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
    items,
  };
}

export function buildLateReturnsSheetDTO(input: {
  liveBookings: DashboardLiveData["liveBookings"];
  now: Date;
}): DashboardV3LateReturnsSheetDTO {
  const items = input.liveBookings
    .filter((booking) => booking.endDate.getTime() < input.now.getTime())
    .map((booking) => {
      const customerName = booking.customer.name;
      const vehicleLabel = `${booking.vehicle.make} ${booking.vehicle.model}`;
      const outstanding = computeBookingRemainingAmountFromPayments(booking);

      return {
        id: booking.id,
        bookingId: booking.id,
        customerName,
        vehicleLabel,
        plate: booking.vehicle.plate,
        dueLabel: `Retour en retard depuis ${formatDateTime(booking.endDate)}`,
        isOverdue: true,
        amount: outstanding > 0 ? outstanding : undefined,
        primaryHref: `/bookings/${booking.id}`,
      };
    })
    .sort((a, b) => {
      if ((a.amount ?? 0) !== (b.amount ?? 0)) return (b.amount ?? 0) - (a.amount ?? 0);
      return a.customerName.localeCompare(b.customerName);
    });

  return {
    count: items.length,
    exposedCount: items.filter((item) => (item.amount ?? 0) > 0).length,
    totalAmount: items.reduce((sum, item) => sum + (item.amount ?? 0), 0),
    items,
  };
}

async function getDashboardLiveDataUncached(agencyId: string): Promise<DashboardLiveData> {
  const startedAt = Date.now();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const liveQueriesStartedAt = Date.now();
  const [
    liveBookings,
    deposits,
    vehicles,
    notifications,
    agency,
    historicalReservation,
    historicalPaidPayment,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: {
        agencyId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
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
    }) as Promise<DashboardLiveBookingRow[]>,
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: { in: ["HELD", "RETURNED", "PARTIAL_RETURNED", "FORFEITED"] },
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
            damageReports: {
              where: {
                deductFromDeposit: true,
                deductedAmount: { gt: 0 },
              },
              orderBy: { reportedAt: "desc" },
              take: 1,
              select: {
                deductFromDeposit: true,
                deductedAmount: true,
              },
            },
          },
        },
      },
    }),
    prisma.vehicle.findMany({
      where: {
        agencyId,
      },
      select: {
        id: true,
        status: true,
      },
    }),
    prisma.notification.findMany({
      where: {
        agencyId,
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
      where: { id: agencyId },
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
    prisma.booking.findFirst({
      where: {
        agencyId,
        status: { not: "CANCELED" },
      },
      select: { id: true },
    }),
    prisma.payment.findFirst({
      where: {
        booking: { agencyId },
        status: "PAID",
      },
      select: { id: true },
    }),
  ]);
  logPerf("live-query-batch", liveQueriesStartedAt, { agencyId });

  const liveDerivationsStartedAt = Date.now();
  const departuresToday = liveBookings.filter((booking) =>
    isWithinDayRange(booking.startDate, todayStart, tomorrowStart)
  ).length;
  const returnsToday = liveBookings.filter((booking) =>
    isWithinDayRange(booking.endDate, todayStart, tomorrowStart)
  ).length;
  const overdueReturnsToday = liveBookings.filter(
    (booking) => booking.endDate.getTime() < now.getTime()
  ).length;
  const historicalReservationCount = historicalReservation ? 1 : 0;
  const historicalPaidPaymentCount = historicalPaidPayment ? 1 : 0;
  logPerf("live-derivations", liveDerivationsStartedAt, {
    agencyId,
    departuresToday,
    returnsToday,
    overdueReturnsToday,
  });

  logPerf("live-queries", startedAt, {
    agencyId,
    liveBookings: liveBookings.length,
    deposits: deposits.length,
    vehicles: vehicles.length,
    notifications: notifications.length,
    departuresToday,
    returnsToday,
    overdueReturnsToday,
  });

  return {
    liveBookings,
    deposits,
    vehicles,
    notifications,
    agency,
    departuresToday,
    returnsToday,
    overdueReturnsToday,
    historicalReservationCount,
    historicalPaidPaymentCount,
  };
}

async function getDashboardPeriodDataUncached(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardPeriodData> {
  const startedAt = Date.now();
  const resolvedPeriod = resolveDashboardV3Period(input.periodInput);
  const periodQueriesStartedAt = Date.now();
  const [paymentGroups, periodBookings, cashExpenseAgg] = await Promise.all([
    prisma.payment.groupBy({
      by: ["status", "category"],
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
      _sum: {
        amount: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        agencyId: input.agencyId,
        status: { not: "CANCELED" },
        startDate: { lte: resolvedPeriod.range.end },
        endDate: { gte: resolvedPeriod.range.start },
      },
      select: {
        vehicleId: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    }),
    prisma.expense.aggregate({
      where: {
        agencyId: input.agencyId,
        method: "CASH",
        date: { gte: resolvedPeriod.range.start, lte: resolvedPeriod.range.end },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);
  logPerf("period-query-batch", periodQueriesStartedAt, {
    agencyId: input.agencyId,
    period: resolvedPeriod.key,
  });

  const periodDerivationsStartedAt = Date.now();
  let paidInflows = 0;
  let refundedOutflows = 0;
  for (const group of paymentGroups) {
    const amount = Number(group._sum.amount ?? 0);
    if (group.status === "PAID" && group.category === "RENTAL") {
      paidInflows += amount;
    } else if (group.status === "REFUNDED") {
      refundedOutflows += amount;
    }
  }
  logPerf("period-derivations", periodDerivationsStartedAt, {
    agencyId: input.agencyId,
    period: resolvedPeriod.key,
    paymentGroups: paymentGroups.length,
    paidInflows,
    refundedOutflows,
  });

  logPerf("period-queries", startedAt, {
    agencyId: input.agencyId,
    period: resolvedPeriod.key,
    paymentGroups: paymentGroups.length,
    periodBookings: periodBookings.length,
  });

  return {
    resolvedPeriod,
    paidInflows,
    refundedOutflows,
    cashExpensesOutflows: Number(cashExpenseAgg._sum.amount ?? 0),
    periodBookings,
  };
}

async function getDashboardDataV3Uncached(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardV3DTO> {
  const startedAt = Date.now();
  const now = new Date();
  const [liveData, periodData] = await Promise.all([
    getDashboardLiveData(input.agencyId),
    getDashboardPeriodData(input),
  ]);
  const resolvedPeriod = periodData.resolvedPeriod;
  const periodQuery = buildPeriodQuery({
    period: resolvedPeriod.key,
    start: resolvedPeriod.range.start.toISOString(),
    end: resolvedPeriod.range.end.toISOString(),
  });
  const { liveBookings, deposits, vehicles, notifications, agency } = liveData;
  const { paidInflows, refundedOutflows, periodBookings } = periodData;

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
  const heldDepositsInPeriod: Array<{ amount: number }> = [];
  const releasedDepositsInPeriod: Array<{
    amount: number;
    status: DepositStatus;
    retainedAmount: number;
  }> = [];

  for (const deposit of deposits) {
    if (
      deposit.status === "HELD" &&
      deposit.heldAt.getTime() >= resolvedPeriod.range.start.getTime() &&
      deposit.heldAt.getTime() <= resolvedPeriod.range.end.getTime()
    ) {
      heldDepositsInPeriod.push({ amount: deposit.amount });
    }
    if (
      (deposit.status === "RETURNED" ||
        deposit.status === "PARTIAL_RETURNED" ||
        deposit.status === "FORFEITED") &&
      deposit.returnedAt &&
      deposit.returnedAt.getTime() >= resolvedPeriod.range.start.getTime() &&
      deposit.returnedAt.getTime() <= resolvedPeriod.range.end.getTime()
    ) {
      releasedDepositsInPeriod.push({
        amount: deposit.amount,
        status: deposit.status,
        retainedAmount: resolveRetainedDepositAmount(
          deposit.amount,
          deposit.booking.damageReports
        ),
      });
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

  const financeTotals = calculateFinanceTotals({
    rentalPayments: [{ amount: paidInflows }],
    refunds: [{ amount: refundedOutflows }],
    cashExpenses: [{ amount: periodData.cashExpensesOutflows }],
    heldDeposits: heldDepositsInPeriod,
    releasedDeposits: releasedDepositsInPeriod,
  });
  const netAmount = financeTotals.earnedNet;

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

  for (const booking of liveBookings) {
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
      discountAmount: booking.discountAmount ?? 0,
      addonsTotal: booking.addonsTotal ?? 0,
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

    const isLateReturn = booking.endDate.getTime() < now.getTime();
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
  const activeReservationsCount = liveBookings.filter((booking) => booking.status === "ACTIVE").length;

  const occupancyRate =
    resolvedPeriod.key === "today"
      ? fleetSnapshot.totalActive > 0
        ? Math.round((fleetSnapshot.rented / fleetSnapshot.totalActive) * 100)
        : 0
      : computeAverageDailyOccupancyFallback({
          rangeStart: resolvedPeriod.range.start,
          rangeEnd: resolvedPeriod.range.end,
          activeVehicleCount: fleetSnapshot.totalActive,
          bookings: periodBookings.map((booking) => ({
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
      ctaHref: `/finance?${periodQuery}`,
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
          primaryAction: "Voir dossier",
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
    liveData.historicalReservationCount > 0;
  const paymentRecorded =
    Boolean(agency?.onboardingPaymentRecorded) ||
    liveData.historicalPaidPaymentCount > 0;
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
    context: {
      updatedAt: now.toISOString(),
      activeReservationsCount,
    },
    pulse: {
      net: {
        amount: Math.round(netAmount * 100) / 100,
        subtitle: `${formatCurrency(financeTotals.earnedIn)} revenus / ${formatCurrency(
          financeTotals.earnedOut
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
      deposits: {
        amount: Math.round(depositDueAmountTotal * 100) / 100,
        count: depositDueItems.length,
        overdueCount: depositDueItems.filter((item) => item.isOverdue).length,
        subtitle: `${depositDueItems.length} cautions, ${depositDueItems.filter((item) => item.isOverdue).length} en retard`,
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
      departures: liveData.departuresToday,
      returns: liveData.returnsToday,
      overdueReturns: liveData.overdueReturnsToday,
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
  const now = new Date();
  void input.periodInput;

  const liveData = await getDashboardLiveData(input.agencyId);
  const dto = buildActiveBookingsDTOFromLiveData({
    liveBookings: liveData.liveBookings,
    now,
  });

  logPerf("active-bookings-total", startedAt, {
    agencyId: input.agencyId,
    bookings: liveData.liveBookings.length,
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

const getDashboardLiveDataCached = unstable_cache(
  async (agencyId: string, dayStart: string) => getDashboardLiveDataUncached(agencyId),
  ["dashboard-v3-live"],
  { revalidate: DASHBOARD_V3_CORE_CACHE_SECONDS }
);

const getDashboardPeriodDataCached = unstable_cache(
  async (agencyId: string, period: string, start: string, end: string) =>
    getDashboardPeriodDataUncached({
      agencyId,
      periodInput: { period, start, end },
    }),
  ["dashboard-v3-period"],
  { revalidate: DASHBOARD_V3_CORE_CACHE_SECONDS }
);

export async function getDashboardDataV3(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardV3DTO> {
  try {
    return await getDashboardDataV3Cached(
      input.agencyId,
      input.periodInput.period ?? "",
      input.periodInput.start ?? "",
      input.periodInput.end ?? ""
    );
  } catch (error) {
    // Fall back to uncached on any cache error (incrementalCache missing, fs issues, etc.)
    if (isIncrementalCacheMissing(error) || (error instanceof Error && error.message?.includes("cache"))) {
      return getDashboardDataV3Uncached(input);
    }
    // Log and fall back to uncached for robustness in production
    console.error("[dashboard:v3] Cache error, falling back to uncached:", error);
    return getDashboardDataV3Uncached(input);
  }
}

export async function getDashboardPeriodSummary(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<Pick<DashboardV3DTO, "period" | "context" | "pulse">> {
  const now = new Date();
  const [liveData, periodData] = await Promise.all([
    getDashboardLiveData(input.agencyId),
    getDashboardPeriodData(input),
  ]);
  const resolvedPeriod = periodData.resolvedPeriod;

  let depositDueAmountTotal = 0;
  let depositDueCount = 0;
  const heldDepositsInPeriod: Array<{ amount: number }> = [];
  const releasedDepositsInPeriod: Array<{
    amount: number;
    status: DepositStatus;
    retainedAmount: number;
  }> = [];

  for (const deposit of liveData.deposits) {
    if (
      deposit.status === "HELD" &&
      deposit.heldAt.getTime() >= resolvedPeriod.range.start.getTime() &&
      deposit.heldAt.getTime() <= resolvedPeriod.range.end.getTime()
    ) {
      heldDepositsInPeriod.push({ amount: deposit.amount });
    }
    if (
      (deposit.status === "RETURNED" ||
        deposit.status === "PARTIAL_RETURNED" ||
        deposit.status === "FORFEITED") &&
      deposit.returnedAt &&
      deposit.returnedAt.getTime() >= resolvedPeriod.range.start.getTime() &&
      deposit.returnedAt.getTime() <= resolvedPeriod.range.end.getTime()
    ) {
      releasedDepositsInPeriod.push({
        amount: deposit.amount,
        status: deposit.status,
        retainedAmount: resolveRetainedDepositAmount(
          deposit.amount,
          deposit.booking.damageReports
        ),
      });
    }

    if (isDepositReleaseDue(deposit, deposit.booking, now)) {
      depositDueAmountTotal += deposit.amount;
      depositDueCount += 1;
    }
  }

  let toCollectAmount = 0;
  let toCollectCount = 0;
  let overdueCollectionsCount = 0;
  let lateReturnCount = 0;
  const currentRentedVehicleIds = new Set<string>();

  for (const booking of liveData.liveBookings) {
    const overlapsNow =
      booking.startDate.getTime() <= now.getTime() &&
      booking.endDate.getTime() >= now.getTime();
    if (overlapsNow) {
      currentRentedVehicleIds.add(booking.vehicleId);
    }

    const due = computeBookingDue({
      totalPrice: booking.totalPrice,
      totalTtc: booking.totalTtc,
      taxEnabled: booking.taxEnabled,
      discountAmount: booking.discountAmount ?? 0,
      addonsTotal: booking.addonsTotal ?? 0,
    });
    const paidAmount = booking.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstanding = computeOutstanding(due, paidAmount);

    if (outstanding > 0) {
      toCollectAmount += outstanding;
      toCollectCount += 1;
      if (isCollectionOverdue(booking, outstanding, now)) {
        overdueCollectionsCount += 1;
      }
    }

    if (booking.endDate.getTime() < now.getTime()) {
      lateReturnCount += 1;
    }
  }

  const fleetSnapshot = computeFleetSnapshot({
    vehicles: liveData.vehicles,
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
          bookings: periodData.periodBookings.map((booking) => ({
            vehicleId: booking.vehicleId,
            startDate: booking.startDate,
            endDate: booking.endDate,
          })),
        });

  const financeTotals = calculateFinanceTotals({
    rentalPayments: [{ amount: periodData.paidInflows }],
    refunds: [{ amount: periodData.refundedOutflows }],
    cashExpenses: [{ amount: periodData.cashExpensesOutflows }],
    heldDeposits: heldDepositsInPeriod,
    releasedDeposits: releasedDepositsInPeriod,
  });
  const netAmount = financeTotals.earnedNet;
  const riskExposure = computeRiskExposure({
    unpaidAmountTotal: toCollectAmount,
    depositDueAmountTotal,
  });

  return {
    period: {
      key: resolvedPeriod.key,
      label: resolvedPeriod.label,
      start: resolvedPeriod.range.start.toISOString(),
      end: resolvedPeriod.range.end.toISOString(),
    },
    context: {
      updatedAt: now.toISOString(),
      activeReservationsCount: liveData.liveBookings.filter((booking) => booking.status === "ACTIVE")
        .length,
    },
    pulse: {
      net: {
        amount: Math.round(netAmount * 100) / 100,
        subtitle: `${formatCurrency(financeTotals.earnedIn)} revenus / ${formatCurrency(
          financeTotals.earnedOut
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
      deposits: {
        amount: Math.round(depositDueAmountTotal * 100) / 100,
        count: depositDueCount,
        overdueCount: deposits.filter((deposit) => isDepositReleaseDue(deposit, deposit.booking, now) && (deposit.booking.actualReturnDate ?? deposit.booking.endDate).getTime() < now.getTime()).length,
        subtitle: `${depositDueCount} cautions, ${deposits.filter((deposit) => isDepositReleaseDue(deposit, deposit.booking, now) && (deposit.booking.actualReturnDate ?? deposit.booking.endDate).getTime() < now.getTime()).length} en retard`,
      },
      risks: {
        count: toCollectCount + depositDueCount + lateReturnCount,
        exposureAmount: Math.round(riskExposure * 100) / 100,
        breakdown: {
          unpaidCount: toCollectCount,
          depositDueCount,
          lateReturnCount,
        },
        subtitle: `${toCollectCount} impayes, ${depositDueCount} cautions, ${lateReturnCount} retours`,
      },
    },
  };
}

export async function getDashboardActiveBookingsV3(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardV3ActiveBookingsDTO> {
  try {
    return await getDashboardActiveBookingsV3Uncached(input);
  } catch (error) {
    if (isIncrementalCacheMissing(error)) {
      return getDashboardActiveBookingsV3Uncached(input);
    }
    throw error;
  }
}

export async function getDashboardCollectionsSheetData(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardV3CollectionsSheetDTO> {
  void input.periodInput;
  const liveData = await getDashboardLiveData(input.agencyId);
  return buildCollectionsSheetDTO({
    liveBookings: liveData.liveBookings,
    now: new Date(),
  });
}

export async function getDashboardDueDepositsSheetData(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardV3DueDepositsSheetDTO> {
  void input.periodInput;
  const liveData = await getDashboardLiveData(input.agencyId);
  return buildDueDepositsSheetDTO({
    deposits: liveData.deposits,
    now: new Date(),
  });
}

export async function getDashboardLateReturnsSheetData(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardV3LateReturnsSheetDTO> {
  void input.periodInput;
  const liveData = await getDashboardLiveData(input.agencyId);
  return buildLateReturnsSheetDTO({
    liveBookings: liveData.liveBookings,
    now: new Date(),
  });
}

async function getDashboardLiveData(agencyId: string): Promise<DashboardLiveData> {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  try {
    const cached = await getDashboardLiveDataCached(agencyId, dayStart.toISOString());
    return deserializeDashboardLiveData(cached);
  } catch (error) {
    if (isIncrementalCacheMissing(error)) {
      return getDashboardLiveDataUncached(agencyId);
    }
    throw error;
  }
}

async function getDashboardPeriodData(input: {
  agencyId: string;
  periodInput: DashboardV3PeriodInput;
}): Promise<DashboardPeriodData> {
  const resolvedPeriod = resolveDashboardV3Period(input.periodInput);
  try {
    const cached = await getDashboardPeriodDataCached(
      input.agencyId,
      resolvedPeriod.key,
      resolvedPeriod.range.start.toISOString(),
      resolvedPeriod.range.end.toISOString()
    );
    return deserializeDashboardPeriodData(cached);
  } catch (error) {
    if (isIncrementalCacheMissing(error)) {
      return getDashboardPeriodDataUncached(input);
    }
    throw error;
  }
}
