"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveWebsiteSettings } from "@/lib/actions/website";
import { getStorefrontPath } from "@/lib/storefront/routes";
import type { WebsiteSettingsFormData } from "@/lib/validations/website";

interface WebsiteSettingsFormProps {
  initialValues: WebsiteSettingsFormData;
  previewUrl?: string | null;
}

export function WebsiteSettingsForm({ initialValues, previewUrl }: WebsiteSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pickupLocationsText, setPickupLocationsText] = useState(initialValues.pickupLocations.join("\n"));
  const [form, setForm] = useState(initialValues);

  const normalizedPreview = useMemo(() => {
    if (!form.agencySlug) return previewUrl;
    if (typeof window === "undefined") {
      return getStorefrontPath(form.agencySlug);
    }
    return `${window.location.origin}${getStorefrontPath(form.agencySlug)}`;
  }, [form.agencySlug, previewUrl]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        const payload: WebsiteSettingsFormData = {
          ...form,
          pickupLocations: pickupLocationsText
            .split(/\n|,/)
            .map((item) => item.trim())
            .filter(Boolean),
        };

        const result = await saveWebsiteSettings(payload);
        if (result?.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Site web enregistré");
        router.refresh();
      })();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border/70 bg-white p-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Globe className="h-4 w-4 text-blue-600" />
            Storefront public
          </div>
          <p className="text-sm text-slate-600">
            Activez une vitrine simple, alimentée par vos véhicules déjà présents dans Locaryx.
          </p>
          {previewUrl ? (
            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-700 underline-offset-4 hover:underline">
              Ouvrir la vitrine actuelle
            </a>
          ) : null}
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-3 py-2">
          <Label htmlFor="isWebsiteEnabled" className="text-sm font-medium">Activer le site</Label>
          <Switch
            id="isWebsiteEnabled"
            checked={form.isWebsiteEnabled}
            onCheckedChange={(checked) => setForm((current) => ({ ...current, isWebsiteEnabled: checked }))}
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Slug public" htmlFor="agencySlug" hint="Ex : atlas-rent-casablanca">
          <Input
            id="agencySlug"
            value={form.agencySlug}
            onChange={(event) => setForm((current) => ({ ...current, agencySlug: event.target.value.toLowerCase() }))}
            placeholder="atlas-rent-casablanca"
          />
        </Field>
        <Field label="Titre du site" htmlFor="siteTitle">
          <Input
            id="siteTitle"
            value={form.siteTitle ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, siteTitle: event.target.value }))}
            placeholder="Atlas Rent Casablanca"
          />
        </Field>
        <Field label="Titre hero" htmlFor="heroTitle">
          <Input
            id="heroTitle"
            value={form.heroTitle ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, heroTitle: event.target.value }))}
            placeholder="Votre voiture, prête aujourd'hui"
          />
        </Field>
        <Field label="Image hero" htmlFor="heroImageUrl">
          <Input
            id="heroImageUrl"
            value={form.heroImageUrl ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, heroImageUrl: event.target.value }))}
            placeholder="https://..."
          />
        </Field>
      </div>

      <Field label="Sous-titre hero" htmlFor="heroSubtitle">
        <Textarea
          id="heroSubtitle"
          value={form.heroSubtitle ?? ""}
          onChange={(event) => setForm((current) => ({ ...current, heroSubtitle: event.target.value }))}
          placeholder="Réservez votre prochaine location directement auprès de l'agence."
          className="min-h-24"
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Téléphone" htmlFor="contactPhone">
          <Input
            id="contactPhone"
            value={form.contactPhone ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))}
            placeholder="+212..."
          />
        </Field>
        <Field label="WhatsApp" htmlFor="whatsappPhone">
          <Input
            id="whatsappPhone"
            value={form.whatsappPhone ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, whatsappPhone: event.target.value }))}
            placeholder="+212..."
          />
        </Field>
        <Field label="Email" htmlFor="contactEmail">
          <Input
            id="contactEmail"
            type="email"
            value={form.contactEmail ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
            placeholder="contact@agence.ma"
          />
        </Field>
        <Field label="Adresse" htmlFor="address">
          <Input
            id="address"
            value={form.address ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            placeholder="Boulevard Mohammed V, Casablanca"
          />
        </Field>
      </div>

      <Field label="Lieux de prise en charge" htmlFor="pickupLocations" hint="Un lieu par ligne ou séparés par des virgules.">
        <Textarea
          id="pickupLocations"
          value={pickupLocationsText}
          onChange={(event) => setPickupLocationsText(event.target.value)}
          className="min-h-28"
          placeholder={"Agence centre-ville\nAéroport Mohammed V\nGare Casa Voyageurs"}
        />
      </Field>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Aperçu du lien public</p>
        <code className="rounded-lg bg-white px-3 py-2 text-xs text-slate-700">{normalizedPreview || "Choisissez d'abord un slug public."}</code>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Enregistrer le site web
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
