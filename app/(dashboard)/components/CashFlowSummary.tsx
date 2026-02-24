"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FlatIcon } from "@/components/shared/flat-icon";

interface CashTransaction {
  id: string;
  type: "in" | "out";
  category: "payment" | "deposit_received" | "deposit_returned" | "refund";
  amount: number;
  customerName: string;
  time: string;
}

interface CashFlowSummaryProps {
  entrees: number;
  sorties: number;
  transactions: CashTransaction[];
}

const formatCashDH = (amount: number): string => {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, " ") + " DH";
};

const categoryLabels: Record<string, string> = {
  payment: "Paiement location",
  deposit_received: "Caution reçue",
  deposit_returned: "Caution remboursée",
  refund: "Remboursement",
};

export function CashFlowSummary({
  entrees,
  sorties,
  transactions,
}: CashFlowSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const solde = entrees - sorties;
  const isPositive = solde >= 0;

  return (
    <Card className="bg-white shadow-md transition-all duration-200">
      <CardHeader className="border-b border-border/50 pb-4 px-card-padding">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlatIcon name="wallet" size={22} />
            <CardTitle className="text-base font-semibold">Caisse du jour</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            Aujourd&apos;hui
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-card-padding pt-6 space-y-5">
        {/* Entrées */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/25">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">
                Entrées
              </p>
              <p className="text-xs text-muted-foreground/45">
                Paiements + Cautions
              </p>
            </div>
          </div>
          <p className="text-[1.625rem] font-bold tabular-nums text-emerald-600 tracking-tight">
            +{formatCashDH(entrees)}
          </p>
        </div>

        {/* Sorties */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/25">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">
                Sorties
              </p>
              <p className="text-xs text-muted-foreground/45">
                Remboursements
              </p>
            </div>
          </div>
          <p className="text-[1.625rem] font-bold tabular-nums text-red-600 tracking-tight">
            -{formatCashDH(sorties)}
          </p>
        </div>

        {/* Solde du jour — reduced dominance, softer green */}
        <div
          className={`rounded-xl p-5 border transition-colors duration-200 ${
            isPositive
              ? "bg-emerald-50/25 border-emerald-200/40"
              : "bg-red-50/25 border-red-200/40"
          }`}
        >
          <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2">
            Solde du jour
          </p>
          <p className="text-xs text-muted-foreground/45 mb-4">
            Entrées − Sorties
          </p>
          <p
            className={`text-[2rem] font-bold tabular-nums tracking-tight ${
              isPositive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {solde >= 0 ? "+" : ""}
            {formatCashDH(Math.abs(solde))}
          </p>
        </div>

        {/* Expand/Collapse + Voir tout */}
        {transactions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="transition-colors duration-200"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Masquer les détails
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Voir les transactions ({transactions.length})
                </>
              )}
            </Button>
            <Link
              href="/caisse"
              className="text-xs font-medium text-primary hover:underline"
            >
              Voir tout
            </Link>
          </div>
        )}

        {/* Transaction Breakdown */}
        {isExpanded && (
          <div className="pt-5 border-t border-muted space-y-2">
            <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-3">
              Détail des transactions
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    tx.type === "in"
                      ? "bg-emerald-50/50 rounded-lg"
                      : "bg-red-50/50 rounded-lg"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {tx.customerName}
                    </p>
            <p className="text-xs text-muted-foreground/70">
              {categoryLabels[tx.category]} • {tx.time}
            </p>
                  </div>
                  <p
                    className={`text-sm font-bold flex-shrink-0 ml-2 ${
                      tx.type === "in" ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {tx.type === "in" ? "+" : "-"}
                    {formatCashDH(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {transactions.length === 0 && (
          <div className="text-center py-6 border-t">
            <FlatIcon name="wallet" size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground/70">
              Aucune transaction aujourd&apos;hui
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
