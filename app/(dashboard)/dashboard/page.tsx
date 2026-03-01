import { Suspense } from "react";
import { getSession } from "@/lib/auth-cache";
import { getDashboardDataV3 } from "@/lib/dashboard/v3-queries";
import { DashboardHeaderV3 } from "@/components/dashboard/DashboardHeaderV3";
import { PulseCards } from "@/components/dashboard/PulseCards";
import { ActionCenterCard } from "@/components/dashboard/ActionCenterCard";
import { FleetSnapshotBar } from "@/components/dashboard/FleetSnapshotBar";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardActiveBookingsSection } from "./DashboardActiveBookingsSection";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getSession();

  if (!session?.user?.agencyId) {
    return null;
  }

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
      <div className="-mx-4 -my-4 min-h-screen bg-muted/40 pb-24 sm:-mx-6 sm:-my-6 lg:-mx-8 md:pb-0">
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 xl:max-w-[1320px]">
          <div className="flex flex-col gap-7">
            <DashboardHeaderV3
              period={{
                key: "today",
                label: "Aujourd'hui",
                start: new Date().toISOString(),
                end: new Date().toISOString(),
              }}
            />
            <Card className="rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/10">
              <CardHeader>
                <CardTitle className="text-base text-amber-900 dark:text-amber-100">
                  Donnees temporairement indisponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  Le tableau de bord rencontre une erreur temporaire de chargement.
                  Rechargez la page dans quelques secondes.
                </p>
                {dashboardErrorDetails && (
                  <p className="mt-2 break-all font-mono text-xs text-amber-900 dark:text-amber-100/90">
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
    <div className="-mx-4 -my-4 min-h-screen bg-muted/40 pb-24 sm:-mx-6 sm:-my-6 lg:-mx-8 md:pb-0">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 xl:max-w-[1320px]">
        <div className="flex flex-col gap-7">
          <DashboardHeaderV3 period={dashboard.period} />
          <OnboardingChecklist
            onboarding={dashboard.onboarding}
            forceVisible={params["getting-started"] === "1" && !dashboard.onboarding.completed}
          />
          <PulseCards pulse={dashboard.pulse} />
          <ActionCenterCard actionCenter={dashboard.actionCenter} period={dashboard.period} />
          <FleetSnapshotBar snapshot={dashboard.fleetSnapshot} />

          <Suspense
            fallback={
              <Card className="rounded-xl border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-foreground">Réservations actives</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Chargement des réservations en cours...</p>
                </CardContent>
              </Card>
            }
          >
            <DashboardActiveBookingsSection agencyId={agencyId} periodInput={periodInput} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
