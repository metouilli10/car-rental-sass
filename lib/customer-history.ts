import type {
  BookingStatus,
  DepositAction,
  InfractionStatus,
  InfractionType,
} from "@prisma/client";

export type ReturnCondition = "GOOD" | "BAD" | "MISSING";

export interface CustomerHistoryInfraction {
  id: string;
  date: Date;
  status: InfractionStatus;
  type: InfractionType;
  amount: number | null;
  bookingId: string | null;
  notes?: string | null;
}

export interface CustomerHistoryReport {
  id: string;
  inspectionType: "DEPART" | "RETOUR";
  reportedAt: Date;
  depositAction: DepositAction;
  deductFromDeposit: boolean;
  deductedAmount: number;
  cleanliness: string | null;
  totalDamageCost: number;
}

export interface CustomerHistoryBooking {
  id: string;
  startDate: Date;
  endDate: Date;
  actualReturnDate: Date | null;
  createdAt: Date;
  totalPrice: number;
  remainingAmount: number;
  status: BookingStatus;
  notes?: string | null;
  vehicle: {
    make: string;
    model: string;
    plate: string;
  };
  infractions: CustomerHistoryInfraction[];
  damageReports: CustomerHistoryReport[];
}

export interface CustomerHistoryRow {
  bookingId: string;
  vehicleLabel: string;
  plate: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  remainingAmount: number;
  returnInspectionId: string | null;
  returnCondition: ReturnCondition;
  returnReportedAt: Date | null;
  bookingInfractionCount: number;
}

export interface CustomerMetrics {
  totalReservations: number;
  totalRevenue: number;
  totalInfractions: number;
  goodReturns: number;
  badReturns: number;
}

export function getLatestReturnInspection(
  booking: Pick<CustomerHistoryBooking, "damageReports">
): CustomerHistoryReport | null {
  const returnReports = booking.damageReports.filter((report) => report.inspectionType === "RETOUR");

  if (returnReports.length === 0) {
    return null;
  }

  return returnReports.reduce((latest, current) =>
    current.reportedAt > latest.reportedAt ? current : latest
  );
}

export function getReturnCondition(
  report: Pick<CustomerHistoryReport, "depositAction"> | null | undefined
): ReturnCondition {
  if (!report) {
    return "MISSING";
  }

  if (report.depositAction === "RELEASE") {
    return "GOOD";
  }

  if (report.depositAction === "PARTIAL" || report.depositAction === "HOLD") {
    return "BAD";
  }

  return "MISSING";
}

export function buildCustomerHistoryRows(bookings: CustomerHistoryBooking[]): CustomerHistoryRow[] {
  return bookings.map((booking) => {
    const latestReturnInspection = getLatestReturnInspection(booking);

    return {
      bookingId: booking.id,
      vehicleLabel: `${booking.vehicle.make} ${booking.vehicle.model}`,
      plate: booking.vehicle.plate,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      remainingAmount: booking.remainingAmount,
      returnInspectionId: latestReturnInspection?.id ?? null,
      returnCondition: getReturnCondition(latestReturnInspection),
      returnReportedAt: latestReturnInspection?.reportedAt ?? null,
      bookingInfractionCount: booking.infractions.length,
    };
  });
}

export function computeCustomerMetrics(
  bookings: CustomerHistoryBooking[],
  infractions: CustomerHistoryInfraction[]
): CustomerMetrics {
  const activeBookings = bookings.filter((booking) => booking.status !== "CANCELED");
  const rows = buildCustomerHistoryRows(bookings);

  let goodReturns = 0;
  let badReturns = 0;

  for (const row of rows) {
    if (row.returnCondition === "GOOD") {
      goodReturns += 1;
    }

    if (row.returnCondition === "BAD") {
      badReturns += 1;
    }
  }

  return {
    totalReservations: activeBookings.length,
    totalRevenue: activeBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    totalInfractions: infractions.length,
    goodReturns,
    badReturns,
  };
}
