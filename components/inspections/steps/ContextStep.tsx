"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, ChevronLeft, Fuel, Gauge, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { BookingOption, DepartureData } from "../types";

interface ContextStepProps {
  bookings: BookingOption[];
  bookingId: string;
  inspectionType: "DEPART" | "RETOUR";
  onBookingChange: (id: string) => void;
  onTypeChange: (type: "DEPART" | "RETOUR") => void;
  departureInspections?: Record<string, DepartureData>;
}

export function ContextStep({
  bookings,
  bookingId,
  inspectionType,
  onBookingChange,
  onTypeChange,
  departureInspections,
}: ContextStepProps) {
  const selectedBooking = bookings.find((b) => b.id === bookingId);
  const departureData = bookingId ? departureInspections?.[bookingId] : undefined;

  return (
    <div className="space-y-6">
      {/* Booking select */}
      <div className="space-y-2">
        <Label>Réservation</Label>
        <Select value={bookingId} onValueChange={onBookingChange}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Sélectionner une réservation..." />
          </SelectTrigger>
          <SelectContent>
            {bookings.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.customer.name} — {b.vehicle.make} {b.vehicle.model} ({b.vehicle.plate})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick summary */}
      {selectedBooking && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-4 pb-3 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Client</span>
                <p className="font-medium">{selectedBooking.customer.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Véhicule</span>
                <p className="font-medium">
                  {selectedBooking.vehicle.make} {selectedBooking.vehicle.model}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Plaque</span>
                <p className="font-medium font-mono">{selectedBooking.vehicle.plate}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Caution</span>
                <p className="font-medium">{formatCurrency(selectedBooking.depositAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspection type */}
      <div className="space-y-2">
        <Label>Type d&apos;inspection</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onTypeChange("DEPART")}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all min-h-[80px]",
              inspectionType === "DEPART"
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            )}
          >
            <ChevronRight className="w-6 h-6" />
            <span className="text-sm font-semibold">Départ</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeChange("RETOUR")}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all min-h-[80px]",
              inspectionType === "RETOUR"
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            )}
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-sm font-semibold">Retour</span>
          </button>
        </div>
      </div>

      {/* Departure reference card (only for RETOUR if data exists) */}
      {inspectionType === "RETOUR" && departureData && (
        <>
          <Separator />
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
                Référence — Inspection départ
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">KM départ</p>
                    <p className="font-medium">
                      {departureData.sections.find((s) => s.sectionType === "KILOMETRAGE")
                        ?.status === "OK"
                        ? "OK"
                        : "Dommage"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Carburant</p>
                    <p className="font-medium">{departureData.fuelLevel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dommages</p>
                    <p className="font-medium">
                      {departureData.sections.filter((s) => s.status === "DAMAGE").length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
