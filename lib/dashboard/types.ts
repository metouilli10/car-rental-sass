import type { DashboardPeriod } from "./ranges";

export type TrendTone = "positive" | "negative" | "neutral";

export interface TrendMetric {
  current: number;
  previous: number;
  deltaPct: number | null;
  label: string;
  tone: TrendTone;
}

export interface KpiAmountWithTrend {
  amount: number;
  trend: TrendMetric;
}

export interface CfoSnapshot {
  encaissements: KpiAmountWithTrend;
  pendingCollections: {
    amount: number;
    pendingBookingsCount: number;
    urgentCount: number;
  };
  occupancy: {
    rate: number;
    rented: number;
    total: number;
    maintenance: number;
    labelPeriod: DashboardPeriod;
    /** For week/month: vehicle-days occupied (utilization numerator). */
    occupiedDays?: number;
    /** For week/month: vehicle-days available (utilization denominator). */
    availableDays?: number;
  };
  depositsToRefund: {
    dueAmount: number;
    dueCount: number;
    overdueAmount: number;
    overdueCount: number;
    /** Total deposit amount held (to rembourser). */
    totalHeld: number;
  };
}

export interface OwnerControlAlerts {
  lateReturnsCount: number;
  followUpsTodayCount: number;
}

export interface PeriodPillStats {
  departures: number;
  returns: number;
  lateReturns: number;
}

export type PeriodStatsMap = Record<DashboardPeriod, PeriodPillStats>;

export type PriorityActionType = "collection" | "deposit_release" | "late_return";
export type PriorityActionPrimary = "Encaisser" | "Liberer" | "Relancer";

export interface PriorityActionItem {
  id: string;
  type: PriorityActionType;
  bookingId: string;
  customerName: string;
  vehicleLabel: string;
  plate: string;
  dueAt: Date | null;
  dueLabel: string;
  amount: number | null;
  primaryAction: PriorityActionPrimary;
  primaryHref: string;
  detailsHref: string;
}

export interface PriorityActionGroups {
  pendingCollections: PriorityActionItem[];
  depositsToRelease: PriorityActionItem[];
  lateReturns: PriorityActionItem[];
}

export interface ParkStatus {
  occupationRate: number;
  rented: number;
  available: number;
  maintenance: number;
  unavailable: number;
  total: number;
}

export type CashMovementDirection = "in" | "out";

export interface CashMovement {
  id: string;
  label: string;
  customerName: string;
  amount: number;
  direction: CashMovementDirection;
  happenedAt: Date;
}

export interface CashCardData {
  inflowToday: number;
  outflowToday: number;
  balanceToday: number;
  toCollectToday: number;
  latestMovements: CashMovement[];
}

export interface MonthPerformanceData {
  revenueMonth: number;
  reservationsMonth: number;
  completedMonth: number;
  completionRate: number;
  revenuePerVehicle: number;
  averageRentalDays: number;
  caHintText: string;
}

export interface TopVehicleRevenue {
  vehicleId: string;
  label: string;
  plate: string;
  revenue: number;
}

export interface BottomVehicleUtilization {
  vehicleId: string;
  label: string;
  plate: string;
  utilizationRate: number;
}

export interface TopVehiclesData {
  topRevenue: TopVehicleRevenue[];
  bottomUtilization: BottomVehicleUtilization[];
}

export interface DashboardDTO {
  period: DashboardPeriod;
  ceoSnapshot: CfoSnapshot;
  ownerAlerts: OwnerControlAlerts;
  periodStats: PeriodStatsMap;
  actionCenter: PriorityActionGroups;
  parkStatus: ParkStatus;
  cash: CashCardData;
  monthPerformance: MonthPerformanceData;
  topVehicles?: TopVehiclesData;
}

/**
 * BusinessRules (single source of truth for all dashboard metrics)
 *
 * - Encaissements:
 *   Count only `Payment.status = PAID` and `Payment.category = RENTAL`.
 *   Deposits are excluded from the main encaissements KPI.
 *
 * - Impayes / A encaisser:
 *   Sum positive balances from bookings where status is not `CANCELED`.
 *   Balance source is `Booking.remainingAmount` with defensive fallback.
 *
 * - Urgent today:
 *   Booking has pending balance and (starts today OR is already ACTIVE).
 *
 * - Caution a rembourser:
 *   Deposit must be `HELD` and related booking must be `COMPLETED`.
 *   Due date rule: `actualReturnDate` when present, otherwise `endDate`.
 *   `dueToday` means due date is within today.
 *   `overdue` means due date is strictly before current time.
 *
 * - Retard retour:
 *   Booking is late when `endDate < now` and status is not `COMPLETED`
 *   and not `CANCELED`.
 */
export interface BusinessRules {
  encaissements: "paid_rental_only";
  pendingBalance: "booking_remaining_amount_positive_not_canceled";
  urgentCollection: "pending_balance_and_starts_today_or_active";
  depositDueRule: "deposit_held_and_booking_completed_due_at_return_or_end_date";
  lateReturnRule: "end_date_before_now_and_not_completed_or_canceled";
}

export const BUSINESS_RULES: BusinessRules = {
  encaissements: "paid_rental_only",
  pendingBalance: "booking_remaining_amount_positive_not_canceled",
  urgentCollection: "pending_balance_and_starts_today_or_active",
  depositDueRule: "deposit_held_and_booking_completed_due_at_return_or_end_date",
  lateReturnRule: "end_date_before_now_and_not_completed_or_canceled",
};
