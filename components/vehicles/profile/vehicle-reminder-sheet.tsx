"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Save } from "lucide-react";
import { updateVehicleReminderFields } from "@/lib/actions/vehicles";
import type { VehicleProfileTab } from "@/lib/vehicles/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface VehicleReminderSheetProps {
  vehicleId: string;
  defaultOpen: boolean;
  currentTab: VehicleProfileTab;
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
  defaults,
}: VehicleReminderSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(defaultOpen);
  const [form, setForm] = useState(defaults);

  const nextUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", currentTab);
    params.delete("sheet");
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
              router.replace(`${pathname}?tab=maintenance`, { scroll: false });
              router.refresh();
            });
          }}
        >
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

          <ReminderField label="Échéance assurance" htmlFor="insuranceExpiryDate">
            <Input
              id="insuranceExpiryDate"
              type="date"
              value={form.insuranceExpiryDate}
              onChange={(event) => updateField("insuranceExpiryDate", event.target.value)}
            />
          </ReminderField>

          <ReminderField label="Échéance visite technique" htmlFor="nextTechnicalInspectionDate">
            <Input
              id="nextTechnicalInspectionDate"
              type="date"
              value={form.nextTechnicalInspectionDate}
              onChange={(event) => updateField("nextTechnicalInspectionDate", event.target.value)}
            />
          </ReminderField>

          <ReminderField label="Échéance vignette" htmlFor="vignetteExpiryDate">
            <Input
              id="vignetteExpiryDate"
              type="date"
              value={form.vignetteExpiryDate}
              onChange={(event) => updateField("vignetteExpiryDate", event.target.value)}
            />
          </ReminderField>

          <ReminderField label="Notes d’entretien" htmlFor="maintenanceNotes">
            <Textarea
              id="maintenanceNotes"
              rows={5}
              value={form.maintenanceNotes}
              onChange={(event) => updateField("maintenanceNotes", event.target.value)}
              placeholder="Ex: vidange à planifier après le retour du véhicule."
            />
          </ReminderField>

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

function ReminderField({
  label,
  htmlFor,
  description,
  children,
}: {
  label: string;
  htmlFor: string;
  description?: string;
  children: React.ReactNode;
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
