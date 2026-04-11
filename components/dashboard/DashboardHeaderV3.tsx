"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { DashboardV3ResolvedPeriod } from "@/lib/dashboard/types";
import { PeriodTabs } from "./PeriodTabs";
import { useI18n } from "@/components/i18n/i18n-context";
import { withLocalePath } from "@/lib/i18n/config";
import type { AppLocale } from "@/lib/i18n/config";

interface DashboardHeaderV3Props {
  period: DashboardV3ResolvedPeriod;
  agencyName: string;
  totalVehicles: number;
  activeReservationsCount: number;
  updatedAt: string;
  onPeriodChange?: (next: { period: string; start?: string; end?: string }) => void;
  periodPending?: boolean;
}

function getFreshnessLabel(
  updatedAt: string,
  now: number,
  locale: AppLocale,
  t: (path: string, vars?: Record<string, string | number>) => string
) {
  const updatedTime = new Date(updatedAt).getTime();
  const diffSeconds = Math.max(0, Math.floor((now - updatedTime) / 1000));
  const timeFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffSeconds < 5) return t("dashboard.header.updatedNow");
  if (diffSeconds < 60)
    return t("dashboard.header.updatedSecondsAgo", { n: diffSeconds });

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60)
    return t("dashboard.header.updatedMinutesAgo", { n: diffMinutes });

  return t("dashboard.header.updatedAtTime", {
    time: timeFmt.format(new Date(updatedAt)),
  });
}

export function DashboardHeaderV3({
  period,
  agencyName,
  totalVehicles,
  activeReservationsCount,
  updatedAt,
  onPeriodChange,
  periodPending = false,
}: DashboardHeaderV3Props) {
  const { locale, t } = useI18n();
  const lp = (path: string) => withLocalePath(locale, path);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const freshnessLabel = useMemo(
    () => getFreshnessLabel(updatedAt, now, locale, t),
    [updatedAt, now, locale, t]
  );

  return (
    <section className="dashboard-panel flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
      <div className="min-w-0 space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[20px] font-semibold leading-[1.2] tracking-tight text-slate-950">
              {t("dashboard.header.title")}
            </h1>
            <span className="inline-flex items-center rounded-full border border-subtle bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
              {t("dashboard.header.onlineBadge")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium leading-none text-slate-600">
            <span>{agencyName}</span>
            <span className="text-slate-300">•</span>
            <span className="tabular-nums">
              {totalVehicles} {t("dashboard.header.vehicles")}
            </span>
            <span className="text-slate-300">•</span>
            <span className="tabular-nums">
              {activeReservationsCount} {t("dashboard.header.activeReservations")}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{freshnessLabel}</span>
          </div>
        </div>
        <PeriodTabs period={period} onPeriodChange={onPeriodChange} pending={periodPending} />
      </div>

      <div className="flex items-center gap-2 self-start">
        <Button
          asChild
          size="sm"
          className="rounded-xl bg-[#1D4ED8] text-white shadow-none transition-colors duration-200 hover:bg-[#1E40AF]"
        >
          <Link href={lp("/bookings/create")}>
            <Plus className="h-4 w-4" />
            {t("dashboard.header.newBooking")}
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-subtle bg-white text-slate-700 hover:bg-slate-50"
            >
              {t("dashboard.header.add")}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href={lp("/customers/add")}>{t("dashboard.header.addClient")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={lp("/vehicles/add")}>{t("dashboard.header.addVehicle")}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
}
