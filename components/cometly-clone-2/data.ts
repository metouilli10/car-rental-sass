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
  { label: "Fonctionnalités", hasDropdown: false },
  { label: "Témoignages", hasDropdown: false },
  { label: "Tarifs", hasDropdown: false },
];

export const heroData = {
  eyebrow: "LE LOGICIEL DE GESTION POUR AGENCES DE LOCATION AU MAROC",
  heading: "Gérez toute votre agence de location depuis un seul tableau de bord.",
  subheading:
    "Réservations, véhicules, cautions et paiements — tout est centralisé pour éviter les erreurs et gagner du temps chaque jour.",
  ctaPrimary: "Commencer gratuitement",
  ctaSecondary: "Voir la démo",
  ctaMicroText: "Essai gratuit — aucune carte bancaire requise.",
  trustText: "Ils font confiance à Locaryx pour gérer leur agence",
  reviewText: "Déjà adopté par des agences de location modernes au Maroc.",
  localPositioningText: "Conçu pour les agences de location modernes au Maroc.",
  stats: [
    {
      title: "Réservations du jour",
      value: "14",
      detail: "Départs et retours à traiter aujourd'hui",
      tone: "emerald",
    },
    {
      title: "Flotte disponible",
      value: "9",
      detail: "Véhicules prêts à être loués",
      tone: "sky",
    },
    {
      title: "Paiements suivis",
      value: "24K DH",
      detail: "Cautions et règlements centralisés",
      tone: "amber",
    },
  ],
};

export const trustHighlights = [
  "Évitez les doubles réservations",
  "Voyez l'état de votre flotte en temps réel",
  "Suivez les cautions sans confusion",
  "Gardez toutes les informations clients au même endroit",
  "Prenez de meilleures décisions avec un tableau de bord clair",
];

export const features = [
  {
    icon: CalendarCheck,
    title: "Réservations intelligentes",
    description:
      "Créez et gérez vos réservations en quelques secondes sans conflit de disponibilité ni oubli dans le planning.",
    linkLabel: "Voir les réservations",
  },
  {
    icon: Car,
    title: "Gestion des véhicules",
    description:
      "Suivez l'état de votre flotte et la disponibilité de chaque véhicule en temps réel.",
    linkLabel: "Voir les véhicules",
  },
  {
    icon: Users,
    title: "Gestion des clients",
    description:
      "Toutes les informations clients, contrats et documents restent accessibles instantanément au même endroit.",
    linkLabel: "Voir les clients",
  },
  {
    icon: Wallet,
    title: "Paiements et cautions",
    description:
      "Suivez les paiements, cautions et remboursements sans confusion ni calcul manuel.",
    linkLabel: "Voir les paiements",
  },
  {
    icon: ClipboardCheck,
    title: "État du véhicule",
    description:
      "Documentez les départs et retours avec photos pour éviter les litiges et garder une trace claire.",
    linkLabel: "Voir les inspections",
  },
  {
    icon: BarChart3,
    title: "Statistiques et rapports",
    description:
      "Analysez les performances de votre agence et prenez de meilleures décisions avec des données claires.",
    linkLabel: "Voir les rapports",
  },
];

export const howItWorksSteps = [
  {
    icon: MousePointerClick,
    title: "Créez votre compte",
    description:
      "Créez votre espace Locaryx en quelques minutes et configurez les informations essentielles de votre agence.",
  },
  {
    icon: Link,
    title: "Ajoutez votre flotte et vos réservations",
    description:
      "Importez ou saisissez vos véhicules, vos disponibilités et vos réservations pour démarrer avec une base claire.",
  },
  {
    icon: Zap,
    title: "Centralisez vos clients et paiements",
    description:
      "Gardez les dossiers clients, les paiements et les cautions au même endroit pour travailler sans confusion.",
  },
  {
    icon: Activity,
    title: "Pilotez vos opérations au quotidien",
    description:
      "Suivez les départs, retours, disponibilités et encaissements depuis un tableau de bord clair et utile.",
  },
  {
    icon: MessageSquare,
    title: "Faites avancer l'agence plus vite",
    description:
      "Toute l'équipe travaille sur les mêmes informations pour éviter les oublis et gagner du temps chaque jour.",
  },
];

export const testimonials = [
  {
    quote:
      "Avant Locaryx, nous avions souvent des conflits de réservation. Maintenant tout est clair sur le tableau de bord.",
    name: "Youssef B.",
    role: "Gérant - Agadir Rent Cars",
    company: "Agadir Rent Cars",
  },
  {
    quote:
      "Le calendrier nous fait gagner du temps chaque jour. Toute l'équipe voit les réservations en temps réel.",
    name: "Sarah L.",
    role: "Responsable flotte - Atlas Car Rental",
    company: "Atlas Car Rental",
  },
  {
    quote:
      "Les cautions et les paiements sont beaucoup plus simples à suivre. On retrouve les informations sans chercher partout.",
    name: "Karim M.",
    role: "Fondateur - Marrakech Drive",
    company: "Marrakech Drive",
  },
  {
    quote:
      "Créer une réservation prend quelques secondes et toutes les informations client sont déjà centralisées.",
    name: "Nadia T.",
    role: "Manager - Sahara Mobility",
    company: "Sahara Mobility",
  },
  {
    quote:
      "Les inspections avec photos nous évitent beaucoup de discussions au retour du véhicule. Tout est documenté.",
    name: "Rachid A.",
    role: "Responsable opérations - Ocean Cars",
    company: "Ocean Cars",
  },
  {
    quote:
      "On a enfin une vue claire sur les réservations, les revenus et la disponibilité de la flotte au même endroit.",
    name: "Imane K.",
    role: "Directrice - City Rent Agadir",
    company: "City Rent Agadir",
  },
];

export const footerColumns = [
  {
    title: "Produit",
    links: [
      "Fonctionnalités",
      "Tarifs",
      "Réservations",
      "Flotte",
      "Clients",
      "Paiements",
      "Inspections",
      "Tableau de bord",
    ],
  },
  {
    title: "Entreprise",
    links: ["À propos", "Clients", "Témoignages", "Contact"],
  },
  {
    title: "Ressources",
    links: ["Blog", "Centre d'aide", "Guides", "FAQ", "Support"],
  },
  {
    title: "Solutions",
    links: ["Petites agences", "Agences en croissance", "Multi-agences"],
  },
];

export const sectionHeadings = {
  features: {
    title: "Gérez toute votre agence depuis une seule plateforme",
    subtitle:
      "Locaryx suit le vrai workflow de votre agence, de la réservation jusqu'au paiement et au retour du véhicule.",
  },
  testimonials: {
    title: "Ils utilisent Locaryx pour gérer leur agence",
    subtitle:
      "Des retours concrets d'agences qui gagnent du temps et évitent plus d'erreurs au quotidien.",
  },
  analytics: {
    title: "Gardez une vue claire sur toute votre agence",
    subtitle:
      "Suivez les revenus, les réservations et la disponibilité de votre flotte en temps réel pour décider plus vite.",
  },
  howItWorks: {
    title: "Démarrez sans complexité",
    subtitle:
      "Locaryx est conçu pour être pris en main rapidement, même par une petite équipe qui veut aller à l'essentiel.",
  },
  integrations: {
    title: "Connectez les outils que vous utilisez déjà",
    subtitle:
      "Centralisez vos opérations et gardez une base de travail claire pour toute l'équipe.",
  },
  cta: {
    title: "Découvrez Locaryx en action",
    subtitle:
      "Créez votre compte et commencez à gérer votre agence en quelques minutes.",
  },
};
