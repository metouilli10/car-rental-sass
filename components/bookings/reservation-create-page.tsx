"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AlertTriangle, ChevronUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { bookingSchema, BookingFormData } from "@/lib/validations/booking";
import { updateBooking } from "@/lib/actions/bookings";
import { formatCurrency } from "@/lib/utils";
import { BlockCard } from "@/components/bookings/block-card";
import { StepperNav } from "@/components/bookings/stepper-nav";
import { VehicleSelect } from "@/components/bookings/vehicle-select";
import { ClientSelect } from "@/components/bookings/client-select";
import { PricingEditor } from "@/components/bookings/pricing-editor";
import { PaymentSection } from "@/components/bookings/payment-section";
import { StickySummary } from "@/components/bookings/sticky-summary";
import type {
  ActiveBookingSlot,
  BookingCustomerOption,
  BookingVehicleOption,
  PricingDerived,
} from "@/components/bookings/types";

interface ReservationCreatePageProps {
  customers: BookingCustomerOption[];
  vehicles: BookingVehicleOption[];
  locationOptions: string[];
  activeBookings: ActiveBookingSlot[];
  /** For create mode. Omit when bookingId is provided (edit mode). */
  onSubmit?: (
    data: BookingFormData,
  ) => Promise<{ error: string } | { success: boolean; bookingId: string } | void>;
  /** When provided, form is in edit mode; submit will call updateBooking(bookingId, data). */
  bookingId?: string;
  /** When provided, form is in edit mode with these default values */
  initialData?: Partial<BookingFormData>;
  submitLabel?: string;
  showDraft?: boolean;
}

const DEFAULT_ADDONS: BookingFormData["addons"] = [
  { label: "Assurance complémentaire", quantity: 1, unitAmount: 0, isDefault: true },
];

const DEFAULT_FORM_VALUES: BookingFormData = {
  customerId: "",
  vehicleId: "",
  startDate: "",
  endDate: "",
  pickupLocation: "",
  returnLocation: "",
  pricePerDay: 0,
  pricingDays: 0,
  pricingHours: 0,
  addonsTotal: 0,
  discountType: null,
  discountValue: 0,
  discountAmount: 0,
  taxEnabled: false,
  taxRate: 20,
  totalHt: 0,
  totalTva: 0,
  totalTtc: 0,
  totalPrice: 0,
  paidNow: 0,
  remainingAmount: 0,
  depositAmount: 2000,
  paymentType: "CASH",
  status: "CONFIRMED",
  addons: DEFAULT_ADDONS,
  notes: "",
};

