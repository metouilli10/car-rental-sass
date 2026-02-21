import type { BookingStatus, BookingDepositStatus, DepositStatus } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Format amount in MAD (reuses app currency formatting). */
export function formatMad(amount: number): string {
  return formatCurrency(amount);
}

/** French date format (reuses app date formatting). */
export function formatDateFR(date: Date | string): string {
  return formatDate(date);
}

export type ReservationToneVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary";

const reservationStatusConfig: Record<
  BookingStatus,
  { label: string; variant: ReservationToneVariant }
> = {
  CONFIRMED: { label: "Confirmée", variant: "info" },
  ACTIVE: { label: "En cours", variant: "success" },
  COMPLETED: { label: "Terminée", variant: "secondary" },
  CANCELED: { label: "Annulée", variant: "destructive" },
  DRAFT: { label: "Brouillon", variant: "secondary" },
};

export function getReservationTone(
  status: BookingStatus
): { label: string; variant: ReservationToneVariant } {
  return reservationStatusConfig[status] ?? { label: status, variant: "default" };
}

export function getPaymentStatus(
  paid: number,
  total: number,
  paymentStatus?: "PENDING" | "PARTIAL" | "PAID"
): { label: "Payé" | "Partiel" | "Impayé"; variant: ReservationToneVariant } {
  if (paymentStatus === "PAID" || (total > 0 && paid >= total)) {
    return { label: "Payé", variant: "success" };
  }
  if (paymentStatus === "PARTIAL" || (total > 0 && paid > 0)) {
    return { label: "Partiel", variant: "warning" };
  }
  return { label: "Impayé", variant: "destructive" };
}

export function getDepositStatus(
  depositAmount: number,
  deposit?: { status: DepositStatus } | null,
  bookingDepositStatus?: BookingDepositStatus
): { label: "Restituée" | "À restituer" | "Retenue" | "Partiel"; variant: ReservationToneVariant } {
  const status = deposit?.status;
  if (status === "RETURNED" || bookingDepositStatus === "RETURNED") {
    return { label: "Restituée", variant: "success" };
  }
  if (status === "PARTIAL_RETURNED") {
    return { label: "Partiel", variant: "info" };
  }
  if (status === "FORFEITED") {
    return { label: "Retenue", variant: "destructive" };
  }
  if (status === "HELD" || bookingDepositStatus === "RECEIVED" || bookingDepositStatus === "PENDING") {
    return { label: "À restituer", variant: "warning" };
  }
  return { label: "À restituer", variant: "warning" };
}
