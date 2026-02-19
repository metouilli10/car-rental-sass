import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Star,
  X as CloseIcon,
  Car,
  Calendar,
  Users,
  FileText,
  Wallet,
  BarChart3,
  MessageCircle,
  Banknote,
  FileCheck,
  Zap,
  Headphones,
  Shield,
  Clock,
  CreditCard,
  Bell,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { FAQItem } from "./_components/FAQItem";
import { MobileMenuButton } from "./_components/MobileMenu";

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Car,
    title: "Parc véhicules",
    benefit: "Voyez en un instant quel véhicule est disponible",
    description: "Statut en temps réel, historique complet, alertes maintenance.",
  },
  {
    icon: Calendar,
    title: "Réservations",
    benefit: "Ne ratez plus jamais un départ ou un retour",
    description: "Calendrier visuel, rappels automatiques, gestion des conflits.",
  },
  {
    icon: Users,
    title: "Fichier clients",
    benefit: "Retrouvez n'importe quel client en 2 secondes",
    description: "Historique complet, documents scannés, notes importantes.",
  },
  {
    icon: FileText,
    title: "Contrats PDF",
    benefit: "Générez un contrat pro en 1 clic",
    description: "Modèles personnalisés, signature, envoi par email ou WhatsApp.",
  },
  {
    icon: Wallet,
    title: "Paiements & cautions",
    benefit: "Sachez exactement qui vous doit quoi",
    description: "Suivi espèces/carte/virement, cautions bloquées, relances.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord",
    benefit: "Prenez de meilleures décisions",
    description: "CA mensuel, taux d'utilisation, véhicules les plus rentables.",
  },
];

const problems = [
  "Retours en retard que vous découvrez trop tard",
  "Cautions perdues ou mal suivies",
  "Paiements notés sur papier ou WhatsApp",
  "Contrats faits à la main, jamais retrouvés",
  "Des heures perdues à chercher une info",
];

const differentiators = [
  {
    icon: MessageCircle,
    title: "WhatsApp intégré",
    description: "Contactez vos clients en 1 clic",
  },
  {
    icon: Banknote,
    title: "Dirhams (MAD)",
    description: "Fait pour le marché marocain",
  },
  {
    icon: FileCheck,
    title: "Contrats locaux",
    description: "Modèles adaptés au Maroc",
  },
  {
    icon: Zap,
    title: "Ultra simple",
    description: "Aucune formation requise",
  },
  {
    icon: Headphones,
    title: "Support humain",
    description: "En français, réactif",
  },
];

const monitoring = [
  {
    icon: Bell,
    color: "text-red-500",
    bg: "bg-red-50",
    title: "Alertes critiques",
    description: "Retours en retard, paiements impayés, cautions à libérer — vous êtes prévenu avant que ça coûte.",
  },
  {
    icon: Clock,
    color: "text-[#2563EB]",
    bg: "bg-[#2563EB]/10",
    title: "Opérations du jour",
    description: "Tous les départs et retours prévus aujourd'hui, en un coup d'œil.",
  },
  {
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    title: "Performance en direct",
    description: "CA du jour, de la semaine, du mois. Voyez votre agence grandir.",
  },
];

const stats = [
  { value: "2h", label: "gagnées par jour en moyenne" },
  { value: "95%", label: "des cautions mieux suivies" },
  { value: "0", label: "formation nécessaire" },
];

const steps = [
  {
    number: "01",
    title: "Demandez votre démo",
    description: "15 minutes pour voir Locapro en action",
    icon: MousePointerClick,
  },
  {
    number: "02",
    title: "On importe vos données",
    description: "Véhicules, clients — on s'occupe de tout",
    icon: Zap,
  },
  {
    number: "03",
    title: "Vous gérez sereinement",
    description: "Votre agence sous contrôle dès le jour 1",
    icon: Check,
  },
];

