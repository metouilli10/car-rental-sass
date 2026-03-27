import type {
  BookingAddon,
  BookingDepositStatus,
  BookingPaymentStatus,
  BookingStatus,
  DepositStatus,
  InspectionType,
  PaymentCategory,
  PaymentStatus,
} from "@prisma/client";
import { getDepositStatus, getPaymentStatus, getReservationTone } from "@/lib/reservations/presentation";

type PaymentLike = {
  amount: number;
  category: PaymentCategory;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
};

type DamageReportLike = {
  inspectionType: InspectionType;
  reportedAt: Date;
};

type CustomerHistoryBookingLike = {
  id: string;
  createdAt: Date;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: BookingStatus;
  vehicle: {
    make: string;
    model: string;
    plate: string;
  };
  infractions: Array<{ id: string }>;
  damageReports: Array<{
    inspectionType: InspectionType;
    depositAction: "RELEASE" | "PARTIAL" | "HOLD";
  }>;
};

export type ReservationAttentionAlert = {
  severity: "warning" | "danger";
  title: string;
  message: string;
};

export type ReservationFinanceRow = {
  label: string;
  amount: number;
  tone?: "default" | "muted";
};

export type ReservationActivityItem = {
  id: string;
  label: string;
  detail: string;
  occurredAt: Date;
};

export type ReservationCustomerHistorySummary = {
  totalRentals: number;
  averageDurationDays: number;
  totalGenerated: number;
  incidents: number;
  lastVehicle: string | null;
};

export function calculateDurationDays(startDate: Date, endDate: Date): number {
  return Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function getReservationAttentionAlert(params: {
  status: BookingStatus;
  endDate: Date;
  damageReports: DamageReportLike[];
}): ReservationAttentionAlert | null {
  const { status, endDate, damageReports } = params;

  if (status === "CANCELED") {
    return null;
  }

  const hasReturnInspection = damageReports.some((report) => report.inspectionType === "RETOUR");
  if (hasReturnInspection) {
    return null;
  }

  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  if (endDate > todayEnd) {
    return null;
  }

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const isToday = endDate >= todayStart && endDate <= todayEnd;

  return {
    severity: isToday ? "warning" : "danger",
    title: isToday ? "Inspection retour à faire aujourd'hui" : "Inspection retour en retard",
    message: isToday
      ? "La date de retour est aujourd'hui et l'inspection n'a pas encore été enregistrée."
      : "La date de retour est dépassée et aucune inspection retour n'a encore été enregistrée.",
  };
}

export function buildReservationFinanceRows(params: {
  totalPrice: number;
  totalHt: number;
  totalTva: number;
  taxEnabled: boolean;
  discountAmount: number;
  addons: BookingAddon[];
}): ReservationFinanceRow[] {
  const { totalPrice, totalHt, totalTva, taxEnabled, discountAmount, addons } = params;
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.totalAmount, 0);
  const baseAmount = totalHt > 0 || taxEnabled ? totalHt : totalPrice;
  const rentalBase = Math.max(0, baseAmount - addonsTotal + discountAmount);

  const rows: ReservationFinanceRow[] = [{ label: "Location", amount: rentalBase }];

  for (const addon of addons) {
    rows.push({
      label: addon.label,
      amount: addon.totalAmount,
    });
  }

  if (discountAmount > 0) {
    rows.push({
      label: "Remise",
      amount: -discountAmount,
      tone: "muted",
    });
  }

  if (taxEnabled && totalTva > 0) {
    rows.push({
      label: "TVA",
      amount: totalTva,
      tone: "muted",
    });
  }

  return rows;
}

export function buildReservationCustomerHistorySummary(
  bookings: CustomerHistoryBookingLike[]
): ReservationCustomerHistorySummary {
  const activeBookings = bookings.filter((booking) => booking.status !== "CANCELED");
  const durations = activeBookings.map((booking) =>
    calculateDurationDays(booking.startDate, booking.endDate)
  );
  const latestBooking = [...activeBookings].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime()
  )[0];
  const badReturnCount = activeBookings.filter((booking) =>
    booking.damageReports.some(
      (report) =>
        report.inspectionType === "RETOUR" &&
        (report.depositAction === "PARTIAL" || report.depositAction === "HOLD")
    )
  ).length;
  const infractionCount = activeBookings.reduce(
    (sum, booking) => sum + booking.infractions.length,
    0
  );

  return {
    totalRentals: activeBookings.length,
    averageDurationDays:
      durations.length > 0
        ? Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) * 10) / 10
        : 0,
    totalGenerated: activeBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    incidents: infractionCount + badReturnCount,
    lastVehicle: latestBooking
      ? `${latestBooking.vehicle.make} ${latestBooking.vehicle.model}`
      : null,
  };
}

export function buildReservationActivityItems(params: {
  createdAt: Date;
  contractSignedAt: Date | null;
  payments: PaymentLike[];
  damageReports: DamageReportLike[];
}): ReservationActivityItem[] {
  const { createdAt, contractSignedAt, payments, damageReports } = params;
  const items: ReservationActivityItem[] = [
    {
      id: "created",
      label: "Réservation créée",
      detail: "Dossier créé dans Locaryx",
      occurredAt: createdAt,
    },
  ];

  for (const payment of payments) {
    if (payment.category !== "RENTAL" || payment.status !== "PAID") {
      continue;
    }

    items.push({
      id: `payment-${payment.createdAt.toISOString()}-${payment.amount}`,
      label: "Paiement reçu",
      detail: `${payment.amount.toLocaleString("fr-MA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} MAD`,
      occurredAt: payment.paidAt ?? payment.createdAt,
    });
  }

  for (const report of damageReports) {
    items.push({
      id: `inspection-${report.inspectionType}-${report.reportedAt.toISOString()}`,
      label:
        report.inspectionType === "DEPART"
          ? "Inspection avant départ"
          : "Inspection retour",
      detail: "Inspection enregistrée",
      occurredAt: report.reportedAt,
    });
  }

  if (contractSignedAt) {
    items.push({
      id: `contract-${contractSignedAt.toISOString()}`,
      label: "Contrat signé téléversé",
      detail: "Document rattaché à la réservation",
      occurredAt: contractSignedAt,
    });
  }

  return items.sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}

export function buildReservationStatusSummary(params: {
  status: BookingStatus;
  totalPrice: number;
  paidNow: number;
  paymentStatus: BookingPaymentStatus;
  depositAmount: number;
  deposit: { status: DepositStatus } | null;
  bookingDepositStatus: BookingDepositStatus;
}) {
  const payment = getPaymentStatus(params.paidNow, params.totalPrice, params.paymentStatus);
  const deposit = getDepositStatus(
    params.depositAmount,
    params.deposit,
    params.bookingDepositStatus
  );
  const reservation = getReservationTone(params.status);

  return {
    reservation,
    payment,
    deposit,
  };
}
