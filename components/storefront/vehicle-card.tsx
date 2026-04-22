import type { ReactNode } from "react";
import { CarFront, Fuel, Gauge, Users } from "lucide-react";
import { BookingRequestDialog } from "@/components/storefront/booking-request-dialog";

interface VehicleCardProps {
  agencySlug: string;
  pickupLocations: string[];
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    category: string;
    photoUrl: string | null;
    seats: number;
    fuelType: string;
    gearbox: string;
    pricePerDay: number;
  };
}

export function VehicleCard({ agencySlug, pickupLocations, vehicle }: VehicleCardProps) {
  const dailyRate = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(vehicle.pricePerDay);
  const gearboxLabel = formatGearbox(vehicle.gearbox);
  const fuelLabel = formatFuelType(vehicle.fuelType);

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/75 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(15,23,42,0.1)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,#eef2f6_0%,#f8fafc_54%,#dfe7ef_100%)]">
        {vehicle.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.photoUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CarFront className="h-12 w-12 text-slate-400" />
          </div>
        )}

        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#1a365d] shadow-[0_8px_18px_rgba(15,23,42,0.08)] ring-1 ring-white/70 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Disponible
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold leading-tight tracking-[-0.035em] text-[#002045]">
              {vehicle.make} {vehicle.model}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-extrabold leading-none tracking-[-0.04em] text-[#002045]">{dailyRate} MAD</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Par jour</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-[12px] font-medium text-slate-600">
          <Spec icon={<Users className="h-3.5 w-3.5" />} label={`${vehicle.seats} places`} />
          <Spec icon={<Gauge className="h-3.5 w-3.5" />} label={gearboxLabel} />
          <Spec icon={<Fuel className="h-3.5 w-3.5" />} label={fuelLabel} />
        </div>

        <div className="mt-4">
          <BookingRequestDialog
            agencySlug={agencySlug}
            vehicle={vehicle}
            pickupLocations={pickupLocations}
            triggerClassName="w-full rounded-xl bg-[linear-gradient(135deg,#4f9cff_0%,#256fd3_100%)] py-3 text-sm font-bold text-white shadow-[0_14px_24px_rgba(37,111,211,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_28px_rgba(37,111,211,0.28)]"
          />
        </div>
      </div>
    </article>
  );
}

function Spec({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-[#1a365d]">{icon}</span>
      <p className="truncate">{label}</p>
    </div>
  );
}

function formatGearbox(value: string) {
  const labels: Record<string, string> = {
    MANUAL: "Manuelle",
    AUTOMATIC: "Automatique",
  };

  return labels[value] || toReadableLabel(value);
}

function formatFuelType(value: string) {
  const labels: Record<string, string> = {
    DIESEL: "Diesel",
    ESSENCE: "Essence",
    HYBRID: "Hybride",
    ELECTRIC: "Électrique",
  };

  return labels[value] || toReadableLabel(value);
}

function toReadableLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
