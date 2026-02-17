"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CarFront } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import type { BookingVehicleOption } from "@/components/bookings/types";

interface VehicleSelectProps {
  vehicles: BookingVehicleOption[];
  value?: string;
  onChange: (value: string) => void;
  availabilityConflict: boolean;
  error?: string;
}

export function VehicleSelect({
  vehicles,
  value,
  onChange,
  availabilityConflict,
  error,
}: VehicleSelectProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return vehicles;
    return vehicles.filter((vehicle) =>
      `${vehicle.make} ${vehicle.model} ${vehicle.plate} ${vehicle.category}`
        .toLowerCase()
        .includes(term),
    );
  }, [vehicles, query]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === value);

  return (
    <div className="space-y-3">
      <Label htmlFor="vehicle-search">Véhicule *</Label>
      <Input
        id="vehicle-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher par modèle, plaque, catégorie..."
      />

      <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-border/70 p-2">
        {filtered.length > 0 ? (
          filtered.map((vehicle) => {
            const isAvailable = vehicle.status === "AVAILABLE";
            const isSelected = vehicle.id === value;
            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => onChange(vehicle.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  isSelected
                    ? "border-blue-300 bg-blue-50"
                    : "border-transparent hover:border-border/70 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.plate} • {vehicle.category}
                    </p>
                  </div>
                  <Badge variant={isAvailable ? "success" : "warning"}>
                    {isAvailable ? "Disponible" : vehicle.status}
                  </Badge>
                </div>
              </button>
            );
          })
        ) : (
          <p className="p-3 text-sm text-muted-foreground">Aucun véhicule trouvé.</p>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {selectedVehicle ? (
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-2">
            <CarFront className="h-4 w-4 text-blue-600" />
            <p className="font-medium">
              {selectedVehicle.make} {selectedVehicle.model}
            </p>
          </div>
          <p className="text-muted-foreground">
            Plaque {selectedVehicle.plate} • {selectedVehicle.category}
          </p>
          <p className="text-muted-foreground">
            Tarif {formatCurrency(selectedVehicle.pricePerDay)} / jour
          </p>
        </div>
      ) : null}

      {availabilityConflict ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>Conflit de disponibilité détecté pour ce véhicule sur la période sélectionnée.</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
