import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, FileQuestion } from "lucide-react";
import type { InspectionType } from "@prisma/client";

export interface DamageReportItem {
  id: string;
  inspectionType: InspectionType;
}

export interface InspectionsPanelProps {
  bookingId: string;
  damageReports: DamageReportItem[];
  /** Compact layout for right sidebar (smaller empty state, tighter spacing). */
  compact?: boolean;
}

const DEPART: InspectionType = "DEPART";
const RETOUR: InspectionType = "RETOUR";

export function InspectionsPanel({
  bookingId,
  damageReports,
  compact = false,
}: InspectionsPanelProps) {
  const hasDepart = damageReports.some((r) => r.inspectionType === DEPART);
  const hasRetour = damageReports.some((r) => r.inspectionType === RETOUR);

  if (damageReports.length === 0) {
    return (
      <Card className={compact ? "border-muted/60" : undefined}>
        <CardHeader
          className={
            compact
              ? "pb-2"
              : "flex flex-row items-center justify-between space-y-0"
          }
        >
          <CardTitle className="text-base">Inspections</CardTitle>
          {!compact && (
            <Button asChild size="sm">
              <Link href={`/damage-reports/new?bookingId=${bookingId}`}>
                Nouvelle inspection
              </Link>
            </Button>
          )}
        </CardHeader>
        {compact ? (
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Aucune inspection. Créez une inspection avant départ.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href={`/damage-reports/new?bookingId=${bookingId}`}>
                Nouvelle inspection
              </Link>
            </Button>
          </CardContent>
        ) : (
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-sm text-muted-foreground">
              <FileQuestion className="h-10 w-10" aria-hidden />
              <p>Aucune inspection enregistrée.</p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  const rowClass = compact
    ? "flex items-center justify-between rounded-md border bg-muted/30 px-2 py-1.5 text-sm"
    : "flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2";
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <Card className={compact ? "border-muted/60" : undefined}>
      <CardHeader
        className={
          compact
            ? "pb-2"
            : "flex flex-row items-center justify-between space-y-0"
        }
      >
        <CardTitle className="text-base">Inspections</CardTitle>
        <Button asChild size="sm">
          <Link href={`/damage-reports/new?bookingId=${bookingId}`}>
            Nouvelle inspection
          </Link>
        </Button>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : undefined}>
        <ul className={compact ? "space-y-1.5" : "space-y-2"} role="list">
          <li className={rowClass}>
            <span className="font-medium">Avant départ</span>
            <span className="inline-flex items-center gap-1.5 text-sm">
              {hasDepart ? (
                <>
                  <ClipboardCheck className={`${iconSize} text-emerald-600`} aria-hidden />
                  Réalisée
                </>
              ) : (
                "Non réalisée"
              )}
            </span>
          </li>
          <li className={rowClass}>
            <span className="font-medium">Retour</span>
            <span className="inline-flex items-center gap-1.5 text-sm">
              {hasRetour ? (
                <>
                  <ClipboardCheck className={`${iconSize} text-emerald-600`} aria-hidden />
                  Réalisée
                </>
              ) : (
                "Non réalisée"
              )}
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
