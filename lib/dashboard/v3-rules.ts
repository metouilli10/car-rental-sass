import type { BookingStatus, DepositStatus, NotificationSeverity, VehicleStatus } from "@prisma/client";
import type {
  DashboardV3ActionItem,
  DashboardV3ActiveBookingsDTO,
  DashboardV3BookingTabItem,
  DashboardV3FleetSnapshot,
} from "./types";

interface BookingLike {
  startDate: Date;
  endDate: Date;
  actualReturnDate?: Date | null;
  status: BookingStatus;
}

interface DepositLike {
  status: DepositStatus;
}

export interface DashboardV3BookingTabSourceItem {
  id: string;
  bookingId: string;
  customerName: string;
  vehicleLabel: string;
  plate: string;
  startDate: Date | null;
  endDate: Date | null;
  status: BookingStatus;
  remainingAmount: number;
}

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isValidDate(value: Date | null | undefined): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isSameDay(left: Date, right: Date): boolean {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function sortByDateAsc<T extends DashboardV3BookingTabItem>(
  items: T[],
  key: "startDate" | "endDate"
): T[] {
  return [...items].sort((left, right) => {
    const leftTime = left[key] ? new Date(left[key]).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right[key] ? new Date(right[key]).getTime() : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });
}

export function getCollectionDueDate(booking: Pick<BookingLike, "startDate">): Date {
  return booking.startDate;
}

export function isBookingOverdue(
  booking: Pick<BookingLike, "endDate" | "status">,
  now: Date
): boolean {
  if (booking.status !== "ACTIVE") return false;
  return startOfDay(booking.endDate).getTime() < startOfDay(now).getTime();
}

export function isCollectionOverdue(
  booking: Pick<BookingLike, "startDate" | "status">,
  outstandingAmount: number,
  now: Date
): boolean {
  if (outstandingAmount <= 0) return false;
  return (
    booking.status === "ACTIVE" ||
    getCollectionDueDate(booking).getTime() < startOfDay(now).getTime()
  );
}

export function isDepositReleaseDue(
  deposit: Pick<DepositLike, "status">,
  booking: Pick<BookingLike, "status" | "endDate" | "actualReturnDate">,
  now: Date
): boolean {
  if (deposit.status !== "HELD") return false;
  if (booking.status === "COMPLETED") return true;
  const returnedAt = booking.actualReturnDate ?? booking.endDate;
  return returnedAt.getTime() < now.getTime();
}

export function computeRiskExposure(input: {
  unpaidAmountTotal: number;
  depositDueAmountTotal: number;
}): number {
  return input.unpaidAmountTotal + input.depositDueAmountTotal;
}

export function sortCollectionItems<T extends DashboardV3ActionItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return (b.amount ?? 0) - (a.amount ?? 0);
  });
}

export function sortDepositItems<T extends DashboardV3ActionItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return (b.amount ?? 0) - (a.amount ?? 0);
  });
}

export function sortLateReturnItems<T extends DashboardV3ActionItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return (b.amount ?? 0) - (a.amount ?? 0);
  });
}

export function sortUrgentNotificationItems<T extends DashboardV3ActionItem & {
  severityRank?: number;
}>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.severityRank ?? 0) - (a.severityRank ?? 0));
}

export function getSeverityRank(severity: NotificationSeverity): number {
  if (severity === "DUE") return 3;
  if (severity === "WARNING") return 2;
  return 1;
}

export function computeFleetSnapshot(input: {
  vehicles: Array<{ id: string; status: VehicleStatus }>;
  rentedVehicleIds: Set<string>;
}): DashboardV3FleetSnapshot {
  let totalActive = 0;
  let maintenance = 0;
  let inactive = 0;
  let rented = 0;

  for (const vehicle of input.vehicles) {
    const { id, status } = vehicle;
    if (status === "MAINTENANCE") {
      maintenance += 1;
      totalActive += 1;
      continue;
    }
    if (status === "UNAVAILABLE") {
      inactive += 1;
      continue;
    }

    totalActive += 1;

    if (status === "RENTED" || input.rentedVehicleIds.has(id)) {
      rented += 1;
    }
  }

  const available = Math.max(0, totalActive - rented - maintenance);

  return {
    rented,
    available,
    maintenance,
    inactive,
    totalActive,
  };
}

