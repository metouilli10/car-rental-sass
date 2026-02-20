import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  computeBookingDue,
  computeOutstanding,
  computePendingBalance,
  getDepositDueDate,
  IMPAYES_SCOPE_STATUSES,
  isDepositDue,
  isDepositDueInPeriod,
  isDepositOverdue,
  isDepositReturnEligible,
  isFollowUpDueToday,
  isLateReturn,
  isUrgentCollection,
  isUrgentForPeriod,
} from "./rules";
import {
  DashboardPeriod,
  resolveDashboardPeriod,
  getComparableRange,
  getPeriodRange,
} from "./ranges";
import type {
  DashboardDTO,
  PeriodStatsMap,
  PriorityActionItem,
  TopVehiclesData,
  TrendMetric,
  TrendTone,
} from "./types";

const PERIODS: DashboardPeriod[] = ["today", "tomorrow", "week", "month"];

function toTone(deltaPct: number | null): TrendTone {
  if (deltaPct === null || deltaPct === 0) return "neutral";
  return deltaPct > 0 ? "positive" : "negative";
}

function buildTrendLabel(deltaPct: number | null): string {
  if (deltaPct === null) return "Stable vs periode precedente";
  if (deltaPct === 0) return "0% vs periode precedente";
  if (deltaPct > 0) return `+${Math.round(deltaPct)}% vs periode precedente`;
  return `${Math.round(deltaPct)}% vs periode precedente`;
}

function buildTrend(current: number, previous: number): TrendMetric {
  if (current <= 0 && previous <= 0) {
    return {
      current,
      previous,
      deltaPct: null,
      label: "Stable vs periode precedente",
      tone: "neutral",
    };
  }

  if (previous <= 0) {
    return {
      current,
      previous,
      deltaPct: 100,
      label: "+100% vs periode precedente",
      tone: "positive",
    };
  }

  const deltaPct = ((current - previous) / previous) * 100;
  return {
    current,
    previous,
    deltaPct,
    label: buildTrendLabel(deltaPct),
    tone: toTone(deltaPct),
  };
}

function toVehicleLabel(make: string, model: string): string {
  return `${make} ${model}`;
}

