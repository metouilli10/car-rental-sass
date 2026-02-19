"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookingFormData } from "@/lib/validations/booking";
import { formatCurrency } from "@/lib/utils";
import { saveBookingDraftPlaceholder } from "@/lib/actions/bookings";
import { WizardStepper } from "@/components/bookings/wizard-stepper";
import { SummaryCard } from "@/components/bookings/summary-card";
import { MobileSummarySheet } from "@/components/bookings/mobile-summary-sheet";
import { NewClientWizardModal } from "@/components/bookings/new-client-wizard-modal";
import type { ActiveBookingSlot, BookingCustomerOption, BookingVehicleOption } from "@/components/bookings/types";

interface ReservationWizardPageProps {
  customers: BookingCustomerOption[];
  vehicles: BookingVehicleOption[];
  locationOptions: string[];
  activeBookings: ActiveBookingSlot[];
  prefilledVehicleId?: string;
  prefilledCustomerId?: string;
  onSubmit: (
    data: BookingFormData,
  ) => Promise<{ error: string } | { success: boolean; bookingId: string } | void>;
}

interface DraftAddon {
  id: string;
  name: string;
  qty: number;
  price: number;
}

interface ReservationDraft {
  step: 1 | 2 | 3 | 4;
  startAt: string;
  endAt: string;
  pickupLocation: string;
  returnLocation: string;
  vehicleId: string;
  clientId: string;
  pricePerDay: number;
  deposit: number;
  addons: DraftAddon[];
  discountType: "none" | "fixed" | "percent";
  discountValue: number;
  vatEnabled: boolean;
  vatRate: number;
  paymentMethod: BookingFormData["paymentType"];
  status: "CONFIRMED" | "DRAFT";
  paidAmount: number;
  notes: string;
}

type StepErrors = Partial<Record<string, string>>;

const DRAFT_KEY = "locapro-reservation-wizard-draft-v1";

const INITIAL_DRAFT: ReservationDraft = {
  step: 1,
  startAt: "",
  endAt: "",
  pickupLocation: "",
  returnLocation: "",
  vehicleId: "",
  clientId: "",
  pricePerDay: 0,
  deposit: 2000,
  addons: [],
  discountType: "none",
  discountValue: 0,
  vatEnabled: false,
  vatRate: 20,
  paymentMethod: "CASH",
  status: "CONFIRMED",
  paidAmount: 0,
  notes: "",
};