const pricing = [
  {
    name: "Starter",
    price: "799",
    period: "/mois",
    tagline: "Pour démarrer (1-5 véhicules)",
    features: [
      "Gestion véhicules illimitée",
      "Réservations & clients",
      "Contrats PDF",
      "Support par email",
    ],
    cta: "Démarrer",
    popular: false,
  },
  {
    name: "Pro",
    price: "1 499",
    period: "/mois",
    tagline: "Pour les agences en croissance",
    features: [
      "Tout Starter +",
      "Paiements & cautions",
      "Tableau de bord avancé",
      "Rapports détaillés",
      "WhatsApp intégré",
      "Support prioritaire",
    ],
    cta: "Essayer 14 jours",
    popular: true,
    badge: "Le plus choisi",
  },
  {
    name: "Entreprise",
    price: "Sur mesure",
    period: "",
    tagline: "Multi-agences & besoins spécifiques",
    features: [
      "Tout Pro +",
      "Multi-agences",
      "API & intégrations",
      "Accompagnement dédié",
    ],
    cta: "Parler à un expert",
    popular: false,
  },
];

const faqs = [
  {
    q: "Est-ce que Locapro est compliqué à utiliser ?",
    a: "Pas du tout. Locapro a été conçu pour être utilisable immédiatement, sans aucune formation. Si vous savez utiliser WhatsApp, vous saurez utiliser Locapro.",
    defaultOpen: true,
  },
  {
    q: "Puis-je l'utiliser sur mon téléphone ?",
    a: "Oui ! Locapro fonctionne parfaitement sur ordinateur, tablette et smartphone. Gérez votre agence où que vous soyez.",
    defaultOpen: false,
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Absolument. Vos données sont chiffrées et sauvegardées quotidiennement sur des serveurs sécurisés. Vous restez propriétaire de vos données.",
    defaultOpen: false,
  },
  {
    q: "Que se passe-t-il si j'annule ?",
    a: "Vous pouvez annuler à tout moment, sans frais. Vos données restent accessibles pendant 30 jours pour export.",
    defaultOpen: false,
  },
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Vous avez 14 jours pour tester toutes les fonctionnalités Pro, sans carte bancaire. À la fin, vous choisissez votre forfait ou vous partez sans rien payer.",
    defaultOpen: false,
  },
];

const trustItems = [
  { icon: CreditCard, text: "Essai 14 jours — sans carte" },
  { icon: Headphones, text: "Support local en français" },
  { icon: Shield, text: "Annulable à tout moment" },
];