function formatDueDateTime(value: Date): string {
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function countDaysOverlap(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date
): number {
  const overlapStart = Math.max(start.getTime(), rangeStart.getTime());
  const overlapEnd = Math.min(end.getTime(), rangeEnd.getTime());
  if (overlapEnd <= overlapStart) return 0;
  const dayMs = 1000 * 60 * 60 * 24;
  return (overlapEnd - overlapStart) / dayMs;
}

async function getPeriodStats(agencyId: string, now: Date): Promise<PeriodStatsMap> {
  const statsEntries = await Promise.all(
    PERIODS.map(async (period) => {
      const range = getPeriodRange(period, now);
      const [departures, returns, lateReturns] = await Promise.all([
        prisma.booking.count({
          where: {
            agencyId,
            status: { in: ["CONFIRMED", "ACTIVE"] },
            startDate: { gte: range.start, lte: range.end },
          },
        }),
        prisma.booking.count({
          where: {
            agencyId,
            status: { not: "CANCELED" },
            endDate: { gte: range.start, lte: range.end },
          },
        }),
        prisma.booking.count({
          where: {
            agencyId,
            status: { notIn: ["COMPLETED", "CANCELED"] },
            endDate: { gte: range.start, lte: range.end, lt: now },
          },
        }),
      ]);

      return [period, { departures, returns, lateReturns }] as const;
    })
  );

  return Object.fromEntries(statsEntries) as PeriodStatsMap;
}

async function getTopVehiclesData(
  agencyId: string,
  monthStart: Date,
  monthEnd: Date
): Promise<TopVehiclesData> {
  const [revenuePayments, vehicleBookings] = await Promise.all([
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "PAID",
        category: "RENTAL",
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      select: {
        amount: true,
        booking: {
          select: {
            vehicleId: true,
            vehicle: { select: { make: true, model: true, plate: true } },
          },
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        agencyId,
        status: { not: "CANCELED" },
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      select: {
        vehicleId: true,
        startDate: true,
        endDate: true,
        vehicle: { select: { make: true, model: true, plate: true } },
      },
    }),
  ]);

  const revenueByVehicle = new Map<
    string,
    { label: string; plate: string; revenue: number }
  >();
  for (const payment of revenuePayments) {
    const id = payment.booking.vehicleId;
    const current = revenueByVehicle.get(id);
    const amount = payment.amount;
    if (current) {
      current.revenue += amount;
      continue;
    }
    revenueByVehicle.set(id, {
      label: toVehicleLabel(
        payment.booking.vehicle.make,
        payment.booking.vehicle.model
      ),
      plate: payment.booking.vehicle.plate,
      revenue: amount,
    });
  }

  const topRevenue = [...revenueByVehicle.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 3)
    .map(([vehicleId, payload]) => ({
      vehicleId,
      label: payload.label,
      plate: payload.plate,
      revenue: round(payload.revenue),
    }));

  const daysElapsedInMonth =
    (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24) || 1;
  const bookedDaysByVehicle = new Map<
    string,
    { label: string; plate: string; bookedDays: number }
  >();
  for (const booking of vehicleBookings) {
    const overlapDays = countDaysOverlap(
      booking.startDate,
      booking.endDate,
      monthStart,
      monthEnd
    );
    const current = bookedDaysByVehicle.get(booking.vehicleId);
    if (current) {
      current.bookedDays += overlapDays;
      continue;
    }
    bookedDaysByVehicle.set(booking.vehicleId, {
      label: toVehicleLabel(booking.vehicle.make, booking.vehicle.model),
      plate: booking.vehicle.plate,
      bookedDays: overlapDays,
    });
  }

  const bottomUtilization = [...bookedDaysByVehicle.entries()]
    .map(([vehicleId, payload]) => ({
      vehicleId,
      label: payload.label,
      plate: payload.plate,
      utilizationRate: round(
        Math.min(100, (payload.bookedDays / daysElapsedInMonth) * 100)
      ),
    }))
    .sort((a, b) => a.utilizationRate - b.utilizationRate)
    .slice(0, 3);

  return {
    topRevenue,
    bottomUtilization,
  };
}

export async function getDashboardData(input: {
  agencyId: string;
  period: DashboardPeriod;
  includeTopVehicles?: boolean;
}): Promise<DashboardDTO> {
  const now = new Date();
  const period = resolveDashboardPeriod(input.period);
  const todayRange = getPeriodRange("today", now);
  const selectedRange = getPeriodRange(period, now);
  const comparableRange = getComparableRange(period, selectedRange, now);
  const monthRange = getPeriodRange("month", now);

  const [
    vehicleStatusCounts,
    occupiedTodayVehicles,
    occupiedSelectedVehicles,
    bookingsForSelectedRange,
    paidRentalCurrent,
    paidRentalComparable,
    impayesScopeBookings,
    rentalPaidByBooking,
    lateReturnsCount,
    lateReturnRows,
    depositRows,
    paymentsToday,
    depositsHeldToday,
    depositsReleasedToday,
    refundsToday,
    monthRevenueAgg,
    monthBookingsCount,
    monthCompletedCount,
    monthAvgDurationAgg,
    monthExpensesAgg,
    periodStats,
  ] = await Promise.all([
    prisma.vehicle.groupBy({
      by: ["status"],
      where: { agencyId: input.agencyId },
      _count: { id: true },
    }),
    prisma.booking.findMany({
      where: {
        agencyId: input.agencyId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        startDate: { lte: todayRange.end },
        endDate: { gte: todayRange.start },
      },
      distinct: ["vehicleId"],
      select: { vehicleId: true },
    }),
    prisma.booking.findMany({
      where: {
        agencyId: input.agencyId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        startDate: { lte: selectedRange.end },
        endDate: { gte: selectedRange.start },
      },
      distinct: ["vehicleId"],
      select: { vehicleId: true },
    }),
    prisma.booking.findMany({
      where: {
        agencyId: input.agencyId,
        status: { not: "CANCELED" },
        startDate: { lte: selectedRange.end },
        endDate: { gte: selectedRange.start },
      },
      select: {
        startDate: true,
        endDate: true,
      },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId: input.agencyId },
        status: "PAID",
        category: "RENTAL",
        paidAt: { gte: selectedRange.start, lte: selectedRange.end },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId: input.agencyId },
        status: "PAID",
        category: "RENTAL",
        paidAt: { gte: comparableRange.start, lte: comparableRange.end },
      },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      where: {
        agencyId: input.agencyId,
        status: { in: IMPAYES_SCOPE_STATUSES },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        totalPrice: true,
        totalTtc: true,
        taxEnabled: true,
        discountAmount: true,
        addonsTotal: true,
        paidNow: true,
        remainingAmount: true,
        customer: { select: { id: true, name: true } },
        vehicle: { select: { make: true, model: true, plate: true } },
      },
    }),
    prisma.payment.groupBy({
      by: ["bookingId"],
      where: {
        booking: { agencyId: input.agencyId },
        status: "PAID",
        category: "RENTAL",
      },
      _sum: { amount: true },
    }),
    prisma.booking.count({
      where: {
        agencyId: input.agencyId,
        status: { notIn: ["COMPLETED", "CANCELED"] },
        endDate: { lt: now },
      },
    }),
    prisma.booking.findMany({
      where: {
        agencyId: input.agencyId,
        status: { notIn: ["COMPLETED", "CANCELED"] },
        endDate: { lt: now },
      },
      orderBy: [{ endDate: "asc" }],
      take: 8,
      select: {
        id: true,
        endDate: true,
        status: true,
        totalPrice: true,
        customer: { select: { id: true, name: true } },
        vehicle: { select: { make: true, model: true, plate: true } },
      },
    }),
    prisma.deposit.findMany({
      where: {
        status: "HELD",
        booking: { agencyId: input.agencyId, status: "COMPLETED" },
      },
      orderBy: [{ heldAt: "asc" }],
      select: {
        id: true,
        amount: true,
        status: true,
        heldAt: true,
        bookingId: true,
        booking: {
          select: {
            status: true,
            endDate: true,
            actualReturnDate: true,
            customer: { select: { id: true, name: true } },
            vehicle: { select: { make: true, model: true, plate: true } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        booking: { agencyId: input.agencyId },
        status: "PAID",
        paidAt: { gte: todayRange.start, lte: todayRange.end },
      },
      select: {
        id: true,
        amount: true,
        category: true,
        paidAt: true,
        booking: { select: { customer: { select: { name: true } } } },
      },
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId: input.agencyId },
        status: "HELD",
        heldAt: { gte: todayRange.start, lte: todayRange.end },
      },
      select: {
        id: true,
        amount: true,
        heldAt: true,
        booking: { select: { customer: { select: { name: true } } } },
      },
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId: input.agencyId },
        status: { in: ["RETURNED", "PARTIAL_RETURNED"] },
        returnedAt: { gte: todayRange.start, lte: todayRange.end },
      },
      select: {
        id: true,
        amount: true,
        returnedAt: true,
        booking: { select: { customer: { select: { name: true } } } },
      },
    }),
    prisma.payment.findMany({
      where: {
        booking: { agencyId: input.agencyId },
        status: "REFUNDED",
        updatedAt: { gte: todayRange.start, lte: todayRange.end },
      },
      select: {
        id: true,
        amount: true,
        updatedAt: true,
        booking: { select: { customer: { select: { name: true } } } },
      },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId: input.agencyId },
        status: "PAID",
        category: "RENTAL",
        paidAt: { gte: monthRange.start, lte: monthRange.end },
      },
      _sum: { amount: true },
    }),
    prisma.booking.count({
      where: {
        agencyId: input.agencyId,
        status: { not: "CANCELED" },
        createdAt: { gte: monthRange.start, lte: monthRange.end },
      },
    }),
    prisma.booking.count({
      where: {
        agencyId: input.agencyId,
        status: "COMPLETED",
        updatedAt: { gte: monthRange.start, lte: monthRange.end },
      },
    }),
    prisma.booking.aggregate({
      where: {
        agencyId: input.agencyId,
        status: { not: "CANCELED" },
        createdAt: { gte: monthRange.start, lte: monthRange.end },
      },
      _avg: { pricingDays: true },
    }),
    prisma.expense.aggregate({
      where: {
        agencyId: input.agencyId,
        date: { gte: monthRange.start, lte: monthRange.end },
      },
      _sum: { amount: true },
    }),
    getPeriodStats(input.agencyId, now),
  ]);

  const totalVehicles = vehicleStatusCounts.reduce(
    (acc, row) => acc + row._count.id,
    0
  );
  const rentedVehiclesToday = occupiedTodayVehicles.length;
  const rentedVehiclesSelected = occupiedSelectedVehicles.length;
  const occupationRate =
    totalVehicles > 0
      ? Math.round((rentedVehiclesToday / totalVehicles) * 100)
      : 0;
  const maintenanceVehicles =
    vehicleStatusCounts.find((item) => item.status === "MAINTENANCE")?._count.id ?? 0;
  const availableVehicles =
    vehicleStatusCounts.find((item) => item.status === "AVAILABLE")?._count.id ?? 0;
  const unavailableVehicles =
    vehicleStatusCounts.find((item) => item.status === "UNAVAILABLE")?._count.id ?? 0;
  const selectedRangeDays = Math.max(
    1,
    (selectedRange.end.getTime() - selectedRange.start.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const bookedDaysSelected = bookingsForSelectedRange.reduce(
    (sum, booking) =>
      sum +
      countDaysOverlap(
        booking.startDate,
        booking.endDate,
        selectedRange.start,
        selectedRange.end
      ),
    0
  );
  const availableDays = totalVehicles * selectedRangeDays;

  let occupancyRateForKpi: number;
  let occupancyRented: number;
  let occupancyLabelPeriod: DashboardPeriod;
  let occupiedDays: number | undefined;
  let availableDaysForKpi: number | undefined;

  if (period === "today") {
    occupancyRateForKpi =
      totalVehicles > 0
        ? Math.round((rentedVehiclesToday / totalVehicles) * 100)
        : 0;
    occupancyRented = rentedVehiclesToday;
    occupancyLabelPeriod = "today";
  } else {
    occupancyRateForKpi =
      totalVehicles > 0 && availableDays > 0
        ? Math.round(
            Math.min(100, (bookedDaysSelected / availableDays) * 100)
          )
        : 0;
    occupancyRented = rentedVehiclesSelected;
    occupancyLabelPeriod = period;
    occupiedDays = round(bookedDaysSelected);
    availableDaysForKpi = round(availableDays);
  }

  const currentEncaissements = paidRentalCurrent._sum.amount ?? 0;
  const comparableEncaissements = paidRentalComparable._sum.amount ?? 0;
  const encaissementsTrend = buildTrend(
    currentEncaissements,
    comparableEncaissements
  );

  const rentalPaidMap = new Map<string, number>();
  for (const row of rentalPaidByBooking) {
    const sum = row._sum.amount ?? 0;
    rentalPaidMap.set(row.bookingId, sum);
  }

  let pendingAmount = 0;
  let pendingBookingsCount = 0;
  let urgentPendingBookingsCount = 0;
  const bookingsWithOutstanding: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    status: string;
    totalPrice: number;
    totalTtc: number;
    taxEnabled: boolean;
    discountAmount: number;
    addonsTotal: number;
    paidNow: number;
    remainingAmount: number;
    customer: { id: string; name: string };
    vehicle: { make: string; model: string; plate: string };
    outstanding: number;
  }> = [];

  for (const b of impayesScopeBookings) {
    const due = computeBookingDue({
      totalPrice: b.totalPrice,
      totalTtc: b.totalTtc,
      taxEnabled: b.taxEnabled,
      discountAmount: b.discountAmount,
      addonsTotal: b.addonsTotal,
    });
    const paid = rentalPaidMap.get(b.id) ?? 0;
    const outstanding = computeOutstanding(due, paid);
    if (outstanding <= 0) continue;
    pendingAmount += outstanding;
    pendingBookingsCount += 1;
    const urgent = isUrgentForPeriod(
      outstanding,
      b.startDate,
      b.status,
      selectedRange
    );
    if (urgent) urgentPendingBookingsCount += 1;
    bookingsWithOutstanding.push({
      ...b,
      outstanding,
    });
  }

  const pendingCollectionRows = [...bookingsWithOutstanding].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  const pendingCollectionActions: PriorityActionItem[] = pendingCollectionRows
    .slice(0, 8)
    .map((booking) => {
      const urgent = isUrgentForPeriod(
        booking.outstanding,
        booking.startDate,
        booking.status,
        selectedRange
      );
      return {
        id: `collection-${booking.id}`,
        type: "collection",
        bookingId: booking.id,
        customerName: booking.customer.name,
        vehicleLabel: toVehicleLabel(booking.vehicle.make, booking.vehicle.model),
        plate: booking.vehicle.plate,
        dueAt: booking.startDate,
        dueLabel: urgent
          ? `Urgent - depart ${formatDueDateTime(booking.startDate)}`
          : `Echeance ${formatDueDateTime(booking.startDate)}`,
        amount: booking.outstanding,
        primaryAction: "Encaisser",
        primaryHref: "/payments",
        detailsHref: `/bookings/${booking.id}`,
      } as PriorityActionItem;
    });

  const lateReturnActions: PriorityActionItem[] = lateReturnRows
    .filter((booking) =>
      isLateReturn({ endDate: booking.endDate, status: booking.status, now })
    )
    .map((booking) => ({
      id: `late-${booking.id}`,
      type: "late_return",
      bookingId: booking.id,
      customerName: booking.customer.name,
      vehicleLabel: toVehicleLabel(booking.vehicle.make, booking.vehicle.model),
      plate: booking.vehicle.plate,
      dueAt: booking.endDate,
      dueLabel: `Retour en retard depuis ${formatDueDateTime(booking.endDate)}`,
      amount: booking.totalPrice,
      primaryAction: "Relancer",
      primaryHref: `/bookings/${booking.id}`,
      detailsHref: `/bookings/${booking.id}`,
    }));

  let depositsDueInPeriodAmount = 0;
  let depositsDueInPeriodCount = 0;
  let depositsOverdueAmount = 0;
  let depositsOverdueCount = 0;
  const depositActions: PriorityActionItem[] = [];
  const followUpCustomerIds = new Set<string>();

  for (const deposit of depositRows) {
    const dueDate = getDepositDueDate(
      deposit.booking.endDate,
      deposit.booking.actualReturnDate
    );
    const eligible = isDepositReturnEligible(
      deposit.booking.status,
      deposit.booking.actualReturnDate
    );
    if (!eligible) continue;

    const dueInRange = isDepositDueInPeriod(dueDate, selectedRange);
    const overdue = isDepositOverdue(dueDate, now);

    if (dueInRange) {
      depositsDueInPeriodAmount += deposit.amount;
      depositsDueInPeriodCount += 1;
    }
    if (overdue) {
      depositsOverdueAmount += deposit.amount;
      depositsOverdueCount += 1;
    }

    followUpCustomerIds.add(deposit.booking.customer.id);

    if ((dueInRange || overdue) && depositActions.length < 8) {
      depositActions.push({
        id: `deposit-${deposit.id}`,
        type: "deposit_release",
        bookingId: deposit.bookingId,
        customerName: deposit.booking.customer.name,
        vehicleLabel: toVehicleLabel(
          deposit.booking.vehicle.make,
          deposit.booking.vehicle.model
        ),
        plate: deposit.booking.vehicle.plate,
        dueAt: dueDate,
        dueLabel: overdue
          ? `En retard depuis ${formatDueDateTime(dueDate)}`
          : `A liberer le ${formatDueDateTime(dueDate)}`,
        amount: deposit.amount,
        primaryAction: "Liberer",
        primaryHref: `/bookings/${deposit.bookingId}`,
        detailsHref: `/bookings/${deposit.bookingId}`,
      });
    }
  }

  for (const row of pendingCollectionRows) {
    const urgent = isUrgentForPeriod(
      row.outstanding,
      row.startDate,
      row.status,
      selectedRange
    );
    const dueTodayFollowUp = isFollowUpDueToday({
      hasPendingBalance: row.outstanding > 0,
      isUrgentCollection: urgent,
      hasDepositDue: false,
    });
    if (dueTodayFollowUp) {
      followUpCustomerIds.add(row.customer.id);
    }
  }

  for (const row of depositRows) {
    const hasDepositDue = isDepositDue({
      status: row.status,
      bookingStatus: row.booking.status,
      endDate: row.booking.endDate,
      actualReturnDate: row.booking.actualReturnDate,
      now,
    });
    const dueTodayFollowUp = isFollowUpDueToday({
      hasPendingBalance: false,
      isUrgentCollection: false,
      hasDepositDue,
    });
    if (dueTodayFollowUp) {
      followUpCustomerIds.add(row.booking.customer.id);
    }
  }

  const toCollectToday = pendingCollectionRows.reduce((sum, row) => {
    const urgent = isUrgentForPeriod(
      row.outstanding,
      row.startDate,
      row.status,
      selectedRange
    );
    return urgent ? sum + row.outstanding : sum;
  }, 0);

  const inflowToday = [...paymentsToday, ...depositsHeldToday].reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const outflowToday = [...depositsReleasedToday, ...refundsToday].reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const balanceToday = inflowToday - outflowToday;

  const latestMovements = [
    ...paymentsToday.map((row) => ({
      id: `payment-${row.id}`,
      label: row.category === "RENTAL" ? "Paiement location" : "Encaissement",
      customerName: row.booking.customer.name,
      amount: row.amount,
      direction: "in" as const,
      happenedAt: row.paidAt ?? now,
    })),
    ...depositsHeldToday.map((row) => ({
      id: `deposit-held-${row.id}`,
      label: "Caution recue",
      customerName: row.booking.customer.name,
      amount: row.amount,
      direction: "in" as const,
      happenedAt: row.heldAt,
    })),
    ...depositsReleasedToday.map((row) => ({
      id: `deposit-release-${row.id}`,
      label: "Caution remboursee",
      customerName: row.booking.customer.name,
      amount: row.amount,
      direction: "out" as const,
      happenedAt: row.returnedAt ?? now,
    })),
    ...refundsToday.map((row) => ({
      id: `refund-${row.id}`,
      label: "Remboursement",
      customerName: row.booking.customer.name,
      amount: row.amount,
      direction: "out" as const,
      happenedAt: row.updatedAt,
    })),
  ]
    .sort((a, b) => b.happenedAt.getTime() - a.happenedAt.getTime())
    .slice(0, 6);

  const revenueMonth = monthRevenueAgg._sum.amount ?? 0;
  const completedMonth = monthCompletedCount;
  const reservationsMonth = monthBookingsCount;
  const completionRate =
    reservationsMonth > 0
      ? Math.round((completedMonth / reservationsMonth) * 100)
      : 0;
  const averageRentalDays = round(monthAvgDurationAgg._avg.pricingDays ?? 0);
  const revenuePerVehicle = totalVehicles > 0 ? round(revenueMonth / totalVehicles) : 0;
  const monthExpenses = Number(monthExpensesAgg._sum.amount ?? 0);

  const topVehicles =
    input.includeTopVehicles === false
      ? undefined
      : await getTopVehiclesData(input.agencyId, monthRange.start, monthRange.end);

  return {
    period,
    ceoSnapshot: {
      encaissements: {
        amount: round(currentEncaissements),
        trend: encaissementsTrend,
      },
      pendingCollections: {
        amount: round(pendingAmount),
        pendingBookingsCount,
        urgentCount: urgentPendingBookingsCount,
      },
      occupancy: {
        rate: occupancyRateForKpi,
        rented: occupancyRented,
        total: totalVehicles,
        maintenance: maintenanceVehicles,
        labelPeriod: occupancyLabelPeriod,
        ...(occupiedDays !== undefined && { occupiedDays }),
        ...(availableDaysForKpi !== undefined && { availableDays: availableDaysForKpi }),
      },
      depositsToRefund: {
        dueAmount: round(depositsDueInPeriodAmount),
        dueCount: depositsDueInPeriodCount,
        overdueAmount: round(depositsOverdueAmount),
        overdueCount: depositsOverdueCount,
        totalHeld: round(
          depositRows.reduce((sum, d) => sum + d.amount, 0)
        ),
      },
    },
    ownerAlerts: {
      lateReturnsCount,
      followUpsTodayCount: followUpCustomerIds.size,
    },
    periodStats,
    actionCenter: {
      pendingCollections: pendingCollectionActions,
      depositsToRelease: depositActions,
      lateReturns: lateReturnActions,
    },
    parkStatus: {
      occupationRate,
      rented: rentedVehiclesToday,
      available: availableVehicles,
      maintenance: maintenanceVehicles,
      unavailable: unavailableVehicles,
      total: totalVehicles,
    },
    cash: {
      inflowToday: round(inflowToday),
      outflowToday: round(outflowToday),
      balanceToday: round(balanceToday),
      toCollectToday: round(toCollectToday),
      latestMovements,
    },
    monthPerformance: {
      revenueMonth: round(revenueMonth),
      reservationsMonth,
      completedMonth,
      completionRate,
      revenuePerVehicle,
      averageRentalDays,
      caHintText: `${formatCurrency(revenueMonth)} - ${formatCurrency(
        revenuePerVehicle
      )}/vehicule (depenses: ${formatCurrency(monthExpenses)})`,
    },
    topVehicles,
  };
}

