"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionChecklist } from "./section-checklist";
import { createInspection } from "@/lib/actions/damage-reports";
import {
  FUEL_LEVELS,
  CLEANLINESS_LEVELS,
  SECTION_LABELS,
  type InspectionFormData,
  type InspectionSectionData,
} from "@/lib/validations/damage-report";
import { formatCurrency } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Car,
  Disc3,
  Armchair,
  Gauge,
  Fuel,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BookingOption = {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  depositAmount: number;
  customer: { name: string };
  vehicle: { make: string; model: string; plate: string };
  deposit: { id: string; amount: number; status: string } | null;
};

interface InspectionFormProps {
  bookings: BookingOption[];
  preselectedBookingId?: string;
}

const SECTION_TYPES = ["CARROSSERIE", "PNEUS", "INTERIEUR", "KILOMETRAGE", "CARBURANT"] as const;

const SECTION_ICONS: Record<string, React.ReactNode> = {
  CARROSSERIE: <Car className="w-5 h-5" />,
  PNEUS: <Disc3 className="w-5 h-5" />,
  INTERIEUR: <Armchair className="w-5 h-5" />,
  KILOMETRAGE: <Gauge className="w-5 h-5" />,
  CARBURANT: <Fuel className="w-5 h-5" />,
};

const TOTAL_STEPS = 7; // Booking + 5 sections + Summary

