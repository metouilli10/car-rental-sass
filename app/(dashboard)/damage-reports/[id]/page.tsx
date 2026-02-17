import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { getInspection } from "@/lib/actions/damage-reports";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { SECTION_LABELS } from "@/lib/validations/damage-report";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Car,
  Disc3,
  Armchair,
  Gauge,
  Fuel,
  User,
  Calendar,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const SECTION_ICONS: Record<string, React.ReactNode> = {
  CARROSSERIE: <Car className="w-5 h-5" />,
  PNEUS: <Disc3 className="w-5 h-5" />,
  INTERIEUR: <Armchair className="w-5 h-5" />,
  KILOMETRAGE: <Gauge className="w-5 h-5" />,
  CARBURANT: <Fuel className="w-5 h-5" />,
};

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const inspection = await getInspection(id);

  if (!inspection) {
    notFound();
  }

  const hasDamage = inspection.sections.some((s) => s.status === "DAMAGE");
  const damagedSections = inspection.sections.filter((s) => s.status === "DAMAGE");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/damage-reports">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Inspection — ${inspection.inspectionType === "DEPART" ? "Départ" : "Retour"}`}
        description={`Réalisée le ${formatDate(inspection.reportedAt)}`}
      />

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Booking Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Réservation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">{inspection.booking.customer.name}</p>
            <p className="text-sm text-muted-foreground">
              {inspection.booking.vehicle.make} {inspection.booking.vehicle.model}
            </p>
            <p className="text-sm font-mono text-muted-foreground">
              {inspection.booking.vehicle.plate}
            </p>
            <Button asChild variant="outline" size="sm" className="w-full mt-2">
              <Link href={`/bookings/${inspection.booking.id}`}>
                Voir la réservation
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Inspection Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Détails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant={inspection.inspectionType === "DEPART" ? "info" : "secondary"}>
                {inspection.inspectionType === "DEPART" ? "Départ" : "Retour"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">État général</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                hasDamage ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
              }`}>
                {hasDamage ? (
                  <><AlertTriangle className="w-3 h-3" /> {damagedSections.length} dommage{damagedSections.length > 1 ? "s" : ""}</>
                ) : (
                  <><CheckCircle2 className="w-3 h-3" /> Aucun dommage</>
                )}
              </span>
            </div>
            {inspection.fuelLevel && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Carburant</span>
                <span className="text-sm font-medium">{inspection.fuelLevel}</span>
              </div>
            )}
            {inspection.cleanliness && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Propreté</span>
                <span className="text-sm font-medium">{inspection.cleanliness}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Finances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Coût des dommages</span>
              <span className={`text-sm font-semibold ${inspection.totalDamageCost > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {inspection.totalDamageCost > 0 ? formatCurrency(inspection.totalDamageCost) : "0.00 MAD"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Action caution</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                inspection.depositAction === "RELEASE"
                  ? "bg-emerald-100 text-emerald-700"
                  : inspection.depositAction === "HOLD"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
              }`}>
                {inspection.depositAction === "RELEASE"
                  ? "Libérée"
                  : inspection.depositAction === "HOLD"
                    ? "Retenue"
                    : "Partielle"}
              </span>
            </div>
            {inspection.deductFromDeposit && inspection.deductedAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Déduit de caution</span>
                <span className="text-sm font-semibold text-orange-600">
                  {formatCurrency(inspection.deductedAmount)}
                </span>
              </div>
            )}
            {inspection.booking.deposit && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Caution initiale</span>
                <span className="text-sm font-medium">
                  {formatCurrency(inspection.booking.deposit.amount)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {inspection.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes générales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{inspection.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Sections Detail */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Détail par section</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {inspection.sections.map((section) => {
            const isDamaged = section.status === "DAMAGE";
            const sectionPhotos = section.photos || [];

            return (
              <Card
                key={section.id}
                className={isDamaged ? "border-red-200" : "border-emerald-200"}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className={isDamaged ? "text-red-600" : "text-emerald-600"}>
                        {SECTION_ICONS[section.sectionType]}
                      </span>
                      {SECTION_LABELS[section.sectionType]}
                    </CardTitle>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isDamaged
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {isDamaged ? (
                        <><AlertTriangle className="w-3.5 h-3.5" /> Dommage</>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> OK</>
                      )}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isDamaged && section.damageCost > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                      <span className="text-sm text-red-700">Coût estimé</span>
                      <span className="font-semibold text-red-700">{formatCurrency(section.damageCost)}</span>
                    </div>
                  )}

                  {section.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-gray-700">{section.notes}</p>
                    </div>
                  )}

                  {sectionPhotos.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Photos ({sectionPhotos.length})
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {sectionPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border"
                          >
                            <Image
                              src={photo.photoUrl}
                              alt={photo.description || "Photo de dommage"}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isDamaged && !section.notes && sectionPhotos.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucun problème détecté.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
