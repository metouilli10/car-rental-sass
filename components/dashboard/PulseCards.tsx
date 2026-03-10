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
    iconWrapClassName: "bg-emerald-50 text-emerald-600",
    valueClassName: "text-emerald-600",
  },
  {
    key: "toCollect",
    title: "A encaisser",
    icon: CreditCard,
    iconWrapClassName: "bg-blue-50 text-blue-600",
    valueClassName: "text-blue-600",
  },
  {
    key: "occupancy",
    title: "Occupation",
    icon: CarFront,
    iconWrapClassName: "bg-amber-50 text-amber-600",
    valueClassName: "text-amber-600",
  },
  {
    key: "risks",
    title: "Risques",
    icon: AlertTriangle,
    iconWrapClassName: "bg-red-50 text-red-600",
    valueClassName: "text-red-600",
  },
] as const;

export function PulseCards({ pulse }: PulseCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {CARD_META.map((card) => {
        const Icon = card.icon;
        if (card.key === "occupancy") {
          return (
            <Card
              key={card.key}
              className="rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-slate-300/70 hover:shadow-md"
            >
              <CardHeader className="p-4 pb-0 md:p-6 md:pb-0">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium text-slate-500">{card.title}</CardTitle>
                  <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full", card.iconWrapClassName)}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-4 md:gap-5 md:p-6">
                <p className={cn("text-3xl font-semibold tracking-tight md:text-4xl", card.valueClassName)}>
                  {pulse.occupancy.rate}%
                </p>
                <p className="text-sm text-slate-500">{pulse.occupancy.subtitle}</p>
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
              className="rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-slate-300/70 hover:shadow-md"
            >
              <CardHeader className="p-4 pb-0 md:p-6 md:pb-0">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium text-slate-500">{card.title}</CardTitle>
                  <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full", card.iconWrapClassName)}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-4 md:gap-5 md:p-6">
                <p className={cn("text-3xl font-semibold tracking-tight md:text-4xl", card.valueClassName)}>
                  {pulse.risks.count}
                </p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(pulse.risks.exposureAmount)} expose
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
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
            className="rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-slate-300/70 hover:shadow-md"
          >
            <CardHeader className="p-4 pb-0 md:p-6 md:pb-0">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {card.title}
                </CardTitle>
                <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full", card.iconWrapClassName)}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-4 md:gap-5 md:p-6">
              <p className={cn("text-3xl font-semibold tracking-tight md:text-4xl", card.valueClassName)}>
                {formatCurrency(value)}
              </p>
              <p className="text-sm text-slate-500">
                {isZeroState ? "Aucune activite sur la periode" : subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
