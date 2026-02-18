import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type KpiTone = "blue" | "violet" | "emerald" | "amber";

const toneStyles: Record<KpiTone, { iconBg: string; iconColor: string }> = {
  blue: {
    iconBg: "bg-blue-100/80",
    iconColor: "text-blue-600",
  },
  violet: {
    iconBg: "bg-violet-100/80",
    iconColor: "text-violet-600",
  },
  emerald: {
    iconBg: "bg-emerald-100/80",
    iconColor: "text-emerald-600",
  },
  amber: {
    iconBg: "bg-amber-100/80",
    iconColor: "text-amber-600",
  },
};

export interface KpiStripItem {
  id: string;
  icon: LucideIcon;
  value: string;
  label: string;
  subLabel?: string;
  tone?: KpiTone;
}

interface KpiCardProps {
  item: KpiStripItem;
  className?: string;
}

export function KpiCard({ item, className }: KpiCardProps) {
  const tone = toneStyles[item.tone ?? "blue"];
  const Icon = item.icon;

  return (
    <article
      className={cn(
        "rounded-xl border border-border/70 bg-white shadow-card",
        "px-4 py-3.5 sm:px-5 sm:py-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            tone.iconBg
          )}
        >
          <Icon className={cn("h-5 w-5", tone.iconColor)} />
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
            {item.value}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground/85">{item.label}</p>
          {item.subLabel ? (
            <p className="mt-0.5 text-xs text-muted-foreground/70">{item.subLabel}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

interface KpiStripProps {
  items: KpiStripItem[];
  className?: string;
}

export function KpiStrip({ items, className }: KpiStripProps) {
  return (
    <section className={className} aria-label="Indicateurs clés">
      <div className="hidden md:grid md:grid-cols-4 md:gap-4">
        {items.map((item) => (
          <KpiCard key={item.id} item={item} />
        ))}
      </div>

      <div className="md:hidden flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <KpiCard key={item.id} item={item} className="min-w-[240px] snap-start" />
        ))}
      </div>
    </section>
  );
}
