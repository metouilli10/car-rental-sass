import type { BookingStatus, DepositStatus } from "@prisma/client";

/** Range for period-based checks */
export interface DateRange {
  start: Date;
  end: Date;
}

// ─── Impayés / À encaisser (outstanding balance) ───────────────────────────
// State metric: total owed right now. Scope: CONFIRMED, ACTIVE, COMPLETED.
// Exclude: DRAFT, CANCELED.
// due(b) = max(bookingTotal - discount + fees, 0); paid(b) = sum(PAID RENTAL); outstanding = max(due - paid, 0).

export interface BookingDueInput {
  totalPrice: number;
  totalTtc: number;
  taxEnabled: boolean;
  discountAmount: number;
  addonsTotal: number;
}

/** Total amount due for a booking (rental total, taxes/fees included). */
export function computeBookingDue(input: BookingDueInput): number {
  const withTax = input.taxEnabled && input.totalTtc > 0;
  const base = withTax
    ? input.totalTtc
    : input.totalPrice - input.discountAmount + input.addonsTotal;
  return Math.max(0, Number.isFinite(base) ? base : 0);
}

/** Rental paid = sum(PAID, RENTAL). Overpayment => 0. */
export function computeOutstanding(due: number, paid: number): number {
  if (paid >= due || !Number.isFinite(due) || !Number.isFinite(paid)) {
    return 0;
  }
  return Math.max(0, due - paid);
}

/** Bookings that count for impayés: CONFIRMED, ACTIVE, COMPLETED. */
export const IMPAYES_SCOPE_STATUSES: BookingStatus[] = [
  "CONFIRMED",
  "ACTIVE",
  "COMPLETED",
];

export function isInImpayesScope(status: BookingStatus): boolean {
  return IMPAYES_SCOPE_STATUSES.includes(status);
}

/** Urgent = departure within period range AND outstanding > 0; or already ACTIVE with outstanding > 0. */
export function isUrgentForPeriod(
  outstanding: number,
  startDate: Date,
  status: BookingStatus,
  range: DateRange
): boolean {
  if (outstanding <= 0) return false;
  const startInRange =
    startDate.getTime() >= range.start.getTime() &&
    startDate.getTime() <= range.end.getTime();
  if (startInRange) return true;
  if (status === "ACTIVE") return true;
  return false;
}

// ─── Cautions à rembourser (deposits to return) ──────────────────────────────
// Due = deposit held, booking ended (COMPLETED), dueAt = actualReturnAt ?? endAt.
// Due in period = dueAt in selectedRange. Overdue = dueAt < now.

export function getDepositDueDate(endDate: Date, actualReturnDate?: Date | null): Date {
  return actualReturnDate ?? endDate;
}

/** Eligible to return: booking COMPLETED. Due only if actualReturnDate set or status COMPLETED. */
export function isDepositReturnEligible(
  bookingStatus: BookingStatus,
  actualReturnDate: Date | null | undefined
): boolean {
  if (bookingStatus !== "COMPLETED") return false;
  return true;
}

export function isDepositDueInPeriod(dueAt: Date, range: DateRange): boolean {
  return dueAt.getTime() >= range.start.getTime() && dueAt.getTime() <= range.end.getTime();
}

export function isDepositOverdue(dueAt: Date, now: Date): boolean {
  return dueAt.getTime() < now.getTime();
}

// ─── Legacy / compatibility (used by action center, follow-ups) ───────────────

interface PendingBalanceInput {
  totalPrice: number;
  paidNow: number;
  remainingAmount?: number | null;
}

interface DepositDueInput {
  amount: number;
  status: DepositStatus;
  bookingStatus: BookingStatus;
  endDate: Date;
  actualReturnDate?: Date | null;
  now: Date;
}

interface LateReturnInput {
  endDate: Date;
  status: BookingStatus;
  now: Date;
}

interface UrgentCollectionInput extends PendingBalanceInput {
  startDate: Date;
  status: BookingStatus;
  now: Date;
}

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

/** @deprecated Prefer computeBookingDue + paidNow and computeOutstanding. */
export function computePendingBalance(input: PendingBalanceInput): number {
  const fallback = input.totalPrice - input.paidNow;
  const candidate =
    typeof input.remainingAmount === "number" ? input.remainingAmount : fallback;
  return Math.max(0, Number.isFinite(candidate) ? candidate : 0);
}

export function isDepositDue(input: DepositDueInput): boolean {
  if (input.amount <= 0) return false;
  if (input.status !== "HELD" || input.bookingStatus !== "COMPLETED") {
    return false;
  }
  const dueDate = getDepositDueDate(input.endDate, input.actualReturnDate);
  return dueDate <= input.now;
}

export function isDepositDueToday(input: DepositDueInput): boolean {
  if (!isDepositDue(input)) {
    return false;
  }
  const dueDate = getDepositDueDate(input.endDate, input.actualReturnDate);
  return dueDate >= startOfDay(input.now) && dueDate <= endOfDay(input.now);
}

export function isLateReturn(input: LateReturnInput): boolean {
  if (input.status === "COMPLETED" || input.status === "CANCELED") {
    return false;
  }
  return input.endDate < input.now;
}

/** @deprecated Use isUrgentForPeriod with selected range. */
export function isUrgentCollection(input: UrgentCollectionInput): boolean {
  const pending = computePendingBalance(input);
  if (pending <= 0 || input.status === "CANCELED" || input.status === "DRAFT") {
    return false;
  }
  const startsToday =
    input.startDate >= startOfDay(input.now) && input.startDate <= endOfDay(input.now);
  return startsToday || input.status === "ACTIVE";
}

interface FollowUpDueInput {
  hasPendingBalance: boolean;
  isUrgentCollection: boolean;
  hasDepositDue: boolean;
}

export function isFollowUpDueToday(input: FollowUpDueInput): boolean {
  if (input.isUrgentCollection) {
    return true;
  }
  return input.hasPendingBalance && input.hasDepositDue;
}
