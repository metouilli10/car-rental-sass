import { Suspense } from "react";
import { getSession } from "@/lib/auth-cache";
import { Skeleton } from "@/components/ui/skeleton";

import { ActionRequise } from "../components/ActionRequise";
import { OperationsDuJour } from "../components/OperationsDuJour";
import { VueDensemble } from "../components/VueDensemble";
import { DashboardHeader } from "../components/DashboardHeader";

function ActionRequiseLoader() {
  return (
    <div className="bg-white rounded-2xl shadow-card p-card-padding">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

function OperationsDuJourLoader() {
  return (
    <div className="bg-white rounded-2xl shadow-card p-card-padding">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

function KpiCardsLoader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-card-gap mt-section">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl p-card-padding bg-muted/30">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="h-11 w-11 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <Skeleton className="h-9 w-16 mb-2" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

function VueDensembleLoader() {
  return (
    <div className="space-y-section-sm">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-card-gap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-card-padding">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DashboardPageProps {
  searchParams: Promise<{ opsDate?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const agencyId = session.user.agencyId;
  const params = await searchParams;
  const opsDate = params.opsDate;

  return (
    <>
      <Suspense fallback={<KpiCardsLoader />}>
        <DashboardHeader agencyId={agencyId} />
      </Suspense>

      <div className="space-y-section pt-section" suppressHydrationWarning>
      {/* 1. ACTION REQUISE - Top priority, red-tinted */}
      <Suspense fallback={<ActionRequiseLoader />}>
        <ActionRequise agencyId={agencyId} />
      </Suspense>

      {/* 2. OPÉRATIONS DU JOUR - Server Component, no client fetch waterfall */}
      <Suspense fallback={<OperationsDuJourLoader />}>
        <OperationsDuJour agencyId={agencyId} date={opsDate} />
      </Suspense>

      {/* 3. VUE D'ENSEMBLE - KPIs and summary stats */}
      <Suspense fallback={<VueDensembleLoader />}>
        <VueDensemble agencyId={agencyId} />
      </Suspense>
      </div>
    </>
  );
}
