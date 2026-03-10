import {
  Activity,
  BarChart3,
  CalendarCheck,
  Car,
  ClipboardCheck,
  Link,
  MessageSquare,
  MousePointerClick,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

export const navLinks = [
  { label: "Fonctionnalités", hasDropdown: true },
  { label: "Solutions", hasDropdown: true },
  { label: "Ressources", hasDropdown: true },
  { label: "Clients", hasDropdown: false },
  { label: "Tarifs", hasDropdown: false },
];

export const heroData = {
  heading: "Smarter Marketing Attribution. Use AI to Turn Data Into Action.",
  subheading:
    "Cometly transforms your marketing and sales data into insights, decisions, and scalable results by accurately attributing every conversion to its true source.",
  ctaPrimary: "Get Started",
  ctaSecondary: "Book a demo",
  trustText: "Trusted by thousands of companies",
};

export const features = [
  {
    icon: CalendarCheck,
    title: "Réservations intelligentes",
    description:
      "Créez et gérez vos réservations en quelques secondes. Le calendrier intelligent évite les conflits et garde votre planning toujours à jour.",
    linkLabel: "Voir les réservations",
  },
  {
    icon: Car,
    title: "Gestion des véhicules",
    description:
      "Suivez la disponibilité, l'historique et l'état de chaque véhicule de votre flotte en temps réel.",
    linkLabel: "Voir les véhicules",
  },
  {
    icon: Users,
    title: "Gestion des clients",
    description:
      "Conservez toutes les informations clients, leurs documents et leur historique de location au même endroit.",
    linkLabel: "Voir les clients",
  },
  {
    icon: Wallet,
    title: "Paiements et cautions",
    description:
      "Suivez les paiements, cautions et montants dus sans tableurs ni calculs manuels.",
    linkLabel: "Voir les paiements",
  },
  {
    icon: ClipboardCheck,
    title: "États de véhicule",
    description:
      "Documentez les départs et retours des véhicules avec photos et rapports détaillés.",
    linkLabel: "Voir les inspections",
  },
  {
    icon: BarChart3,
    title: "Statistiques et rapports",
    description:
      "Analysez les performances de votre agence : revenus, taux d'occupation et activité.",
    linkLabel: "Voir les rapports",
  },
];

export const howItWorksSteps = [
  {
    icon: MousePointerClick,
    title: "Capture website activity",
    description:
      "Install the Cometly Pixel on your website and automatically start tracking all activity (visits, form fills, etc.) from your website users.",
  },
  {
    icon: Link,
    title: "Connect your marketing & sales tools",
    description:
      "Connect your ad accounts, CRM, and payment tools in just a few clicks to start tracking the actions that matter most.",
  },
  {
    icon: Zap,
    title: "Activate Conversion Sync",
    description:
      "With Cometly’s built-in server-side tracking, you can sync conversions to ad platforms with a single toggle — no devs needed.",
  },
  {
    icon: Activity,
    title: "Analyze & act on accurate data",
    description:
      "Start analyzing your data in real time. Find out exactly which channels, ads, or campaigns are working so you can make smarter decisions.",
  },
  {
    icon: MessageSquare,
    title: "Use AI to chat with your data",
    description:
      "Use AI to ask questions about your ad performance and get clear, helpful insights that improve your results — fast.",
  },
];

export const testimonials = [
  {
    quote:
      "Avant Locaryx, on gérait les réservations sur Excel et WhatsApp. Maintenant tout est centralisé. On voit immédiatement quels véhicules sont disponibles et on évite les doubles réservations.",
    name: "Youssef B.",
    role: "Gérant - Agadir Rent Cars",
    company: "Agadir Rent Cars",
  },
  {
    quote:
      "Le calendrier est devenu indispensable pour notre agence. Toute l’équipe peut voir les réservations en temps réel et l’organisation est beaucoup plus simple.",
    name: "Sarah L.",
    role: "Responsable flotte - Atlas Car Rental",
    company: "Atlas Car Rental",
  },
  {
    quote:
      "Ce que j’aime le plus avec Locaryx, c’est le suivi des clients et des cautions. Avant c’était compliqué de retrouver les infos, maintenant tout est clair.",
    name: "Karim M.",
    role: "Fondateur - Marrakech Drive",
    company: "Marrakech Drive",
  },
  {
    quote:
      "On gagne énormément de temps sur la gestion quotidienne. Créer une réservation prend quelques secondes et toutes les informations client sont enregistrées.",
    name: "Nadia T.",
    role: "Manager - Sahara Mobility",
    company: "Sahara Mobility",
  },
  {
    quote:
      "Les inspections avec photos nous ont vraiment aidés. On peut documenter l’état du véhicule au départ et au retour sans discussions avec les clients.",
    name: "Rachid A.",
    role: "Responsable opérations - Ocean Cars",
    company: "Ocean Cars",
  },
  {
    quote:
      "Locaryx nous donne enfin une vue claire sur l’activité : réservations, revenus et disponibilité des véhicules. C’est devenu notre outil principal.",
    name: "Imane K.",
    role: "Directrice - City Rent Agadir",
    company: "City Rent Agadir",
  },
];

export const footerColumns = [
  {
    title: "Product",
    links: [
      "Features",
      "Pricing",
      "Integrations",
      "AI Ads Manager",
      "AI Chat",
      "Server-Side Tracking",
      "Multi-Touch Attribution",
      "Analytics",
      "Conversion Sync",
    ],
  },
  {
    title: "Company",
    links: ["About Us", "Customers", "Case Studies", "Contact Us"],
  },
  {
    title: "Resources",
    links: ["Blog", "Help Center", "Academy", "Guides", "Community", "Developer Docs"],
  },
  {
    title: "Solutions",
    links: ["SaaS", "Agencies", "Ecommerce"],
  },
];

export const sectionHeadings = {
  features: {
    title: "Measure conversions and revenue from every marketing source",
    subtitle: "Unify all your marketing data into one platform for smarter, faster decisions.",
  },
  testimonials: {
    title: "Ils utilisent Locaryx pour gérer leur agence",
    subtitle: "Découvrez comment les agences de location simplifient leur gestion quotidienne avec Locaryx.",
  },
  analytics: {
    title: "Gardez une vue claire sur toute votre agence",
    subtitle:
      "Suivez vos réservations, vos véhicules, vos revenus et vos clients depuis un tableau de bord simple et puissant. Prenez de meilleures décisions grâce à des données claires.",
  },
  howItWorks: {
    title: "Launch With Expert Help",
    subtitle:
      "Getting started with Cometly is fast but you’re not doing it alone. We partner with your team from day one to ensure everything is implemented correctly.",
  },
  integrations: {
    title: "Connect your marketing & sales stack",
    subtitle:
      "Connect your tools, connect your teams. With over 100 apps already available in our directory, your team’s favourite tools are just a click away.",
  },
  cta: {
    title: "Découvrez Locaryx en action",
    subtitle:
      "Essayez Locaryx et simplifiez la gestion de votre agence. Réservations, véhicules, clients et paiements — tout est centralisé dans une seule plateforme.",
  },
};
