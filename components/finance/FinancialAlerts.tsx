import Link from "next/link";
import { AlertTriangle, ChevronRight, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMAD } from "@/lib/format";

type FinancialAlertsProps = {
  unpaidAmount: number;
  unpaidCount: number;
  depositsToReturn: number;
  depositsToReturnCount: number;
  refundsPending: number;
  refundsPendingCount: number;
};

type AlertRow = {
  key: string;
  label: string;
  icon: typeof CreditCard;
  amount: number;
  count: number;
  countLabel: string;
  href: string;
  iconClass: string;
};

export function FinancialAlerts({
  unpaidAmount,
  unpaidCount,
  depositsToReturn,
  depositsToReturnCount,
  refundsPending,
  refundsPendingCount,
}: FinancialAlertsProps) {
  const rows: AlertRow[] = [
    {
      key: "unpaid",
      label: "Réservations non payées",
      icon: CreditCard,
      amount: unpaidAmount,
      count: unpaidCount,
      countLabel: `${unpaidCount} dossier${unpaidCount !== 1 ? "s" : ""}`,
      href: "/bookings?paymentStatus=PENDING",
      iconClass: "text-amber-600",
    },
    {
      key: "deposits",
      label: "Cautions à rendre",
      icon: ShieldCheck,
      amount: depositsToReturn,
      count: depositsToReturnCount,
      countLabel: `${depositsToReturnCount} client${depositsToReturnCount !== 1 ? "s" : ""}`,
      href: "/finance?tab=cautions",
      iconClass: "text-yellow-600",
    },
    {
      key: "refunds",
      label: "Remboursements en attente",
      icon: RefreshCw,
      amount: refundsPending,
      count: refundsPendingCount,
      countLabel: `${refundsPendingCount} paiement${refundsPendingCount !== 1 ? "s" : ""}`,
      href: "/finance?tab=revenus",
      iconClass: "text-rose-600",
    },
  ];

  const hasAnyAlert = unpaidCount > 0 || depositsToReturnCount > 0 || refundsPendingCount > 0;

  return (
    <Card className="border-border/70 bg-muted/30 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Actions financières requises
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnyAlert ? (
          <div className="rounded-lg border border-dashed border-border/50 bg-background/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune action requise — tout est à jour
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {rows.map((row) => {
              if (row.count === 0) return null;
              const Icon = row.icon;
              return (
                <Link
                  key={row.key}
                  href={row.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${row.iconClass}`} />
                    <div>
                      <p className="text-sm font-medium">{row.label}</p>
                      <Badge variant="secondary" className="mt-0.5 text-xs">
                        {row.countLabel}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {formatMAD(row.amount)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