export function ReservationCreatePage({
  customers: initialCustomers,
  vehicles,
  locationOptions,
  activeBookings,
  onSubmit,
  bookingId,
  initialData,
  submitLabel,
  showDraft = true,
}: ReservationCreatePageProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [addons, setAddons] = useState<BookingFormData["addons"]>(
    initialData?.addons ?? DEFAULT_ADDONS
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: initialData
      ? { ...DEFAULT_FORM_VALUES, ...initialData, addons: initialData.addons ?? DEFAULT_ADDONS }
      : DEFAULT_FORM_VALUES,
  });

  const vehicleId = watch("vehicleId");
  const customerId = watch("customerId");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const pricePerDay = watch("pricePerDay");
  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const depositAmount = watch("depositAmount");
  const taxEnabled = watch("taxEnabled");
  const taxRate = watch("taxRate");
  const paidNow = watch("paidNow");
  const paymentType = watch("paymentType");
  const status = watch("status");
  const notes = watch("notes");
  const pickupLocation = watch("pickupLocation");
  const returnLocation = watch("returnLocation");

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === vehicleId),
    [vehicles, vehicleId],
  );
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId),
    [customers, customerId],
  );

  useEffect(() => {
    if (!selectedVehicle) return;
    if (getValues("pricePerDay") <= 0) {
      setValue("pricePerDay", selectedVehicle.pricePerDay);
    }
    if (getValues("depositAmount") <= 0) {
      setValue("depositAmount", selectedVehicle.depositAmount);
    }
  }, [selectedVehicle, setValue, getValues]);

  const availabilityConflict = useMemo(() => {
    if (!vehicleId || !startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return false;
    return activeBookings.some((booking) => {
      if (booking.vehicleId !== vehicleId) return false;
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      return start < bookingEnd && end > bookingStart;
    });
  }, [activeBookings, endDate, startDate, vehicleId]);

  const pricing = useMemo<PricingDerived>(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const hasDates = start && end && end > start;
    const durationHours = hasDates ? (end.getTime() - start.getTime()) / (1000 * 60 * 60) : 0;
    const billableDays = hasDates ? Math.max(1, Math.ceil(durationHours / 24)) : 0;
    const billableHours = hasDates ? Math.max(0, Math.floor(durationHours % 24)) : 0;
    const basePrice = billableDays * Number(pricePerDay || 0);
    const addonsTotal = addons.reduce(
      (sum, addon) => sum + Number(addon.quantity || 0) * Number(addon.unitAmount || 0),
      0,
    );
    const subtotal = basePrice + addonsTotal;
    const discountAmount =
      discountType === "PERCENTAGE"
        ? subtotal * Math.min(Number(discountValue || 0), 100) / 100
        : discountType === "FIXED"
          ? Number(discountValue || 0)
          : 0;
    const totalHt = Math.max(0, subtotal - discountAmount);
    const totalTva = taxEnabled ? (totalHt * Number(taxRate || 0)) / 100 : 0;
    const totalTtc = totalHt + totalTva;
    const remaining = Math.max(0, totalTtc - Number(paidNow || 0));
    const durationText = hasDates ? `${billableDays} j${billableHours ? ` et ${billableHours} h` : ""}` : "--";

    return {
      durationText,
      billableDays,
      billableHours,
      basePrice,
      addonsTotal,
      discountAmount,
      totalHt,
      totalTva,
      totalTtc,
      remaining,
    };
  }, [addons, discountType, discountValue, endDate, paidNow, pricePerDay, startDate, taxEnabled, taxRate]);

  useEffect(() => {
    setValue("addons", addons);
    setValue("pricingDays", pricing.billableDays);
    setValue("pricingHours", pricing.billableHours);
    setValue("addonsTotal", pricing.addonsTotal);
    setValue("discountAmount", pricing.discountAmount);
    setValue("totalHt", pricing.totalHt);
    setValue("totalTva", pricing.totalTva);
    setValue("totalTtc", pricing.totalTtc);
    setValue("totalPrice", pricing.totalTtc);
    setValue("remainingAmount", pricing.remaining);
  }, [addons, pricing, setValue]);

  const warnings = useMemo(() => {
    const items: string[] = [];
    if (availabilityConflict) items.push("Véhicule indisponible sur la plage sélectionnée.");
    if (selectedCustomer?.unpaidCount && selectedCustomer.unpaidCount > 0) {
      items.push(`Client avec ${selectedCustomer.unpaidCount} dossier(s) impayé(s).`);
    }
    return items;
  }, [availabilityConflict, selectedCustomer]);

  const steps = useMemo(() => {
    const datesValid = Boolean(startDate && endDate && new Date(endDate) > new Date(startDate));
    const block1 = Boolean(vehicleId) && datesValid && !availabilityConflict;
    const block2 = Boolean(customerId);
    const block3 = pricing.totalTtc >= 0 && Number(pricePerDay) >= 0;
    const block4 = Number(paidNow || 0) <= pricing.totalTtc;
    const completion = [block1, block2, block3, block4];
    const activeIndex = completion.findIndex((isDone) => !isDone);
    const current = activeIndex === -1 ? 3 : activeIndex;

    return [
      { id: "block-1", title: "Détails location", completed: block1, active: current === 0 },
      { id: "block-2", title: "Client", completed: block2, active: current === 1 },
      { id: "block-3", title: "Add-ons & Tarification", completed: block3, active: current === 2 },
      { id: "block-4", title: "Paiement & Validation", completed: block4, active: current === 3 },
    ];
  }, [availabilityConflict, customerId, endDate, paidNow, pricePerDay, pricing.totalTtc, startDate, vehicleId]);

  const isEdit = Boolean(bookingId);

  const handleCreate = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const result = isEdit && bookingId
        ? await updateBooking(bookingId, data)
        : await onSubmit?.(data);

      if (result && "error" in result) {
        setFormError(result.error);
        return;
      }

      if (isEdit) {
        toast.success("Réservation mise à jour");
        setTimeout(() => {
          if (result && "bookingId" in result) {
            router.push(`/bookings/${result.bookingId}`);
          } else {
            router.push("/bookings");
          }
        }, 500);
      } else {
        toast.success("Réservation créée avec succès");
        toast("Prochaines étapes", {
          description: "Créer contrat • Faire inspection départ • Envoyer WhatsApp",
        });
        setTimeout(() => {
          if (result && "bookingId" in result) {
            router.push(`/bookings/${result.bookingId}`);
            return;
          }
          router.push("/bookings");
        }, 900);
      }
    } catch {
      setFormError(
        isEdit
          ? "Impossible de mettre à jour la réservation pour le moment."
          : "Impossible de créer la réservation pour le moment."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (typeof window === "undefined") return;
    const payload = {
      ...getValues(),
      addons,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem("locapro-booking-draft", JSON.stringify(payload));
    toast.success("Brouillon enregistré localement");
  };

  return (
    <form onSubmit={handleSubmit(handleCreate)} className="space-y-6">
      <StepperNav steps={steps} />

      {formError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <BlockCard
            id="block-1"
            title="1) Détails location"
            description="Définissez la période, les lieux et le véhicule."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date/Heure de départ *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(event) => setValue("startDate", event.target.value)}
                />
                {errors.startDate ? <p className="text-sm text-red-600">{errors.startDate.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date/Heure de retour *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(event) => setValue("endDate", event.target.value)}
                />
                {errors.endDate ? <p className="text-sm text-red-600">{errors.endDate.message}</p> : null}
              </div>
            </div>

            <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Durée calculée: <span className="font-medium">{pricing.durationText}</span>
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Lieu départ</Label>
                <Select
                  value={pickupLocation || ""}
                  onValueChange={(value) => setValue("pickupLocation", value)}
                >
                  <SelectTrigger>
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
                  value={returnLocation || ""}
                  onValueChange={(value) => setValue("returnLocation", value)}
                >
                  <SelectTrigger>
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

            <VehicleSelect
              vehicles={vehicles}
              value={vehicleId}
              onChange={(value) => setValue("vehicleId", value)}
              availabilityConflict={availabilityConflict}
              error={errors.vehicleId?.message}
            />
          </BlockCard>

          <BlockCard id="block-2" title="2) Client" description="Choisissez un client existant ou créez-le rapidement.">
            <ClientSelect
              customers={customers}
              value={customerId}
              onChange={(value) => setValue("customerId", value)}
              onCustomerCreated={(customer) => {
                setCustomers((prev) => [...prev, customer].sort((a, b) => a.name.localeCompare(b.name)));
                setValue("customerId", customer.id);
              }}
              error={errors.customerId?.message}
            />
          </BlockCard>

          <BlockCard
            id="block-3"
            title="3) Add-ons & Tarification"
            description="Ajustez le prix, les options, la remise et la TVA."
          >
            <PricingEditor
              pricePerDay={Number(pricePerDay || 0)}
              onPricePerDayChange={(value) => setValue("pricePerDay", value)}
              discountType={discountType}
              onDiscountTypeChange={(value) => setValue("discountType", value)}
              discountValue={Number(discountValue || 0)}
              onDiscountValueChange={(value) => setValue("discountValue", value)}
              depositAmount={Number(depositAmount || 0)}
              onDepositAmountChange={(value) => setValue("depositAmount", value)}
              taxEnabled={taxEnabled}
              onTaxEnabledChange={(value) => setValue("taxEnabled", value)}
              taxRate={Number(taxRate || 0)}
              onTaxRateChange={(value) => setValue("taxRate", value)}
              addons={addons}
              onAddAddon={() =>
                setAddons((prev) => [...prev, { label: "", quantity: 1, unitAmount: 0, isDefault: false }])
              }
              onRemoveAddon={(index) => setAddons((prev) => prev.filter((_, i) => i !== index))}
              onUpdateAddon={(index, key, value) =>
                setAddons((prev) =>
                  prev.map((addon, i) =>
                    i === index ? { ...addon, [key]: value } : addon,
                  ),
                )
              }
              derived={pricing}
            />
          </BlockCard>

          <BlockCard
            id="block-4"
            title="4) Paiement & Validation"
            description="Finalisez le mode de paiement et validez la réservation."
          >
            {Number(paidNow || 0) > pricing.totalTtc ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Le montant payé ne peut pas dépasser {formatCurrency(pricing.totalTtc)}.
                </p>
              </div>
            ) : null}

            <PaymentSection
              paymentType={paymentType}
              onPaymentTypeChange={(value) => setValue("paymentType", value)}
              status={status}
              onStatusChange={(value) => setValue("status", value)}
              paidNow={Number(paidNow || 0)}
              onPaidNowChange={(value) => setValue("paidNow", value)}
              remaining={pricing.remaining}
              notes={notes}
              onNotesChange={(value) => setValue("notes", value)}
              isSubmitting={isSubmitting}
              onSaveDraft={handleSaveDraft}
              submitLabel={submitLabel}
              showDraft={showDraft}
            />
          </BlockCard>
        </div>

        <div className="hidden lg:block">
          <StickySummary
            vehicle={selectedVehicle}
            customer={selectedCustomer}
            startDate={startDate}
            endDate={endDate}
            durationText={pricing.durationText}
            pricing={pricing}
            depositAmount={Number(depositAmount || 0)}
            paidNow={Number(paidNow || 0)}
            warnings={warnings}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-30 mx-auto w-[calc(100%-2rem)] max-w-sm lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full rounded-2xl bg-blue-600 py-6 text-base hover:bg-blue-700">
              <span className="mr-2">Résumé {formatCurrency(pricing.totalTtc)}</span>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Résumé réservation</SheetTitle>
              <SheetDescription>Suivi financier et alertes opérationnelles.</SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <StickySummary
                vehicle={selectedVehicle}
                customer={selectedCustomer}
                startDate={startDate}
                endDate={endDate}
                durationText={pricing.durationText}
                pricing={pricing}
                depositAmount={Number(depositAmount || 0)}
                paidNow={Number(paidNow || 0)}
                warnings={warnings}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </form>
  );
}
