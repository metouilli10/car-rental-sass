"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatMAD } from "@/lib/format";
import { expenseCategoryLabel } from "@/components/finance/constants";
import type { ExpenseCategory } from "@prisma/client";

type NetProfitBreakdownProps = {
  revenue: number;
  refunded: number;
  expenseBreakdown: Partial<Record<ExpenseCategory, number>>;
  netProfit: number;
  periodLabel: string;
};

const CATEGORY_ORDER: ExpenseCategory[] = [
  "CARBURANT",
  "ASSURANCE",
  "MAINTENANCE",
  "SALAIRES",
  "LOYER",
  "TAXES",
  "NETTOYAGE",
  "MARKETING",
  "AUTRE",
];

export function NetProfitBreakdown({
  revenue,
  refunded,
  expenseBreakdown,
  netProfit,
  periodLabel,
}: NetProfitBreakdownProps) {
  const costLines = CATEGORY_ORDER.filter(
    (cat) => (expenseBreakdown[cat] ?? 0) > 0
  ).map((cat) => ({
    label: expenseCategoryLabel[cat],
    amount: expenseBreakdown[cat] ?? 0,
  }));

  const hasRefunds = refunded > 0;
  const isPositive = netProfit >= 0;

  return (
    <Card className="border-border/70 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Résultat net détaillé</CardTitle>
        <p className="text-sm text-muted-foreground">
          Revenus moins charges par catégorie — {periodLabel}
        </p>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Revenue */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium">Revenus</span>
          <span className="text-sm font-semibold text-emerald-700">
            +{formatMAD(revenue)}
          </span>
        </div>

        {/* Refunds */}
        {hasRefunds && (
          <>
            <Separator className="my-2" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">
                (-) Remboursements
              </span>
              <span className="text-sm font-medium text-rose-600">
                -{formatMAD(refunded)}
              </span>
            </div>
          </>
        )}

        {/* Expense lines */}
        {costLines.map((line) => (
          <div key={line.label}>
            <Separator className="my-2" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">
                (-) {line.label}
              </span>
              <span className="text-sm font-medium text-rose-600">
                -{formatMAD(line.amount)}
              </span>
            </div>
          </div>
        ))}

        {/* Net profit */}
        <Separator className="my-3" />
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-600" />
            )}
            Résultat net
          </span>
          <span
            className={
              isPositive
                ? "text-lg font-bold text-emerald-700"
                : "text-lg font-bold text-rose-700"
            }
          >
            {formatMAD(netProfit)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
