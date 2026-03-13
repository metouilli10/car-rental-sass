import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardV3Pulse, DashboardV3TodayOperations } from "@/lib/dashboard/types";

interface PulseCardsProps {
  pulse: DashboardV3Pulse;
  operations: DashboardV3TodayOperations;
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
    key: "risks",
    title: "Risques",
    getMeta: (pulse: DashboardV3Pulse) =>
      `${pulse.risks.breakdown.unpaidCount} impayes • ${pulse.risks.breakdown.depositDueCount} cautions • ${pulse.risks.breakdown.lateReturnCount} retours`,
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

export function PulseCards({ pulse, operations }: PulseCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {CARD_META.map((card) => {
        const value =
          card.key === "net"
            ? formatCurrency(pulse.net.amount)
            : card.key === "toCollect"
              ? formatCurrency(pulse.toCollect.amount)
              : card.key === "occupancy"
                ? `${pulse.occupancy.rate}%`
                : String(pulse.risks.count);

        return (
          <article
            key={card.key}
            className="dashboard-tile flex min-h-[116px] flex-col justify-between p-3 sm:p-4"
          >
            <div className="space-y-1.5">
              <p className="text-[12px] font-medium leading-none text-slate-500">{card.title}</p>
              <p className="metric-value">{value}</p>
            </div>
            <div className="flex min-h-[20px] items-center">
              {card.key === "net" ? (
                renderNetMeta(pulse)
              ) : card.key === "risks" ? (
                <span className="text-[11px] leading-none text-red-600">
                  {formatCurrency(pulse.risks.exposureAmount)} exposes
                </span>
              ) : (
                <span className="meta-text">{card.getMeta(pulse, operations)}</span>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
