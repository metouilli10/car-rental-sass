"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DashboardV3ResolvedPeriod } from "@/lib/dashboard/types";

interface PeriodTabsProps {
  period: DashboardV3ResolvedPeriod;
}

const PERIOD_ITEMS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "7d", label: "7 jours" },
  { id: "month", label: "Ce mois" },
] as const;

const BASE_SEGMENT_CLASS =
  "inline-flex min-w-[88px] items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors";
const ACTIVE_SEGMENT_CLASS =
  "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200";
const INACTIVE_SEGMENT_CLASS =
  "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700";

function toMonthValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function toMonthDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month] = value.split("-").map(Number);
  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return null;
  }

  return new Date(year, month - 1, 1);
}

function getCustomMonthValue(periodKey: DashboardV3ResolvedPeriod["key"], periodStart: string): string {
  if (periodKey === "custom") {
    const parsed = new Date(periodStart);
    if (!Number.isNaN(parsed.getTime())) {
      return toMonthValue(parsed);
    }
  }

  return toMonthValue(new Date());
}

function formatCustomMonthLabel(monthValue: string, isActive: boolean): string {
  if (!isActive) {
    return "Perso";
  }

  const selectedMonth = toMonthDate(monthValue);
  if (!selectedMonth) {
    return "Perso";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "numeric",
  }).format(selectedMonth);
}

export function PeriodTabs({ period }: PeriodTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputId = useId();
  const [customMonth, setCustomMonth] = useState(() =>
    getCustomMonthValue(period.key, period.start)
  );
  const currentMonth = toMonthValue(new Date());

  useEffect(() => {
    setCustomMonth(getCustomMonthValue(period.key, period.start));
  }, [period.key, period.start]);

  function handleCustomMonthChange(value: string) {
    setCustomMonth(value);

    const selectedMonth = toMonthDate(value);
    if (!selectedMonth) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (value === currentMonth) {
      params.set("period", "month");
      params.delete("start");
      params.delete("end");
      router.push(`/dashboard?${params.toString()}`);
      return;
    }

    const rangeStart = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      1,
      12,
      0,
      0,
      0,
    );
    const rangeEnd = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0,
      12,
      0,
      0,
      0,
    );

    params.set("period", "custom");
    params.set("start", rangeStart.toISOString());
    params.set("end", rangeEnd.toISOString());
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {PERIOD_ITEMS.map((item) => (
        <Link
          key={item.id}
          href={`/dashboard?period=${item.id}`}
          className={cn(
            BASE_SEGMENT_CLASS,
            period.key === item.id ? ACTIVE_SEGMENT_CLASS : INACTIVE_SEGMENT_CLASS
          )}
        >
          {item.label}
        </Link>
      ))}
      <div className="relative">
        <label
          htmlFor={inputId}
          className={cn(
            BASE_SEGMENT_CLASS,
            "cursor-pointer",
            period.key === "custom" ? ACTIVE_SEGMENT_CLASS : INACTIVE_SEGMENT_CLASS
          )}
        >
          {formatCustomMonthLabel(customMonth, period.key === "custom")}
        </label>
        <input
          id={inputId}
          type="month"
          value={customMonth}
          max={currentMonth}
          onChange={(event) => handleCustomMonthChange(event.target.value)}
          aria-label="Choisir un mois personnalisé"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}
