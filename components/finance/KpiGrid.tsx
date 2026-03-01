import { cn } from "@/lib/utils";
import { formatMAD } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { kpiDefinitions } from "@/components/finance/kpiTone";

type KpiGridProps = {
  periodLabel: string;
  revenuePeriod: number;
  expensesPeriod: number;
  netProfit: number;
  cashInHand: number;
  depositsHeld: number;
};

export function KpiGrid({
  periodLabel,
  revenuePeriod,
  expensesPeriod,
  netProfit,
  cashInHand,
  depositsHeld,
}: KpiGridProps) {
  const items = [
    {
      ...kpiDefinitions.net,
      value: netProfit,
      tone:
        netProfit >= 0
          ? kpiDefinitions.net.tone
          : {
              ...kpiDefinitions.net.tone,
              cardClassName: "border-rose-200/70 bg-rose-50/30",
              iconWrapClassName: "bg-rose-100 text-rose-700",
              iconClassName: "text-rose-700",
              valueClassName: "text-3xl font-bold",
            },
    },
    { ...kpiDefinitions.revenue, value: revenuePeriod },
    { ...kpiDefinitions.expenses, value: expensesPeriod },
    { ...kpiDefinitions.cash, value: cashInHand },
    { ...kpiDefinitions.deposits, value: depositsHeld },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.key}
            className={cn(
              "border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
              item.key === "net"
                ? "xl:col-span-2 border-primary/20 ring-1 ring-primary/10"
                : "xl:col-span-1",
              item.tone.cardClassName
            )}
          >
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", item.tone.iconWrapClassName)}>
                  <Icon className={cn("h-4 w-4", item.tone.iconClassName)} />
                </span>
              </div>

              <div className={cn("text-2xl font-semibold tracking-tight", item.tone.valueClassName)}>
                {formatMAD(item.value)}
              </div>

              {item.key === "net" ? (
                <p className="text-xs text-muted-foreground">
                  {item.value >= 0 ? "Benefice sur la periode" : "Deficit sur la periode"}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {item.key === "cash" ? "Flux net cash sur la periode" : periodLabel}
                  <span className="text-muted-foreground/70"> • Mise a jour live</span>
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
