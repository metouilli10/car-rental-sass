import type { ExpenseCategory } from "@prisma/client";
import { FinanceHeaderActions } from "@/components/finance/FinanceHeaderActions";
import { ExecutiveSnapshot } from "@/components/finance/ExecutiveSnapshot";
import { VehicleProfitabilityList } from "@/components/finance/VehicleProfitabilityList";
import { NetProfitBreakdown } from "@/components/finance/NetProfitBreakdown";
import { CostStructureCard } from "@/components/finance/CostStructureCard";
import { KeyMetricsCard } from "@/components/finance/KeyMetricsCard";
import { FinancialAlerts } from "@/components/finance/FinancialAlerts";

type FinanceCenterViewProps = {
  period: {
    range: "today" | "7d" | "month" | "quarter" | "custom";
    label: string;
    from?: string;
    to?: string;
  };
  kpis: {
    cashInHand: number;
    unpaidAmount: number;
    unpaidCount: number;
    depositsHeld: number;
    depositsHeldCount: number;
    netProfit: number;
    revenuePeriod: number;
    expensesPeriod: number;
  };
  deltas: {
    cashDelta: number | null;
    netDelta: number | null;
  };
  vehicleProfitability: Array<{
    vehicleId: string;
    label: string;
    revenue: number;
    costs: number;
    profit: number;
    marginPercent: number;
  }>;
  expenseBreakdown: Partial<Record<ExpenseCategory, number>>;
  revenuePeriod: number;
  refundedPeriod: number;
  costStructure: {
    fixedAmount: number;
    variableAmount: number;
    fixedPercentOfRevenue: number;
  };
  metrics: {
    revenuePerVehicle: number;
    panierMoyen: number;
    activeVehicleCount: number;
  };
  alerts: {
    unpaidAmount: number;
    unpaidCount: number;
    depositsToReturn: number;
    depositsToReturnCount: number;
    refundsPending: number;
    refundsPendingCount: number;
    hasDeficit?: boolean;
    netMarginPercent?: number | null;
    losingVehicles?: string[];
  };
  vehicles: Array<{ id: string; make: string; model: string; plate: string }>;
};

export function FinanceCenterView({
  period,
  kpis,
  deltas,
  vehicleProfitability,
  expenseBreakdown,
  revenuePeriod,
  refundedPeriod,
  costStructure,
  metrics,
  alerts,
  vehicles,
}: FinanceCenterViewProps) {
  return (
    <div className="space-y-6">
      <FinanceHeaderActions
        range={period.range}
        from={period.from}
        to={period.to}
        vehicles={vehicles}
      />

      {/* Sections wrapper — uses flex + order for mobile reordering */}
      <div className="flex flex-col gap-6">
        {/* 1. Executive Snapshot — always first */}
        <div className="order-1">
          <ExecutiveSnapshot
            cashInHand={kpis.cashInHand}
            cashDelta={deltas.cashDelta}
            unpaidAmount={kpis.unpaidAmount}
            unpaidCount={kpis.unpaidCount}
            depositsHeld={kpis.depositsHeld}
            depositsHeldCount={kpis.depositsHeldCount}
            netProfit={kpis.netProfit}
            netDelta={deltas.netDelta}
            periodLabel={period.label}
          />
        </div>

        {/* 2. Net Profit Breakdown — stacked list */}
        <div className="order-2">
          <NetProfitBreakdown
            revenue={revenuePeriod}
            refunded={refundedPeriod}
            expenseBreakdown={expenseBreakdown}
            netProfit={kpis.netProfit}
            periodLabel={period.label}
          />
        </div>

        {/* 3. Financial Alerts — unified (operational + margin) */}
        <div className="order-3 lg:order-5">
          <FinancialAlerts
            unpaidAmount={alerts.unpaidAmount}
            unpaidCount={alerts.unpaidCount}
            depositsToReturn={alerts.depositsToReturn}
            depositsToReturnCount={alerts.depositsToReturnCount}
            refundsPending={alerts.refundsPending}
            refundsPendingCount={alerts.refundsPendingCount}
            hasDeficit={alerts.hasDeficit}
            netMarginPercent={alerts.netMarginPercent}
            losingVehicles={alerts.losingVehicles}
          />
        </div>

        {/* 4. Vehicle profitability */}
        <div className="order-4 lg:order-2">
          <VehicleProfitabilityList items={vehicleProfitability} />
        </div>

        {/* 5. Cost Structure + Key Metrics */}
        <div className="order-5 lg:order-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CostStructureCard
            fixedAmount={costStructure.fixedAmount}
            variableAmount={costStructure.variableAmount}
            fixedPercentOfRevenue={costStructure.fixedPercentOfRevenue}
            revenuePeriod={kpis.revenuePeriod}
          />
          <KeyMetricsCard
            revenuePerVehicle={metrics.revenuePerVehicle}
            panierMoyen={metrics.panierMoyen}
            activeVehicleCount={metrics.activeVehicleCount}
            periodLabel={period.label}
          />
        </div>
      </div>
    </div>
  );
}
