import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateFR } from "@/lib/reservations/presentation";

export interface ReservationActivityProps {
  createdAt: Date | string;
  statusLabel: string;
  paymentLabel: string;
  /** Compact layout for right sidebar (tighter spacing, smaller dots). */
  compact?: boolean;
}

export function ReservationActivity({
  createdAt,
  statusLabel,
  paymentLabel,
  compact = false,
}: ReservationActivityProps) {
  const createdStr = formatDateFR(createdAt);

  const items = [
    { label: "Réservation créée", detail: createdStr },
    { label: "Statut", detail: statusLabel },
    { label: "Paiement", detail: paymentLabel },
  ];

  const dotSize = compact ? "h-3 w-3" : "h-4 w-4";
  const listGap = compact ? "space-y-2" : "space-y-4";
  const lineLeft = compact ? "left-[5px]" : "left-[7px]";
  const lineTop = compact ? "top-3" : "top-5";

  return (
    <Card className={compact ? "border-muted/60" : undefined}>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="text-base">Activité</CardTitle>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : undefined}>
        <ul className={`relative ${listGap}`} role="list">
          {items.map((item, i) => (
            <li key={i} className="relative flex gap-2">
              {i < items.length - 1 && (
                <span
                  className={`absolute ${lineLeft} ${lineTop} h-full w-px bg-border`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex ${dotSize} shrink-0 rounded-full border-2 border-primary bg-background`}
                aria-hidden
              />
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
