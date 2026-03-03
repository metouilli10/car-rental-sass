import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Banknote,
  FileCheck,
  Zap,
  Headphones,
  Shield,
} from "lucide-react";
import { FAQItem } from "./_components/FAQItem";
import { Reveal } from "./_components/Reveal";
import { ScrollNav } from "./_components/ScrollNav";

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const featureSections = [
  {
    id: "fleet",
    eyebrow: "GESTION DE FLOTTE",
    heading: "Tous vos véhicules. Un seul endroit.",
    body: "Ajoutez vos véhicules en quelques clics et suivez leur statut en temps réel : disponible, en location, en maintenance ou indisponible. Accédez aux documents, à l'historique et aux échéances importantes sans chercher dans plusieurs outils.",
    bullets: [
      "Fiches véhicules complètes avec photos et documents",
      "Rappels de maintenance et de conformité",
      "Statuts clairs pour savoir tout de suite ce qui est disponible",
    ],
    screenshot: "/screenshots/catalogue.png",
    screenshotAlt: "Catalogue de véhicules LocaPro",
    layout: "copy-left" as const,
  },
  {
    id: "reservations",
    eyebrow: "RESERVATIONS",
    heading: "Réservez en 2 minutes. Suivez tout jusqu'au retour.",
    body: "Créez une réservation rapidement, appliquez vos tarifs, suppléments, remises, taxes et cautions automatiquement, puis suivez les paiements et l'état du dossier jusqu'au retour du véhicule.",
    bullets: [
      "Workflow de réservation guidé et rapide",
      "Calcul automatique des montants, taxes et cautions",
      "Visibilité immédiate sur paiements, retards et soldes",
    ],
    screenshot: "/screenshots/reservations.png",
    screenshotAlt: "Reservations LocaPro",
    layout: "copy-right" as const,
  },
  {
    id: "planning",
    eyebrow: "PLANNING & DISPONIBILITES",
    heading: "Zéro double réservation. Zéro surprise.",
    body: "Avec une vue disponibilité et un calendrier interactif, vous savez quels véhicules sont libres, occupés ou à risque de conflit. Votre équipe planifie plus vite et évite les doubles réservations.",
    bullets: [
      "Recherche rapide par dates et disponibilité",
      "Calendrier clair pour visualiser les mouvements de la flotte",
      "Moins de conflits, moins d'aller-retour manuels",
    ],
    screenshot: "/screenshots/dashboard.png",
    screenshotAlt: "Planning et disponibilites LocaPro",
    layout: "copy-left" as const,
  },
  {
    id: "finance",
    eyebrow: "FINANCES",
    heading: "Vos finances, sans zones d'ombre.",
    body: "Le centre financier et la caisse vous aident à suivre encaissements, dépenses, impayés, cautions détenues et rentabilité. Vous pilotez mieux votre cash et vous repérez plus vite les points de fuite.",
    bullets: [
      "Montants à encaisser visibles",
      "Suivi des mouvements de caisse",
      "Vision plus nette sur les soldes et la rentabilité",
    ],
    screenshot: "/screenshots/finance.png",
    screenshotAlt: "Centre financier LocaPro",
    layout: "copy-left" as const,
  },
  {
    id: "clients",
    eyebrow: "GESTION CLIENTS",
    heading: "Chaque client reste documenté, clair et facile à retrouver.",
    body: "Centralisez les documents, les coordonnées, l'historique de réservations et le suivi des paiements pour travailler avec plus de fiabilité et moins d'improvisation.",
    bullets: [
      "Documents clients rangés au même endroit",
      "Historique complet par client",
      "Export simple pour vos suivis et rapports",
    ],
    screenshot: "/screenshots/clients.png",
    screenshotAlt: "Gestion clients LocaPro",
    layout: "copy-right" as const,
  },
  {
    id: "inspections",
    eyebrow: "INSPECTIONS & CAUTIONS",
    heading: "Documentez l'état du véhicule et réduisez les litiges.",
    body: "Au départ comme au retour, enregistrez les constats, ajoutez les photos, estimez les dommages et décidez rapidement du sort de la caution. Chaque dossier devient plus clair, plus défendable et plus professionnel.",
    bullets: [
      "Photos et preuves rattachées au dossier",
      "Évaluation plus claire des dommages",
      "Décision de caution plus simple et mieux tracée",
    ],
    screenshot: "/screenshots/reservations.png",
    screenshotAlt: "Inspections et cautions LocaPro",
    layout: "copy-left" as const,
  },
  {
    id: "infractions",
    eyebrow: "INFRACTIONS",
    heading: "Les PV restent rattachés au bon véhicule, au bon client, au bon dossier.",
    body: "Enregistrez les infractions, attribuez la responsabilité et suivez leur statut sans perdre le fil. Vous gardez un historique propre, exploitable et facile à retrouver.",
    bullets: [
      "Lien direct avec véhicule, réservation et client",
      "Suivi du statut de traitement",
      "Recherche simple grâce aux filtres",
    ],
    screenshot: "/screenshots/finance.png",
    screenshotAlt: "Infractions LocaPro",
    layout: "copy-right" as const,
  },
];