export function InspectionForm({ bookings, preselectedBookingId }: InspectionFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [bookingId, setBookingId] = useState(preselectedBookingId || "");
  const [inspectionType, setInspectionType] = useState<"DEPART" | "RETOUR">("RETOUR");
  const [fuelLevel, setFuelLevel] = useState("");
  const [cleanliness, setCleanliness] = useState("");
  const [notes, setNotes] = useState("");
  const [depositAction, setDepositAction] = useState<"RELEASE" | "PARTIAL" | "HOLD">("RELEASE");
  const [deductFromDeposit, setDeductFromDeposit] = useState(false);
  const [deductedAmount, setDeductedAmount] = useState(0);

  // Section states
  const [sections, setSections] = useState<Record<string, InspectionSectionData>>(
    Object.fromEntries(
      SECTION_TYPES.map((type) => [
        type,
        { sectionType: type, status: "OK" as const, notes: "", damageCost: 0, photos: [] },
      ])
    )
  );

  const selectedBooking = bookings.find((b) => b.id === bookingId);

  const updateSection = (type: string, updates: Partial<InspectionSectionData>) => {
    setSections((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...updates },
    }));
  };

  const totalDamageCost = Object.values(sections).reduce(
    (sum, s) => sum + (s.status === "DAMAGE" ? (s.damageCost || 0) : 0),
    0
  );

  const hasDamage = Object.values(sections).some((s) => s.status === "DAMAGE");

  const canProceed = () => {
    if (currentStep === 0) return !!bookingId && !!inspectionType;
    if (currentStep >= 1 && currentStep <= 5) return true; // sections always have a default
    if (currentStep === 6) return !!fuelLevel && !!depositAction;
    return true;
  };

  const handleSubmit = async () => {
    if (!fuelLevel || !depositAction || !bookingId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data: InspectionFormData = {
        bookingId,
        inspectionType,
        fuelLevel,
        cleanliness: cleanliness || undefined,
        notes: notes || undefined,
        sections: SECTION_TYPES.map((type) => sections[type]),
        deductFromDeposit,
        deductedAmount: deductFromDeposit ? deductedAmount : 0,
        depositAction,
      };

      const result = await createInspection(data);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push(`/damage-reports/${result.id}`);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    // Step 0: Booking Selection
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Réservation</Label>
            <Select value={bookingId} onValueChange={setBookingId}>
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

          {selectedBooking && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Client</span>
                    <p className="font-medium">{selectedBooking.customer.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Véhicule</span>
                    <p className="font-medium">{selectedBooking.vehicle.make} {selectedBooking.vehicle.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plaque</span>
                    <p className="font-medium font-mono">{selectedBooking.vehicle.plate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Caution</span>
                    <p className="font-medium">{formatCurrency(selectedBooking.depositAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label>Type d&apos;inspection</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInspectionType("DEPART")}
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
                onClick={() => setInspectionType("RETOUR")}
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
        </div>
      );
    }

    // Steps 1-5: Section checklists
    if (currentStep >= 1 && currentStep <= 5) {
      const sectionType = SECTION_TYPES[currentStep - 1];
      const section = sections[sectionType];

      return (
        <SectionChecklist
          sectionType={sectionType}
          status={section.status as "OK" | "DAMAGE"}
          notes={section.notes || ""}
          damageCost={section.damageCost || 0}
          photos={section.photos || []}
          onStatusChange={(status) => updateSection(sectionType, { status })}
          onNotesChange={(notes) => updateSection(sectionType, { notes })}
          onDamageCostChange={(damageCost) => updateSection(sectionType, { damageCost })}
          onPhotosChange={(photos) => updateSection(sectionType, { photos })}
        />
      );
    }

    // Step 6: Summary & Deposit
    if (currentStep === 6) {
      return (
        <div className="space-y-6">
          {/* Sections Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Résumé des sections</h3>
            <div className="space-y-2">
              {SECTION_TYPES.map((type) => {
                const s = sections[type];
                return (
                  <div
                    key={type}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      s.status === "DAMAGE" ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={s.status === "DAMAGE" ? "text-red-600" : "text-emerald-600"}>
                        {SECTION_ICONS[type]}
                      </span>
                      <span className="font-medium text-sm">{SECTION_LABELS[type]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status === "DAMAGE" && s.damageCost > 0 && (
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(s.damageCost)}
                        </span>
                      )}
                      {s.status === "OK" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalDamageCost > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-red-100 border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-800">Coût total des dommages</span>
                  <span className="text-lg font-bold text-red-700">{formatCurrency(totalDamageCost)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Fuel & Cleanliness */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Niveau de carburant *</Label>
              <Select value={fuelLevel} onValueChange={setFuelLevel}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_LEVELS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Propreté</Label>
              <Select value={cleanliness} onValueChange={setCleanliness}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {CLEANLINESS_LEVELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes générales</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes supplémentaires sur l'inspection..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Deposit Action */}
          <div className="space-y-3">
            <Label>Action sur la caution</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "RELEASE" as const, label: "Libérer", color: "emerald" },
                { value: "PARTIAL" as const, label: "Partielle", color: "amber" },
                { value: "HOLD" as const, label: "Retenir", color: "red" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDepositAction(opt.value)}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-xl border-2 transition-all text-sm font-semibold min-h-[48px]",
                    depositAction === opt.value
                      ? opt.color === "emerald"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : opt.color === "amber"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deduct from deposit */}
          {hasDamage && selectedBooking?.deposit && (
            <div className="space-y-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="deductFromDeposit"
                  checked={deductFromDeposit}
                  onCheckedChange={(checked) => {
                    setDeductFromDeposit(!!checked);
                    if (!checked) setDeductedAmount(0);
                  }}
                />
                <Label htmlFor="deductFromDeposit" className="font-medium cursor-pointer">
                  Déduire de la caution ({formatCurrency(selectedBooking.deposit.amount)})
                </Label>
              </div>
              {deductFromDeposit && (
                <div className="space-y-2 pl-7">
                  <Label htmlFor="deductedAmount">Montant à déduire (MAD)</Label>
                  <Input
                    id="deductedAmount"
                    type="number"
                    min={0}
                    max={selectedBooking.deposit.amount}
                    step={50}
                    value={deductedAmount || ""}
                    onChange={(e) => setDeductedAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="h-12 text-lg"
                  />
                  {deductedAmount > selectedBooking.deposit.amount && (
                    <p className="text-xs text-red-500">
                      Le montant ne peut pas dépasser la caution ({formatCurrency(selectedBooking.deposit.amount)})
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const stepLabel = () => {
    if (currentStep === 0) return "Réservation";
    if (currentStep >= 1 && currentStep <= 5) return SECTION_LABELS[SECTION_TYPES[currentStep - 1]];
    if (currentStep === 6) return "Résumé & Caution";
    return "";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Nouvelle inspection
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              Étape {currentStep + 1} / {TOTAL_STEPS}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between mt-3 overflow-x-auto pb-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const isSection = i >= 1 && i <= 5;
              const sectionType = isSection ? SECTION_TYPES[i - 1] : null;
              const sectionStatus = sectionType ? sections[sectionType]?.status : null;
              const isCompleted = i < currentStep;
              const isCurrent = i === currentStep;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (i <= currentStep || canProceed()) setCurrentStep(i);
                  }}
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    isCurrent
                      ? "bg-primary text-white ring-2 ring-primary/30"
                      : isCompleted && isSection && sectionStatus === "DAMAGE"
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : isCompleted
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                  )}
                  title={
                    i === 0
                      ? "Réservation"
                      : i <= 5
                        ? SECTION_LABELS[SECTION_TYPES[i - 1]]
                        : "Résumé"
                  }
                >
                  {isCompleted && isSection && sectionStatus === "DAMAGE" ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-sm font-medium text-center text-muted-foreground mt-2">
            {stepLabel()}
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
              {error}
            </div>
          )}

          {renderStep()}
        </CardContent>
      </Card>

      {/* Sticky bottom navigation */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-4 mt-4 -mx-4 px-4 md:mx-0 md:px-0 md:border-t-0 md:bg-transparent md:relative">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((s) => s - 1)}
              className="flex-1 h-12"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>
          )}

          {currentStep < TOTAL_STEPS - 1 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex-1 h-12"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="flex-1 h-12"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Enregistrer l&apos;inspection
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