export function ReservationWizardPage({
  customers: initialCustomers,
  vehicles,
  locationOptions,
  activeBookings,
  prefilledVehicleId,
  prefilledCustomerId,
  onSubmit,
}: ReservationWizardPageProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<ReservationDraft>(INITIAL_DRAFT);
  const [errors, setErrors] = useState<StepErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [customers, setCustomers] = useState(initialCustomers);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === draft.vehicleId),
    [vehicles, draft.vehicleId],
  );
  const selectedClient = useMemo(
    () => customers.find((client) => client.id === draft.clientId),
    [customers, draft.clientId],
  );

  const recentClients = useMemo(
    () =>
      [...customers]
        .sort((a, b) => {
          const aTime = a.lastBookingAt ? new Date(a.lastBookingAt).getTime() : 0;
          const bTime = b.lastBookingAt ? new Date(b.lastBookingAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 6),
    [customers],
  );

  const vehicleAvailability = useMemo(() => {
    const start = draft.startAt ? new Date(draft.startAt) : null;
    const end = draft.endAt ? new Date(draft.endAt) : null;
    const hasValidRange = !!start && !!end && end > start;

    return vehicles.map((vehicle) => {
      let tone: "green" | "red" | "yellow" = "green";
      let label = "Disponible";

      if (vehicle.status === "MAINTENANCE" || vehicle.status === "UNAVAILABLE") {
        tone = "yellow";
        label = "En maintenance";
      } else if (vehicle.status === "RENTED") {
        tone = "red";
        label = "Loué";
      }

      if (hasValidRange) {
        const overlap = activeBookings.some((booking) => {
          if (booking.vehicleId !== vehicle.id) return false;
          const bookingStart = new Date(booking.startDate);
          const bookingEnd = new Date(booking.endDate);
          return start < bookingEnd && end > bookingStart;
        });
        if (overlap) {
          tone = "red";
          label = "Loué sur ces dates";
        }
      }

      return {
        vehicle,
        tone,
        label,
        selectable: tone === "green",
      };
    });
  }, [activeBookings, draft.endAt, draft.startAt, vehicles]);

  const selectedVehicleAvailability = useMemo(
    () => vehicleAvailability.find((entry) => entry.vehicle.id === draft.vehicleId),
    [draft.vehicleId, vehicleAvailability],
  );
  const vehicleConflictByStatus = selectedVehicleAvailability
    ? !selectedVehicleAvailability.selectable
    : false;
  const vehicleOverlapConflict = selectedVehicleAvailability
    ? selectedVehicleAvailability.label === "Loué sur ces dates"
    : false;

  const derived = useMemo(() => {
    const start = draft.startAt ? new Date(draft.startAt) : null;
    const end = draft.endAt ? new Date(draft.endAt) : null;
    const hasDates = !!start && !!end && end > start;
    const durationHoursFloat = hasDates ? (end.getTime() - start.getTime()) / (1000 * 60 * 60) : 0;
    const durationDays = hasDates ? Math.max(1, Math.ceil(durationHoursFloat / 24)) : 0;
    const durationHours = hasDates ? Math.max(0, Math.round(durationHoursFloat % 24)) : 0;
    const durationLabel = hasDates ? `${durationDays} j${durationHours ? ` et ${durationHours} h` : ""}` : "--";

    const baseTotal = durationDays * Number(draft.pricePerDay || 0);
    const addonsTotal = draft.addons.reduce((sum, addon) => sum + addon.qty * addon.price, 0);
    const subTotal = baseTotal + addonsTotal;
    const discountTotal =
      draft.discountType === "percent"
        ? subTotal * Math.min(Number(draft.discountValue || 0), 100) / 100
        : draft.discountType === "fixed"
          ? Number(draft.discountValue || 0)
          : 0;
    const totalHT = Math.max(0, subTotal - discountTotal);
    const vatTotal = draft.vatEnabled ? totalHT * Number(draft.vatRate || 0) / 100 : 0;
    const totalTTC = totalHT + vatTotal;
    const remaining = Math.max(0, totalTTC - Number(draft.paidAmount || 0));

    return {
      durationDays,
      durationHours,
      durationLabel,
      baseTotal,
      addonsTotal,
      discountTotal,
      totalHT,
      vatTotal,
      totalTTC,
      remaining,
    };
  }, [draft]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<ReservationDraft>;
      setDraft((prev) => ({
        ...prev,
        ...parsed,
        step: (parsed.step as 1 | 2 | 3 | 4) || 1,
        addons: Array.isArray(parsed.addons) && parsed.addons.length > 0 ? parsed.addons : prev.addons,
      }));
    } catch {
      // ignore corrupted draft
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      void saveBookingDraftPlaceholder({
        step: draft.step,
        vehicleId: draft.vehicleId,
        clientId: draft.clientId,
        total: derived.totalTTC,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, derived.totalTTC]);

  useEffect(() => {
    if (!selectedVehicle) return;
    setDraft((prev) => ({
      ...prev,
      pricePerDay: prev.pricePerDay > 0 ? prev.pricePerDay : selectedVehicle.pricePerDay,
      deposit: prev.deposit > 0 ? prev.deposit : selectedVehicle.depositAmount,
    }));
  }, [selectedVehicle]);

  useEffect(() => {
    if (!prefilledVehicleId) return;
    const prefilledVehicle = vehicles.find((vehicle) => vehicle.id === prefilledVehicleId);
    if (!prefilledVehicle) return;

    setDraft((prev) => {
      if (prev.vehicleId) {
        return prev;
      }

      return {
        ...prev,
        vehicleId: prefilledVehicle.id,
        pricePerDay: prefilledVehicle.pricePerDay,
        deposit: prefilledVehicle.depositAmount,
      };
    });
  }, [prefilledVehicleId, vehicles]);

  useEffect(() => {
    if (!prefilledCustomerId) return;
    const customerExists = customers.some((customer) => customer.id === prefilledCustomerId);
    if (!customerExists) return;

    setDraft((prev) => {
      if (prev.clientId) {
        return prev;
      }
      return {
        ...prev,
        clientId: prefilledCustomerId,
      };
    });
  }, [customers, prefilledCustomerId]);

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (vehicleConflictByStatus || vehicleOverlapConflict) list.push("Conflit véhicule");
    if (selectedClient?.unpaidCount && selectedClient.unpaidCount > 0) list.push("Risque: impayé");
    return list;
  }, [selectedClient, vehicleConflictByStatus, vehicleOverlapConflict]);

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    if (!term) return recentClients;
    return customers.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(term));
  }, [clientSearch, customers, recentClients]);

  const steps = useMemo(() => {
    return [
      { id: 1 as const, title: "Détails location", isComplete: validateStep(1, draft, { vehicleConflictByStatus, vehicleOverlapConflict }).ok, isActive: draft.step === 1 },
      { id: 2 as const, title: "Client", isComplete: validateStep(2, draft, { vehicleConflictByStatus, vehicleOverlapConflict }).ok, isActive: draft.step === 2 },
      { id: 3 as const, title: "Add-ons & Tarification", isComplete: validateStep(3, draft, { vehicleConflictByStatus, vehicleOverlapConflict }).ok, isActive: draft.step === 3 },
      { id: 4 as const, title: "Paiement & Validation", isComplete: validateStep(4, draft, { vehicleConflictByStatus, vehicleOverlapConflict }).ok, isActive: draft.step === 4 },
    ];
  }, [draft, vehicleConflictByStatus, vehicleOverlapConflict]);

  const handleQuickDuration = (days: number) => {
    if (!draft.startAt) return;
    const start = new Date(draft.startAt);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    const endValue = toDatetimeLocal(end);
    setDraft((prev) => ({ ...prev, endAt: endValue }));
  };

  const onNext = () => {
    const validation = validateStep(draft.step, draft, { vehicleConflictByStatus, vehicleOverlapConflict });
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setDraft((prev) => ({ ...prev, step: (Math.min(4, prev.step + 1) as 1 | 2 | 3 | 4) }));
  };

  const onBack = () => {
    setErrors({});
    setDraft((prev) => ({ ...prev, step: (Math.max(1, prev.step - 1) as 1 | 2 | 3 | 4) }));
  };

  const jumpToStep = (step: 1 | 2 | 3 | 4) => {
    if (step <= draft.step) {
      setDraft((prev) => ({ ...prev, step }));
      return;
    }
    const validation = validateStep(draft.step, draft, { vehicleConflictByStatus, vehicleOverlapConflict });
    if (validation.ok) {
      setErrors({});
      setDraft((prev) => ({ ...prev, step }));
    } else {
      setErrors(validation.errors);
    }
  };

  const handleSaveDraft = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
    toast.success("Brouillon enregistré");
  };

  const canCreate = useMemo(() => {
    return [1, 2, 3, 4].every((step) =>
      validateStep(step as 1 | 2 | 3 | 4, draft, { vehicleConflictByStatus, vehicleOverlapConflict }).ok,
    );
  }, [draft, vehicleConflictByStatus, vehicleOverlapConflict]);

  const handleCreate = async () => {
    const allOk = validateStep(1, draft, { vehicleConflictByStatus, vehicleOverlapConflict }).ok &&
      validateStep(2, draft, { vehicleConflictByStatus, vehicleOverlapConflict }).ok &&
      validateStep(3, draft, { vehicleConflictByStatus, vehicleOverlapConflict }).ok &&
      validateStep(4, draft, { vehicleConflictByStatus, vehicleOverlapConflict }).ok;
    if (!allOk) {
      setFormError("Veuillez compléter correctement toutes les étapes.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    const payload: BookingFormData = {
      customerId: draft.clientId,
      vehicleId: draft.vehicleId,
      startDate: draft.startAt,
      endDate: draft.endAt,
      pickupLocation: draft.pickupLocation || undefined,
      returnLocation: draft.returnLocation || undefined,
      pricePerDay: Number(draft.pricePerDay || 0),
      pricingDays: derived.durationDays,
      pricingHours: derived.durationHours,
      addonsTotal: derived.addonsTotal,
      discountType: draft.discountType === "none" ? null : draft.discountType === "percent" ? "PERCENTAGE" : "FIXED",
      discountValue: Number(draft.discountValue || 0),
      discountAmount: derived.discountTotal,
      taxEnabled: draft.vatEnabled,
      taxRate: Number(draft.vatRate || 0),
      totalHt: derived.totalHT,
      totalTva: derived.vatTotal,
      totalTtc: derived.totalTTC,
      totalPrice: derived.totalTTC,
      paidNow: Number(draft.paidAmount || 0),
      remainingAmount: derived.remaining,
      depositAmount: Number(draft.deposit || 0),
      paymentType: draft.paymentMethod,
      status: draft.status,
      addons: draft.addons.map((addon) => ({
        label: addon.name,
        quantity: addon.qty,
        unitAmount: addon.price,
        isDefault: false,
      })),
      notes: draft.notes || undefined,
    };

    try {
      const result = await onSubmit(payload);
      if (result && "error" in result) {
        setFormError(result.error);
        return;
      }
      toast.success("Réservation créée avec succès");
      if (typeof window !== "undefined") window.localStorage.removeItem(DRAFT_KEY);
      if (result && "bookingId" in result) {
        router.push(`/bookings/${result.bookingId}`);
      } else {
        router.push("/bookings");
      }
    } catch {
      setFormError("Une erreur est survenue pendant la création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <WizardStepper steps={steps} currentStep={draft.step} onStepClick={jumpToStep} />

      {formError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">
                {draft.step === 1 && "1) Détails location"}
                {draft.step === 2 && "2) Client"}
                {draft.step === 3 && "3) Add-ons & Tarification"}
                {draft.step === 4 && "4) Paiement & Validation"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {draft.step === 1 && "Renseignez la période et choisissez le véhicule."}
                {draft.step === 2 && "Sélectionnez le client et vérifiez son historique."}
                {draft.step === 3 && "Ajustez le tarif de façon opérationnelle."}
                {draft.step === 4 && "Confirmez le paiement et créez la réservation."}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {draft.step === 1 ? (
                <StepLocation
                  draft={draft}
                  locationOptions={locationOptions}
                  vehicleAvailability={vehicleAvailability}
                  selectedVehicle={selectedVehicle}
                  onChange={setDraft}
                  onQuickDuration={handleQuickDuration}
                  durationLabel={derived.durationLabel}
                  vehicleConflictByStatus={vehicleConflictByStatus}
                  vehicleOverlapConflict={vehicleOverlapConflict}
                  errors={errors}
                />
              ) : null}

              {draft.step === 2 ? (
                <StepClient
                  draft={draft}
                  clients={filteredClients}
                  onSearch={setClientSearch}
                  searchValue={clientSearch}
                  onChange={setDraft}
                  onOpenNewClient={() => setNewClientOpen(true)}
                  errors={errors}
                />
              ) : null}

              {draft.step === 3 ? (
                <StepPricing
                  draft={draft}
                  derived={derived}
                  onChange={setDraft}
                  errors={errors}
                />
              ) : null}

              {draft.step === 4 ? (
                <StepPayment
                  draft={draft}
                  derived={derived}
                  onChange={setDraft}
                  errors={errors}
                />
              ) : null}

              <div className="hidden items-center justify-between border-t pt-4 md:flex">
                <Button type="button" variant="outline" onClick={onBack} disabled={draft.step === 1}>
                  Retour
                </Button>

                {draft.step < 4 ? (
                  <Button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={onNext}
                  >
                    Suivant
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={handleSaveDraft}>
                      Enregistrer brouillon
                    </Button>
                    <Button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleCreate}
                      disabled={!canCreate || isSubmitting}
                    >
                      {isSubmitting ? "Création..." : "Créer la réservation"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 -mx-6 border-t bg-background/95 px-6 py-3 backdrop-blur md:hidden">
                <div className="flex items-center justify-between gap-2">
                  <Button type="button" variant="outline" onClick={onBack} disabled={draft.step === 1} className="min-h-11 flex-1">
                    Retour
                  </Button>
                  {draft.step < 4 ? (
                    <Button type="button" onClick={onNext} className="min-h-11 flex-1 bg-blue-600 hover:bg-blue-700">
                      Suivant
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleCreate}
                      disabled={!canCreate || isSubmitting}
                      className="min-h-11 flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? "Création..." : "Créer"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-20">
            <SummaryCard
              vehicle={selectedVehicle}
              client={selectedClient}
              durationLabel={derived.durationLabel}
              startAt={draft.startAt}
              endAt={draft.endAt}
              baseTotal={derived.baseTotal}
              addonsTotal={derived.addonsTotal}
              discountTotal={derived.discountTotal}
              vatTotal={derived.vatTotal}
              totalTTC={derived.totalTTC}
              paid={draft.paidAmount}
              remaining={derived.remaining}
              warnings={warnings}
            />
          </div>
        </div>
      </div>

      <MobileSummarySheet
        vehicle={selectedVehicle}
        client={selectedClient}
        durationLabel={derived.durationLabel}
        startAt={draft.startAt}
        endAt={draft.endAt}
        baseTotal={derived.baseTotal}
        addonsTotal={derived.addonsTotal}
        discountTotal={derived.discountTotal}
        vatTotal={derived.vatTotal}
        totalTTC={derived.totalTTC}
        paid={draft.paidAmount}
        remaining={derived.remaining}
        warnings={warnings}
      />

      <NewClientWizardModal
        open={newClientOpen}
        onOpenChange={setNewClientOpen}
        onClientCreated={(client) => {
          setCustomers((prev) => [...prev, client]);
          setDraft((prev) => ({ ...prev, clientId: client.id }));
        }}
      />
    </div>
  );
}

function StepLocation({
  draft,
  locationOptions,
  vehicleAvailability,
  selectedVehicle,
  onChange,
  onQuickDuration,
  durationLabel,
  vehicleConflictByStatus,
  vehicleOverlapConflict,
  errors,
}: {
  draft: ReservationDraft;
  locationOptions: string[];
  vehicleAvailability: Array<{
    vehicle: BookingVehicleOption;
    tone: "green" | "red" | "yellow";
    label: string;
    selectable: boolean;
  }>;
  selectedVehicle?: BookingVehicleOption;
  onChange: React.Dispatch<React.SetStateAction<ReservationDraft>>;
  onQuickDuration: (days: number) => void;
  durationLabel: string;
  vehicleConflictByStatus: boolean;
  vehicleOverlapConflict: boolean;
  errors: StepErrors;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldError label="Date/Heure de départ *" error={errors.startAt}>
          <Input
            type="datetime-local"
            value={draft.startAt}
            onChange={(event) => onChange((prev) => ({ ...prev, startAt: event.target.value }))}
          />
        </FieldError>
        <FieldError label="Date/Heure de retour *" error={errors.endAt}>
          <Input
            type="datetime-local"
            value={draft.endAt}
            onChange={(event) => onChange((prev) => ({ ...prev, endAt: event.target.value }))}
          />
        </FieldError>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Durée rapide:</span>
        {[1, 3, 7].map((day) => (
          <Button key={day} type="button" variant="outline" size="sm" onClick={() => onQuickDuration(day)}>
            {day}j
          </Button>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
          <Clock3 className="h-4 w-4" />
          {durationLabel}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Lieu départ</Label>
          <Select
            value={draft.pickupLocation || ""}
            onValueChange={(value) => onChange((prev) => ({ ...prev, pickupLocation: value }))}
          >
            <SelectTrigger className="min-h-11">
              <SelectValue placeholder="Sélectionner un lieu" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map((location) => (
                <SelectItem key={`pickup-${location}`} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Lieu retour</Label>
          <Select
            value={draft.returnLocation || ""}
            onValueChange={(value) => onChange((prev) => ({ ...prev, returnLocation: value }))}
          >
            <SelectTrigger className="min-h-11">
              <SelectValue placeholder="Sélectionner un lieu" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map((location) => (
                <SelectItem key={`return-${location}`} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FieldError label="Véhicule *" error={errors.vehicleId}>
        <Select
          value={draft.vehicleId}
          onValueChange={(value) => onChange((prev) => ({ ...prev, vehicleId: value }))}
        >
          <SelectTrigger className="min-h-11 rounded-xl border-border/70">
            <SelectValue placeholder="Sélectionner un véhicule" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {vehicleAvailability.map(({ vehicle, tone, label }) => (
              <SelectItem
                key={vehicle.id}
                value={vehicle.id}
                className="py-2"
              >
                <div className="flex min-w-[260px] items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {vehicle.plate} • {vehicle.category}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      tone === "green"
                        ? "bg-emerald-100 text-emerald-700"
                        : tone === "red"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldError>

      {selectedVehicle ? (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
          {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.plate}) • {formatCurrency(selectedVehicle.pricePerDay)}/jour
        </div>
      ) : null}

      {vehicleConflictByStatus ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Véhicule en état {selectedVehicle?.status}. Veuillez choisir un autre véhicule.
          </p>
        </div>
      ) : null}

      {vehicleOverlapConflict ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Un chevauchement de réservation a été détecté pour cette période.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StepClient({
  draft,
  clients,
  searchValue,
  onSearch,
  onChange,
  onOpenNewClient,
  errors,
}: {
  draft: ReservationDraft;
  clients: BookingCustomerOption[];
  searchValue: string;
  onSearch: (value: string) => void;
  onChange: React.Dispatch<React.SetStateAction<ReservationDraft>>;
  onOpenNewClient: () => void;
  errors: StepErrors;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Client *</Label>
        <Button type="button" variant="outline" size="sm" onClick={onOpenNewClient}>
          + Nouveau client
        </Button>
      </div>
      <Input
        placeholder="Rechercher nom/téléphone..."
        value={searchValue}
        onChange={(event) => onSearch(event.target.value)}
      />
      {errors.clientId ? <p className="text-sm text-red-600">{errors.clientId}</p> : null}

      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border/70 p-2">
        {clients.map((client) => (
          <button
            key={client.id}
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, clientId: client.id }))}
            className={`w-full rounded-lg border p-3 text-left transition ${
              draft.clientId === client.id
                ? "border-blue-300 bg-blue-50"
                : "border-transparent hover:border-border/70 hover:bg-muted/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="text-xs text-muted-foreground">{client.phone}</p>
              </div>
              <div className="flex gap-1">
                {client.unpaidCount > 0 ? <Badge variant="warning">Impayé</Badge> : null}
                {client.isVip ? <Badge variant="info">VIP</Badge> : null}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPricing({
  draft,
  derived,
  onChange,
  errors,
}: {
  draft: ReservationDraft;
  derived: {
    durationDays: number;
    baseTotal: number;
    addonsTotal: number;
    discountTotal: number;
    vatTotal: number;
    totalTTC: number;
  };
  onChange: React.Dispatch<React.SetStateAction<ReservationDraft>>;
  errors: StepErrors;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldError label="Prix/jour (MAD) *" error={errors.pricePerDay}>
          <Input
            type="number"
            min={0}
            value={draft.pricePerDay}
            onChange={(event) => onChange((prev) => ({ ...prev, pricePerDay: Number(event.target.value) || 0 }))}
          />
        </FieldError>
        <FieldError label="Caution (MAD) *" error={errors.deposit}>
          <Input
            type="number"
            min={0}
            value={draft.deposit}
            onChange={(event) => onChange((prev) => ({ ...prev, deposit: Number(event.target.value) || 0 }))}
          />
        </FieldError>
      </div>

      <div className="rounded-xl border border-border/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-semibold">Add-ons</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange((prev) => ({
                ...prev,
                addons: [...prev.addons, { id: cryptoRandomId(), name: "", qty: 1, price: 0 }],
              }))
            }
          >
            Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {draft.addons.map((addon) => (
            <div key={addon.id} className="grid gap-2 sm:grid-cols-12">
              <Input
                className="sm:col-span-5"
                placeholder="Nom add-on"
                value={addon.name}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    addons: prev.addons.map((a) => (a.id === addon.id ? { ...a, name: event.target.value } : a)),
                  }))
                }
              />
              <Input
                className="sm:col-span-2"
                type="number"
                min={1}
                value={addon.qty}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    addons: prev.addons.map((a) => (a.id === addon.id ? { ...a, qty: Number(event.target.value) || 1 } : a)),
                  }))
                }
              />
              <Input
                className="sm:col-span-3"
                type="number"
                min={0}
                value={addon.price}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    addons: prev.addons.map((a) => (a.id === addon.id ? { ...a, price: Number(event.target.value) || 0 } : a)),
                  }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                className="sm:col-span-2"
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    addons: prev.addons.filter((a) => a.id !== addon.id),
                  }))
                }
              >
                Retirer
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Remise</Label>
          <Select
            value={draft.discountType}
            onValueChange={(value) => onChange((prev) => ({ ...prev, discountType: value as ReservationDraft["discountType"] }))}
          >
            <SelectTrigger className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              <SelectItem value="fixed">Fixe (MAD)</SelectItem>
              <SelectItem value="percent">Pourcentage (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valeur remise</Label>
          <Input
            type="number"
            min={0}
            value={draft.discountValue}
            onChange={(event) => onChange((prev) => ({ ...prev, discountValue: Number(event.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>TVA</Label>
          <Button
            type="button"
            variant={draft.vatEnabled ? "default" : "outline"}
            className={draft.vatEnabled ? "w-full bg-blue-600 hover:bg-blue-700" : "w-full"}
            onClick={() => onChange((prev) => ({ ...prev, vatEnabled: !prev.vatEnabled }))}
          >
            {draft.vatEnabled ? "Activée" : "Désactivée"}
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Taux TVA (%)</Label>
          <Input
            type="number"
            min={0}
            value={draft.vatRate}
            disabled={!draft.vatEnabled}
            onChange={(event) => onChange((prev) => ({ ...prev, vatRate: Number(event.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">Résumé calcul</p>
        <div className="mt-2 space-y-1 text-sm text-blue-800">
          <p>Durée facturée: {derived.durationDays} jour(s)</p>
          <p>Base: {formatCurrency(derived.baseTotal)}</p>
          <p>Add-ons: {formatCurrency(derived.addonsTotal)}</p>
          <p>Remise: -{formatCurrency(derived.discountTotal)}</p>
          <p>TVA: {formatCurrency(derived.vatTotal)}</p>
          <p className="text-lg font-bold">Total TTC: {formatCurrency(derived.totalTTC)}</p>
        </div>
      </div>
    </div>
  );
}

function StepPayment({
  draft,
  derived,
  onChange,
  errors,
}: {
  draft: ReservationDraft;
  derived: { remaining: number; totalTTC: number };
  onChange: React.Dispatch<React.SetStateAction<ReservationDraft>>;
  errors: StepErrors;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Mode de paiement</Label>
          <Select
            value={draft.paymentMethod}
            onValueChange={(value) => onChange((prev) => ({ ...prev, paymentMethod: value as BookingFormData["paymentType"] }))}
          >
            <SelectTrigger className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Espèces</SelectItem>
              <SelectItem value="CARD">Carte</SelectItem>
              <SelectItem value="TRANSFER">Virement</SelectItem>
              <SelectItem value="CMI">CMI</SelectItem>
              <SelectItem value="OTHER">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Statut</Label>
          <Select
            value={draft.status}
            onValueChange={(value) => onChange((prev) => ({ ...prev, status: value as "CONFIRMED" | "DRAFT" }))}
          >
            <SelectTrigger className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONFIRMED">Confirmé</SelectItem>
              <SelectItem value="DRAFT">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <FieldError label="Montant payé (MAD)" error={errors.paidAmount}>
        <Input
          type="number"
          min={0}
          value={draft.paidAmount}
          onChange={(event) => onChange((prev) => ({ ...prev, paidAmount: Number(event.target.value) || 0 }))}
        />
      </FieldError>

      <div className="rounded-full bg-blue-50 px-4 py-2 text-center text-lg font-semibold text-blue-800">
        Restant: {formatCurrency(derived.remaining)}
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          rows={4}
          value={draft.notes}
          onChange={(event) => onChange((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder="Notes opérationnelles..."
        />
      </div>

      {draft.paidAmount > derived.totalTTC ? (
        <p className="text-sm text-red-600">Le montant payé dépasse le total TTC.</p>
      ) : null}
    </div>
  );
}

function FieldError({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function validateStep(
  step: 1 | 2 | 3 | 4,
  draft: ReservationDraft,
  context: { vehicleConflictByStatus: boolean; vehicleOverlapConflict: boolean },
): { ok: boolean; errors: StepErrors } {
  const errors: StepErrors = {};

  if (step === 1) {
    if (!draft.startAt) errors.startAt = "Date de départ requise";
    if (!draft.endAt) errors.endAt = "Date de retour requise";
    if (draft.startAt && draft.endAt && new Date(draft.endAt) <= new Date(draft.startAt)) {
      errors.endAt = "La date de retour doit être après le départ";
    }
    if (!draft.vehicleId) errors.vehicleId = "Véhicule requis";
    if (context.vehicleConflictByStatus || context.vehicleOverlapConflict) {
      errors.vehicleId = "Véhicule indisponible";
    }
  }

  if (step === 2) {
    if (!draft.clientId) errors.clientId = "Client requis";
  }

  if (step === 3) {
    if (!(Number(draft.pricePerDay) > 0)) errors.pricePerDay = "Prix/jour requis";
    if (!(Number(draft.deposit) >= 0)) errors.deposit = "Caution invalide";
  }

  if (step === 4) {
    if (Number(draft.paidAmount) < 0) errors.paidAmount = "Montant payé invalide";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

function cryptoRandomId() {
  return `addon_${Math.random().toString(36).slice(2, 9)}`;
}

function toDatetimeLocal(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
