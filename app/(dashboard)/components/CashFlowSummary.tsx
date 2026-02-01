"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Caisse du jour</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            Aujourd&apos;hui
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Entrées */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Entrées
              </p>
              <p className="text-sm text-muted-foreground">
                Paiements + Cautions
              </p>
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-700">
            +{formatCashDH(entrees)}
          </p>
        </div>

        {/* Sorties */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-red-700 uppercase tracking-wider">
                Sorties
              </p>
              <p className="text-sm text-muted-foreground">
                Remboursements
              </p>
            </div>
          </div>
          <p className="text-xl font-bold text-red-700">
            -{formatCashDH(sorties)}
          </p>
        </div>

        {/* Solde */}
        <div className="pt-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Solde du jour
              </p>
              <p className="text-xs text-muted-foreground">
                Entrées - Sorties
              </p>
            </div>
            <p
              className={`text-3xl font-bold ${
                solde >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {solde >= 0 ? "+" : ""}
              {formatCashDH(Math.abs(solde))}
            </p>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        {transactions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
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
        )}

        {/* Transaction Breakdown */}
        {isExpanded && (
          <div className="pt-4 border-t space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Détail des transactions
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    tx.type === "in"
                      ? "bg-emerald-50 border border-emerald-100"
                      : "bg-red-50 border border-red-100"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {tx.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Aucune transaction aujourd&apos;hui
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
