import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { VehicleInfractionItem } from "@/lib/vehicles/profile";
import type { AppLocale } from "@/lib/i18n/config";
import { withLocalePath } from "@/lib/i18n/config";
import { getInfractionStatusClass, infractionStatusLabels, infractionTypeLabels } from "./presentation";

export function VehicleInfractionsPanel({
  vehicleId,
  infractions,
  compact = false,
  locale = "fr",
}: {
  vehicleId: string;
  infractions: VehicleInfractionItem[];
  compact?: boolean;
  locale?: AppLocale;
}) {
  const items = compact ? infractions.slice(0, 3) : infractions;

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Infractions</CardTitle>
        <Button variant="secondary" size="sm" asChild>
          <Link href={withLocalePath(locale, `/infractions/new?vehicleId=${vehicleId}`)}>
            Ajouter infraction
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Aucune infraction enregistrée.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {infractionTypeLabels[item.type as keyof typeof infractionTypeLabels] ?? item.type}
                    </p>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getInfractionStatusClass(item.status)}`}>
                      {infractionStatusLabels[item.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.assignedClientName ?? "Client non assigné"} · {formatDate(item.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.amount != null ? formatCurrency(item.amount) : "Montant non renseigné"}
                  </p>
                  <Link
                    href={withLocalePath(locale, `/infractions/${item.id}`)}
                    className="mt-1 inline-flex text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Voir le détail
                  </Link>
                </div>
              </div>
              {item.notes ? (
                <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p>{item.notes}</p>
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
