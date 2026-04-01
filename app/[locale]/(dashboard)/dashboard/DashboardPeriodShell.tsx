"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { DashboardHeaderV3 } from "@/components/dashboard/DashboardHeaderV3";
import { PulseCards } from "@/components/dashboard/PulseCards";
import type {
  DashboardV3DTO,
  DashboardV3Pulse,
  DashboardV3ResolvedPeriod,
  DashboardV3TodayOperations,
} from "@/lib/dashboard/types";

interface DashboardPeriodShellProps {
  initialPeriod: DashboardV3ResolvedPeriod;
  initialPulse: DashboardV3Pulse;
  operations: DashboardV3TodayOperations;
  agencyName: string;
  totalVehicles: number;
  activeReservationsCount: number;
  updatedAt: string;
}

interface DashboardPeriodSummaryResponse extends Pick<DashboardV3DTO, "period" | "context" | "pulse"> {}

function dashboardPathPrefix(pathname: string): string {
  const m = pathname.match(/^\/(fr|ar)(?=\/|$)/);
  return m ? `/${m[1]}` : "/fr";
}

function buildDashboardUrl(
  pathname: string,
  next: { period: string; start?: string; end?: string }
) {
  const params = new URLSearchParams(window.location.search);
  params.set("period", next.period);

  if (next.start && next.end) {
    params.set("start", next.start);
    params.set("end", next.end);
  } else {
    params.delete("start");
    params.delete("end");
  }

  return `${dashboardPathPrefix(pathname)}/dashboard?${params.toString()}`;
}

export function DashboardPeriodShell({
  initialPeriod,
  initialPulse,
  operations,
  agencyName,
  totalVehicles,
  activeReservationsCount,
  updatedAt,
}: DashboardPeriodShellProps) {
  const pathname = usePathname();
  const [period, setPeriod] = useState(initialPeriod);
  const [pulse, setPulse] = useState(initialPulse);
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState(updatedAt);
  const [currentActiveReservationsCount, setCurrentActiveReservationsCount] = useState(
    activeReservationsCount
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handlePeriodChange(next: { period: string; start?: string; end?: string }) {
    const nextUrl = buildDashboardUrl(pathname, next);
    const locale = pathname.match(/^\/(fr|ar)(?=\/|$)/)?.[1] === "ar" ? "ar" : "fr";
    const summaryQs = new URLSearchParams(nextUrl.split("?")[1]);
    summaryQs.set("locale", locale);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard/period-summary?${summaryQs.toString()}`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        window.location.href = nextUrl;
        return;
      }

      const summary = (await response.json()) as DashboardPeriodSummaryResponse;
      startTransition(() => {
        setPeriod(summary.period);
        setPulse(summary.pulse);
        setCurrentUpdatedAt(summary.context.updatedAt);
        setCurrentActiveReservationsCount(summary.context.activeReservationsCount);
        window.history.replaceState(null, "", nextUrl);
      });
    } catch (error) {
      console.error("Dashboard period change failed", error);
      window.location.href = nextUrl;
      return;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <DashboardHeaderV3
        period={period}
        agencyName={agencyName}
        totalVehicles={totalVehicles}
        activeReservationsCount={currentActiveReservationsCount}
        updatedAt={currentUpdatedAt}
        onPeriodChange={handlePeriodChange}
        periodPending={isLoading || isPending}
      />
      <PulseCards pulse={pulse} operations={operations} period={period} />
    </>
  );
}
