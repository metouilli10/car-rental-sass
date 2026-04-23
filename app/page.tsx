import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarClock, CarFront, CreditCard, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    title: "Réservations sans friction",
    body: "Suivez les départs, retours et disponibilités dans un poste de pilotage clair pour toute l'équipe.",
    icon: CalendarClock,
  },
  {
    title: "Flotte sous contrôle",
    body: "Centralisez véhicules, documents, rappels et inspections sans multiplier les outils.",
    icon: CarFront,
  },
  {
    title: "Paiements plus nets",
    body: "Encaissements, cautions et suivi financier restent lisibles, même pendant les journées chargées.",
    icon: CreditCard,
  },
];

const trustPoints = [
  "Workflow conçu pour agences marocaines",
  "Validation humaine sur les demandes du site",
  "Expérience fluide sur desktop, mobile et PWA",
];

export default async function HomePage() {
  const session = await getSession();

  if (session?.user) {
    redirect("/post-login");
  }

  return (
    <main className="public-shell min-h-screen text-[hsl(var(--public-ink))]">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--public-border))]/70 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-32 sm:w-36">
              <Image
                src="/assets/locaryx logo new.png"
                alt="Locaryx"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild variant="public" className="h-11 px-5 text-sm font-semibold">
              <Link href="/signup">Créer mon espace</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="overflow-hidden px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Votre agence, sous contrôle
            </div>

            <h1 className="mt-6 text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.06em] text-[hsl(var(--public-ink))] sm:text-[3.75rem] lg:text-[4.9rem]">
              Le cockpit premium pour piloter votre agence de location.
            </h1>

            <p className="mt-6 max-w-xl text-[1.05rem] leading-8 text-slate-600">
              Locaryx centralise vos réservations, votre flotte, vos paiements et votre vitrine
              publique dans une expérience calme, nette et crédible.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="public" className="h-14 px-7 text-base font-semibold">
                <Link href="/signup">
                  Créer mon espace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="public-outline" className="h-14 px-7 text-base font-medium">
                <Link href="/login">Accéder à mon tableau de bord</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              {trustPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[hsl(var(--public-border))]/80 bg-white/80 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
                >
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.08] text-primary">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <p className="leading-6">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-10 top-8 h-[78%] rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(33,150,243,0.2),transparent_60%)] blur-3xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-[hsl(var(--public-border))] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.1)]">
              <div className="flex items-center justify-between rounded-[24px] border border-subtle bg-[hsl(var(--surface-muted))] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                    Tableau de bord
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Vision claire sur les opérations du jour
                  </p>
                </div>
                <div className="rounded-full bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary">
                  Live
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[28px] border border-subtle bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,248,252,0.95))] p-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["18", "Réservations actives"],
                      ["42", "Véhicules suivis"],
                      ["96%", "Dossiers complets"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-2xl border border-subtle bg-white px-4 py-4 shadow-sm">
                        <p className="text-2xl font-semibold tracking-tight text-[hsl(var(--public-ink))]">
                          {value}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[24px] border border-subtle bg-white px-5 py-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[hsl(var(--public-ink))]">
                          Demandes à confirmer
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Priorisez les demandes web et les retours à surveiller.
                        </p>
                      </div>
                      <div className="rounded-full bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary">
                        5 urgentes
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {[
                        "Casablanca centre • Touareg • retrait demain 09:00",
                        "Aéroport Marrakech • Clio 5 • dépôt à confirmer",
                        "Rabat Agdal • Série 1 • paiement partiel reçu",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-2xl border border-subtle bg-[hsl(var(--surface-muted))] px-4 py-3"
                        >
                          <p className="text-sm text-slate-700">{item}</p>
                          <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[28px] border border-subtle bg-[hsl(var(--public-primary-soft))] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                      Site public
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-[hsl(var(--public-ink))]">
                      Une vitrine cohérente avec votre back-office.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Recevez des demandes qualifiées, sans casser votre workflow interne.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-[28px] border border-subtle bg-white shadow-sm">
                    <div className="border-b border-subtle px-5 py-4">
                      <p className="text-sm font-semibold text-[hsl(var(--public-ink))]">
                        Expérience pensée pour aller vite
                      </p>
                    </div>
                    <div className="space-y-4 px-5 py-5">
                      {highlights.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.title} className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[hsl(var(--public-ink))]">
                                {item.title}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
