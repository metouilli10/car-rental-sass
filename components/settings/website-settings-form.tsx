"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  MapPin,
  MessageSquareText,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  connectStorefrontDomain,
  refreshStorefrontDomainStatus,
  removeStorefrontDomain,
  saveWebsiteSettings,
  type StorefrontDomainFormValues,
} from "@/lib/actions/website";
import { getStorefrontPath } from "@/lib/storefront/routes";
import {
  getDnsProviderHostValue,
  getEffectiveStorefrontVerificationRecords,
  getRegistrableStorefrontDomain,
  type StorefrontVerificationRecord,
} from "@/lib/storefront/domains";
import type { WebsiteSettingsFormData } from "@/lib/validations/website";

interface WebsiteSettingsFormProps {
  initialValues: WebsiteSettingsFormData;
  initialDomain: StorefrontDomainFormValues;
  previewUrl?: string | null;
}

export function WebsiteSettingsForm({
  initialValues,
  initialDomain,
  previewUrl,
}: WebsiteSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDomainPending, startDomainTransition] = useTransition();
  const [pickupLocationsText, setPickupLocationsText] = useState(initialValues.pickupLocations.join("\n"));
  const [form, setForm] = useState(initialValues);
  const [domain, setDomain] = useState(initialDomain);
  const [domainInput, setDomainInput] = useState(initialDomain.hostname);

  useEffect(() => {
    setDomain(initialDomain);
    setDomainInput(initialDomain.hostname);
  }, [initialDomain]);

  const normalizedPreview = useMemo(() => {
    if (!form.agencySlug) return previewUrl;
    if (typeof window === "undefined") {
      return getStorefrontPath(form.agencySlug);
    }
    return `${window.location.origin}${getStorefrontPath(form.agencySlug)}`;
  }, [form.agencySlug, previewUrl]);

  const pickupLocationsPreview = useMemo(
    () =>
      pickupLocationsText
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    [pickupLocationsText],
  );

  const publicTitle = form.siteTitle?.trim() || "Titre du site à compléter";
  const publicHeroTitle = form.heroTitle?.trim() || "Message d’accueil à compléter";
  const publicHeroSubtitle =
    form.heroSubtitle?.trim() || "Ajoutez une phrase courte pour présenter votre service.";
  const publicContactItems = [
    form.contactPhone?.trim() ? `Téléphone: ${form.contactPhone.trim()}` : null,
    form.whatsappPhone?.trim() ? `WhatsApp: ${form.whatsappPhone.trim()}` : null,
    form.contactEmail?.trim() ? `Email: ${form.contactEmail.trim()}` : null,
  ].filter((item): item is string => Boolean(item));

  const domainStatusMeta = getDomainStatusMeta(domain.status);
  const domainSummary =
    domain.hostname.trim().length > 0
      ? `https://${domain.hostname}`
      : "Aucun domaine personnalisé connecté";
  const dnsInstructions = useMemo(
    () => getEffectiveStorefrontVerificationRecords(domain.hostname, domain.verificationRecords),
    [domain.hostname, domain.verificationRecords],
  );
  const isApexCustomDomain =
    domain.hostname.trim().length > 0 &&
    getRegistrableStorefrontDomain(domain.hostname) === domain.hostname.trim().toLowerCase();

  function refreshPage() {
    router.refresh();
  }

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
        refreshPage();
      })();
    });
  }

  function handleConnectDomain() {
    startDomainTransition(() => {
      void (async () => {
        const result = await connectStorefrontDomain({ hostname: domainInput });
        if (result?.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Domaine enregistré. Ajoutez les DNS puis vérifiez-le.");
        refreshPage();
      })();
    });
  }

  function handleRefreshDomain() {
    startDomainTransition(() => {
      void (async () => {
        const result = await refreshStorefrontDomainStatus();
        if ("error" in result) {
          toast.error(result.error);
          return;
        }

        if (result.status === "VERIFIED") {
          toast.success(result.message);
        } else if (result.status === "ERROR") {
          toast.error(result.message);
        } else {
          toast.warning(result.message || "Vérification DNS en attente.");
        }
        refreshPage();
      })();
    });
  }

  function handleRemoveDomain() {
    startDomainTransition(() => {
      void (async () => {
        const result = await removeStorefrontDomain();
        if (result?.error) {
          toast.error(result.error);
          return;
        }

        setDomainInput("");
        toast.success("Domaine personnalisé supprimé");
        refreshPage();
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
              <Field
                label="Slug public"
                htmlFor="agencySlug"
                hint="Utilisé dans le lien public Locaryx, ex : auto-maroc-location."
              >
                <Input
                  id="agencySlug"
                  value={form.agencySlug}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, agencySlug: event.target.value.toLowerCase() }))
                  }
                  placeholder="atlas-rent-casablanca"
                />
              </Field>
              <Field
                label="Nom affiché du site"
                htmlFor="siteTitle"
                hint="Affiché dans la navigation et le pied de page."
              >
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
                  <p className="font-medium text-slate-900">Lien public de secours</p>
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
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Domaine personnalisé"
            description="Connectez un domaine de votre agence. Une fois vérifié, il devient l’adresse principale du storefront."
          >
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <Field
                  label="Nom de domaine"
                  htmlFor="storefront-domain"
                  hint="Exemple : www.monagence.ma. Un seul domaine personnalisé est autorisé en v1."
                >
                  <Input
                    id="storefront-domain"
                    value={domainInput}
                    onChange={(event) => setDomainInput(event.target.value.toLowerCase())}
                    placeholder="www.monagence.ma"
                  />
                </Field>
                <Button type="button" onClick={handleConnectDomain} disabled={isDomainPending || !domainInput.trim()}>
                  {isDomainPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Connecter le domaine
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">Statut actuel</p>
                      <Badge variant={domainStatusMeta.variant}>{domainStatusMeta.label}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">{domainSummary}</p>
                    {domain.verificationError ? (
                      <p className="text-xs leading-5 text-amber-700">{domain.verificationError}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRefreshDomain}
                      disabled={isDomainPending || domain.status === "NOT_CONNECTED"}
                    >
                      {isDomainPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Vérifier
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleRemoveDomain}
                      disabled={isDomainPending || domain.status === "NOT_CONNECTED"}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <MetaItem label="Primaire" value={domain.isPrimary ? "Oui" : "Non"} />
                  <MetaItem
                    label="Vérifié le"
                    value={domain.verifiedAt ? formatDate(domain.verifiedAt) : "Pas encore"}
                  />
                  <MetaItem
                    label="Dernier contrôle"
                    value={domain.lastCheckedAt ? formatDate(domain.lastCheckedAt) : "Jamais"}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">DNS à configurer</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Saisissez exactement ces champs chez votre registrar ou fournisseur DNS, puis cliquez sur
                    <span className="font-medium text-slate-700"> Vérifier</span>.
                  </p>
                  {domain.hostname ? (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {isApexCustomDomain
                        ? "Pour le domaine racine, la plupart des fournisseurs demandent l’hôte "
                        : "La plupart des fournisseurs demandent un hôte relatif comme "}
                      <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-slate-700">
                        {isApexCustomDomain ? "@" : getDnsProviderHostValue(domain.hostname, domain.hostname)}
                      </code>
                      {isApexCustomDomain
                        ? " au lieu du nom de domaine complet."
                        : " au lieu du nom de domaine complet."}
                    </p>
                  ) : null}
                </div>

                {dnsInstructions.length > 0 ? (
                  <div className="space-y-3">
                    {dnsInstructions.map((record, index) => (
                      <DnsRecordCard
                        key={`${record.type}-${record.domain}-${record.value}-${index}`}
                        domainHostname={domain.hostname}
                        record={record}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Les enregistrements DNS apparaîtront ici après la connexion du domaine.
                  </p>
                )}
              </div>
            </div>
          </Section>

          <Section
            icon={<MessageSquareText className="h-4 w-4" />}
            title="Message d’accueil"
            description="Texte court et clair pour présenter la promesse client. Le site public garde le visuel Touareg par défaut."
          >
            <div className="space-y-5">
              <Field
                label="Titre principal"
                htmlFor="heroTitle"
                hint="Utilisé pour le titre de la page et les aperçus de partage."
              >
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
            <PreviewItem
              label="Adresse"
              value={form.address?.trim() || "Adresse à compléter"}
              muted={!form.address?.trim()}
            />
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
              label="Lien Locaryx"
              value={normalizedPreview || "Slug public à compléter"}
              muted={!normalizedPreview}
              monospace
            />
            <PreviewItem
              label="Domaine principal"
              value={domainSummary}
              muted={domain.status === "NOT_CONNECTED"}
              monospace={domain.status !== "NOT_CONNECTED"}
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

function DnsRecordCard({
  domainHostname,
  record,
}: {
  domainHostname: string;
  record: StorefrontVerificationRecord;
}) {
  const statusMeta = getDnsRecordStatusMeta(record.status);
  const providerHost = getDnsProviderHostValue(domainHostname, record.domain);
  const normalizedValue = record.value.trim().replace(/\.+$/, "");
  const helperNote = getDnsRecordProviderNote(domainHostname, record);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="grid gap-3 md:grid-cols-[5rem_minmax(0,1fr)]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Type</p>
          <p className="mt-1 font-semibold text-slate-900">{record.type}</p>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          </div>
          <MetaItem label="Hôte à saisir" value={providerHost} monospace />
          <MetaItem label="Valeur à saisir" value={normalizedValue} monospace />
          <MetaItem label="Domaine complet visé" value={record.domain} monospace />
          {record.observedValues && record.observedValues.length > 0 ? (
            <MetaItem label="Valeur détectée" value={record.observedValues.join(", ")} monospace />
          ) : null}
          <MetaItem label="Instruction" value={helperNote || record.reason || "Ajoutez cette entrée DNS exactement."} />
        </div>
      </div>
    </div>
  );
}

function getDnsRecordProviderNote(domainHostname: string, record: StorefrontVerificationRecord) {
  const providerHost = getDnsProviderHostValue(domainHostname, record.domain);

  switch (record.type.toUpperCase()) {
    case "A":
      return providerHost === "@"
        ? "Créez un enregistrement A sur l’hôte @ pour le domaine racine."
        : `Créez un enregistrement A sur l’hôte ${providerHost}.`;
    case "CNAME":
      return `Créez un CNAME sur l’hôte ${providerHost} et ne mélangez pas CNAME et A sur ce même hôte.`;
    case "TXT":
      return `Créez un TXT sur l’hôte ${providerHost} avec cette valeur de vérification.`;
    default:
      return record.reason || null;
  }
}

function MetaItem({
  label,
  value,
  monospace = false,
}: {
  label: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={monospace ? "break-all font-mono text-xs text-slate-700" : "text-sm text-slate-700"}>{value}</p>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getDomainStatusMeta(status: StorefrontDomainFormValues["status"]) {
  switch (status) {
    case "VERIFIED":
      return { label: "Verified", variant: "success" as const };
    case "PENDING":
      return { label: "Pending DNS", variant: "warning" as const };
    case "ERROR":
      return { label: "Error", variant: "destructive" as const };
    default:
      return { label: "Not connected", variant: "secondary" as const };
  }
}

function getDnsRecordStatusMeta(status: StorefrontVerificationRecord["status"]) {
  switch (status) {
    case "verified":
      return { label: "Détecté", variant: "success" as const };
    case "mismatch":
      return { label: "Valeur différente", variant: "destructive" as const };
    case "missing":
      return { label: "Non détecté", variant: "warning" as const };
    default:
      return { label: "À vérifier", variant: "secondary" as const };
  }
}
