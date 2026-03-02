import {
  BookingStatus,
  BookingDepositStatus,
  DepositAction,
  DepositStatus,
} from "@prisma/client";

type DateLike = Date | string;

export type BookingRiskLevel = "none" | "watch" | "warning" | "critical";
export type BookingRiskTone = "warning" | "destructive" | "info";
export type BookingRiskSignalKind = "deposit" | "overlap" | "late";

export interface BookingRiskSignal {
  kind: BookingRiskSignalKind;
  tone: BookingRiskTone;
  label: string;
}

export interface BookingRiskSummary {
  hasUnpaidDeposit: boolean;
  hasOverlapConflict: boolean;
  overlapCount: number;
  lateReturnRiskLevel: BookingRiskLevel;
  lateReturnRiskScore: number;
  lateReturnRiskLabel: string | null;
  signals: BookingRiskSignal[];
}

export interface BookingRiskRowInput {
  id: string;
  customerId: string;
  vehicleId: string;
  startDate: DateLike;
  endDate: DateLike;
  status: BookingStatus;
  depositStatus: BookingDepositStatus;
  depositRecordStatus?: DepositStatus | null;
}

export interface BookingOverlapCandidate {
  id: string;
  vehicleId: string;
  startDate: DateLike;
  endDate: DateLike;
  status: BookingStatus;
}

export interface CustomerRiskHistorySummary {
  hasBadReturn: boolean;
  hasMissingReturnInspection: boolean;
  hasInfractions: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInDays(dateA: Date, dateB: Date): number {
  return Math.round((startOfDay(dateA).getTime() - startOfDay(dateB).getTime()) / DAY_MS);
}

function rangesIntersect(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA.getTime() <= endB.getTime() && endA.getTime() >= startB.getTime();
}

function getLateReturnScore(
  booking: Pick<BookingRiskRowInput, "status" | "endDate">,
  history: CustomerRiskHistorySummary,
  today: Date
): number {
  if (booking.status !== "ACTIVE") {
    return 0;
  }

  const dueDate = toDate(booking.endDate);
  const dayOffset = diffInDays(dueDate, today);

  let score = 0;

  if (dayOffset < 0) {
    score = 100;
  } else if (dayOffset === 0) {
    score = 70;
  } else if (dayOffset === 1) {
    score = 45;
  } else if (dayOffset <= 3) {
    score = 25;
  }

  if (history.hasBadReturn) {
    score += 20;
  }
  if (history.hasMissingReturnInspection) {
    score += 10;
  }
  if (history.hasInfractions) {
    score += 10;
  }

  return Math.min(score, 100);
}

function getLateRiskLevel(score: number): BookingRiskLevel {
  if (score >= 100) {
    return "critical";
  }
  if (score >= 60) {
    return "warning";
  }
  if (score >= 30) {
    return "watch";
  }
  return "none";
}

function getLateRiskLabel(level: BookingRiskLevel): string | null {
  switch (level) {
    case "critical":
      return "Retour en retard";
    case "warning":
      return "Risque eleve de retard";
    case "watch":
      return "Retour a surveiller";
    default:
      return null;
  }
}

function sortSignals(signals: BookingRiskSignal[]): BookingRiskSignal[] {
  const priority: Record<BookingRiskSignalKind, number> = {
    overlap: 0,
    late: 1,
    deposit: 2,
  };

  return [...signals].sort((left, right) => {
    const priorityDiff = priority[left.kind] - priority[right.kind];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return left.label.localeCompare(right.label);
  });
}

export function buildBookingRiskSummary(params: {
  booking: BookingRiskRowInput;
  overlapCandidates: BookingOverlapCandidate[];
  customerHistory?: CustomerRiskHistorySummary;
  today?: Date;
}): BookingRiskSummary {
  const { booking, overlapCandidates, customerHistory, today = new Date() } = params;
  const history = customerHistory ?? {
    hasBadReturn: false,
    hasMissingReturnInspection: false,
    hasInfractions: false,
  };

  const bookingStart = toDate(booking.startDate);
  const bookingEnd = toDate(booking.endDate);

  const overlapCount = overlapCandidates.filter((candidate) => {
    if (candidate.id === booking.id) {
      return false;
    }
    if (candidate.vehicleId !== booking.vehicleId) {
      return false;
    }
    if (candidate.status === "CANCELED" || candidate.status === "COMPLETED") {
      return false;
    }

    return rangesIntersect(
      bookingStart,
      bookingEnd,
      toDate(candidate.startDate),
      toDate(candidate.endDate)
    );
  }).length;

  const hasOverlapConflict = overlapCount > 0;
  const hasCollectedDeposit =
    booking.depositRecordStatus === "HELD" ||
    booking.depositRecordStatus === "PARTIAL_RETURNED" ||
    booking.depositRecordStatus === "RETURNED" ||
    booking.depositRecordStatus === "FORFEITED";
  const hasUnpaidDeposit =
    booking.depositStatus === "PENDING" && !hasCollectedDeposit;
  const lateReturnRiskScore = getLateReturnScore(booking, history, today);
  const lateReturnRiskLevel = getLateRiskLevel(lateReturnRiskScore);
  const lateReturnRiskLabel = getLateRiskLabel(lateReturnRiskLevel);

  const signals: BookingRiskSignal[] = [];

  if (hasOverlapConflict) {
    signals.push({
      kind: "overlap",
      tone: "destructive",
      label:
        overlapCount === 1
          ? "Chevauchement detecte"
          : `${overlapCount} chevauchements detectes`,
    });
  }

  if (lateReturnRiskLabel) {
    signals.push({
      kind: "late",
      tone:
        lateReturnRiskLevel === "critical"
          ? "destructive"
          : lateReturnRiskLevel === "warning"
            ? "warning"
            : "info",
      label: lateReturnRiskLabel,
    });
  }

  if (hasUnpaidDeposit) {
    signals.push({
      kind: "deposit",
      tone: "warning",
      label: "Caution non encaissee",
    });
  }

  return {
    hasUnpaidDeposit,
    hasOverlapConflict,
    overlapCount,
    lateReturnRiskLevel,
    lateReturnRiskScore,
    lateReturnRiskLabel,
    signals: sortSignals(signals).slice(0, 2),
  };
}

export function summarizeCustomerRiskHistory(input: {
  bookings: Array<{
    status: BookingStatus;
    infractionCount: number;
    returnDepositAction: DepositAction | null;
    hasReturnInspection: boolean;
  }>;
}): CustomerRiskHistorySummary {
  let hasBadReturn = false;
  let hasMissingReturnInspection = false;
  let hasInfractions = false;

  for (const booking of input.bookings) {
    if (
      booking.returnDepositAction === "PARTIAL" ||
      booking.returnDepositAction === "HOLD"
    ) {
      hasBadReturn = true;
    }

    if (booking.status === "COMPLETED" && !booking.hasReturnInspection) {
      hasMissingReturnInspection = true;
    }

    if (booking.infractionCount > 0) {
      hasInfractions = true;
    }
  }

  return {
    hasBadReturn,
    hasMissingReturnInspection,
    hasInfractions,
  };
}