const differentiators = [
  {
    icon: MessageCircle,
    title: "WhatsApp intégré",
    description: "Confirmations et suivis sans copier-coller permanent",
  },
  {
    icon: Banknote,
    title: "Dirhams (MAD)",
    description: "Tarifs, encaissements et cautions dans votre réalité locale",
  },
  {
    icon: FileCheck,
    title: "Documents traçables",
    description: "Des dossiers plus clairs, plus défendables en cas de litige",
  },
  {
    icon: Zap,
    title: "Prise en main rapide",
    description: "Une interface claire, orientée action dès le premier jour",
  },
  {
    icon: Headphones,
    title: "Support humain",
    description: "En français, réactif, concret et utile sur le terrain",
  },
];

const qualitativeProof = [
  {
    title: "Réservations centralisées",
    body: "Tous vos dossiers avancent dans un seul flux de travail, sans perdre d'information entre outils.",
  },
  {
    title: "Suivi en temps réel",
    body: "Statuts, retours, encaissements et actions critiques restent visibles immédiatement.",
  },
  {
    title: "Conçu pour le terrain",
    body: "Pensé pour les agences qui travaillent vite, avec WhatsApp, plusieurs urgences et peu de marge d'erreur.",
  },
];

const proofCases = [
  {
    kicker: "Retours du jour",
    title: "Vous voyez tout de suite ce qui doit sortir, revenir ou être encaissé.",
    body: "Le tableau de bord remonte les départs, retours, retards et montants à encaisser sans que l'équipe ait à recouper plusieurs fichiers.",
    outcome: "Moins d'oublis sur les actions critiques",
  },
  {
    kicker: "Cautions & litiges",
    title: "Chaque dossier garde ses preuves, ses photos et sa décision de caution.",
    body: "Au retour, les constats et documents restent rattachés au bon client et au bon véhicule. Le dossier est plus propre en cas de discussion.",
    outcome: "Moins de flou au moment de trancher",
  },
  {
    kicker: "Disponibilité",
    title: "Le planning réduit les conflits avant qu'ils ne deviennent un problème.",
    body: "Avec une vue claire sur la flotte disponible, l'équipe réserve plus vite et évite les doubles réservations qui coûtent du temps et de la confiance.",
    outcome: "Moins de frictions dans l'organisation",
  },
];

const businessStats = [
  {
    value: "90%",
    label: "des actions critiques visibles dans un seul flux de travail",
  },
  {
    value: "3x",
    label: "moins d'aller-retour pour retrouver une information critique",
  },
  {
    value: "0",
    label: "outil de plus à surveiller pour faire tourner l'agence",
  },
];

const pricing = [
  {
    name: "Starter",
    price: "0",
    period: "/mois",
    tagline: "Pour démarrer (jusqu'à 5 véhicules)",
    features: [
      "Jusqu'à 5 véhicules",
      "Réservations illimitées",
      "Tableau de bord de base",
      "Prise en main simple",
    ],
    cta: "Démarrer",
    popular: false,
  },
  {
    name: "Pro",
    price: "499",
    period: "/mois",
    tagline: "Pour piloter l'agence au quotidien",
    features: [
      "Tout Starter +",
      "Véhicules illimités",
      "Centre financier",
      "Inspections & cautions",
      "WhatsApp intégré",
      "Support prioritaire",
    ],
    cta: "Essayer gratuitement",
    popular: true,
    badge: "Le plus choisi",
  },
  {
    name: "Agence+",
    price: "899",
    period: "/mois",
    tagline: "Pour les structures multi-utilisateurs",
    features: [
      "Tout Pro +",
      "Multi-utilisateurs",
      "Multi-agences",
      "API",
      "Accompagnement dédié",
    ],
    cta: "Parler à l'équipe",
    popular: false,
  },
];