const callouts = [
  { label: "Alertes auto", position: "top-[12%] left-[2%]", delay: "0s" },
  { label: "Contrats PDF 1 clic", position: "top-[40%] right-[0%]", delay: "0.3s" },
  { label: "Suivi paiements", position: "bottom-[20%] left-[5%]", delay: "0.6s" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE (Server Component -- no "use client")
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased overflow-x-hidden">
      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-gray-100/80 z-50">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/locapro-logo.png"
                alt="Locapro"
                width={130}
                height={32}
                className="h-7 w-auto"
                priority
              />
            </Link>

            <div className="hidden md:flex items-center gap-7">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Tarifs
              </a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                FAQ
              </a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium px-4 py-2"
              >
                Connexion
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-full hover:bg-[#1D4ED8] transition-all hover:shadow-lg hover:shadow-[#2563EB]/25 active:scale-[0.98]"
              >
                Essai gratuit
              </Link>
            </div>

            <MobileMenuButton />
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-28 lg:pt-36 pb-12 lg:pb-20 px-5 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            {/* Morocco-specific tagline */}
            <p className="inline-flex items-center gap-2 text-sm font-medium text-[#2563EB] mb-4">
              <span>🇲🇦</span>
              Pensé pour les agences marocaines
            </p>

            <h1 className="text-[2.5rem] leading-[1.1] md:text-5xl lg:text-[3.5rem] font-bold tracking-tight mb-6">
              Gérez votre agence de location{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">sans stress</span>
                <svg className="absolute -bottom-1.5 left-0 w-full h-3 z-0" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                  <path d="M2 10C40 4 100 2 198 8" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" className="animate-draw"/>
                </svg>
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl mx-auto font-medium">
              Véhicules, réservations, clients, contrats PDF, paiements — tout ce dont votre agence a besoin, dans une seule application simple.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <Link
              href="/login"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#2563EB] text-white text-base font-semibold rounded-full hover:bg-[#1D4ED8] transition-all hover:shadow-xl hover:shadow-[#2563EB]/25 active:scale-[0.98]"
            >
              Démarrer l&apos;essai gratuit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-gray-200 text-gray-700 text-base font-semibold rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
            >
              Voir la démo
            </Link>
          </div>

          {/* Social Proof */}
          <p className="text-center text-sm text-gray-500 mb-8">
            <span className="font-semibold text-gray-700">Déjà utilisé par 120+ agences</span> au Maroc
          </p>

          {/* Trust Row */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-14">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-2 text-sm text-gray-500">
                  <Icon className="w-4 h-4 text-[#2563EB]" />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* Product Mockup with Callouts */}
          <div className="relative mx-auto max-w-4xl">
            {/* Soft gradient background for depth */}
            <div className="absolute -inset-8 bg-gradient-to-b from-[#2563EB]/5 via-[#2563EB]/10 to-transparent rounded-[2rem] blur-2xl" />
            <div className="absolute -inset-4 bg-gradient-to-tr from-gray-100/80 to-white/50 rounded-3xl" />

            {/* Callout Labels */}
            {callouts.map((callout) => (
              <div
                key={callout.label}
                className={`absolute ${callout.position} z-20 hidden lg:flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-xl shadow-gray-900/10 border border-gray-100 text-sm font-semibold text-gray-800 animate-float`}
                style={{ animationDelay: callout.delay }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-pulse" />
                {callout.label}
              </div>
            ))}

            {/* Browser Frame */}
            <div className="relative bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-400/20 overflow-hidden ring-1 ring-gray-900/5">
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
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
              <div className="aspect-[16/10] relative overflow-hidden bg-gray-50">
                <Image
                  src="/assets/dashboard-screenshot.png"
                  alt="Tableau de bord Locapro"
                  width={1920}
                  height={1080}
                  className="w-full h-full object-cover object-top"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PAIN POINTS ─── */}
      <section className="py-20 px-5 lg:px-8 bg-gray-50/70">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Le problème</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 leading-tight">
                Vous reconnaissez ces situations ?
              </h2>
              <ul className="space-y-4">
                {problems.map((problem) => (
                  <li key={problem} className="flex items-start gap-3 text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CloseIcon className="w-3 h-3 text-red-500" />
                    </div>
                    <span className="text-[15px]">{problem}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-sm">
                <div className="absolute inset-0 bg-[#2563EB]/10 rounded-3xl blur-2xl scale-110" />
                <div className="relative text-center p-10 bg-white rounded-2xl shadow-xl">
                  <div className="w-14 h-14 bg-[#2563EB] rounded-xl flex items-center justify-center mx-auto mb-5">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-3">
                    Locapro règle tout ça.
                  </h3>
                  <p className="text-gray-500 text-sm">Une seule application. Zéro prise de tête.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 px-5 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Fonctionnalités</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Tout ce qu&apos;il vous faut, rien de plus
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Conçu spécialement pour les agences de location au Maroc. Simple, complet, efficace.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-6 rounded-2xl bg-white shadow-sm hover:shadow-xl hover:shadow-[#2563EB]/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-11 h-11 bg-gray-100 group-hover:bg-[#2563EB] rounded-xl flex items-center justify-center mb-5 transition-colors duration-300">
                    <Icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-bold mb-1.5 text-gray-900">{feature.title}</h3>
                  <p className="text-[#2563EB] font-medium text-sm mb-2">{feature.benefit}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── MOROCCO SECTION ─── */}
      <section className="py-20 px-5 lg:px-8 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#2563EB]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#2563EB]/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto relative">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
              <span className="text-lg">🇲🇦</span>
              <span className="text-sm font-semibold">Conçu pour le Maroc</span>
            </div>
          </div>

          <h2 className="text-center text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Pensé pour les agences marocaines
          </h2>
          <p className="text-center text-gray-400 max-w-xl mx-auto mb-12">
            Pas un logiciel étranger adapté.{" "}
            <span className="text-white font-medium">Créé pour votre réalité.</span>
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {differentiators.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="text-center p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-[#2563EB]/50 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-[#2563EB]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-400">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── MONITORING BENEFITS ─── */}
      <section className="py-20 px-5 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-[#2563EB]/10 to-gray-100 rounded-2xl blur-xl" />
                <div className="relative rounded-xl border border-gray-200 overflow-hidden shadow-xl">
                  <Image
                    src="/assets/dashboard-screenshot.png"
                    alt="Tableau de bord"
                    width={1920}
                    height={1080}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Automatisation</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 leading-tight">
                Ce que Locapro surveille pour vous
              </h2>

              <div className="space-y-5">
                {monitoring.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4">
                      <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link
                href="/login"
                className="group inline-flex items-center gap-2 mt-8 px-6 py-3 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-all active:scale-[0.98]"
              >
                Voir la démo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RESULTS & TESTIMONIAL ─── */}
      <section className="py-20 px-5 lg:px-8 bg-gray-50/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Résultats</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Des résultats concrets
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-14">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-8 rounded-2xl bg-white shadow-sm">
                <div className="text-4xl md:text-5xl font-bold text-[#2563EB] mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-gray-500 font-medium text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md">
              <div className="flex items-center gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <blockquote className="text-lg md:text-xl font-medium leading-relaxed mb-6 text-gray-900">
                &quot;Avant Locapro, je passais mes soirées à vérifier les retours et les paiements. Maintenant tout est clair, je peux enfin me concentrer sur mes clients.&quot;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white font-bold text-sm">
                  YA
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Youssef A.</div>
                  <div className="text-xs text-gray-500">Gérant d&apos;agence, Casablanca</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 px-5 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Démarrer prend 15 minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative text-center">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200" />
                  )}
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-[#2563EB]/10 rounded-2xl mb-5 relative">
                    <Icon className="w-8 h-8 text-[#2563EB]" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-[#2563EB] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 px-5 lg:px-8 bg-gray-50/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Tarifs</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Un prix simple, sans surprise
            </h2>
            <p className="text-gray-500">Choisissez le forfait adapté à votre agence</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto items-start mb-8">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-7 rounded-2xl transition-all duration-300 ${
                  plan.popular
                    ? "bg-[#2563EB] text-white shadow-2xl shadow-[#2563EB]/25 md:-mt-4 md:mb-4 md:py-9"
                    : "bg-white shadow-sm hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-400 text-gray-900 text-xs font-bold rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-1 ${plan.popular ? "text-white" : "text-gray-900"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.popular ? "text-white/70" : "text-gray-500"}`}>
                    {plan.tagline}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold tracking-tight ${plan.popular ? "text-white" : "text-gray-900"}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={plan.popular ? "text-white/70" : "text-gray-500"}>
                        MAD{plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? "text-white" : "text-[#2563EB]"}`} />
                      <span className={`text-sm ${plan.popular ? "text-white/90" : "text-gray-600"}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`block w-full py-3 font-semibold text-center text-sm transition-all rounded-full active:scale-[0.98] ${
                    plan.popular
                      ? "bg-white text-[#2563EB] hover:bg-gray-100"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500">
            Sans engagement • Annulable à tout moment • Support inclus
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 px-5 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Questions fréquentes
            </h2>
          </div>

          <div className="bg-white rounded-2xl px-6 shadow-md">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} defaultOpen={faq.defaultOpen} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 px-5 lg:px-8 bg-[#2563EB] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            Prêt à reprendre le contrôle de votre agence ?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Rejoignez les agences qui ont choisi la sérénité. Essai gratuit 14 jours, sans carte bancaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-[#2563EB] text-base font-semibold rounded-full hover:bg-gray-100 transition-all active:scale-[0.98]"
            >
              Démarrer l&apos;essai gratuit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border-2 border-white/30 text-white text-base font-semibold rounded-full hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              Voir la démo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-14 px-5 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
            <div className="lg:col-span-2">
              <Image
                src="/assets/locapro-logo.png"
                alt="Locapro"
                width={140}
                height={36}
                className="h-8 w-auto mb-4"
              />
              <p className="text-gray-500 text-sm leading-relaxed mb-4 max-w-xs">
                La plateforme tout-en-un pour les agences de location automobile au Maroc.
              </p>
              <p className="text-sm text-gray-400">🇲🇦 Fait avec ❤️ au Maroc</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-900">Produit</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="text-gray-500 hover:text-gray-900 transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="text-gray-500 hover:text-gray-900 transition-colors">Tarifs</a></li>
                <li><a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Démo</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-900">Entreprise</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">À propos</a></li>
                <li><a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-900">Support</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#faq" className="text-gray-500 hover:text-gray-900 transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Documentation</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Locapro. Tous droits réservés.</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-gray-900 transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-gray-900 transition-colors">CGU</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
