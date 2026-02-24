/**
 * Shared date/urgency helpers for the bookings list (table + cards).
 * Used by BookingsControlCenter (filtering) and ReservationsTable / ReservationCardList.
 */

export type DateLike = Date | string;

export interface BookingForListHelpers {
  startDate: DateLike;
  endDate: DateLike;
  status: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function toDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value);
}

export function isSameDay(dateA: Date, dateB: Date): boolean {
  return startOfDay(dateA).getTime() === startOfDay(dateB).getTime();
}

export function isInRangeInclusive(date: Date, start: Date, end: Date): boolean {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

export function intersectsRange(
  rangeStart: Date,
  rangeEnd: Date,
  bookingStart: Date,
  bookingEnd: Date
): boolean {
  return bookingStart.getTime() <= rangeEnd.getTime() && bookingEnd.getTime() >= rangeStart.getTime();
}

export function getDurationDays(startDate: Date, endDate: Date): number {
  const start = startOfDay(startDate).getTime();
  const end = startOfDay(endDate).getTime();
  return Math.max(1, Math.ceil((end - start) / MS_PER_DAY));
}

export function getBookingUrgency(
  booking: BookingForListHelpers,
  today: Date
): { label: string; variant: "destructive" | "info" | "warning" | "success" } | null {
  const startDate = toDate(booking.startDate);
  const endDate = toDate(booking.endDate);
  const todayStart = startOfDay(today);

  if (booking.status === "ACTIVE" && startOfDay(endDate).getTime() < todayStart.getTime()) {
    return { label: "En retard", variant: "destructive" };
  }
  if (isSameDay(startDate, todayStart)) {
    return { label: "Départ aujourd'hui", variant: "info" };
  }
  if (isSameDay(endDate, todayStart)) {
    return { label: "Retour aujourd'hui", variant: "warning" };
  }
  if (
    booking.status === "ACTIVE" &&
    isInRangeInclusive(todayStart, startOfDay(startDate), endOfDay(endDate))
  ) {
    return { label: "En cours", variant: "success" };
  }
  return null;
}

export function getDayProgress(
  booking: BookingForListHelpers,
  today: Date
): number | null {
  if (booking.status !== "ACTIVE") return null;
  const startDate = toDate(booking.startDate);
  const endDate = toDate(booking.endDate);
  const durationDays = getDurationDays(startDate, endDate);
  const dayProgress = Math.min(
    durationDays,
    Math.max(
      1,
      Math.floor(
        (startOfDay(today).getTime() - startOfDay(startDate).getTime()) / MS_PER_DAY
      ) + 1
    )
  );
  return dayProgress;
}
