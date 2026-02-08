import { Suspense } from "react";
import { getSession } from "@/lib/auth-cache";
import { Skeleton } from "@/components/ui/skeleton";

import { ActionRequise } from "../components/ActionRequise";
import { OperationsDuJour } from "../components/OperationsDuJour";
import { VueDensemble } from "../components/VueDensemble";
import { DashboardHeader } from "../components/DashboardHeader";

function ActionRequiseLoader() {
  return (
    <div className="border-2 border-red-200 bg-red-50/50 rounded-xl p-6">
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
    <div className="border-2 border-blue-200 bg-blue-50/30 rounded-xl p-6">
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

function VueDensembleLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-6">
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

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const agencyId = session.user.agencyId;

  return (
    <>
      <DashboardHeader agencyId={agencyId} />

      <div className="space-y-8 pt-8" suppressHydrationWarning>
      {/* 1. ACTION REQUISE - Top priority, red-tinted */}
      <Suspense fallback={<ActionRequiseLoader />}>
        <ActionRequise agencyId={agencyId} />
      </Suspense>

      {/* 2. OPÉRATIONS DU JOUR - Timeline of today's operations */}
      <Suspense fallback={<OperationsDuJourLoader />}>
        <OperationsDuJour agencyId={agencyId} />
      </Suspense>

      {/* 3. VUE D'ENSEMBLE - KPIs and summary stats */}
      <Suspense fallback={<VueDensembleLoader />}>
        <VueDensemble agencyId={agencyId} />
      </Suspense>
      </div>
    </>
  );
}
