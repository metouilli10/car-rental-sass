"use client";

import { useState, useCallback } from "react";
import { UseFormReturn, Controller } from "react-hook-form";
import { VehicleFormData } from "@/lib/validations/vehicle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Droplets,
  ShieldCheck,
  ClipboardCheck,
  StickyNote,
  ChevronDown,
  Wrench,
  AlertTriangle,
  Check,
  Settings2,
} from "lucide-react";
import { differenceInDays, addMonths, format } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Types ──────────────────────────────────────────────────────────────────

type ReminderType = "oil" | "insurance" | "inspection" | "vignette";

interface RemindersSetupPanelProps {
  form: UseFormReturn<VehicleFormData>;
  isLoading: boolean;
}

// ─── Reminder days chips (reused in sheets) ─────────────────────────────────

const REMINDER_DAYS_OPTIONS = [30, 15, 7];

function ReminderDaysChips({
  value,
  onChange,
}: {
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const toggle = (day: number) => {
    const next = value.includes(day)
      ? value.filter((d) => d !== day)
      : [...value, day];
    onChange(next.sort((a, b) => b - a));
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {REMINDER_DAYS_OPTIONS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => toggle(day)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            value.includes(day)
              ? "bg-primary text-white border-primary"
              : "bg-muted/40 text-muted-foreground border-border hover:border-primary/50"
          }`}
        >
          {day}j
        </button>
      ))}
      <span className="text-xs text-muted-foreground self-center">
        avant expiration
      </span>
    </div>
  );
}

// ─── Status helpers ─────────────────────────────────────────────────────────

function getOilStatus(form: UseFormReturn<VehicleFormData>) {
  const v = form.getValues;
  const currentKm = v("currentKm");
  const nextKm = v("nextOilChangeMileageKm");
  const lastKm = v("lastOilChangeMileageKm");
  const interval = v("oilChangeIntervalKm");
  const nextDate = v("nextOilChangeDate");
  const lastDate = v("lastOilChangeDate");
  const intervalMonths = v("oilChangeIntervalMonths");

  if (nextKm && currentKm != null) {
    const remaining = Number(nextKm) - Number(currentKm);
    const overdue = remaining <= 0;
    return {
      configured: true,
      overdue,
      preview: `${Number(nextKm).toLocaleString("fr-FR")} km — ${
        overdue
          ? `Dépassée de ${Math.abs(remaining).toLocaleString("fr-FR")} km`
          : `${remaining.toLocaleString("fr-FR")} km restants`
      }`,
    };
  }
  if (lastKm && interval && currentKm != null) {
    const computed = Number(lastKm) + Number(interval);
    const remaining = computed - Number(currentKm);
    const overdue = remaining <= 0;
    return {
      configured: true,
      overdue,
      preview: `~${computed.toLocaleString("fr-FR")} km — ${
        overdue
          ? `Dépassée de ${Math.abs(remaining).toLocaleString("fr-FR")} km`
          : `${remaining.toLocaleString("fr-FR")} km restants`
      }`,
    };
  }
  if (nextDate) {
    const daysLeft = differenceInDays(new Date(nextDate), new Date());
    const overdue = daysLeft <= 0;
    return {
      configured: true,
      overdue,
      preview: `${format(new Date(nextDate), "d MMM yyyy", { locale: fr })} — ${
        overdue ? `Dépassée de ${Math.abs(daysLeft)}j` : `Dans ${daysLeft}j`
      }`,
    };
  }
  if (lastDate && intervalMonths) {
    const computed = addMonths(new Date(lastDate), Number(intervalMonths));
    const daysLeft = differenceInDays(computed, new Date());
    const overdue = daysLeft <= 0;
    return {
      configured: true,
      overdue,
      preview: `~${format(computed, "d MMM yyyy", { locale: fr })} — ${
        overdue ? `Dépassée de ${Math.abs(daysLeft)}j` : `Dans ${daysLeft}j`
      }`,
    };
  }
  return { configured: false, overdue: false, preview: "" };
}

function getDateStatus(dateValue: string | undefined) {
  if (!dateValue) return { configured: false, overdue: false, preview: "" };
  const daysLeft = differenceInDays(new Date(dateValue), new Date());
  const overdue = daysLeft <= 0;
  return {
    configured: true,
    overdue,
    preview: `${format(new Date(dateValue), "d MMM yyyy", { locale: fr })} — ${
      overdue ? `Dépassée de ${Math.abs(daysLeft)}j` : `Dans ${daysLeft}j`
    }`,
  };
}

// ─── Reminder Tile ──────────────────────────────────────────────────────────

function ReminderTile({
  icon: Icon,
  title,
  configured,
  overdue,
  preview,
  onConfigure,
}: {
  icon: React.ElementType;
  title: string;
  configured: boolean;
  overdue: boolean;
  preview: string;
  onConfigure: () => void;
}) {
  return (
    <div
      className="group relative flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-colors hover:bg-slate-50/80 cursor-pointer"
      onClick={onConfigure}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          configured
            ? overdue
              ? "bg-red-50 text-red-500"
              : "bg-primary/10 text-primary"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{title}</span>
          {configured ? (
            overdue ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 border border-red-100">
                <AlertTriangle className="h-2.5 w-2.5" />
                Dépassé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 border border-emerald-100">
                <Check className="h-2.5 w-2.5" />
                Configuré
              </span>
            )
          ) : (
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Non configuré
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500 truncate">
          {configured ? preview : "Aucune alerte configurée"}
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 text-xs text-slate-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onConfigure();
        }}
      >
        <Settings2 className="h-3.5 w-3.5 mr-1" />
        Configurer
      </Button>
    </div>
  );
}

// ─── Oil Change Sheet ───────────────────────────────────────────────────────

function OilChangeSheet({
  open,
  onOpenChange,
  form,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<VehicleFormData>;
  isLoading: boolean;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { register, watch } = form;

  const currentKm = watch("currentKm");
  const lastKm = watch("lastOilChangeMileageKm");
  const intervalKm = watch("oilChangeIntervalKm");
  const nextKm = watch("nextOilChangeMileageKm");
  const lastDate = watch("lastOilChangeDate");
  const intervalMonths = watch("oilChangeIntervalMonths");
  const nextDate = watch("nextOilChangeDate");

  // Compute preview
  const preview = (() => {
    if (nextKm && currentKm != null) {
      const remaining = Number(nextKm) - Number(currentKm);
      return {
        label: `Prochaine vidange : ${Number(nextKm).toLocaleString("fr-FR")} km`,
        sub:
          remaining <= 0
            ? `Dépassée de ${Math.abs(remaining).toLocaleString("fr-FR")} km`
            : `Dans ${remaining.toLocaleString("fr-FR")} km`,
        overdue: remaining <= 0,
      };
    }
    if (lastKm && intervalKm && currentKm != null) {
      const computed = Number(lastKm) + Number(intervalKm);
      const remaining = computed - Number(currentKm);
      return {
        label: `Prochaine vidange estimée : ${computed.toLocaleString("fr-FR")} km`,
        sub:
          remaining <= 0
            ? `Dépassée de ${Math.abs(remaining).toLocaleString("fr-FR")} km`
            : `Dans ${remaining.toLocaleString("fr-FR")} km`,
        overdue: remaining <= 0,
      };
    }
    if (nextDate) {
      const daysLeft = differenceInDays(new Date(nextDate), new Date());
      return {
        label: `Prochaine vidange : ${format(new Date(nextDate), "d MMM yyyy", { locale: fr })}`,
        sub: daysLeft <= 0 ? `Dépassée de ${Math.abs(daysLeft)}j` : `Dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
        overdue: daysLeft <= 0,
      };
    }
    if (lastDate && intervalMonths) {
      const computed = addMonths(new Date(lastDate), Number(intervalMonths));
      const daysLeft = differenceInDays(computed, new Date());
      return {
        label: `Prochaine vidange estimée : ${format(computed, "d MMM yyyy", { locale: fr })}`,
        sub: daysLeft <= 0 ? `Dépassée de ${Math.abs(daysLeft)}j` : `Dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
        overdue: daysLeft <= 0,
      };
    }
    return null;
  })();

  const hasSomeOilData = lastKm || intervalKm || nextKm;
  const missingMileage = hasSomeOilData && !currentKm;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Vidange
          </SheetTitle>
          <SheetDescription>
            Configurez le suivi de vidange pour ce véhicule.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Minimal fields */}
          <div className="space-y-2">
            <Label htmlFor="sheet-currentKm">Kilométrage actuel</Label>
            <Input
              id="sheet-currentKm"
              type="number"
              {...register("currentKm")}
              placeholder="ex: 75 000"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheet-oilInterval">Intervalle (km)</Label>
            <Input
              id="sheet-oilInterval"
              type="number"
              {...register("oilChangeIntervalKm")}
              placeholder="10 000"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Typiquement 7 500–10 000 km
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sheet-lastOilKm">Dernière vidange (km)</Label>
              <Input
                id="sheet-lastOilKm"
                type="number"
                {...register("lastOilChangeMileageKm")}
                placeholder="ex: 70 000"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet-nextOilKm">
                Prochaine (km)
              </Label>
              <Input
                id="sheet-nextOilKm"
                type="number"
                {...register("nextOilChangeMileageKm")}
                placeholder="ex: 80 000"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Remplace le calcul auto</p>
            </div>
          </div>

          {/* Preview */}
          {missingMileage && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Kilométrage actuel requis pour calculer les rappels en km.
            </div>
          )}

          {preview && (
            <div
              className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2.5 border ${
                preview.overdue
                  ? "text-red-700 bg-red-50 border-red-200"
                  : "text-primary bg-primary/5 border-primary/20"
              }`}
            >
              <Wrench className="h-3.5 w-3.5 shrink-0" />
              <span>
                {preview.label} — <strong>{preview.sub}</strong>
              </span>
            </div>
          )}

          {/* Advanced options */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  advancedOpen ? "rotate-180" : ""
                }`}
              />
              Options avancées
            </button>

            {advancedOpen && (
              <div className="mt-3 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sheet-lastOilDate">
                    Date dernière vidange
                  </Label>
                  <Input
                    id="sheet-lastOilDate"
                    type="date"
                    {...register("lastOilChangeDate")}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sheet-oilIntervalMonths">
                    Intervalle (mois)
                  </Label>
                  <Input
                    id="sheet-oilIntervalMonths"
                    type="number"
                    {...register("oilChangeIntervalMonths")}
                    placeholder="ex: 6"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sheet-nextOilDate">
                    Prochaine vidange (date manuelle)
                  </Label>
                  <Input
                    id="sheet-nextOilDate"
                    type="date"
                    {...register("nextOilChangeDate")}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Insurance Sheet ────────────────────────────────────────────────────────

function InsuranceSheet({
  open,
  onOpenChange,
  form,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<VehicleFormData>;
  isLoading: boolean;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { register, control } = form;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Assurance
          </SheetTitle>
          <SheetDescription>
            Configurez le suivi d&apos;assurance pour ce véhicule.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sheet-insuranceExpiry">
              Date d&apos;expiration *
            </Label>
            <Input
              id="sheet-insuranceExpiry"
              type="date"
              {...register("insuranceExpiryDate")}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheet-insuranceProvider">
              Compagnie (optionnel)
            </Label>
            <Input
              id="sheet-insuranceProvider"
              {...register("insuranceProvider")}
              placeholder="ex: Wafa Assurance"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Rappels avant expiration</Label>
            <Controller
              name="insuranceReminderDays"
              control={control}
              render={({ field }) => (
                <ReminderDaysChips
                  value={field.value ?? [30, 15, 7]}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Advanced */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  advancedOpen ? "rotate-180" : ""
                }`}
              />
              Options avancées
            </button>

            {advancedOpen && (
              <div className="mt-3 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sheet-insurancePolicy">N° de police</Label>
                  <Input
                    id="sheet-insurancePolicy"
                    {...register("insurancePolicyNumber")}
                    placeholder="ex: 123456789"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sheet-insuranceStart">Date de début</Label>
                  <Input
                    id="sheet-insuranceStart"
                    type="date"
                    {...register("insuranceStartDate")}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Technical Inspection Sheet ─────────────────────────────────────────────

function TechnicalInspectionSheet({
  open,
  onOpenChange,
  form,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<VehicleFormData>;
  isLoading: boolean;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { register, control } = form;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Visite technique
          </SheetTitle>
          <SheetDescription>
            Configurez le suivi de visite technique.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sheet-nextInspection">Prochaine visite *</Label>
            <Input
              id="sheet-nextInspection"
              type="date"
              {...register("nextTechnicalInspectionDate")}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Rappels avant échéance</Label>
            <Controller
              name="technicalInspectionReminderDays"
              control={control}
              render={({ field }) => (
                <ReminderDaysChips
                  value={field.value ?? [30, 15, 7]}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Advanced */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  advancedOpen ? "rotate-180" : ""
                }`}
              />
              Options avancées
            </button>

            {advancedOpen && (
              <div className="mt-3 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sheet-lastInspection">Dernière visite</Label>
                  <Input
                    id="sheet-lastInspection"
                    type="date"
                    {...register("lastTechnicalInspectionDate")}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Vignette Sheet ─────────────────────────────────────────────────────────

function VignetteSheet({
  open,
  onOpenChange,
  form,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<VehicleFormData>;
  isLoading: boolean;
}) {
  const { register, control } = form;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            Vignette
          </SheetTitle>
          <SheetDescription>
            Configurez le suivi de la vignette.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sheet-vignetteExpiry">Date d&apos;expiration</Label>
            <Input
              id="sheet-vignetteExpiry"
              type="date"
              {...register("vignetteExpiryDate")}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Rappels avant expiration</Label>
            <Controller
              name="vignetteReminderDays"
              control={control}
              render={({ field }) => (
                <ReminderDaysChips
                  value={field.value ?? [30, 15, 7]}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────

export function RemindersSetupPanel({
  form,
  isLoading,
}: RemindersSetupPanelProps) {
  const [openSheet, setOpenSheet] = useState<ReminderType | null>(null);
  const [othersOpen, setOthersOpen] = useState(false);

  // Watch values for tile status (trigger re-render)
  const insuranceExpiry = form.watch("insuranceExpiryDate");
  const inspectionDate = form.watch("nextTechnicalInspectionDate");
  const vignetteExpiry = form.watch("vignetteExpiryDate");
  // Oil watches for reactivity
  form.watch("currentKm");
  form.watch("nextOilChangeMileageKm");
  form.watch("lastOilChangeMileageKm");
  form.watch("oilChangeIntervalKm");
  form.watch("nextOilChangeDate");
  form.watch("lastOilChangeDate");
  form.watch("oilChangeIntervalMonths");
  const maintenanceNotes = form.watch("maintenanceNotes");

  const oilStatus = getOilStatus(form);
  const insuranceStatus = getDateStatus(insuranceExpiry);
  const inspectionStatus = getDateStatus(inspectionDate);
  const vignetteStatus = getDateStatus(vignetteExpiry);

  const configuredCount = [
    oilStatus.configured,
    insuranceStatus.configured,
    inspectionStatus.configured,
    vignetteStatus.configured,
  ].filter(Boolean).length;

  const close = useCallback(() => setOpenSheet(null), []);

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 bg-slate-50/60 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <Wrench className="h-4 w-4 text-primary" />
                Rappels &amp; entretien
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rappels automatiques pour vidange, assurance et conformité.
              </p>
            </div>
            {configuredCount > 0 && (
              <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                {configuredCount}/4
              </span>
            )}
          </div>
        </div>

        {/* Tiles */}
        <div className="p-3 space-y-2">
          <ReminderTile
            icon={Droplets}
            title="Vidange"
            configured={oilStatus.configured}
            overdue={oilStatus.overdue}
            preview={oilStatus.preview}
            onConfigure={() => setOpenSheet("oil")}
          />

          <ReminderTile
            icon={ShieldCheck}
            title="Assurance"
            configured={insuranceStatus.configured}
            overdue={insuranceStatus.overdue}
            preview={insuranceStatus.preview}
            onConfigure={() => setOpenSheet("insurance")}
          />

          <ReminderTile
            icon={ClipboardCheck}
            title="Visite technique"
            configured={inspectionStatus.configured}
            overdue={inspectionStatus.overdue}
            preview={inspectionStatus.preview}
            onConfigure={() => setOpenSheet("inspection")}
          />

          {/* Autres — collapsed by default */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setOthersOpen(!othersOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors px-1"
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  othersOpen ? "rotate-180" : ""
                }`}
              />
              Autres rappels
            </button>

            {othersOpen && (
              <div className="mt-2 space-y-2">
                <ReminderTile
                  icon={StickyNote}
                  title="Vignette"
                  configured={vignetteStatus.configured}
                  overdue={vignetteStatus.overdue}
                  preview={vignetteStatus.preview}
                  onConfigure={() => setOpenSheet("vignette")}
                />

                {/* Maintenance notes */}
                <div className="px-4 py-3">
                  <Label
                    htmlFor="panel-maintenanceNotes"
                    className="text-xs font-medium text-slate-600"
                  >
                    Notes de maintenance
                  </Label>
                  <Textarea
                    id="panel-maintenanceNotes"
                    {...form.register("maintenanceNotes")}
                    placeholder="Notes libres : réparations, prochaines interventions..."
                    rows={2}
                    disabled={isLoading}
                    className="mt-1.5 resize-none text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sheets */}
      <OilChangeSheet
        open={openSheet === "oil"}
        onOpenChange={(v) => !v && close()}
        form={form}
        isLoading={isLoading}
      />
      <InsuranceSheet
        open={openSheet === "insurance"}
        onOpenChange={(v) => !v && close()}
        form={form}
        isLoading={isLoading}
      />
      <TechnicalInspectionSheet
        open={openSheet === "inspection"}
        onOpenChange={(v) => !v && close()}
        form={form}
        isLoading={isLoading}
      />
      <VignetteSheet
        open={openSheet === "vignette"}
        onOpenChange={(v) => !v && close()}
        form={form}
        isLoading={isLoading}
      />
    </>
  );
}
