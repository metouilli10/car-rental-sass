import type { CalendarBooking } from "@/lib/actions/calendar";

export type ValidationResult = {
  valid: boolean;
  reason?: string;
};

export function toDayKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dayKeyToLocalDate(dayKey: string): Date {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function overlaps(
  aStart: Date,
  aEndExclusive: Date,
  bStart: Date,
  bEndExclusive: Date,
): boolean {
  return aStart < bEndExclusive && aEndExclusive > bStart;
}

export function buildReservationsByVehicle(
  bookings: CalendarBooking[],
): Map<string, CalendarBooking[]> {
  const map = new Map<string, CalendarBooking[]>();

  for (const booking of bookings) {
    const list = map.get(booking.vehicleId) ?? [];
    list.push(booking);
    map.set(booking.vehicleId, list);
  }

  for (const [vehicleId, list] of map.entries()) {
    map.set(
      vehicleId,
      [...list].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    );
  }

  return map;
}

export function validateCandidateInterval(params: {
  vehicleId: string;
  start: Date;
  endExclusive: Date;
  byVehicle: Map<string, CalendarBooking[]>;
  excludeBookingId?: string;
}): ValidationResult {
  const { vehicleId, start, endExclusive, byVehicle, excludeBookingId } = params;

  if (!(start < endExclusive)) {
    return { valid: false, reason: "Dates invalides" };
  }

  const vehicleBookings = byVehicle.get(vehicleId) ?? [];
  for (const other of vehicleBookings) {
    if (other.id === excludeBookingId) {
      continue;
    }
    if (
      overlaps(
        start,
        endExclusive,
        new Date(other.startDate),
        new Date(other.endDate),
      )
    ) {
      return { valid: false, reason: "Conflit" };
    }
  }

  return { valid: true };
}
