import {
  CalendarPlus2,
  CarFront,
  Compass,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import type { DashboardV3Onboarding } from "@/lib/dashboard/types";

export type OnboardingStepKey = "vehicle" | "reservation" | "payment" | "dashboard";

export interface OnboardingStep {
  key: OnboardingStepKey;
  label: string;
  shortLabel: string;
  help: string;
  href: string;
  ctaLabel: string;
  title: string;
  description: string;
  reasons: string[];
  done: boolean;
  icon: LucideIcon;
}

export function getOnboardingSteps(onboarding: DashboardV3Onboarding): OnboardingStep[] {
  return [
    {
      key: "vehicle",
      label: "Ajoutez votre premier véhicule",
      shortLabel: "Premier véhicule",
      done: onboarding.vehicleAdded,
      href: "/vehicles/add",
      ctaLabel: "Ajouter un véhicule",
      help: "Ajoutez un véhicule pour commencer à gérer vos locations.",
      title: "Ajoutez le premier véhicule de votre flotte",
      description:
        "Votre parc est le point de départ de tout le reste. Une fois votre premier véhicule ajouté, vous pourrez ouvrir des réservations et suivre votre activité réelle.",
      reasons: [
        "Construire votre flotte active dès maintenant",
        "Rendre le catalogue et la disponibilité utilisables",
        "Préparer vos premières locations sans configuration cachée",
      ],
      icon: CarFront,
    },
    {
      key: "reservation",
      label: "Créez votre première réservation",
      shortLabel: "Première réservation",
      done: onboarding.reservationCreated,
      href: "/bookings/create",
      ctaLabel: "Créer une réservation",
      help: "Créez une réservation pour simuler une vraie location.",
      title: "Créez votre premier dossier de location",
      description:
        "Une réservation valide votre flux principal. Elle vous permet de tester la disponibilité, le client, le véhicule et le suivi opérationnel dans les mêmes écrans que vos futures locations.",
      reasons: [
        "Vérifier votre parcours de réservation de bout en bout",
        "Faire apparaître de l'activité dans l'agenda et les listes",
        "Préparer l'encaissement du premier paiement",
      ],
      icon: CalendarPlus2,
    },
    {
      key: "payment",
      label: "Enregistrez votre premier paiement",
      shortLabel: "Premier paiement",
      done: onboarding.paymentRecorded,
      href: "/bookings?filter=unpaid",
      ctaLabel: "Enregistrer un paiement",
      help: "Enregistrez un paiement pour voir vos revenus apparaître.",
      title: "Enregistrez votre premier encaissement",
      description:
        "Le paiement active la partie financière de Locaryx. C'est ce qui fera remonter vos revenus, vos soldes à encaisser et les indicateurs utiles dans le tableau de bord.",
      reasons: [
        "Faire remonter vos revenus et paiements réels",
        "Vérifier vos montants à encaisser",
        "Débloquer la dernière étape d'exploration du tableau de bord",
      ],
      icon: CreditCard,
    },
    {
      key: "dashboard",
      label: "Explorez votre tableau de bord",
      shortLabel: "Explorer le tableau de bord",
      done: onboarding.dashboardExplored,
      href: "/dashboard",
      ctaLabel: "Ouvrir le tableau de bord",
      help: "Vérifiez comment votre tableau de bord se met à jour.",
      title: "Vérifiez votre tableau de bord en conditions réelles",
      description:
        "Une fois vos premières données enregistrées, le tableau de bord devient votre poste de pilotage. Cette étape valide que votre agence voit bien les indicateurs qui comptent au quotidien.",
      reasons: [
        "Contrôler l'occupation, l'encaissement et les priorités",
        "Vérifier que vos premières données remontent correctement",
        "Terminer votre mise en route avec une vue d'ensemble exploitable",
      ],
      icon: Compass,
    },
  ];
}

export function getCompletedOnboardingStepsCount(steps: OnboardingStep[]): number {
  return steps.filter((step) => step.done).length;
}

export function getDefaultOnboardingStepKey(steps: OnboardingStep[]): OnboardingStepKey {
  return steps.find((step) => !step.done)?.key ?? steps[steps.length - 1]?.key ?? "vehicle";
}
