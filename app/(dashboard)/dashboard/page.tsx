import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth-cache";
import { resolveDashboardPeriod } from "@/lib/dashboard-periods";
import { DashboardHeader } from "../components/DashboardHeader";
import { PeriodFilter } from "../components/PeriodFilter";
import { TopMetrics } from "../components/TopMetrics";
import { PriorityActions } from "../components/PriorityActions";
import { FleetStatus } from "../components/FleetStatus";
import { DailyCash } from "../components/DailyCash";
import { MonthlyOverview } from "../components/MonthlyOverview";

// ── Skeleton loaders (match new card designs) ──────────────────────────────

function HeaderLoader() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Skeleton className="h-9 w-56" />
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Skeleton className="mb-3 h-3 w-28" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function KpiRowLoader() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header skeleton */}
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <Skeleton className="ml-9 mt-1 h-3 w-56" />
      </div>
      {/* Row skeletons */}
      <div className="divide-y divide-slate-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5">
            <Skeleton className="h-12 w-1 shrink-0 rounded-full" />
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-5" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-5 w-20" />
            <Skeleton className="mt-3 h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewLoader() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-5" />
          </div>
          <div className="space-y-3 p-6">
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
    <div className="-mx-4 -my-4 min-h-screen bg-slate-50 pb-24 sm:-mx-6 sm:-my-6 lg:-mx-8 md:pb-0">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 xl:max-w-[1320px]">
        <div className="flex flex-col gap-6">

          <Suspense fallback={<HeaderLoader />}>
            <DashboardHeader />
          </Suspense>

          <Suspense fallback={<PeriodLoader />}>
            <PeriodFilter agencyId={agencyId} selectedPeriod={selectedPeriod} />
          </Suspense>

          <Suspense fallback={<KpiRowLoader />}>
            <TopMetrics agencyId={agencyId} period={selectedPeriod} />
          </Suspense>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <Suspense fallback={<CardLoader />}>
                <PriorityActions agencyId={agencyId} period={selectedPeriod} />
              </Suspense>
            </div>
            <div className="xl:col-span-4">
              <Suspense fallback={<OperationsLoader />}>
                <FleetStatus agencyId={agencyId} />
              </Suspense>
            </div>
          </div>

          <Suspense fallback={<OverviewLoader />}>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <DailyCash agencyId={agencyId} />
              <MonthlyOverview agencyId={agencyId} />
            </div>
          </Suspense>

        </div>
      </div>
    </div>
  );
}
