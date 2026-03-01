import { Wallet, TrendingUp, Receipt, PiggyBank, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type FinanceKpisProps = {
  revenueMonth: number;
  expensesMonth: number;
  netProfit: number;
  cashInHand: number;
  depositsHeld: number;
};

export function FinanceKpis({
  revenueMonth,
  expensesMonth,
  netProfit,
  cashInHand,
  depositsHeld,
}: FinanceKpisProps) {
  const items = [
    {
      label: "Revenus",
      value: revenueMonth,
      icon: Wallet,
    },
    {
      label: "Charges",
      value: expensesMonth,
      icon: Receipt,
    },
    {
      label: "Net",
      value: netProfit,
      icon: TrendingUp,
    },
    {
      label: "Flux cash",
      value: cashInHand,
      icon: PiggyBank,
    },
    {
      label: "Cautions retenues",
      value: depositsHeld,
      icon: ShieldCheck,
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="border-border/70">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{formatCurrency(item.value)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Ce mois</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
