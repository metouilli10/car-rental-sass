import { FinanceHeaderActions } from "@/components/finance/FinanceHeaderActions";
import { ExecutiveSnapshot } from "@/components/finance/ExecutiveSnapshot";
import { RevenueChart } from "@/components/finance/RevenueChart";
import { VehicleRevenueList } from "@/components/finance/VehicleRevenueList";
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
  vehicleRevenue: Array<{ name: string; amount: number; percentage: number }>;
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
  };
  vehicles: Array<{ id: string; make: string; model: string; plate: string }>;
};

export function FinanceCenterView({
  period,
  kpis,
  deltas,
  vehicleRevenue,
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

        {/* 2. Financial Alerts — second on mobile, last on desktop */}
        <div className="order-2 lg:order-5">
          <FinancialAlerts
            unpaidAmount={alerts.unpaidAmount}
            unpaidCount={alerts.unpaidCount}
            depositsToReturn={alerts.depositsToReturn}
            depositsToReturnCount={alerts.depositsToReturnCount}
            refundsPending={alerts.refundsPending}
            refundsPendingCount={alerts.refundsPendingCount}
          />
        </div>

        {/* 3. Performance — chart + vehicle revenue */}
        <div className="order-3 lg:order-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueChart />
          <VehicleRevenueList items={vehicleRevenue} />
        </div>

        {/* 4. Cost Structure + Key Metrics */}
        <div className="order-4 lg:order-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