const faqs = [
  {
    q: "Est-ce que LocaPro est compliqué à utiliser ?",
    a: "Non. LocaPro est conçu pour des actions claires, des statuts visibles et une prise en main rapide, même pour une équipe qui travaille déjà sous pression.",
    defaultOpen: true,
  },
  {
    q: "Puis-je l'utiliser sur mon téléphone ?",
    a: "Oui. LocaPro fonctionne sur ordinateur, tablette et smartphone pour garder un accès simple à l'activité, même en déplacement.",
    defaultOpen: false,
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Vos données restent centralisées, protégées et gérées dans un environnement sécurisé. Vous gardez la maîtrise de vos informations.",
    defaultOpen: false,
  },
  {
    q: "Que se passe-t-il si j'annule ?",
    a: "Vous pouvez arrêter à tout moment. L'objectif de LocaPro est de réduire la friction, pas d'en créer.",
    defaultOpen: false,
  },
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Vous pouvez commencer sans carte bancaire et découvrir la logique de pilotage de LocaPro avant de choisir la formule adaptée à votre agence.",
    defaultOpen: false,
  },
];

const heroCallouts = [
  { label: "Tableau de bord en temps réel", position: "top-[8%] left-[2%]", delay: "0s" },
  { label: "Planning et disponibilités", position: "top-[35%] right-[-2%]", delay: "0.4s" },
  { label: "Centre financier", position: "bottom-[15%] left-[3%]", delay: "0.8s" },
];

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function BrowserFrame({
  src,
  alt,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative bg-white rounded-2xl border border-gray-200/60 shadow-2xl shadow-gray-400/20 overflow-hidden ring-1 ring-gray-900/5 ${className}`}>
      <div className="bg-gray-50/80 border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 max-w-[200px] mx-auto text-center">
            app.locapro.ma
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden bg-gray-50">
        <Image
          src={src}
          alt={alt}
          width={1920}
          height={1080}
          className="w-full h-auto"
          priority={priority}
        />
      </div>
    </div>
  );
}

function SectionCurve({
  position,
  colorClass,
}: {
  position: "top" | "bottom";
  colorClass: string;
}) {
  const placement =
    position === "top" ? "top-0 -translate-y-full rotate-180" : "bottom-0 translate-y-full";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 h-16 lg:h-24 ${placement} ${colorClass}`}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="h-full w-full fill-current"
      >
        <path d="M0,96L80,85.3C160,75,320,53,480,48C640,43,800,53,960,64C1120,75,1280,85,1360,90.7L1440,96L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
      </svg>
    </div>
  );
}

