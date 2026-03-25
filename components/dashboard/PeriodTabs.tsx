"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { DashboardV3ResolvedPeriod } from "@/lib/dashboard/types";

interface PeriodTabsProps {
  period: DashboardV3ResolvedPeriod;
  onPeriodChange?: (next: { period: string; start?: string; end?: string }) => void;
  pending?: boolean;
}

const PERIOD_ITEMS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "7d", label: "7 jours" },
  { id: "month", label: "Ce mois" },
] as const;

const BASE_SEGMENT_CLASS =
  "inline-flex min-w-[72px] whitespace-nowrap items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:min-w-[88px] sm:px-3";
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

export function PeriodTabs({ period, onPeriodChange, pending = false }: PeriodTabsProps) {
  const inputId = useId();
  const monthInputRef = useRef<HTMLInputElement | null>(null);
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

    if (value === currentMonth) {
      onPeriodChange?.({ period: "month" });
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

    onPeriodChange?.({
      period: "custom",
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
    });
  }

  function openCustomMonthPicker() {
    if (pending) return;
    const input = monthInputRef.current;
    if (!input) return;

    if ("showPicker" in input && typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  return (
    <div className="flex flex-nowrap items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inline-flex sm:flex-wrap sm:overflow-visible">
      {PERIOD_ITEMS.map((item) => (
        onPeriodChange ? (
          <button
            key={item.id}
            type="button"
            disabled={pending}
            onClick={() => onPeriodChange({ period: item.id })}
            className={cn(
              BASE_SEGMENT_CLASS,
              period.key === item.id ? ACTIVE_SEGMENT_CLASS : INACTIVE_SEGMENT_CLASS,
              "disabled:cursor-wait disabled:opacity-70"
            )}
          >
            {item.label}
          </button>
        ) : (
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
        )
      ))}
      <div className="relative">
        <button
          type="button"
          disabled={pending}
          onClick={openCustomMonthPicker}
          className={cn(
            BASE_SEGMENT_CLASS,
            "cursor-pointer disabled:cursor-wait disabled:opacity-70",
            period.key === "custom" ? ACTIVE_SEGMENT_CLASS : INACTIVE_SEGMENT_CLASS
          )}
        >
          {formatCustomMonthLabel(customMonth, period.key === "custom")}
        </button>
        <input
          id={inputId}
          ref={monthInputRef}
          type="month"
          value={customMonth}
          max={currentMonth}
          onChange={(event) => handleCustomMonthChange(event.target.value)}
          aria-label="Choisir un mois personnalisé"
          disabled={pending}
          tabIndex={-1}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      </div>
    </div>
  );
}