export function computeAverageDailyOccupancyFallback(input: {
  rangeStart: Date;
  rangeEnd: Date;
  activeVehicleCount: number;
  bookings: Array<Pick<BookingLike, "startDate" | "endDate"> & { vehicleId: string }>;
}): number {
  if (input.activeVehicleCount <= 0) return 0;
  const current = new Date(startOfDay(input.rangeStart));
  const end = new Date(startOfDay(input.rangeEnd));
  let days = 0;
  let occupancySum = 0;

  while (current.getTime() <= end.getTime()) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const rentedCount = new Set(
      input.bookings
        .filter(
          (booking) =>
            booking.startDate.getTime() <= dayEnd.getTime() &&
            booking.endDate.getTime() >= dayStart.getTime()
        )
        .map((booking) => booking.vehicleId)
    ).size;

    occupancySum += rentedCount / input.activeVehicleCount;
    days += 1;
    current.setDate(current.getDate() + 1);
  }

  return days > 0 ? Math.round((occupancySum / days) * 100) : 0;
}

export function buildActiveBookingTabs(input: {
  bookings: DashboardV3BookingTabSourceItem[];
  now: Date;
}): DashboardV3ActiveBookingsDTO {
  const active: DashboardV3BookingTabItem[] = [];
  const startToday: DashboardV3BookingTabItem[] = [];
  const endToday: DashboardV3BookingTabItem[] = [];
  const overdue: DashboardV3BookingTabItem[] = [];

  for (const booking of input.bookings) {
    const hasValidStartDate = isValidDate(booking.startDate);
    const hasValidEndDate = isValidDate(booking.endDate);
    const startDate = hasValidStartDate ? booking.startDate : null;
    const endDate = hasValidEndDate ? booking.endDate : null;

    const isOverdue = endDate
      ? isBookingOverdue(
          {
            endDate,
            status: booking.status,
          },
          input.now
        )
      : false;

    const item: DashboardV3BookingTabItem = {
      id: booking.id,
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      vehicleLabel: booking.vehicleLabel,
      plate: booking.plate,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      status: booking.status,
      remainingAmount: Math.max(0, Math.round(booking.remainingAmount * 100) / 100),
      isOverdue,
      detailsHref: `/bookings/${booking.bookingId}`,
    };

    if (booking.status === "ACTIVE") {
      active.push(item);
    }

    if (
      (booking.status === "ACTIVE" || booking.status === "CONFIRMED") &&
      startDate &&
      isSameDay(startDate, input.now)
    ) {
      startToday.push(item);
    }

    if (
      (booking.status === "ACTIVE" || booking.status === "CONFIRMED") &&
      endDate &&
      isSameDay(endDate, input.now)
    ) {
      endToday.push(item);
    }

    if (isOverdue) {
      overdue.push(item);
    }
  }

  return {
    defaultTab: "active",
    tabs: [
      {
        key: "active",
        label: "En cours",
        count: active.length,
        items: sortByDateAsc(active, "endDate"),
      },
      {
        key: "start_today",
        label: "Départs aujourd'hui",
        count: startToday.length,
        items: sortByDateAsc(startToday, "startDate"),
      },
      {
        key: "end_today",
        label: "Retours aujourd'hui",
        count: endToday.length,
        items: sortByDateAsc(endToday, "endDate"),
      },
      {
        key: "overdue",
        label: "En retard",
        count: overdue.length,
        items: sortByDateAsc(overdue, "endDate"),
      },
    ],
  };
}
