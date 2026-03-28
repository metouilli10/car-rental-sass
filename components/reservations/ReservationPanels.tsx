import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateFR } from "@/lib/reservations/presentation";
import { MessageCircle } from "lucide-react";
import type { BookingStatus } from "@prisma/client";
import type { VehicleStatus } from "@prisma/client";

type CustomerPanel = {
  name: string;
  phone: string | null;
  email: string | null;
  passportOrCIN: string | null;
};
type VehiclePanel = {
  make: string;
  model: string;
  plate: string;
  color: string;
  status: VehicleStatus;
  currentKm: number | null;
  mileage: number | null;
  nextOilChangeDate: Date | string | null;
  nextMaintenanceKm: number | null;
};
type ReservationPanel = {
  status: BookingStatus;
  startDate: Date | string;
  endDate: Date | string;
  durationDays: number;
  pickupLocation: string | null;
  returnLocation: string | null;
  notes: string | null;
};

export interface ReservationPanelsProps {
  customer: CustomerPanel;
  vehicle: VehiclePanel;
  reservation: ReservationPanel;
  whatsappLink: string | null;
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function formatMaintenance(
  nextOilChangeDate: Date | string | null,
  nextMaintenanceKm: number | null
): string {
  if (nextOilChangeDate) {
    return formatDateFR(nextOilChangeDate);
  }
  if (nextMaintenanceKm != null) {
    return `${nextMaintenanceKm} km`;
  }
  return "—";
}

export function ReservationPanels({
  customer,
  vehicle,
  reservation,
  whatsappLink,
}: ReservationPanelsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
              aria-hidden
            >
              {getInitials(customer.name)}
            </div>
            <p className="font-medium">{customer.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Téléphone</p>
            {customer.phone ? (
              <a
                href={`tel:${customer.phone}`}
                className="font-medium text-primary hover:underline"
              >
                {customer.phone}
              </a>
            ) : (
              <p className="font-medium">Non renseigné</p>
            )}
          </div>
          {customer.email ? (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <a
                href={`mailto:${customer.email}`}
                className="font-medium text-primary hover:underline"
              >
                {customer.email}
              </a>
            </div>
          ) : null}
          {customer.passportOrCIN ? (
            <div>
              <p className="text-sm text-muted-foreground">CIN / Passeport</p>
              <p className="font-medium">{customer.passportOrCIN}</p>
            </div>
          ) : null}
          {whatsappLink ? (
            <Button asChild variant="outline" size="sm" className="w-full">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contacter sur WhatsApp"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Véhicule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Véhicule</p>
            <p className="font-medium">
              {vehicle.make} {vehicle.model}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plaque</p>
            <p className="font-medium">{vehicle.plate}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Couleur</p>
            <p className="font-medium">{vehicle.color}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Statut du véhicule</p>
            <StatusBadge status={vehicle.status} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kilométrage</p>
            <p className="font-medium">
              {vehicle.currentKm ?? vehicle.mileage ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Prochaine maintenance</p>
            <p className="font-medium">
              {formatMaintenance(
                vehicle.nextOilChangeDate,
                vehicle.nextMaintenanceKm
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Réservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Statut</p>
            <StatusBadge status={reservation.status} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dates</p>
            <p className="font-medium">
              {formatDateFR(reservation.startDate)} → {formatDateFR(reservation.endDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Durée</p>
            <p className="font-medium">{reservation.durationDays} jour(s)</p>
          </div>
          {reservation.pickupLocation || reservation.returnLocation ? (
            <>
              {reservation.pickupLocation ? (
                <div>
                  <p className="text-sm text-muted-foreground">Lieu départ</p>
                  <p className="font-medium">{reservation.pickupLocation}</p>
                </div>
              ) : null}
              {reservation.returnLocation ? (
                <div>
                  <p className="text-sm text-muted-foreground">Lieu retour</p>
                  <p className="font-medium">{reservation.returnLocation}</p>
                </div>
              ) : null}
            </>
          ) : null}
          {reservation.notes ? (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{reservation.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
