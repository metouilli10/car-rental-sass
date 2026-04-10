import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { VehicleInspectionHistoryItem } from "@/lib/vehicles/profile";

export function VehicleInspectionHistory({
  inspections,
  createInspectionHref,
  createInspectionDisabledReason,
}: {
  inspections: VehicleInspectionHistoryItem[];
  createInspectionHref?: string;
  createInspectionDisabledReason?: string | null;
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Historique inspections</CardTitle>
      </CardHeader>
      <CardContent>
        {inspections.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6">
            <p className="text-sm font-semibold text-slate-950">Aucune inspection enregistrée</p>
            <p className="mt-1 text-sm text-slate-500">
              Lancez une inspection pour cadrer le prochain départ ou retour.
            </p>
            {createInspectionHref ? (
              <Button size="sm" className="mt-4" asChild>
                <Link href={createInspectionHref}>Lancer une inspection</Link>
              </Button>
            ) : (
              <Button size="sm" className="mt-4" disabled title={createInspectionDisabledReason ?? undefined}>
                Lancer une inspection
              </Button>
            )}
            {!createInspectionHref && createInspectionDisabledReason ? (
              <p className="mt-2 text-xs text-slate-400">{createInspectionDisabledReason}</p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {inspections.map((inspection) => (
                <Link
                  key={inspection.id}
                  href={`/damage-reports/${inspection.id}`}
                  className="block rounded-2xl border border-slate-200/70 bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Inspection {inspection.inspectionType === "DEPART" ? "départ" : "retour"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{inspection.customerName}</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(inspection.reportedAt)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{inspection.damageCount} dommage(s)</span>
                    <span>{inspection.photosCount} photo(s)</span>
                    {inspection.totalDamageCost > 0 ? <span>{formatCurrency(inspection.totalDamageCost)}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Réservation / client</th>
                    <th className="pb-3 pr-4">Carburant</th>
                    <th className="pb-3 pr-4">Dommages</th>
                    <th className="pb-3 pr-4">Photos</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspections.map((inspection) => (
                    <tr key={inspection.id}>
                      <td className="py-4 pr-4 text-sm text-slate-600">{formatDate(inspection.reportedAt)}</td>
                      <td className="py-4 pr-4 text-sm font-medium text-slate-900">
                        {inspection.inspectionType === "DEPART" ? "Départ" : "Retour"}
                      </td>
                      <td className="py-4 pr-4 text-sm text-slate-600">{inspection.customerName}</td>
                      <td className="py-4 pr-4 text-sm text-slate-600">{inspection.fuelLevel ?? "—"}</td>
                      <td className="py-4 pr-4 text-sm text-slate-600">{inspection.damageCount}</td>
                      <td className="py-4 pr-4 text-sm text-slate-600">{inspection.photosCount}</td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/damage-reports/${inspection.id}`}>
                            <ClipboardCheck className="h-4 w-4" />
                            Voir
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
