"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  FileText,
  Car,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createInspection } from "@/lib/actions/damage-reports";
import type {
  InspectionFormData,
  InspectionSectionData,
} from "@/lib/validations/damage-report";
import { ContextStep } from "./steps/ContextStep";
import { VehicleConditionStep } from "./steps/VehicleConditionStep";
import { ReadingsStep } from "./steps/ReadingsStep";
import { SummaryDepositStep } from "./steps/SummaryDepositStep";
import type { BookingOption, DepartureData } from "./types";
import { SECTION_TYPES } from "./types";

const TOTAL_STEPS = 4;

const STEPS = [
  { label: "Contexte", icon: FileText },
  { label: "Véhicule", icon: Car },
  { label: "Relevés", icon: Gauge },
  { label: "Résumé", icon: ClipboardCheck },
] as const;

interface InspectionWizardV2Props {
  bookings: BookingOption[];
  preselectedBookingId?: string;
  departureInspections?: Record<string, DepartureData>;
}

export function InspectionWizardV2({
  bookings,
  preselectedBookingId,
  departureInspections,
}: InspectionWizardV2Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state — identical to original InspectionForm
  const [bookingId, setBookingId] = useState(preselectedBookingId || "");
  const [inspectionType, setInspectionType] = useState<"DEPART" | "RETOUR">("RETOUR");
  const [fuelLevel, setFuelLevel] = useState("");
  const [cleanliness, setCleanliness] = useState("");
  const [notes, setNotes] = useState("");
  const [depositAction, setDepositAction] = useState<"RELEASE" | "PARTIAL" | "HOLD">(
    "RELEASE"
  );
  const [deductFromDeposit, setDeductFromDeposit] = useState(false);
  const [deductedAmount, setDeductedAmount] = useState(0);
  const [mileage, setMileage] = useState("");

  const [sections, setSections] = useState<Record<string, InspectionSectionData>>(
    Object.fromEntries(
      SECTION_TYPES.map((type) => [
        type,
        {
          sectionType: type,
          status: "OK" as const,
          notes: "",
          damageCost: 0,
          photos: [],
        },
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

  const canProceed = () => {
    if (currentStep === 0) return !!bookingId && !!inspectionType;
    if (currentStep === 1) return true;
    if (currentStep === 2) return !!fuelLevel && !!mileage && Number(mileage) > 0;
    if (currentStep === 3) {
      // Deposit action only required for RETOUR; DEPART always proceeds
      return inspectionType === "DEPART" || !!depositAction;
    }
    return true;
  };

  // Payload construction and submission
  const handleSubmit = async () => {
    if (!fuelLevel || !bookingId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Build sections array — KILOMETRAGE and CARBURANT are always "OK"
      // (their damage toggles are removed from UI; backend still expects 5 sections)
      const builtSections = SECTION_TYPES.map((type) => {
        if (type === "KILOMETRAGE" || type === "CARBURANT") {
          return { ...sections[type], status: "OK" as const, damageCost: 0, notes: "", photos: [] };
        }
        return sections[type];
      });

      const data: InspectionFormData = {
        bookingId,
        inspectionType,
        fuelLevel,
        cleanliness: cleanliness || undefined,
        notes: notes || undefined,
        sections: builtSections,
        deductFromDeposit: inspectionType === "RETOUR" ? deductFromDeposit : false,
        deductedAmount: inspectionType === "RETOUR" && deductFromDeposit ? deductedAmount : 0,
        depositAction: inspectionType === "RETOUR" ? depositAction : "RELEASE",
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
    switch (currentStep) {
      case 0:
        return (
          <ContextStep
            bookings={bookings}
            bookingId={bookingId}
            inspectionType={inspectionType}
            onBookingChange={setBookingId}
            onTypeChange={setInspectionType}
            departureInspections={departureInspections}
          />
        );
      case 1:
        return (
          <VehicleConditionStep
            sections={sections}
            onUpdateSection={updateSection}
          />
        );
      case 2:
        return (
          <ReadingsStep
            fuelLevel={fuelLevel}
            cleanliness={cleanliness}
            mileage={mileage}
            onFuelLevelChange={setFuelLevel}
            onCleanlinessChange={setCleanliness}
            onMileageChange={setMileage}
          />
        );
      case 3:
        return (
          <SummaryDepositStep
            sections={sections}
            inspectionType={inspectionType}
            notes={notes}
            depositAction={depositAction}
            deductFromDeposit={deductFromDeposit}
            deductedAmount={deductedAmount}
            depositAmount={selectedBooking?.deposit?.amount ?? null}
            fuelLevel={fuelLevel}
            cleanliness={cleanliness}
            mileage={mileage}
            onNotesChange={setNotes}
            onDepositActionChange={setDepositAction}
            onDeductFromDepositChange={setDeductFromDeposit}
            onDeductedAmountChange={setDeductedAmount}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="pb-4">
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
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((step, i) => {
              const isCompleted = i < currentStep;
              const isCurrent = i === currentStep;
              const Icon = step.icon;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (i <= currentStep || canProceed()) setCurrentStep(i);
                  }}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                      isCurrent
                        ? "bg-primary text-white ring-2 ring-primary/30"
                        : isCompleted
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium transition-colors",
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                          ? "text-emerald-700"
                          : "text-gray-400"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
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
