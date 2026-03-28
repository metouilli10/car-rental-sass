import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

export type AlertSeverity = "danger" | "warning" | "info";

export interface OperationalAlertItem {
  severity: AlertSeverity;
  message: string;
}

export interface ReservationOperationalAlertsProps {
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
