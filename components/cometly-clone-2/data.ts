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
  { label: "Fonctionnalités", href: "#fonctionnalites", hasDropdown: false },
  { label: "Témoignages", href: "#temoignages", hasDropdown: false },
  { label: "Tarifs", href: "#tarifs", hasDropdown: false },
];

export const heroData = {
  eyebrow: "Nouveau · Locaryx pour agences marocaines",
  heading: "Votre agence, sous contrôle.\nVos locations, en pilote automatique.",
  subheading:
    "Locaryx centralise vos réservations, contrats et paiements en un seul endroit — pour que vous passiez plus de temps à louer, et moins à chercher des fichiers.",
  ctaPrimary: "Essayer gratuitement",
  ctaSecondary: "Voir une démo →",
  ctaMicroText: "Sans carte bancaire  ·  Prêt en 5 minutes  ·  Support en français",
  trustText: "Ils font confiance à Locaryx pour gérer leur agence",
  reviewText: "Sans carte bancaire  ·  Prêt en 5 minutes  ·  Support en français",
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
      "Avant, on confirmait encore des locations sur WhatsApp et on recopiait tout à la main. Depuis qu'on est passés sur Locaryx, le planning est plus propre et on a presque supprimé les erreurs de disponibilité.",
    name: "Youssef A.",
    role: "Gérant",
    company: "Agadir Drive",
  },
  {
    quote:
      "Le calendrier change vraiment le quotidien de l'équipe. Quand un véhicule part, revient ou change de statut, tout le monde voit la même information tout de suite.",
    name: "Sara E.",
    role: "Responsable flotte",
    company: "Atlas Mobility",
  },
  {
    quote:
      "Le suivi des cautions nous prenait un temps fou. Maintenant on sait ce qui a été encaissé, restitué ou oublié sans devoir ouvrir plusieurs fichiers.",
    name: "Karim T.",
    role: "Fondateur",
    company: "Marrakech Car Hire",
  },
  {
    quote:
      "Quand un client appelle, on retrouve son dossier en quelques secondes. Réservations passées, contrat, paiement, permis: tout est au même endroit.",
    name: "Nadia R.",
    role: "Office manager",
    company: "Sahara Cars",
  },
  {
    quote:
      "Les états de départ et de retour avec photos nous ont évité plusieurs discussions inutiles avec des clients. C'est simple, mais ça change beaucoup.",
    name: "Rachid B.",
    role: "Responsable opérations",
    company: "Ocean Ride",
  },
  {
    quote:
      "Ce que j'apprécie surtout, c'est la vue d'ensemble. Je peux vérifier les réservations, les paiements et les voitures disponibles sans passer d'un outil à l'autre.",
    name: "Imane L.",
    role: "Directrice",
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