function FeatureSection({
  section,
  index,
  bgClass,
}: {
  section: (typeof featureSections)[number];
  index: number;
  bgClass: string;
}) {
  const isLeft = section.layout === "copy-left";
  const panelClass =
    index % 2 === 0
      ? "border-slate-200 bg-white"
      : "border-blue-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/60";

  const copyBlock = (
    <div className="flex flex-col justify-center max-w-xl">
      <div className="pill-badge bg-blue-50 text-blue-600 mb-5">
        {section.eyebrow}
      </div>
      <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-tight text-gray-900">
        {section.heading}
      </h2>
      <p className="text-gray-600 text-lg leading-relaxed mt-5">
        {section.body}
      </p>
      <ul className="space-y-3.5 mt-7">
        {section.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-gray-700 text-[15px]">{bullet}</span>
          </li>
        ))}
      </ul>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mt-8 text-sm font-medium text-gray-700 w-fit">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
        {section.bullets[0]}
      </div>
    </div>
  );

  const screenshotBlock = (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-br from-blue-100/80 via-white to-amber-50 rounded-[2rem] blur-2xl" />
      <div className="relative rounded-[2rem] bg-gradient-to-br from-white via-blue-50/70 to-amber-50/70 p-3 lg:p-4 shadow-2xl shadow-blue-100/60 ring-1 ring-slate-200/80">
        <BrowserFrame
          src={section.screenshot}
          alt={section.screenshotAlt}
          className="relative screenshot-frame"
        />
      </div>
      <div className="absolute -bottom-4 right-4 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-xl shadow-slate-300/20">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
          LocaPro
        </div>
        <div className="mt-1 text-sm font-semibold text-gray-900">{section.eyebrow}</div>
      </div>
    </div>
  );

  return (
    <section className={`py-16 lg:py-20 px-6 lg:px-8 ${bgClass}`}>
      <div className="max-w-[1200px] mx-auto">
        <Reveal
          className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center rounded-[2.5rem] border p-8 lg:p-14 ${panelClass}`}
          delayMs={index * 60}
        >
          {isLeft ? (
            <>
              {copyBlock}
              {screenshotBlock}
            </>
          ) : (
            <>
              <div className="order-2 lg:order-1">{screenshotBlock}</div>
              <div className="order-1 lg:order-2">{copyBlock}</div>
            </>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased overflow-x-hidden">
      {/* ─── NAVIGATION ─── */}
      <ScrollNav />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden hero-gradient">
        {/* Decorative background layers */}
        <div className="absolute inset-0 hero-dots opacity-40" />
        <div className="hero-glow-1 top-[-200px] right-[-100px]" />
        <div className="hero-glow-2 bottom-[-100px] left-[-150px]" />

        <div className="relative pt-36 lg:pt-44 pb-0 px-6 lg:px-8">
          <div className="max-w-[1200px] mx-auto">
            {/* Text content */}
            <Reveal className="text-center max-w-4xl mx-auto">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm mb-8">
                <span className="text-base">🇲🇦</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-white/90">
                  FAIT POUR LES AGENCES MAROCAINES
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-[3.75rem] font-bold text-white tracking-tight leading-[1.08]">
                Toute votre agence,
                <br className="hidden sm:block" />
                <span className="text-blue-200">sous controle.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto mt-7 leading-relaxed font-medium">
                Réservations, flotte, paiements, clients : tout dans un seul outil. Fini les erreurs. Fini le chaos.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <Link
                  href="/signup"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white text-base font-semibold rounded-full transition-all hover:shadow-xl hover:shadow-amber-500/25 active:scale-[0.98]"
                >
                  Démarrer gratuitement
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="#product-demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white text-base font-semibold rounded-full hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                  Voir la demo
                </Link>
              </div>

              {/* Trust bar */}
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 mt-7 text-sm text-blue-200/70">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Pensé pour les agences marocaines</span>
                </div>
                <span className="hidden sm:inline">·</span>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp intégré</span>
                </div>
                <span className="hidden sm:inline">·</span>
                <div className="flex items-center gap-2">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Français et arabe</span>
                </div>
              </div>

              <p className="text-sm text-blue-100/60 mt-5 max-w-xl mx-auto">
                Mettez fin aux tableaux Excel, aux papiers dispersés et aux suivis oubliés.
              </p>
            </Reveal>

            {/* Hero screenshot — extends into next section */}
            <Reveal className="relative max-w-5xl mx-auto mt-16 mb-[-80px] lg:mb-[-120px] z-10" delayMs={120}>
              {/* Floating callout tags */}
              {heroCallouts.map((callout) => (
                <div
                  key={callout.label}
                  className={`absolute ${callout.position} z-20 hidden lg:flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-xl shadow-black/10 border border-gray-100 text-sm font-semibold text-gray-800 animate-float`}
                  style={{ animationDelay: callout.delay }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  {callout.label}
                </div>
              ))}

              <BrowserFrame
                src="/screenshots/dashboard.png"
                alt="Tableau de bord LocaPro"
                priority
                className="screenshot-frame shadow-2xl shadow-black/30 ring-1 ring-white/10"
              />
            </Reveal>
          </div>
        </div>
        <SectionCurve position="bottom" colorClass="text-white" />
      </section>

      {/* ─── SOCIAL PROOF BAR ─── */}
      <section className="relative pt-32 lg:pt-44 pb-24 lg:pb-32 px-6 lg:px-8 bg-white">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Moins de dispersion. Plus de controle.
          </h2>
          <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed">
            LocaPro aide les agences a centraliser leurs dossiers, suivre les actions critiques et mieux piloter l&apos;activite au quotidien.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
            {qualitativeProof.map((item, index) => (
              <Reveal
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-left"
                delayMs={index * 80}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <div className="text-gray-600 text-sm leading-relaxed mt-3">
                  {item.body}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <SectionCurve position="bottom" colorClass="text-slate-50" />
      </section>

      {/* ─── FEATURE SECTIONS ─── */}
      <div id="features" className="py-10 lg:py-14 bg-white">
        <FeatureSection section={featureSections[0]} index={0} bgClass="bg-white" />
        <FeatureSection section={featureSections[1]} index={1} bgClass="bg-white" />
        <FeatureSection section={featureSections[2]} index={2} bgClass="bg-white" />

        {/* ─── DASHBOARD SHOWCASE (full-width break) ─── */}
        <section
          id="product-demo"
          className="relative my-16 lg:my-24 py-24 lg:py-32 px-6 lg:px-8 section-gradient-dark text-white overflow-hidden"
        >
          <SectionCurve position="top" colorClass="text-white" />
          <SectionCurve position="bottom" colorClass="text-white" />
          <div className="absolute inset-0 hero-dots opacity-25" />
          <div className="hero-glow-1 top-[-260px] right-[-120px] opacity-40" />
          <div className="hero-glow-2 bottom-[-220px] left-[-140px] opacity-30" />
          <div className="max-w-[1200px] mx-auto">
            <Reveal className="text-center max-w-3xl mx-auto">
              <div className="pill-badge bg-white/10 text-white border border-white/10 mb-5">
                TABLEAU DE BORD
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-[3rem] font-bold tracking-tight leading-tight text-white">
                Chaque matin, commencez avec les bonnes priorités.
              </h2>
              <p className="text-lg text-blue-100/80 mt-5 leading-relaxed">
                Le tableau de bord met en avant ce qui demande votre attention : retours du jour, retards, montants à encaisser, cautions à libérer et points de risque.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {["KPIs utiles", "Alertes visibles", "Vue d'ensemble immédiate"].map(
                  (pill) => (
                    <span
                      key={pill}
                      className="px-4 py-2 bg-white/10 border border-white/10 rounded-full text-sm font-medium text-white"
                    >
                      {pill}
                    </span>
                  )
                )}
              </div>
            </Reveal>

            {/* Full-width screenshot */}
            <Reveal className="relative max-w-6xl mx-auto mt-16" delayMs={100}>
              <div className="absolute -inset-6 bg-gradient-to-b from-blue-300/30 to-transparent rounded-[2.5rem] blur-3xl" />
              <div className="relative rounded-[2.5rem] bg-white/10 border border-white/10 p-3 lg:p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
                <BrowserFrame
                  src="/screenshots/dashboard.png"
                  alt="Tableau de bord LocaPro"
                  className="relative screenshot-frame shadow-2xl shadow-black/20"
                />
              </div>
            </Reveal>

            {/* Outcome callout */}
            <p className="text-center mt-10 text-lg font-semibold text-white">
              Moins de réaction dans l&apos;urgence.{" "}
              <span className="text-amber-300">Plus d&apos;anticipation.</span>
            </p>
          </div>
        </section>

        <FeatureSection section={featureSections[3]} index={3} bgClass="bg-white" />
        <FeatureSection section={featureSections[4]} index={4} bgClass="bg-white" />
        <FeatureSection section={featureSections[5]} index={5} bgClass="bg-white" />
        <FeatureSection section={featureSections[6]} index={6} bgClass="bg-white" />
      </div>

      {/* ─── MOROCCO DIFFERENTIATION ─── */}
      <section
        id="why-locapro"
        className="py-24 lg:py-32 px-6 lg:px-8 section-gradient-dark text-white relative overflow-hidden"
      >
        <SectionCurve position="top" colorClass="text-white" />
        <SectionCurve position="bottom" colorClass="text-white" />
        <div className="absolute inset-0 hero-dots opacity-30" />
        <div className="hero-glow-1 top-[-300px] right-[-200px] opacity-40" />
        <div className="hero-glow-2 bottom-[-200px] left-[-100px] opacity-30" />

        <div className="max-w-[1200px] mx-auto relative">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <Reveal className="inline-flex items-center gap-2.5 px-5 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
              <span className="text-base">🇲🇦</span>
              <span className="text-sm font-semibold text-white">Conçu pour le Maroc</span>
            </Reveal>
          </div>

          <Reveal>
            <h2 className="text-center text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-tight">
              Pensé pour les agences marocaines
            </h2>
            <p className="text-center text-blue-200/60 max-w-xl mx-auto mt-4 text-lg leading-relaxed">
              Pas juste un logiciel de plus.{" "}
              <span className="text-white font-medium">Un vrai outil de pilotage adapté à votre réalité terrain.</span>
            </p>
          </Reveal>

          {/* Differentiator cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-16">
            {differentiators.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal
                  key={item.title}
                  className="text-center p-6 bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-400/30 hover:bg-white/[0.08] transition-all duration-300"
                  delayMs={index * 70}
                >
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-blue-300" />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-blue-200/50 leading-relaxed">{item.description}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-24 lg:py-32 px-6 lg:px-8 bg-white">
        <div className="max-w-[1200px] mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
          <div className="max-w-md">
            <div className="pill-badge bg-blue-50 text-blue-600 mb-5">
              PREUVES TERRAIN
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-[2.9rem] font-bold tracking-tight text-gray-900 leading-tight">
              Ce que LocaPro clarifie au quotidien.
            </h2>
            <p className="text-gray-500 mt-5 text-lg leading-relaxed">
              Des situations concrètes, mieux gérées quand les informations, documents et actions restent au même endroit.
            </p>
            <div className="space-y-3 mt-8">
              {[
                "Moins de temps perdu à chercher une information",
                "Des retours et paiements plus simples à suivre",
                "Des dossiers plus propres en cas de litige",
              ].map((point) => (
                <div
                  key={point}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-gray-700 mr-2"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {proofCases.map((item, index) => (
              <Reveal
                key={item.kicker}
                className={`rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  index === 0
                    ? "md:col-span-2 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 border-blue-100 shadow-lg shadow-blue-100/30"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
                delayMs={index * 90}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    {item.kicker}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                    Preuve concrète
                  </div>
                </div>
                <blockquote className="text-gray-800 text-[15px] md:text-base leading-relaxed font-medium mb-6">
                  {item.title}
                </blockquote>
                <div className="pt-5 border-t border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-gray-600 leading-relaxed">{item.body}</div>
                    <div className="text-xs text-blue-600 font-semibold mt-3">{item.outcome}</div>
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                    LocaPro
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OUTCOMES BAND ─── */}
      <section className="relative py-20 lg:py-24 px-6 lg:px-8 section-gradient-dark text-white overflow-hidden">
        <SectionCurve position="top" colorClass="text-white" />
        <SectionCurve position="bottom" colorClass="text-slate-50" />
        <div className="absolute inset-0 hero-dots opacity-20" />
        <div className="max-w-[1200px] mx-auto relative">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Plus de clarté. Plus de maîtrise chaque jour.
            </h2>
            <p className="text-blue-100/70 text-lg mt-4">
              Quand l&apos;information est centralisée, votre équipe agit plus vite et votre agence tourne avec moins de friction.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {businessStats.map((stat, index) => (
              <Reveal
                key={stat.value}
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center backdrop-blur-sm"
                delayMs={index * 90}
              >
                <div className="text-5xl md:text-6xl font-bold tracking-tight text-amber-300">
                  {stat.value}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-blue-100/75">
                  {stat.label}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 lg:py-32 px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_55%)]" />
        <div className="max-w-[1200px] mx-auto">
          <Reveal className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="pill-badge bg-blue-50 text-blue-600 mb-5">
                TARIFS
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-[2.9rem] font-bold tracking-tight text-gray-900 mb-4 leading-tight">
                Un prix simple. Pas de surprises.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Commencez gratuitement. Évoluez quand votre agence en a besoin, sans engagement inutile.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                Inclus
              </div>
              <div className="mt-1 text-sm font-medium text-gray-700">
                Support, mises à jour et prise en main rapide
              </div>
            </div>
          </Reveal>

          <div className="rounded-[2rem] border border-slate-200 bg-white/70 backdrop-blur-sm p-5 lg:p-6 shadow-xl shadow-slate-200/40">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
              {pricing.map((plan, index) => (
                <Reveal
                  key={plan.name}
                  className={`relative rounded-2xl transition-all duration-300 ${
                    plan.popular
                      ? "bg-blue-600 text-white shadow-2xl shadow-blue-600/25 md:-mt-4 md:mb-4 p-8 md:py-10"
                      : "bg-white shadow-sm hover:shadow-lg border border-gray-100 p-8"
                  }`}
                  delayMs={index * 90}
                >
                  {plan.popular && plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-7">
                    <h3
                      className={`text-lg font-bold mb-1 ${
                        plan.popular ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm mb-5 ${
                        plan.popular ? "text-blue-100/70" : "text-gray-500"
                      }`}
                    >
                      {plan.tagline}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-4xl font-bold tracking-tight ${
                          plan.popular ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span
                          className={
                            plan.popular ? "text-blue-100/70" : "text-gray-500"
                          }
                        >
                          MAD{plan.period}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            plan.popular ? "text-blue-200" : "text-blue-600"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            plan.popular ? "text-white/90" : "text-gray-600"
                          }`}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`block w-full py-3.5 font-semibold text-center text-sm transition-all rounded-full active:scale-[0.98] ${
                      plan.popular
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-10">
            Sans engagement · Annulable à tout moment · Support inclus
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 lg:py-32 px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-14">
            <div className="pill-badge bg-blue-50 text-blue-600 mb-5">FAQ</div>
            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-gray-900">
              Les questions avant de se lancer
            </h2>
          </Reveal>

          <Reveal className="bg-white rounded-2xl px-8 shadow-sm border border-gray-100" delayMs={80}>
            {faqs.map((faq) => (
              <FAQItem
                key={faq.q}
                q={faq.q}
                a={faq.a}
                defaultOpen={faq.defaultOpen}
              />
            ))}
          </Reveal>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section
        id="contact"
        className="py-24 lg:py-32 px-6 lg:px-8 hero-gradient text-white relative overflow-hidden"
      >
        <SectionCurve position="top" colorClass="text-slate-50" />
        <div className="absolute inset-0 hero-dots opacity-30" />
        <div className="hero-glow-1 top-[-200px] left-[20%] opacity-40" />
        <div className="hero-glow-2 bottom-[-150px] right-[20%] opacity-30" />

        <Reveal className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Prêt à reprendre le contrôle ?
          </h2>
          <p className="text-lg text-blue-100/80 mt-6 max-w-xl mx-auto leading-relaxed">
            Essayez LocaPro gratuitement. Centralisez vos opérations, réduisez les erreurs et gardez une vision plus claire sur vos retours, vos paiements et vos cautions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white text-base font-semibold rounded-full transition-all hover:shadow-xl hover:shadow-amber-500/25 active:scale-[0.98]"
            >
              Démarrer maintenant
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#product-demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white text-base font-semibold rounded-full hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              Contactez-nous pour une démo
            </Link>
          </div>
          <p className="text-sm text-blue-200/50 mt-6">
            Aucune carte bancaire requise
          </p>
        </Reveal>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-16 lg:py-20 px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Image
                src="/assets/locapro-logo.png"
                alt="LocaPro"
                width={140}
                height={36}
                className="h-8 w-auto mb-5 brightness-0 invert"
              />
              <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-xs">
                FAIT POUR LES AGENCES MAROCAINES.
              </p>
              <p className="text-sm text-gray-500">
                🇲🇦 Pensé pour le terrain marocain
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 className="font-semibold text-sm mb-5 text-white">Produit</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                    Tarifs
                  </a>
                </li>
                <li>
                  <a href="#product-demo" className="text-gray-400 hover:text-white transition-colors">
                    Démo
                  </a>
                </li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="font-semibold text-sm mb-5 text-white">Ressources</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#faq" className="text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            {/* Entreprise */}
            <div>
              <h4 className="font-semibold text-sm mb-5 text-white">Entreprise</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    CGU
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} LocaPro. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">
                Confidentialité
              </a>
              <a href="#" className="hover:text-white transition-colors">
                CGU
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
