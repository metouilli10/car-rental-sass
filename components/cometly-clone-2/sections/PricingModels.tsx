import RuixenPricing04, { type RuixenPricingPlan } from "@/components/ui/ruixen-pricing-04"

const pricingTiers: RuixenPricingPlan[] = [
  {
    id: "starter",
    title: "Starter",
    desc: "Idéal pour les petites agences avec une flotte jusqu'à 15 véhicules.",
    monthlyPrice: 249,
    annuallyMonthlyPrice: 212,
    annuallyBillingLabel: "Facturé 2540 DH par an",
    buttonText: "Commencer gratuitement",
    features: [
      "Gestion des réservations",
      "Calendrier de disponibilité",
      "Gestion des clients",
      "Paiements et cautions",
      "Inspections véhicule (départ / retour)",
      "Jusqu'à 15 véhicules",
      "Support email",
    ],
  },
  {
    id: "pro",
    title: "Pro",
    desc: "Idéal pour les agences avec plus de 15 véhicules.",
    monthlyPrice: 499,
    annuallyMonthlyPrice: 424,
    annuallyBillingLabel: "Facturé 5090 DH par an",
    badge: "Le plus populaire",
    buttonText: "Commencer gratuitement",
    features: [
      "Réservations illimitées",
      "Gestion complète de la flotte",
      "Clients et documents centralisés",
      "Paiements et cautions",
      "Inspections avec photos",
      "Statistiques et rapports",
      "Véhicules illimités",
      "Support prioritaire",
    ],
  },
]

export function PricingModels() {
  return (
    <RuixenPricing04
      plans={pricingTiers}
      title="Tarifs simples et transparents"
      subtitle="Choisissez l'offre adaptée à la taille de votre flotte. Commencez gratuitement, sans engagement."
      yearlySaveBadge="Économisez 15%"
      trustLine="Le prix dépend du nombre de véhicules dans votre flotte. Vous pouvez changer d'offre à tout moment, sans engagement."
      ctaHelperLines={["Essai gratuit — aucune carte bancaire requise", "Aucun engagement"]}
    />
  )
}
