import { AlertTriangle, CarFront, Coins, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardV3Pulse } from "@/lib/dashboard/types";

interface PulseCardsProps {
  pulse: DashboardV3Pulse;
}

const CARD_META = [
  {
    key: "net",
    title: "Net",
    icon: Coins,
    iconWrapClassName: "bg-emerald-100 dark:bg-emerald-500/15",
    iconClassName: "text-emerald-700 dark:text-emerald-300",
    headerWashClassName: "from-emerald-50/35 dark:from-emerald-500/5",
  },
  {
    key: "toCollect",
    title: "A encaisser",
    icon: CreditCard,
    iconWrapClassName: "bg-blue-100 dark:bg-blue-500/15",
    iconClassName: "text-blue-700 dark:text-blue-300",
    headerWashClassName: "from-blue-50/35 dark:from-blue-500/5",
  },
  {
    key: "occupancy",
    title: "Occupation",
    icon: CarFront,
    iconWrapClassName: "bg-amber-100 dark:bg-amber-500/15",
    iconClassName: "text-amber-700 dark:text-amber-300",
    headerWashClassName: "from-amber-50/35 dark:from-amber-500/5",
  },
  {
    key: "risks",
    title: "Risques",
    icon: AlertTriangle,
    iconWrapClassName: "bg-red-100 dark:bg-red-500/15",
    iconClassName: "text-red-700 dark:text-red-300",
    headerWashClassName: "from-red-50/35 dark:from-red-500/5",
  },
] as const;

export function PulseCards({ pulse }: PulseCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {CARD_META.map((card) => {
        const Icon = card.icon;
        if (card.key === "occupancy") {
          return (
            <Card
              key={card.key}
              className={cn(
                "rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:translate-y-0 hover:shadow-md"
              )}
            >
              <CardHeader className="pb-2">
                <div className={cn("flex items-center justify-between rounded-xl bg-gradient-to-r to-transparent px-3 py-2", card.headerWashClassName)}>
                  <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full", card.iconWrapClassName)}>
                    <Icon className={`h-4 w-4 ${card.iconClassName}`} />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-1">
                <p className="text-[1.75rem] font-semibold tracking-tight text-foreground">
                  {pulse.occupancy.rate}%
                </p>
                <p className="text-xs text-muted-foreground">{pulse.occupancy.subtitle}</p>
              </CardContent>
            </Card>
          );
        }

        if (card.key === "risks") {
          const {
            unpaidCount,
            depositDueCount,
            lateReturnCount,
          } = pulse.risks.breakdown;
          return (
            <Card
              key={card.key}
              className={cn(
                "rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:translate-y-0 hover:shadow-md"
              )}
            >
              <CardHeader className="pb-2">
                <div className={cn("flex items-center justify-between rounded-xl bg-gradient-to-r to-transparent px-3 py-2", card.headerWashClassName)}>
                  <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full", card.iconWrapClassName)}>
                    <Icon className={`h-4 w-4 ${card.iconClassName}`} />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-1">
                <p className="text-[1.75rem] font-semibold tracking-tight text-foreground">
                  {pulse.risks.count}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(pulse.risks.exposureAmount)} expose
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span>Impayes: {unpaidCount}</span>
                  <span>Cautions: {depositDueCount}</span>
                  <span>Retours: {lateReturnCount}</span>
                </div>
              </CardContent>
            </Card>
          );
        }

        const value = card.key === "net" ? pulse.net.amount : pulse.toCollect.amount;
        const subtitle = card.key === "net" ? pulse.net.subtitle : pulse.toCollect.subtitle;
        const isZeroState = card.key === "net" && value === 0;

        return (
          <Card
            key={card.key}
            className={cn(
              "rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:translate-y-0 hover:shadow-md"
            )}
          >
            <CardHeader className="pb-2">
              <div className={cn("flex items-center justify-between rounded-xl bg-gradient-to-r to-transparent px-3 py-2", card.headerWashClassName)}>
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full", card.iconWrapClassName)}>
                  <Icon className={`h-4 w-4 ${card.iconClassName}`} />
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-1">
              <p className="text-[1.75rem] font-semibold tracking-tight text-foreground">
                {formatCurrency(value)}
              </p>
              <p className="text-xs text-muted-foreground">
                {isZeroState ? "Aucune activite sur la periode" : subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
