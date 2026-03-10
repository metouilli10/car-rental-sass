import type { BookingStatus } from "@prisma/client";
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
  /** Set for type === "deposit_release" to allow in-place release. */
  depositId?: string;
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

export type DashboardV3Period = "today" | "7d" | "month" | "custom";

export interface DashboardV3ResolvedPeriod {
  key: DashboardV3Period;
  label: string;
  start: string;
  end: string;
}

export interface DashboardV3Pulse {
  net: {
    amount: number;
    subtitle: string;
    trend?: TrendMetric;
  };
  toCollect: {
    amount: number;
    bookingCount: number;
    overdueCount: number;
    subtitle: string;
  };
  occupancy: {
    rate: number;
    rented: number;
    total: number;
    subtitle: string;
  };
  risks: {
    count: number;
    exposureAmount: number;
    breakdown: {
      unpaidCount: number;
      depositDueCount: number;
      lateReturnCount: number;
    };
    subtitle: string;
  };
}

export type DashboardV3ActionGroupId =
  | "collections"
  | "deposits"
  | "late_returns"
  | "notifications";

export type DashboardV3ActionType = "collection" | "deposit_release" | "link";

export interface DashboardV3ActionItem {
  id: string;
  label: string;
  sublabel: string;
  amount?: number;
  dueLabel?: string;
  isOverdue?: boolean;
  primaryAction: string;
  primaryHref: string;
  actionType: DashboardV3ActionType;
  bookingId?: string;
  depositId?: string;
  customerName?: string;
  vehicleLabel?: string;
  plate?: string;
}

export interface DashboardV3ActionGroup {
  id: DashboardV3ActionGroupId;
  title: string;
  count: number;
  totalAmount?: number;
  ctaLabel: string;
  ctaHref: string;
  items: DashboardV3ActionItem[];
}

export interface DashboardV3FleetSnapshot {
  rented: number;
  available: number;
  maintenance: number;
  inactive: number;
  totalActive: number;
}

export interface DashboardV3TodayOperations {
  departures: number;
  returns: number;
  overdueReturns: number;
  availableVehicles: number;
}

export interface DashboardV3Onboarding {
  eligible: boolean;
  vehicleAdded: boolean;
  reservationCreated: boolean;
  paymentRecorded: boolean;
  dashboardExplored: boolean;
  completed: boolean;
  dismissed: boolean;
}

export type DashboardV3BookingTabKey =
  | "active"
  | "start_today"
  | "end_today"
  | "overdue";

export interface DashboardV3BookingTabItem {
  id: string;
  bookingId: string;
  customerName: string;
  vehicleLabel: string;
  plate: string;
  startDate: string | null;
  endDate: string | null;
  status: BookingStatus;
  remainingAmount: number;
  isOverdue: boolean;
  detailsHref: string;
}

export interface DashboardV3BookingTab {
  key: DashboardV3BookingTabKey;
  label: string;
  count: number;
  items: DashboardV3BookingTabItem[];
}

export interface DashboardV3ActiveBookingsDTO {
  tabs: DashboardV3BookingTab[];
  defaultTab?: DashboardV3BookingTabKey;
}

export interface DashboardV3DTO {
  period: DashboardV3ResolvedPeriod;
  pulse: DashboardV3Pulse;
  todayOperations: DashboardV3TodayOperations;
  actionCenter: {
    groups: DashboardV3ActionGroup[];
    isAllClear: boolean;
  };
  fleetSnapshot: DashboardV3FleetSnapshot;
  onboarding: DashboardV3Onboarding;
}

export interface DashboardV3DueDepositItem {
  id: string;
  depositId: string;
  bookingId: string;
  customerName: string;
  vehicleLabel: string;
  plate: string;
  amount: number;
  dueLabel: string;
  isOverdue: boolean;
  primaryHref: string;
}

export interface DashboardV3CollectionSheetItem {
  id: string;
  bookingId: string;
  customerName: string;
  vehicleLabel: string;
  plate: string;
  amount: number;
  dueLabel: string;
  isOverdue: boolean;
  primaryHref: string;
}

export interface DashboardV3CollectionsSheetDTO {
  count: number;
  overdueCount: number;
  totalAmount: number;
  items: DashboardV3CollectionSheetItem[];
}

export interface DashboardV3LateReturnSheetItem {
  id: string;
  bookingId: string;
  customerName: string;
  vehicleLabel: string;
  plate: string;
  dueLabel: string;
  isOverdue: boolean;
  amount?: number;
  primaryHref: string;
}

export interface DashboardV3LateReturnsSheetDTO {
  count: number;
  exposedCount: number;
  totalAmount: number;
  items: DashboardV3LateReturnSheetItem[];
}

export interface DashboardV3DueDepositsSheetDTO {
  count: number;
  totalAmount: number;
  items: DashboardV3DueDepositItem[];
}
