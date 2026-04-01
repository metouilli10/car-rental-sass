import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth-cache";
import { getDashboardDataV3 } from "@/lib/dashboard/v3-queries";
import { DashboardHeaderV3 } from "@/components/dashboard/DashboardHeaderV3";
import { ActionCenterCard } from "@/components/dashboard/ActionCenterCard";
import { FleetSnapshotBar } from "@/components/dashboard/FleetSnapshotBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardActiveBookingsSection } from "./DashboardActiveBookingsSection";
import { DashboardPeriodShell } from "./DashboardPeriodShell";
import { createPerfLogger } from "@/lib/perf";
import { isValidLocale, type AppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({
  searchParams,
  params,
}: DashboardPageProps) {
  const { locale: localeParam } = await params;
  const locale: AppLocale = isValidLocale(localeParam) ? localeParam : "fr";
  const ui = getMessages(locale);

  const perf = createPerfLogger("dashboard-page");
  const session = await getSession();
  perf.step("session-loaded", { hasSession: Boolean(session?.user) });

  if (!session?.user) redirect("/login");
  if (!session.user.agencyId) redirect("/setup");

  const agencyId = session.user.agencyId;
  const query = await searchParams;
  const periodInput = {
    period: query.period,
    start: query.start,
    end: query.end,
  };
  let dashboard = null;
  let dashboardErrorDetails: string | null = null;
  try {
    dashboard = await getDashboardDataV3({
      agencyId,
      periodInput,
      locale,
    });
    perf.end({ hasDashboard: Boolean(dashboard) });
  } catch (error) {
    console.error("DashboardPage getDashboardDataV3 failed", { agencyId, error });
    const e = error as { code?: string; message?: string; name?: string };
    const code = e.code ? `code=${e.code}` : null;
    const name = e.name ? `name=${e.name}` : null;
    const message = e.message ? `message=${e.message}` : null;
    dashboardErrorDetails = [code, name, message].filter(Boolean).join(" | ");
    perf.end({ failed: true });
  }

  if (!dashboard) {
    return (
      <div className="-mx-4 -my-4 min-h-dvh-screen dashboard-shell pb-24 sm:-mx-6 sm:-my-6 md:pb-0 lg:-mx-8">
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-section">
            <DashboardHeaderV3
              period={{
                key: "today",
                label: ui.dashboard.periodTabs.today,
                start: new Date().toISOString(),
                end: new Date().toISOString(),
              }}
              agencyName={session.user.agencyName || ui.common.agencyFallback}
              totalVehicles={0}
              activeReservationsCount={0}
              updatedAt={new Date().toISOString()}
            />
            <Card className="rounded-2xl border border-amber-200 bg-amber-50/80 shadow-sm">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="section-title text-amber-900">
                  {ui.dashboard.errorTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-amber-900">{ui.dashboard.errorBody}</p>
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
    <div className="-mx-4 -my-4 min-h-dvh-screen dashboard-shell pb-24 sm:-mx-6 sm:-my-6 md:pb-0 lg:-mx-8">
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-section">
          <DashboardPeriodShell
            initialPeriod={dashboard.period}
            initialPulse={dashboard.pulse}
            operations={dashboard.todayOperations}
            agencyName={session.user.agencyName || ui.common.agencyFallback}
            totalVehicles={(dashboard.fleetSnapshot?.totalActive ?? 0) + (dashboard.fleetSnapshot?.inactive ?? 0)}
            activeReservationsCount={dashboard.context?.activeReservationsCount ?? 0}
            updatedAt={dashboard.context?.updatedAt ?? new Date().toISOString()}
          />
          <div className="grid grid-cols-1 gap-4 xl:items-start xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="space-y-4">
              <Suspense
                fallback={
                  <Card className="dashboard-panel">
                    <CardHeader className="p-4 pb-3">
                      <CardTitle className="section-title">
                        {ui.dashboard.activeBookingsTitle}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-slate-500">
                        {ui.dashboard.activeBookingsLoading}
                      </p>
                    </CardContent>
                  </Card>
                }
              >
                <DashboardActiveBookingsSection agencyId={agencyId} periodInput={periodInput} />
              </Suspense>
              <FleetSnapshotBar
                snapshot={{
                  rented: dashboard.fleetSnapshot?.rented ?? 0,
                  available: dashboard.fleetSnapshot?.available ?? 0,
                  maintenance: dashboard.fleetSnapshot?.maintenance ?? 0,
                  inactive: dashboard.fleetSnapshot?.inactive ?? 0,
                  totalActive: dashboard.fleetSnapshot?.totalActive ?? 0,
                }}
              />
            </div>
            <div className="space-y-4">
              <ActionCenterCard
                actionCenter={dashboard.actionCenter ?? { groups: [], isAllClear: true }}
                period={dashboard.period}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
