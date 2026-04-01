"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { CollectionsSheet } from "@/components/dashboard/CollectionsSheet";
import { DepositsDueSheet } from "@/components/dashboard/DepositsDueSheet";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardV3Pulse, DashboardV3ResolvedPeriod, DashboardV3TodayOperations } from "@/lib/dashboard/types";
import { useI18n } from "@/components/i18n/i18n-context";
import { withLocalePath } from "@/lib/i18n/config";

interface PulseCardsProps {
  pulse: DashboardV3Pulse;
  operations: DashboardV3TodayOperations;
  period: DashboardV3ResolvedPeriod;
}

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
  const { locale, t } = useI18n();
  const router = useRouter();
  const [collectionsSheetOpen, setCollectionsSheetOpen] = useState(false);
  const [depositsSheetOpen, setDepositsSheetOpen] = useState(false);

  const cardMeta = [
    {
      key: "net" as const,
      title: t("dashboard.pulse.net"),
      getMeta: (p: DashboardV3Pulse, _o: DashboardV3TodayOperations) => p.net.subtitle,
    },
    {
      key: "toCollect" as const,
      title: t("dashboard.pulse.toCollect"),
      getMeta: (p: DashboardV3Pulse, _o: DashboardV3TodayOperations) => p.toCollect.subtitle,
    },
    {
      key: "occupancy" as const,
      title: t("dashboard.pulse.occupancy"),
      getMeta: (p: DashboardV3Pulse, ops: DashboardV3TodayOperations) =>
        `${t("dashboard.pulse.rentedOfTotal", {
          rented: p.occupancy.rented,
          total: p.occupancy.total,
        })} • ${t("dashboard.pulse.availableShort", { n: ops.availableVehicles })}`,
    },
    {
      key: "deposits" as const,
      title: t("dashboard.pulse.deposits"),
      getMeta: (p: DashboardV3Pulse, _o: DashboardV3TodayOperations) => p.deposits.subtitle,
    },
  ];

  return (
    <>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cardMeta.map((card) => {
          const value =
            card.key === "net"
              ? formatCurrency(pulse.net.amount)
              : card.key === "toCollect"
                ? formatCurrency(pulse.toCollect.amount)
                : card.key === "occupancy"
                  ? `${pulse.occupancy.rate}%`
                  : formatCurrency(pulse.deposits.amount);

          const meta = card.getMeta(pulse, operations);

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
                    ? () =>
                        router.push(
                          withLocalePath(locale, "/vehicles?status=AVAILABLE")
                        )
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
                  <span className="text-[11px] leading-none text-sky-700">{meta}</span>
                ) : (
                  <span className="meta-text">{meta}</span>
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
