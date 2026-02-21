import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { formatMad } from "@/lib/reservations/presentation";

export type AlertSeverity = "danger" | "warning" | "info";

export interface OperationalAlertItem {
  severity: AlertSeverity;
  message: string;
}

export interface ReservationOperationalAlertsProps {
  /** Max 2 alerts, already ordered by priority (danger > warning > info). */
  alerts: OperationalAlertItem[];
}

const severityConfig = {
  danger: {
    icon: AlertCircle,
    className:
      "border-destructive/50 bg-destructive/5 text-destructive [&>svg]:text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-amber-500/50 bg-amber-500/5 text-amber-800 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
  },
  info: {
    icon: Info,
    className:
      "border-blue-500/50 bg-blue-500/5 text-blue-800 dark:text-blue-200 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400",
  },
} as const;

export function ReservationOperationalAlerts({
  alerts,
}: ReservationOperationalAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2" role="region" aria-label="Alertes opérationnelles">
      {alerts.slice(0, 2).map((alert, i) => {
        const config = severityConfig[alert.severity];
        const Icon = config.icon;
        return (
          <Alert
            key={i}
            className={config.className}
            variant={alert.severity === "danger" ? "destructive" : "default"}
          >
            <Icon className="h-4 w-4" />
            <AlertTitle className="sr-only">
              {alert.severity === "danger"
                ? "Alerte"
                : alert.severity === "warning"
                  ? "Attention"
                  : "Information"}
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

/** Build alerts for a reservation (call from page). Max 2 returned, priority order. */
export function buildReservationAlerts(params: {
  remainingAmount: number;
  status: string;
  depositStatusLabel: string;
  startDate: Date | string;
  isStartToday: boolean;
}): OperationalAlertItem[] {
  const {
    remainingAmount,
    status,
    depositStatusLabel,
    isStartToday,
  } = params;
  const alerts: OperationalAlertItem[] = [];

  if (remainingAmount > 0) {
    alerts.push({
      severity: "warning",
      message: `Paiement en attente : ${formatMad(remainingAmount)}`,
    });
  }
  if (
    status === "COMPLETED" &&
    (depositStatusLabel === "À restituer" || depositStatusLabel === "Partiel")
  ) {
    alerts.push({
      severity: "warning",
      message: "Caution à restituer",
    });
  }
  if (isStartToday && status === "CONFIRMED") {
    alerts.push({
      severity: "info",
      message: "La location démarre aujourd'hui",
    });
  }

  return alerts;
}
