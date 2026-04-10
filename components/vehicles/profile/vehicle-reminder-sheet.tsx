"use client";

import { useEffect, useMemo, useState, useTransition, type ElementType, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Save,
  ShieldCheck,
  Sticker,
  Wrench,
} from "lucide-react";
import { updateVehicleReminderFields } from "@/lib/actions/vehicles";
import type { VehicleProfileTab } from "@/lib/vehicles/profile";
import { normalizeReminderSheetType, type ReminderSheetType } from "@/lib/vehicles/reminder-sheet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface VehicleReminderSheetProps {
  vehicleId: string;
  defaultOpen: boolean;
  currentTab: VehicleProfileTab;
  defaultReminderType?: string;
  defaults: {
    nextOilChangeDate: string;
    nextOilChangeMileageKm: string;
    insuranceExpiryDate: string;
    nextTechnicalInspectionDate: string;
    vignetteExpiryDate: string;
    maintenanceNotes: string;
  };
}

export function VehicleReminderSheet({
  vehicleId,
  defaultOpen,
  currentTab,
  defaultReminderType,
  defaults,
}: VehicleReminderSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(defaultOpen);
  const [form, setForm] = useState(defaults);
  const [selectedType, setSelectedType] = useState<ReminderSheetType>(
    normalizeReminderSheetType(defaultReminderType) ?? "oil",
  );

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    setForm(defaults);
  }, [defaults]);

  useEffect(() => {
    setSelectedType(normalizeReminderSheetType(defaultReminderType) ?? "oil");
  }, [defaultReminderType]);

  const nextUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", currentTab);
    params.delete("sheet");
    params.delete("reminder");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [currentTab, pathname, searchParams]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      router.replace(nextUrl, { scroll: false });
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="pr-6">
          <SheetTitle>Ajouter un rappel</SheetTitle>
          <SheetDescription>
            Mettez à jour les prochaines échéances de conformité et d’entretien sans quitter la fiche véhicule.
          </SheetDescription>
        </SheetHeader>

        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await updateVehicleReminderFields(vehicleId, {
                ...form,
                nextOilChangeMileageKm: form.nextOilChangeMileageKm
                  ? Number(form.nextOilChangeMileageKm)
                  : undefined,
              });
              if (result?.error) {
                toast.error(result.error);
                return;
              }
              toast.success("Rappels mis à jour");
              setOpen(false);
              router.replace(`${pathname}?tab=tracking`, { scroll: false });
              router.refresh();
            });
          }}
        >
          <div className="space-y-3 rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">Type de rappel</p>
              <p className="mt-1 text-sm text-slate-500">
                Choisissez d’abord le suivi à configurer, puis renseignez uniquement les champs utiles.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {REMINDER_TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = selectedType === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "flex items-start gap-3 rounded-[18px] border px-4 py-3 text-left transition-colors",
                      isActive
                        ? "border-blue-200 bg-blue-50 text-slate-950 shadow-sm"
                        : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    )}
                    onClick={() => setSelectedType(option.value)}
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedType === "oil" ? (
            <>
              <ReminderField
                label="Prochaine vidange"
                description="Date prévisionnelle"
                htmlFor="nextOilChangeDate"
              >
                <Input
                  id="nextOilChangeDate"
                  type="date"
                  value={form.nextOilChangeDate}
                  onChange={(event) => updateField("nextOilChangeDate", event.target.value)}
                />
              </ReminderField>

              <ReminderField
                label="Kilométrage de vidange"
                description="Seuil kilométrique"
                htmlFor="nextOilChangeMileageKm"
              >
                <Input
                  id="nextOilChangeMileageKm"
                  type="number"
                  min="0"
                  value={form.nextOilChangeMileageKm}
                  onChange={(event) => updateField("nextOilChangeMileageKm", event.target.value)}
                />
              </ReminderField>
            </>
          ) : null}

          {selectedType === "insurance" ? (
            <ReminderField
              label="Échéance assurance"
              description="Date limite à surveiller pour le renouvellement."
              htmlFor="insuranceExpiryDate"
            >
              <Input
                id="insuranceExpiryDate"
                type="date"
                value={form.insuranceExpiryDate}
                onChange={(event) => updateField("insuranceExpiryDate", event.target.value)}
              />
            </ReminderField>
          ) : null}

          {selectedType === "inspection" ? (
            <ReminderField
              label="Échéance visite technique"
              description="Date du prochain contrôle technique."
              htmlFor="nextTechnicalInspectionDate"
            >
              <Input
                id="nextTechnicalInspectionDate"
                type="date"
                value={form.nextTechnicalInspectionDate}
                onChange={(event) => updateField("nextTechnicalInspectionDate", event.target.value)}
              />
            </ReminderField>
          ) : null}

          {selectedType === "vignette" ? (
            <ReminderField
              label="Échéance vignette"
              description="Date prévue pour le prochain renouvellement."
              htmlFor="vignetteExpiryDate"
            >
              <Input
                id="vignetteExpiryDate"
                type="date"
                value={form.vignetteExpiryDate}
                onChange={(event) => updateField("vignetteExpiryDate", event.target.value)}
              />
            </ReminderField>
          ) : null}

          {selectedType === "other" ? (
            <ReminderField
              label="Suivi libre"
              description="Ajoutez un rappel opérationnel ou une note d’entretien personnalisée."
              htmlFor="maintenanceNotes"
            >
              <Textarea
                id="maintenanceNotes"
                rows={5}
                value={form.maintenanceNotes}
                onChange={(event) => updateField("maintenanceNotes", event.target.value)}
                placeholder="Ex: contrôle pneus après retour, suivi carrosserie, rendez-vous atelier."
              />
            </ReminderField>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Fermer
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4" />
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

const REMINDER_TYPE_OPTIONS: Array<{
  value: ReminderSheetType;
  label: string;
  description: string;
  icon: ElementType;
}> = [
  {
    value: "oil",
    label: "Vidange",
    description: "Planifier la prochaine échéance d’entretien et son seuil kilométrique.",
    icon: Wrench,
  },
  {
    value: "insurance",
    label: "Assurance",
    description: "Suivre la date de renouvellement de l’assurance du véhicule.",
    icon: ShieldCheck,
  },
  {
    value: "inspection",
    label: "Visite technique",
    description: "Renseigner la prochaine visite technique obligatoire.",
    icon: ClipboardCheck,
  },
  {
    value: "vignette",
    label: "Vignette",
    description: "Préparer la prochaine échéance de vignette.",
    icon: Sticker,
  },
  {
    value: "other",
    label: "Autre suivi",
    description: "Créer un rappel libre ou une note d’entretien spécifique.",
    icon: FileText,
  },
];

function ReminderField({
  label,
  htmlFor,
  description,
  children,
}: {
  label: string;
  htmlFor: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-slate-400" />
        <Label htmlFor={htmlFor}>{label}</Label>
      </div>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      {children}
    </div>
  );
}
