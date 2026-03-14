import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth-cache";
import { getDashboardDataV3 } from "@/lib/dashboard/v3-queries";
import { DashboardHeaderV3 } from "@/components/dashboard/DashboardHeaderV3";
import { ActionCenterCard } from "@/components/dashboard/ActionCenterCard";
import { FleetSnapshotBar } from "@/components/dashboard/FleetSnapshotBar";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardActiveBookingsSection } from "./DashboardActiveBookingsSection";
import { DashboardPeriodShell } from "./DashboardPeriodShell";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getSession();

  if (!session?.user) redirect("/login");
  if (!session.user.agencyId) redirect("/setup");

  const agencyId = session.user.agencyId;
  const params = await searchParams;
  const periodInput = {
    period: params.period,
    start: params.start,
    end: params.end,
  };
  let dashboard = null;
  let dashboardErrorDetails: string | null = null;
  try {
    dashboard = await getDashboardDataV3({
      agencyId,
      periodInput,
    });
  } catch (error) {
    console.error("DashboardPage getDashboardDataV3 failed", { agencyId, error });
    const e = error as { code?: string; message?: string; name?: string };
    const code = e.code ? `code=${e.code}` : null;
    const name = e.name ? `name=${e.name}` : null;
    const message = e.message ? `message=${e.message}` : null;
    dashboardErrorDetails = [code, name, message].filter(Boolean).join(" | ");
  }

  if (!dashboard) {
    return (
      <div className="-mx-4 -my-4 min-h-screen dashboard-shell pb-24 sm:-mx-6 sm:-my-6 md:pb-0 lg:-mx-8">
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-section">
            <DashboardHeaderV3
              period={{
                key: "today",
                label: "Aujourd'hui",
                start: new Date().toISOString(),
                end: new Date().toISOString(),
              }}
              agencyName={session.user.agencyName || "Agence"}
              totalVehicles={0}
              activeReservationsCount={0}
              updatedAt={new Date().toISOString()}
            />
            <Card className="rounded-2xl border border-amber-200 bg-amber-50/80 shadow-sm">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="section-title text-amber-900">
                  Données temporairement indisponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-amber-900">
                  Le tableau de bord rencontre une erreur temporaire de chargement.
                  Rechargez la page dans quelques secondes.
                </p>
                {dashboardErrorDetails && (
                  <p className="mt-2 break-all font-mono text-xs text-amber-900">
                    {dashboardErrorDetails}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-4 min-h-screen dashboard-shell pb-24 sm:-mx-6 sm:-my-6 md:pb-0 lg:-mx-8">
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-section">
          <DashboardPeriodShell
            initialPeriod={dashboard.period}
            initialPulse={dashboard.pulse}
            operations={dashboard.todayOperations}
            agencyName={session.user.agencyName || "Agence"}
            totalVehicles={dashboard.fleetSnapshot.totalActive + dashboard.fleetSnapshot.inactive}
            activeReservationsCount={dashboard.context.activeReservationsCount}
            updatedAt={dashboard.context.updatedAt}
          />
          <div className="grid grid-cols-1 gap-4 xl:items-start xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="space-y-4">
              <Suspense
                fallback={
                  <Card className="dashboard-panel">
                    <CardHeader className="p-4 pb-3">
                      <CardTitle className="section-title">Réservations actives</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-slate-500">Chargement des réservations en cours...</p>
                    </CardContent>
                  </Card>
                }
              >
                <DashboardActiveBookingsSection agencyId={agencyId} periodInput={periodInput} />
              </Suspense>
              <FleetSnapshotBar snapshot={dashboard.fleetSnapshot} />
            </div>
            <div className="space-y-4">
              <ActionCenterCard actionCenter={dashboard.actionCenter} period={dashboard.period} />
              <OnboardingChecklist
                onboarding={dashboard.onboarding}
                forceVisible={params["getting-started"] === "1" && !dashboard.onboarding.completed}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
