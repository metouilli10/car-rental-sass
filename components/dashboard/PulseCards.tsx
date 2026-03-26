"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { CollectionsSheet } from "@/components/dashboard/CollectionsSheet";
import { DepositsDueSheet } from "@/components/dashboard/DepositsDueSheet";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardV3Pulse, DashboardV3ResolvedPeriod, DashboardV3TodayOperations } from "@/lib/dashboard/types";

interface PulseCardsProps {
  pulse: DashboardV3Pulse;
  operations: DashboardV3TodayOperations;
  period: DashboardV3ResolvedPeriod;
}

const CARD_META = [
  {
    key: "net",
    title: "Net",
    getMeta: (pulse: DashboardV3Pulse) => pulse.net.subtitle,
  },
  {
    key: "toCollect",
    title: "A encaisser",
    getMeta: (pulse: DashboardV3Pulse) => pulse.toCollect.subtitle,
  },
  {
    key: "occupancy",
    title: "Occupation",
    getMeta: (pulse: DashboardV3Pulse, operations: DashboardV3TodayOperations) =>
      `${pulse.occupancy.rented}/${pulse.occupancy.total} loues • ${operations.availableVehicles} dispo`,
  },
  {
    key: "deposits",
    title: "Cautions a rendre",
    getMeta: (pulse: DashboardV3Pulse) => pulse.deposits.subtitle,
  },
] as const;

function renderNetMeta(pulse: DashboardV3Pulse) {
  const trend = pulse.net.trend;
  if (!trend?.deltaPct) {
    return <span className="meta-text">{pulse.net.subtitle}</span>;
  }

  const isPositive = trend.deltaPct > 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] leading-none",
        isPositive ? "text-emerald-600" : "text-red-600"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {`${Math.abs(Math.round(trend.deltaPct))}% ${trend.label.toLowerCase()}`}
    </span>
  );
}

export function PulseCards({ pulse, operations, period }: PulseCardsProps) {
  const router = useRouter();
  const [collectionsSheetOpen, setCollectionsSheetOpen] = useState(false);
  const [depositsSheetOpen, setDepositsSheetOpen] = useState(false);

  return (
    <>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {CARD_META.map((card) => {
        const value =
          card.key === "net"
            ? formatCurrency(pulse.net.amount)
            : card.key === "toCollect"
              ? formatCurrency(pulse.toCollect.amount)
              : card.key === "occupancy"
                ? `${pulse.occupancy.rate}%`
              : card.key === "deposits"
                ? formatCurrency(pulse.deposits.amount)
                : "";

        return (
          <article
            key={card.key}
            className={cn(
              "dashboard-tile flex min-h-[116px] flex-col justify-between p-3 sm:p-4",
              card.key === "toCollect"
                ? "cursor-pointer transition-colors hover:bg-orange-50/40"
                : card.key === "occupancy"
                  ? "cursor-pointer transition-colors hover:bg-slate-50"
                  : card.key === "deposits"
                    ? "cursor-pointer transition-colors hover:bg-sky-50/40"
                    : ""
            )}
            onClick={
              card.key === "toCollect"
                ? () => setCollectionsSheetOpen(true)
                : card.key === "occupancy"
                  ? () => router.push("/vehicles?status=AVAILABLE")
                  : card.key === "deposits"
                    ? () => setDepositsSheetOpen(true)
                    : undefined
            }
          >
            <div className="space-y-1.5">
              <p className="text-[12px] font-medium leading-none text-slate-500">{card.title}</p>
              <p className="metric-value">{value}</p>
            </div>
            <div className="flex min-h-[20px] items-center">
              {card.key === "net" ? (
                renderNetMeta(pulse)
              ) : card.key === "deposits" ? (
                <span className="text-[11px] leading-none text-sky-700">{card.getMeta(pulse, operations)}</span>
              ) : (
                <span className="meta-text">{card.getMeta(pulse, operations)}</span>
              )}
            </div>
          </article>
        );
        })}
      </section>

      <CollectionsSheet
        open={collectionsSheetOpen}
        onOpenChange={setCollectionsSheetOpen}
        period={period}
        initialCount={pulse.toCollect.bookingCount}
        initialOverdueCount={pulse.toCollect.overdueCount}
        initialTotalAmount={pulse.toCollect.amount}
      />

      <DepositsDueSheet
        open={depositsSheetOpen}
        onOpenChange={setDepositsSheetOpen}
        period={period}
        initialCount={pulse.deposits.count}
        initialTotalAmount={pulse.deposits.amount}
      />
    </>
  );
}
