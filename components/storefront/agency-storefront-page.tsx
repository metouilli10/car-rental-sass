import type { ReactNode } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CarFront,
  FileText,
  PhoneCall,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { VehicleCard } from "@/components/storefront/vehicle-card";
import type { PublicVehicle, WebsiteSettingsWithAgency } from "@/lib/storefront/queries";

interface AgencyStorefrontPageProps {
  settings: WebsiteSettingsWithAgency;
  vehicles: PublicVehicle[];
}

export function AgencyStorefrontPage({ settings, vehicles }: AgencyStorefrontPageProps) {
  const siteTitle = settings.siteTitle || settings.agency.name;
  const city = settings.agency.city;
  const heroTitle = settings.heroTitle || `Location de voitures à ${city}`;
  const heroSubtitle =
    settings.heroSubtitle ||
    `Découvrez notre sélection exclusive de véhicules à ${city} et profitez d'un accompagnement humain, rapide et rassurant à chaque étape.`;
  const contactPhone = settings.contactPhone || settings.agency.phone;
  const whatsappPhone = settings.whatsappPhone || settings.contactPhone || settings.agency.phone;
  const contactEmail = settings.contactEmail || settings.agency.email;
  const address = settings.address || settings.agency.address || city;
  const heroContactHref = whatsappPhone
    ? getWhatsAppHref(whatsappPhone)
    : contactPhone
      ? `tel:${contactPhone}`
      : contactEmail
        ? `mailto:${contactEmail}`
        : null;
  const pickupLocationSummary =
    settings.pickupLocations.length > 0
      ? settings.pickupLocations.slice(0, 2).join(" • ")
      : `Retrait à ${city}`;
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[hsl(var(--public-surface))] text-[hsl(var(--public-ink))]">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--public-border))]/70 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3 text-[hsl(var(--public-ink))]">
            {settings.agency.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.agency.logoUrl}
                alt={siteTitle}
                className="h-10 w-10 rounded-2xl object-cover shadow-[0_14px_28px_rgba(25,28,30,0.08)]"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--public-primary))] text-sm font-extrabold text-white">
                {siteTitle.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-extrabold tracking-[-0.04em]">{siteTitle}</p>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{city}</p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#" className="text-sm font-bold text-[hsl(var(--public-ink))]">
              Accueil
            </a>
            <a href="#fleet" className="text-sm font-medium text-slate-600 transition hover:text-primary">
              Véhicules
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 transition hover:text-primary">
              Processus
            </a>
            <a href="#contact" className="text-sm font-medium text-slate-600 transition hover:text-primary">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {contactPhone ? (
              <a
                href={`tel:${contactPhone}`}
                className="hidden rounded-full border border-[hsl(var(--public-border))] bg-white px-4 py-2.5 text-sm font-semibold text-[hsl(var(--public-ink))] shadow-[0_16px_30px_rgba(25,28,30,0.06)] transition hover:bg-[hsl(var(--public-primary-soft))] sm:inline-flex"
              >
                Appeler
              </a>
            ) : null}
            <a
              href="#fleet"
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--public-primary))] px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_24px_rgba(33,150,243,0.22)] transition hover:-translate-y-0.5 hover:bg-[hsl(var(--public-primary))]/92 hover:shadow-[0_18px_28px_rgba(33,150,243,0.28)]"
            >
              Réserver
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <section
        aria-labelledby="storefront-hero-title"
        className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,hsl(var(--public-primary-soft))_62%,#ffffff_100%)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(33,150,243,0.12),transparent_34%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid min-h-[37rem] items-center gap-12 lg:min-h-[43.5rem] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div className="relative z-10 max-w-[36rem]">
              <h1
                id="storefront-hero-title"
                className="max-w-none text-[2.85rem] font-extrabold leading-[1.05] tracking-[-0.068em] text-[hsl(var(--public-ink))] sm:text-[3.75rem] lg:text-[4.6rem]"
              >
                {heroTitle}
              </h1>

              <p className="mt-6 max-w-2xl text-[1.02rem] leading-[1.5] text-slate-600 sm:text-[1.12rem] lg:text-[1.18rem]">
                {heroSubtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#fleet"
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-[hsl(var(--public-primary))] px-7 py-3.5 text-base font-semibold text-white shadow-[0_14px_24px_rgba(33,150,243,0.22)] transition hover:-translate-y-0.5 hover:bg-[hsl(var(--public-primary))]/92 hover:shadow-[0_18px_28px_rgba(33,150,243,0.28)]"
                >
                  Voir les véhicules
                </a>
                <a
                  href={heroContactHref || "#contact"}
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-[hsl(var(--public-border))] bg-white px-7 py-3.5 text-base font-medium text-[hsl(var(--public-ink))] shadow-[0_10px_20px_rgba(15,23,42,0.04)] transition hover:border-primary/20 hover:bg-[hsl(var(--public-primary-soft))]"
                >
                  Contacter l’agence
                </a>
              </div>

              <div className="mt-8 grid max-w-[42rem] grid-cols-2 gap-6 text-slate-600 sm:grid-cols-4">
                <HeroTrustItem icon={<ShieldCheck className="h-[18px] w-[18px]" />} label="Validation humaine" />
                <HeroTrustItem icon={<TimerReset className="h-[18px] w-[18px]" />} label="Réponse rapide" />
                <HeroTrustItem icon={<FileText className="h-[18px] w-[18px]" />} label="Contrat clair" />
              </div>
            </div>

            <div className="relative flex min-h-[21rem] items-center justify-center sm:min-h-[25rem] lg:min-h-[39rem] lg:justify-end">
              <div className="relative flex w-full max-w-[46rem] items-center justify-center lg:mr-[-1.75rem]">
                <div className="absolute left-[22%] top-[18%] h-[72%] w-[64%] rounded-[44%_56%_46%_54%/38%_52%_48%_62%] bg-[radial-gradient(circle_at_28%_22%,rgba(223,244,255,0.52)_0%,rgba(166,212,255,0.28)_38%,rgba(54,114,214,0.18)_100%)] blur-3xl lg:left-[20%] lg:top-[16%] lg:h-[76%] lg:w-[67%]" />
                <Image
                  src="/assets/blob3.svg"
                  alt=""
                  width={900}
                  height={900}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[14%] top-[-17%] z-0 h-auto w-[92%] rotate-[4deg] scale-y-[1.1] opacity-[0.96] lg:left-[12%] lg:top-[-20%] lg:w-[94%] lg:scale-y-[1.14]"
                />
                <div className="absolute bottom-[5%] left-1/2 h-12 w-[74%] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(17,24,39,0.32)_0%,rgba(17,24,39,0.18)_34%,rgba(17,24,39,0.06)_60%,rgba(17,24,39,0)_78%)] blur-md lg:bottom-[2.5%] lg:h-14 lg:w-[78%]" />
                <div className="relative z-10 w-full max-w-[42.5rem] translate-y-6 lg:max-w-[45rem] lg:translate-x-5 lg:translate-y-6">
                  <Image
                    src="/assets/touaareg.webp"
                    alt={`Volkswagen Touareg bleu - ${siteTitle}`}
                    width={1411}
                    height={850}
                    priority
                    unoptimized
                    className="h-auto w-full object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.15)]"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-[linear-gradient(180deg,#ffffff_0%,hsl(var(--public-primary-soft))_100%)] py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary">Processus simple</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[hsl(var(--public-ink))] sm:text-5xl">
              Comment ça fonctionne
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Choisissez, envoyez votre demande, puis recevez une confirmation humaine.
            </p>
          </div>

          <div className="relative mx-auto mt-10 grid max-w-5xl gap-12 md:grid-cols-3 md:gap-16">
            <div className="pointer-events-none absolute left-[23%] top-8 hidden w-24 border-t border-dashed border-primary/20 md:block" />
            <div className="pointer-events-none absolute right-[23%] top-8 hidden w-24 border-t border-dashed border-primary/20 md:block" />
            <ProcessStep
              icon={<CarFront className="h-6 w-6" />}
              title="Choisissez un véhicule"
              body="Parcourez la flotte et sélectionnez le modèle qui correspond à votre trajet."
            />
            <ProcessStep
              icon={<CalendarClock className="h-6 w-6" />}
              title="Envoyez vos dates"
              body="Indiquez les dates, le lieu de retrait et vos coordonnées en quelques instants."
            />
            <ProcessStep
              icon={<BadgeCheck className="h-6 w-6" />}
              title="Confirmation humaine"
              body="L'agence vérifie la disponibilité réelle et vous confirme la meilleure option."
            />
          </div>
        </div>
      </section>

      <section id="fleet" className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary">
              LOCATION DE VOITURES À {city.toUpperCase()}
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[hsl(var(--public-ink))] sm:text-5xl">
              Notre flotte premium
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Découvrez notre sélection de véhicules entretenus et publiés pour faciliter une demande claire et rapide.
            </p>
          </div>

          {vehicles.length === 0 ? (
            <div className="mt-10 rounded-[2rem] bg-white p-10 shadow-[0_26px_60px_rgba(25,28,30,0.06)] ring-1 ring-[hsl(var(--public-border))]/70">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-primary/[0.1] text-[hsl(var(--public-ink))]">
                <CarFront className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-2xl font-bold tracking-[-0.04em] text-[hsl(var(--public-ink))]">
                La vitrine est prête, la flotte arrive bientôt
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                L&apos;agence n&apos;a pas encore publié de véhicules sur son site public. Vous pouvez revenir bientôt ou
                contacter directement l&apos;équipe pour connaître les disponibilités actuelles.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {contactPhone ? (
                  <a
                    href={`tel:${contactPhone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--public-primary))] px-5 py-3 text-sm font-bold text-white transition hover:bg-[hsl(var(--public-primary))]/92"
                  >
                    <PhoneCall className="h-4 w-4" />
                    Appeler l&apos;agence
                  </a>
                ) : null}
                {contactEmail ? (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--public-primary-soft))] px-5 py-3 text-sm font-bold text-[hsl(var(--public-ink))] transition hover:bg-primary/[0.12]"
                  >
                    Écrire à l&apos;agence
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  agencySlug={settings.agencySlug}
                  pickupLocations={settings.pickupLocations}
                  vehicle={vehicle}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <ClosingCta contactHref={heroContactHref || "#contact"} pickupLocationSummary={pickupLocationSummary} />

      <footer className="border-t border-white/10 bg-[linear-gradient(135deg,#1d88e5_0%,hsl(var(--public-primary))_100%)] text-white">
        <div
          id="contact"
          className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.95fr_1fr] lg:px-8"
        >
          <div className="max-w-sm">
            <p className="text-2xl font-extrabold tracking-[-0.05em]">{siteTitle}</p>
            <p className="mt-4 text-sm leading-7 text-white/82">
              {heroSubtitle}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">Navigation</p>
            <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-white/86">
              <a href="#" className="transition hover:text-white">
                Accueil
              </a>
              <a href="#fleet" className="transition hover:text-white">
                Véhicules
              </a>
              <a href="#how-it-works" className="transition hover:text-white">
                Processus
              </a>
              <a href="#contact" className="transition hover:text-white">
                Contact
              </a>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">Contact</p>
            <div className="mt-4 space-y-3 text-sm font-medium text-white/86">
              <p>{address}</p>
              {contactPhone ? (
                <a href={`tel:${contactPhone}`} className="block transition hover:text-white">
                  {contactPhone}
                </a>
              ) : null}
              {whatsappPhone ? (
                <a href={getWhatsAppHref(whatsappPhone)} className="block transition hover:text-white">
                  WhatsApp {whatsappPhone}
                </a>
              ) : null}
              {contactEmail ? (
                <a href={`mailto:${contactEmail}`} className="block transition hover:text-white">
                  {contactEmail}
                </a>
              ) : null}
            </div>
          </div>

          <div className="lg:justify-self-end">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">Réservation</p>
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/82">
              Choisissez un véhicule et envoyez une demande claire en quelques instants.
            </p>
            <p className="mt-3 max-w-xs text-xs font-medium leading-5 text-white/70">{pickupLocationSummary}</p>
            <a
              href="#fleet"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-[hsl(var(--public-primary))] shadow-[0_14px_24px_rgba(11,27,43,0.14)] transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_18px_28px_rgba(11,27,43,0.18)]"
            >
              Voir les véhicules
            </a>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs font-medium text-white/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© {siteTitle} {currentYear}</p>
            <div className="flex flex-wrap gap-4">
              <a href="#contact" className="transition hover:text-white">
                Mentions légales
              </a>
              <a href="#contact" className="transition hover:text-white">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ClosingCta({
  contactHref,
  pickupLocationSummary,
}: {
  contactHref: string;
  pickupLocationSummary: string;
}) {
  return (
    <section aria-labelledby="storefront-closing-cta-title" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] border border-[hsl(var(--public-border))] bg-[linear-gradient(135deg,#ffffff_0%,hsl(var(--public-primary-soft))_100%)] px-6 py-8 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute -right-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-primary/[0.12] blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">RÉSERVATION SIMPLE</p>
              <h2
                id="storefront-closing-cta-title"
                className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-[hsl(var(--public-ink))] sm:text-4xl"
              >
                Prêt à réserver votre véhicule ?
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                Consultez notre flotte disponible et envoyez votre demande en quelques secondes. L’agence confirme
                ensuite la disponibilité réelle.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:min-w-[24rem] lg:flex-col lg:items-stretch">
              <a
                href="#fleet"
                className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full bg-[hsl(var(--public-primary))] px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_24px_rgba(33,150,243,0.22)] transition hover:-translate-y-0.5 hover:bg-[hsl(var(--public-primary))]/92 hover:shadow-[0_18px_28px_rgba(33,150,243,0.28)]"
              >
                Voir les véhicules
              </a>
              <a
                href={contactHref}
                className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-[hsl(var(--public-border))] bg-white px-6 py-3.5 text-sm font-semibold text-[hsl(var(--public-ink))] shadow-[0_10px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-[hsl(var(--public-primary-soft))]"
              >
                Contacter l’agence
              </a>
              <p className="pt-1 text-center text-xs font-medium leading-5 text-slate-500 sm:basis-full lg:text-left">
                Confirmation humaine • Réponse rapide • {pickupLocationSummary}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getWhatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : `tel:${phone}`;
}

function HeroTrustItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-primary/45">{icon}</div>
      <p className="max-w-[10ch] text-[0.98rem] font-medium leading-[1.15] tracking-[-0.03em] text-slate-600">
        {label}
      </p>
    </div>
  );
}

function ProcessStep({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[hsl(var(--public-border))] bg-white text-primary shadow-[0_16px_28px_rgba(33,150,243,0.12)]">
        {icon}
      </div>
      <p className="mt-4 text-[18px] font-semibold tracking-[-0.025em] text-[hsl(var(--public-ink))]">{title}</p>
      <p className="mt-3 max-w-[17rem] text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
