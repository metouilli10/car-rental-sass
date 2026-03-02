import Link from "next/link";
import {
  AlertTriangle,
  Car,
  ChevronRight,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
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
  /** Margin alerts (merged) */
  hasDeficit?: boolean;
  netMarginPercent?: number | null;
  losingVehicles?: string[];
};

type AlertRow = {
  key: string;
  label: string;
  icon: typeof CreditCard;
  amount?: number;
  count?: number;
  countLabel?: string;
  href?: string;
  iconClass: string;
  /** Margin alerts render without link */
  isMarginAlert?: boolean;
};

export function FinancialAlerts({
  unpaidAmount,
  unpaidCount,
  depositsToReturn,
  depositsToReturnCount,
  refundsPending,
  refundsPendingCount,
  hasDeficit = false,
  netMarginPercent = null,
  losingVehicles = [],
}: FinancialAlertsProps) {
  const rows: AlertRow[] = [
    {
      key: "unpaid",
      label: "Réservations non payées",
      icon: CreditCard,
      amount: unpaidAmount,
      count: unpaidCount,
      countLabel: `${unpaidCount} dossier${unpaidCount !== 1 ? "s" : ""}`,
      href: "/bookings?filter=unpaid",
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
    ...(hasDeficit
      ? [
          {
            key: "deficit",
            label: "Déficit ce mois — revoir charges ou revenus",
            icon: TrendingDown,
            iconClass: "text-rose-600",
            isMarginAlert: true,
          } as AlertRow,
        ]
      : []),
    ...(netMarginPercent !== null &&
    netMarginPercent < 10 &&
    !hasDeficit
      ? [
          {
            key: "low-margin",
            label: `Marge nette faible (${netMarginPercent.toFixed(1)}%) — risque élevé`,
            icon: TrendingDown,
            iconClass: "text-amber-600",
            isMarginAlert: true,
          } as AlertRow,
        ]
      : []),
    ...losingVehicles.map((label, i) => ({
      key: `losing-${i}`,
      label: `Véhicule en perte: ${label}`,
      icon: Car,
      iconClass: "text-amber-600",
      isMarginAlert: true,
    })) as AlertRow[],
  ];

  const hasAnyAlert =
    unpaidCount > 0 ||
    depositsToReturnCount > 0 ||
    refundsPendingCount > 0 ||
    hasDeficit ||
    (netMarginPercent !== null && netMarginPercent < 10) ||
    losingVehicles.length > 0;

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
              if (!row.isMarginAlert && (row.count ?? 0) === 0) return null;
              const Icon = row.icon;
              const content = (
                <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${row.iconClass}`} />
                    <div>
                      <p className="text-sm font-medium">{row.label}</p>
                      {row.countLabel != null && (
                        <Badge variant="secondary" className="mt-0.5 text-xs">
                          {row.countLabel}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {row.amount != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {formatMAD(row.amount)}
                      </span>
                      {row.href && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              );
              if (row.isMarginAlert || !row.href) {
                return <div key={row.key}>{content}</div>;
              }
              return (
                <Link key={row.key} href={row.href}>
                  {content}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
