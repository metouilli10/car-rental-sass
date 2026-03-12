import { HeroSection2 } from '@/components/ui/hero-section-2'
import { Features } from '@/components/ui/features-10'
import ClientFeedback from '@/components/ui/testimonial'

const testimonialItems = [
  {
    quote:
      'Avant Locaryx, nous avions souvent des conflits de réservation. Maintenant tout est clair sur le tableau de bord.',
    name: 'Youssef B.',
    role: 'Gérant - Agadir Rent Cars',
    company: 'Agadir Rent Cars',
  },
  {
    quote:
      "Le calendrier nous fait gagner du temps chaque jour. Toute l'équipe voit les réservations en temps réel.",
    name: 'Sarah L.',
    role: 'Responsable flotte - Atlas Car Rental',
    company: 'Atlas Car Rental',
  },
  {
    quote:
      'Les cautions et les paiements sont beaucoup plus simples à suivre. On retrouve les informations sans chercher partout.',
    name: 'Karim M.',
    role: 'Fondateur - Marrakech Drive',
    company: 'Marrakech Drive',
  },
  {
    quote:
      'Créer une réservation prend quelques secondes et toutes les informations client sont déjà centralisées.',
    name: 'Nadia T.',
    role: 'Manager - Sahara Mobility',
    company: 'Sahara Mobility',
  },
  {
    quote:
      'Les inspections avec photos nous évitent beaucoup de discussions au retour du véhicule. Tout est documenté.',
    name: 'Rachid A.',
    role: 'Responsable opérations - Ocean Cars',
    company: 'Ocean Cars',
  },
  {
    quote:
      'On a enfin une vue claire sur les réservations, les revenus et la disponibilité de la flotte au même endroit.',
    name: 'Imane K.',
    role: 'Directrice - City Rent Agadir',
    company: 'City Rent Agadir',
  },
]

export default function Landing2Page() {
  return (
    <>
      <HeroSection2 />
      <Features />
      <ClientFeedback
        title="Ils utilisent Locaryx pour gérer leur agence"
        subtitle="Des retours concrets d'agences qui gagnent du temps et évitent plus d'erreurs au quotidien."
        items={testimonialItems}
      />
    </>
  )
}
