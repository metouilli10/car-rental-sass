"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
} from "lucide-react";
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

  const pickupLocationsPreview = useMemo(
    () => pickupLocationsText
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean),
    [pickupLocationsText],
  );

  const publicTitle = form.siteTitle?.trim() || "Titre du site à compléter";
  const publicHeroTitle = form.heroTitle?.trim() || "Message d’accueil à compléter";
  const publicHeroSubtitle = form.heroSubtitle?.trim() || "Ajoutez une phrase courte pour présenter votre service.";
  const publicContactItems = [
    form.contactPhone?.trim() ? `Téléphone: ${form.contactPhone.trim()}` : null,
    form.whatsappPhone?.trim() ? `WhatsApp: ${form.whatsappPhone.trim()}` : null,
    form.contactEmail?.trim() ? `Email: ${form.contactEmail.trim()}` : null,
  ].filter((item): item is string => Boolean(item));

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
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border/70 bg-white p-5 sm:p-6">
      <Section
        icon={<Globe className="h-4 w-4" />}
        title="Publication"
        description="Activez la vitrine publique quand les textes, contacts et véhicules publiés sont prêts."
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-slate-900">Vitrine publique Locaryx</p>
            <p className="text-sm leading-6 text-slate-600">
              Vos clients voient une page premium avec le visuel Touareg, votre flotte publiée et un formulaire de
              demande.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-blue-200 bg-white px-3 py-2">
            <Label htmlFor="isWebsiteEnabled" className="text-sm font-medium">
              Activer le site
            </Label>
            <Switch
              id="isWebsiteEnabled"
              checked={form.isWebsiteEnabled}
              onCheckedChange={(checked) => setForm((current) => ({ ...current, isWebsiteEnabled: checked }))}
            />
          </div>
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
        <div className="space-y-6">
          <Section
            icon={<Link2 className="h-4 w-4" />}
            title="Identité publique"
            description="Ces informations structurent l’adresse de partage, le nom affiché dans l’en-tête et les métadonnées de la page."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Slug public" htmlFor="agencySlug" hint="Utilisé dans le lien public, ex : auto-maroc-location.">
                <Input
                  id="agencySlug"
                  value={form.agencySlug}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, agencySlug: event.target.value.toLowerCase() }))
                  }
                  placeholder="atlas-rent-casablanca"
                />
              </Field>
              <Field label="Nom affiché du site" htmlFor="siteTitle" hint="Affiché dans la navigation et le pied de page.">
                <Input
                  id="siteTitle"
                  value={form.siteTitle ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, siteTitle: event.target.value }))}
                  placeholder="Atlas Rent Casablanca"
                />
              </Field>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-slate-900">Lien public généré</p>
                  <code className="block overflow-x-auto rounded-lg bg-white px-3 py-2 text-xs text-slate-700">
                    {normalizedPreview || "Choisissez d'abord un slug public."}
                  </code>
                </div>
                {normalizedPreview ? (
                  <a
                    href={normalizedPreview}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Ouvrir
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </Section>

          <Section
            icon={<MessageSquareText className="h-4 w-4" />}
            title="Message d’accueil"
            description="Texte court et clair pour présenter la promesse client. Le site public garde le visuel Touareg par défaut."
          >
            <div className="space-y-5">
              <Field label="Titre principal" htmlFor="heroTitle" hint="Utilisé pour le titre de la page et les aperçus de partage.">
                <Input
                  id="heroTitle"
                  value={form.heroTitle ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, heroTitle: event.target.value }))}
                  placeholder="Location de voitures à Casablanca"
                />
              </Field>
              <Field
                label="Phrase d’introduction"
                htmlFor="heroSubtitle"
                hint="Une ou deux phrases maximum : service, zone, promesse de réponse ou validation humaine."
              >
                <Textarea
                  id="heroSubtitle"
                  value={form.heroSubtitle ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, heroSubtitle: event.target.value }))}
                  placeholder="Choisissez un véhicule et envoyez votre demande. Notre équipe confirme rapidement la disponibilité."
                  className="min-h-24"
                />
              </Field>
            </div>
          </Section>

          <Section
            icon={<Phone className="h-4 w-4" />}
            title="Contact agence"
            description="Coordonnées affichées sur la page et utilisées comme option de contact rapide."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Téléphone" htmlFor="contactPhone" hint="Affiché pour l’appel direct.">
                <Input
                  id="contactPhone"
                  value={form.contactPhone ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))}
                  placeholder="+212..."
                />
              </Field>
              <Field label="WhatsApp" htmlFor="whatsappPhone" hint="Numéro à privilégier pour les échanges rapides.">
                <Input
                  id="whatsappPhone"
                  value={form.whatsappPhone ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, whatsappPhone: event.target.value }))}
                  placeholder="+212..."
                />
              </Field>
              <Field label="Email" htmlFor="contactEmail" hint="Affiché dans la section contact.">
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
                  placeholder="contact@agence.ma"
                />
              </Field>
              <Field label="Adresse" htmlFor="address" hint="Adresse ou zone principale visible par les clients.">
                <Input
                  id="address"
                  value={form.address ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Boulevard Mohammed V, Casablanca"
                />
              </Field>
            </div>
          </Section>

          <Section
            icon={<MapPin className="h-4 w-4" />}
            title="Retrait et retour"
            description="Lieux proposés dans le formulaire de demande pour éviter les demandes floues."
          >
            <Field
              label="Lieux de prise en charge"
              htmlFor="pickupLocations"
              hint="Un lieu par ligne ou séparés par des virgules. Les mêmes options servent au retrait et au retour."
            >
              <Textarea
                id="pickupLocations"
                value={pickupLocationsText}
                onChange={(event) => setPickupLocationsText(event.target.value)}
                className="min-h-28"
                placeholder={"Agence centre-ville\nAéroport Mohammed V\nGare Casa Voyageurs"}
              />
            </Field>
          </Section>
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 xl:sticky xl:top-24">
          <div>
            <p className="text-sm font-semibold text-slate-950">Aperçu des informations publiées</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Résumé des données qui donnent du sens à la vitrine client.
            </p>
          </div>

          <div className="space-y-4 rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200/70">
            <PreviewItem label="Site" value={publicTitle} />
            <PreviewItem label="Message" value={publicHeroTitle} />
            <PreviewItem label="Introduction" value={publicHeroSubtitle} muted={!form.heroSubtitle?.trim()} />
            <PreviewItem label="Adresse" value={form.address?.trim() || "Adresse à compléter"} muted={!form.address?.trim()} />
            <PreviewList
              label="Contact"
              items={publicContactItems.length > 0 ? publicContactItems : ["Coordonnées à compléter"]}
              muted={publicContactItems.length === 0}
            />
            <PreviewList
              label="Lieux"
              items={pickupLocationsPreview.length > 0 ? pickupLocationsPreview : ["Agence"]}
              muted={pickupLocationsPreview.length === 0}
            />
            <PreviewItem
              label="Lien"
              value={normalizedPreview || "Slug public à compléter"}
              muted={!normalizedPreview}
              monospace
            />
          </div>
        </aside>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          Le visuel d’accueil du site public reste géré par Locaryx pour garder une présentation cohérente.
        </p>
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Enregistrer le site web
        </Button>
      </div>
    </form>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      {children}
    </section>
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
      <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-900">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function PreviewItem({
  label,
  value,
  muted = false,
  monospace = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  monospace?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p
        className={[
          "break-words text-sm leading-6",
          muted ? "text-slate-400" : "text-slate-800",
          monospace ? "font-mono text-xs" : "font-medium",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function PreviewList({ label, items, muted = false }: { label: string; items: string[]; muted?: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={[
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              muted ? "border-slate-200 bg-slate-50 text-slate-400" : "border-blue-100 bg-blue-50 text-blue-800",
            ].join(" ")}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
