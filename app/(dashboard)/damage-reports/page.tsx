import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { PageHeader } from "@/components/shared/page-header";
import { getInspections } from "@/lib/actions/damage-reports";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/shared/pagination";

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { inspections, total, totalPages } = await getInspections(page, 20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspections"
        description={`${total} inspection${total !== 1 ? "s" : ""} enregistrée${total !== 1 ? "s" : ""}`}
        action={inspections.length > 0 ? { label: "Nouvelle inspection", href: "/damage-reports/new" } : undefined}
      />

      {inspections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-muted-foreground font-medium mb-2">Aucune inspection enregistrée.</p>
            <p className="text-sm text-muted-foreground/80 mb-6">
              Créez votre première inspection pour commencer le suivi.
            </p>
            <Button asChild>
              <Link href="/damage-reports/new">Nouvelle inspection</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="space-y-3 md:hidden">
            {inspections.map((inspection) => {
              const hasDamage = inspection.sections.some((s) => s.status === "DAMAGE");
              return (
                <Link
                  key={inspection.id}
                  href={`/damage-reports/${inspection.id}`}
                  className="block"
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              inspection.inspectionType === "DEPART"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {inspection.inspectionType === "DEPART" ? "Départ" : "Retour"}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              hasDamage ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {hasDamage ? (
                                <><AlertTriangle className="w-3 h-3" /> Dommages</>
                              ) : (
                                <><CheckCircle2 className="w-3 h-3" /> OK</>
                              )}
                            </span>
                          </div>
                          <p className="font-medium text-sm truncate">
                            {inspection.booking.customer.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {inspection.booking.vehicle.make} {inspection.booking.vehicle.model}{" "}
                            <span className="font-mono">{inspection.booking.vehicle.plate}</span>
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatDate(inspection.reportedAt)}</span>
                            {inspection.totalDamageCost > 0 && (
                              <span className="text-red-600 font-medium">
                                {formatCurrency(inspection.totalDamageCost)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Véhicule</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">État</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Coût</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Caution</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inspections.map((inspection) => {
                      const hasDamage = inspection.sections.some((s) => s.status === "DAMAGE");
                      const depositLabel = {
                        RELEASE: "Libérée",
                        PARTIAL: "Partielle",
                        HOLD: "Retenue",
                      }[inspection.depositAction];

                      return (
                        <tr key={inspection.id} className="hover:bg-muted/40 transition-colors duration-200">
                          <td className="p-3 text-sm">{formatDate(inspection.reportedAt)}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              inspection.inspectionType === "DEPART"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {inspection.inspectionType === "DEPART" ? "Départ" : "Retour"}
                            </span>
                          </td>
                          <td className="p-3 text-sm font-medium">{inspection.booking.customer.name}</td>
                          <td className="p-3 text-sm">
                            {inspection.booking.vehicle.make} {inspection.booking.vehicle.model}{" "}
                            <span className="font-mono text-xs text-muted-foreground">{inspection.booking.vehicle.plate}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              hasDamage ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {hasDamage ? (
                                <><AlertTriangle className="w-3 h-3" /> Dommages</>
                              ) : (
                                <><CheckCircle2 className="w-3 h-3" /> OK</>
                              )}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-right">
                            {inspection.totalDamageCost > 0 ? (
                              <span className="text-red-600 font-medium">{formatCurrency(inspection.totalDamageCost)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              inspection.depositAction === "RELEASE"
                                ? "bg-emerald-100 text-emerald-700"
                                : inspection.depositAction === "HOLD"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}>
                              {depositLabel}
                            </span>
                          </td>
                          <td className="p-3">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/damage-reports/${inspection.id}`}>
                                Voir
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/damage-reports"
            />
          )}
        </>
      )}
    </div>
  );
}
