import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth-cache";
import { resolveDashboardPeriod } from "@/lib/dashboard-periods";
import { DashboardHeader } from "../components/DashboardHeader";
import { PeriodPills } from "../components/PeriodPills";
import { KpiRow } from "../components/KpiRow";
import { ActionRequiredPanel } from "../components/ActionRequiredPanel";
import { OperationsPanel } from "../components/OperationsPanel";
import { OverviewGrid } from "../components/OverviewGrid";

// ── Skeleton loaders (match new card designs) ──────────────────────────────

function HeaderLoader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-36 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function PeriodLoader() {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-3 w-14" />
      <div className="inline-flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>
    </div>
  );
}

function KpiRowLoader() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardLoader() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Header skeleton */}
      <div className="border-b border-gray-100 p-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <Skeleton className="ml-9 mt-1 h-3 w-56" />
      </div>
      {/* Row skeletons */}
      <div className="divide-y divide-gray-50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-12 w-0.5 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1.5 h-3 w-48" />
            </div>
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OperationsLoader() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="shrink-0 border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <Skeleton className="mt-1.5 h-3 w-48" />
      </div>
      <div className="flex-1 divide-y divide-gray-50">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2.5 p-3">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-6 w-6 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewLoader() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-5" />
          </div>
          <div className="space-y-3 p-5">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

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

  return (
    /* Gray background wash — negative margins cancel the layout's own padding */
    <div className="-mx-4 -my-4 min-h-screen bg-gray-50 pb-24 sm:-mx-6 sm:-my-6 lg:-mx-8 md:pb-0">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 xl:max-w-[1320px]">
        <div className="flex flex-col gap-6">

          {/* Row 1: Header */}
          <Suspense fallback={<HeaderLoader />}>
            <DashboardHeader />
          </Suspense>

          {/* Row 2: Period segmented control */}
          <Suspense fallback={<PeriodLoader />}>
            <PeriodPills agencyId={agencyId} selectedPeriod={selectedPeriod} />
          </Suspense>

          {/* Row 3: KPI cards */}
          <Suspense fallback={<KpiRowLoader />}>
            <KpiRow agencyId={agencyId} />
          </Suspense>

          {/* Row 4: Command center (2/3) + Operations (1/3) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-8">
              <Suspense fallback={<CardLoader />}>
                <ActionRequiredPanel agencyId={agencyId} />
              </Suspense>
            </div>
            <div className="md:col-span-4">
              <Suspense fallback={<OperationsLoader />}>
                <OperationsPanel agencyId={agencyId} period={selectedPeriod} />
              </Suspense>
            </div>
          </div>

          {/* Row 5: Analytics overview */}
          <Suspense fallback={<OverviewLoader />}>
            <OverviewGrid agencyId={agencyId} />
          </Suspense>

        </div>
      </div>
    </div>
  );
}
