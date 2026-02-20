import { getSession } from "@/lib/auth-cache";
import { periodLabel, resolveDashboardPeriod } from "@/lib/dashboard/ranges";
import { getDashboardData } from "@/lib/dashboard/queries";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PeriodFilterBar } from "@/components/dashboard/PeriodFilterBar";
import { ActionCenter } from "@/components/dashboard/ActionCenter";
import { ParkStatusCard } from "@/components/dashboard/ParkStatusCard";
import { CashCard } from "@/components/dashboard/CashCard";
import { MonthPerformanceCard } from "@/components/dashboard/MonthPerformanceCard";
import { TopVehiclesCard } from "@/components/dashboard/TopVehiclesCard";
import { DashboardHeader } from "../components/DashboardHeader";

interface DashboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const agencyId = session.user.agencyId;
  const params = await searchParams;
  const selectedPeriod = resolveDashboardPeriod(params.period);
  const dashboard = await getDashboardData({
    agencyId,
    period: selectedPeriod,
    includeTopVehicles: true,
  });
  const selectedPeriodLabel = periodLabel(dashboard.period);
  const occupancyLabel = periodLabel(dashboard.ceoSnapshot.occupancy.labelPeriod);

  return (
    <div className="-mx-4 -my-4 min-h-screen bg-slate-50 pb-24 sm:-mx-6 sm:-my-6 lg:-mx-8 md:pb-0">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 xl:max-w-[1320px]">
        <div className="flex flex-col gap-6">
          <DashboardHeader />

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={dashboard.ownerAlerts.lateReturnsCount > 0 ? "destructive" : "secondary"}>
              {dashboard.ownerAlerts.lateReturnsCount} retours en retard
            </Badge>
            <Badge variant={dashboard.ownerAlerts.followUpsTodayCount > 0 ? "warning" : "secondary"}>
              {dashboard.ownerAlerts.followUpsTodayCount} clients a relancer aujourd&apos;hui
            </Badge>
          </div>

          <section className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title={`Encaissements (${selectedPeriodLabel})`}
              value={dashboard.ceoSnapshot.encaissements.amount}
              subtitle={`Paiements location encaisses (${selectedPeriodLabel.toLowerCase()})`}
              trend={dashboard.ceoSnapshot.encaissements.trend}
            />
            <KpiCard
              title="Impayes / A encaisser (En cours)"
              value={dashboard.ceoSnapshot.pendingCollections.amount}
              subtitle={`${dashboard.ceoSnapshot.pendingCollections.pendingBookingsCount} dossiers, ${dashboard.ceoSnapshot.pendingCollections.urgentCount} urgents (${selectedPeriodLabel.toLowerCase()})`}
              risk={dashboard.ceoSnapshot.pendingCollections.urgentCount > 0 ? "warning" : "none"}
            />
            <KpiCard
              title={
                dashboard.ceoSnapshot.occupancy.labelPeriod === "today"
                  ? "Taux d'occupation (Aujourd'hui)"
                  : `Utilisation (${occupancyLabel})`
              }
              value={dashboard.ceoSnapshot.occupancy.rate}
              valueSuffix="%"
              subtitle={
                dashboard.ceoSnapshot.occupancy.labelPeriod === "today"
                  ? `${dashboard.ceoSnapshot.occupancy.rented}/${dashboard.ceoSnapshot.occupancy.total} loues - ${dashboard.ceoSnapshot.occupancy.maintenance} en maintenance`
                  : [
                      `${dashboard.ceoSnapshot.occupancy.rented}/${dashboard.ceoSnapshot.occupancy.total} loues`,
                      dashboard.ceoSnapshot.occupancy.occupiedDays != null &&
                      dashboard.ceoSnapshot.occupancy.availableDays != null
                        ? ` • ${dashboard.ceoSnapshot.occupancy.occupiedDays} / ${dashboard.ceoSnapshot.occupancy.availableDays} jours-vehicule`
                        : "",
                    ].join("")
                  }
            />
            <KpiCard
              title={`Cautions a rembourser (${selectedPeriodLabel})`}
              value={dashboard.ceoSnapshot.depositsToRefund.totalHeld}
              subtitle={`${dashboard.ceoSnapshot.depositsToRefund.dueCount} dues, ${dashboard.ceoSnapshot.depositsToRefund.overdueCount} en retard`}
              risk={dashboard.ceoSnapshot.depositsToRefund.overdueCount > 0 ? "destructive" : "none"}
            />
          </section>

          <PeriodFilterBar selectedPeriod={selectedPeriod} stats={dashboard.periodStats} />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <ActionCenter
                pendingCollections={dashboard.actionCenter.pendingCollections}
                depositsToRelease={dashboard.actionCenter.depositsToRelease}
                lateReturns={dashboard.actionCenter.lateReturns}
              />
            </div>
            <div className="xl:col-span-4">
              <ParkStatusCard status={dashboard.parkStatus} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <CashCard cash={dashboard.cash} />
            <MonthPerformanceCard data={dashboard.monthPerformance} />
          </section>

          <TopVehiclesCard data={dashboard.topVehicles} />

        </div>
      </div>
    </div>
  );
}
