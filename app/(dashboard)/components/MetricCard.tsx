"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowUpRight, Gauge, HandCoins, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

export interface MetricCardData {
  id: string;
  label: string;
  value: string;
  subLabel: string;
  insightText: string;
  insightTone: "positive" | "negative" | "neutral";
  href: string;
  icon: "gauge" | "activity" | "revenue" | "profit";
  sparkline: number[];
}

interface MetricCardProps {
  item: MetricCardData;
}

const insightToneClasses: Record<MetricCardData["insightTone"], string> = {
  positive: "text-emerald-600",
  negative: "text-red-600",
  neutral: "text-slate-500",
};
const metricIconClass = "h-5 w-5 shrink-0";
const arrowIconClass =
  "h-5 w-5 shrink-0 text-slate-400 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-blue-600 group-hover:opacity-100";

const iconMap = {
  gauge: Gauge,
  activity: Activity,
  revenue: HandCoins,
  profit: TrendingUp,
} as const;

export function MetricCard({ item }: MetricCardProps) {
  const router = useRouter();
  const Icon = iconMap[item.icon];

  const maxPoint = useMemo(() => {
    const max = Math.max(...item.sparkline, 1);
    return max;
  }, [item.sparkline]);

  return (
    <button
      type="button"
      onClick={() => router.push(item.href)}
      aria-label={`${item.label}: ${item.value}`}
      className="group flex w-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-700">{item.label}</p>
          <p className="text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.subLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-slate-100 p-2 text-muted-foreground transition-colors duration-200 group-hover:bg-blue-50 group-hover:text-blue-600">
            <Icon className={metricIconClass} />
          </div>
          <ArrowUpRight className={arrowIconClass} />
        </div>
      </div>

      <p className={cn("mt-4 text-xs font-medium", insightToneClasses[item.insightTone])}>
        {item.insightText}
      </p>

      <div className="mt-4 flex h-9 items-end gap-1">
        {item.sparkline.map((point, index) => (
          <div
            key={`${item.id}-spark-${index}`}
            className="flex-1 rounded-full bg-slate-200/80 transition-all duration-200 group-hover:bg-blue-200/80"
            style={{ height: `${Math.max(18, Math.round((point / maxPoint) * 100))}%` }}
          />
        ))}
      </div>
    </button>
  );
}
