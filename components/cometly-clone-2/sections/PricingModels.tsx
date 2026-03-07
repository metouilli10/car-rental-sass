import { ArrowDownToDot, Zap } from "lucide-react"
import { PricingSection, type PricingTier } from "@/components/ui/pricing-section"

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    price: {
      monthly: 249,
      yearly: 2540,
    },
    displayPrice: {
      monthly: "249 DH",
      yearly: "212 DH",
      yearlyBilling: "facturé 2540 DH / an",
    },
    description: "Idéal pour les petites agences avec une flotte jusqu'à 15 véhicules.",
    ctaLabel: "Commencer",
    icon: (
      <div className="relative">
        <Zap className="w-7 h-7 relative z-10 text-zinc-500 dark:text-zinc-400" />
      </div>
    ),
    features: [
      {
        name: "Gestion des réservations",
        description: "",
        included: true,
      },
      {
        name: "Calendrier de disponibilité",
        description: "",
        included: true,
      },
      {
        name: "Gestion des clients",
        description: "",
        included: true,
      },
      {
        name: "Paiements et cautions",
        description: "",
        included: true,
      },
      {
        name: "Inspections véhicule (départ / retour)",
        description: "",
        included: true,
      },
      {
        name: "Jusqu'à 15 véhicules",
        description: "",
        included: true,
      },
      {
        name: "Support email",
        description: "",
        included: true,
      },
    ],
  },
  {
    name: "Pro",
    price: {
      monthly: 499,
      yearly: 5090,
    },
    displayPrice: {
      monthly: "499 DH",
      yearly: "424 DH",
      yearlyBilling: "facturé 5090 DH / an",
    },
    description: "Idéal pour les agences avec plus de 15 véhicules.",
    highlight: true,
    badge: "Le plus populaire",
    ctaLabel: "Commencer",
    icon: (
      <div className="relative">
        <ArrowDownToDot className="w-7 h-7 relative z-10" />
      </div>
    ),
    features: [
      {
        name: "Réservations illimitées",
        description: "",
        included: true,
      },
      {
        name: "Gestion complète de la flotte",
        description: "",
        included: true,
      },
      {
        name: "Clients et documents centralisés",
        description: "",
        included: true,
      },
      {
        name: "Paiements et cautions",
        description: "",
        included: true,
      },
      {
        name: "Inspections avec photos",
        description: "",
        included: true,
      },
      {
        name: "Statistiques et rapports",
        description: "",
        included: true,
      },
      {
        name: "Véhicules illimités",
        description: "",
        included: true,
      },
      {
        name: "Support prioritaire",
        description: "",
        included: true,
      },
    ],
  },
]

export function PricingModels() {
  return (
    <PricingSection
      tiers={pricingTiers}
      title="Tarifs simples et transparents"
      subtitle="Choisissez l'offre adaptée à la taille de votre flotte. Économisez 15% avec l'abonnement annuel."
      monthlyLabel="Mensuel"
      yearlyLabel="Annuel"
      monthlyPeriodLabel="mois"
      yearlyPeriodLabel="mois"
      yearlySaveBadge="Économisez 15%"
      trustLine="Le prix dépend du nombre de véhicules dans votre flotte. Vous pouvez changer d'offre à tout moment."
      ctaHelperLines={["Essai gratuit de 14 jours", "Aucune carte bancaire requise"]}
    />
  )
}
