import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { CashCardData } from "@/lib/dashboard/types";

interface CashCardProps {
  cash: CashCardData;
}

function formatHour(value: Date): string {
  return new Intl.DateTimeFormat("fr-MA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function CashCard({ cash }: CashCardProps) {
  return (
    <Card className="h-full rounded-xl border border-slate-200 bg-white shadow-sm hover:translate-y-0 hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">Caisse du jour</CardTitle>
            <p className="text-xs text-muted-foreground">Suivi des mouvements et encaissements</p>
          </div>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
              Entrees
            </div>
            <p className="mt-1 text-xl font-semibold text-emerald-700">
              +{formatCurrency(cash.cashInflowToday)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
              Sorties
            </div>
            <p className="mt-1 text-xl font-semibold text-red-700">
              -{formatCurrency(cash.cashOutflowToday)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Résultat du jour</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {cash.resultToday >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(cash.resultToday))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cash net: {cash.cashBalanceToday >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(cash.cashBalanceToday))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            A encaisser aujourd&apos;hui: {formatCurrency(cash.toCollectToday)}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Derniers mouvements
            </p>
            <Link href="/caisse" className="text-xs font-medium text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          {cash.latestMovements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground">
              Aucun mouvement aujourd&apos;hui.
            </div>
          ) : (
            <div className="space-y-1">
              {cash.latestMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {movement.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {movement.label} - {formatHour(movement.happenedAt)}
                    </p>
                  </div>
                  <Badge variant={movement.direction === "in" ? "success" : "danger"}>
                    {movement.direction === "in" ? "+" : "-"}
                    {formatCurrency(movement.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
