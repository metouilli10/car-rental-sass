"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  PartyPopper,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DashboardV3Onboarding } from "@/lib/dashboard/types";
import {
  getCompletedOnboardingStepsCount,
  getDefaultOnboardingStepKey,
  getOnboardingSteps,
  type OnboardingStepKey,
} from "@/lib/onboarding/checklist";
import {
  dismissOnboardingChecklist,
  markOnboardingDashboardExplored,
  resumeOnboardingChecklist,
} from "@/lib/actions/onboarding";

interface GettingStartedExperienceProps {
  agencyName: string;
  onboarding: DashboardV3Onboarding;
}

const CELEBRATION_KEY = "locaryx-onboarding-celebrated";

export function GettingStartedExperience({
  agencyName,
  onboarding,
}: GettingStartedExperienceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(onboarding.dismissed);
  const [dashboardExplored, setDashboardExplored] = useState(onboarding.dashboardExplored);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    setDismissed(onboarding.dismissed);
  }, [onboarding.dismissed]);

  useEffect(() => {
    setDashboardExplored(onboarding.dashboardExplored);
  }, [onboarding.dashboardExplored]);

  useEffect(() => {
    if (!onboarding.completed || typeof window === "undefined") {
      return;
    }

    if (window.sessionStorage.getItem(CELEBRATION_KEY) === "1") {
      return;
    }

    window.sessionStorage.setItem(CELEBRATION_KEY, "1");
    setShowCelebration(true);
    const timeout = window.setTimeout(() => setShowCelebration(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [onboarding.completed]);

  const derivedOnboarding = useMemo(
    () => ({
      ...onboarding,
      dashboardExplored,
      completed:
        onboarding.vehicleAdded &&
        onboarding.reservationCreated &&
        onboarding.paymentRecorded &&
        dashboardExplored,
    }),
    [dashboardExplored, onboarding],
  );

  const steps = useMemo(() => getOnboardingSteps(derivedOnboarding), [derivedOnboarding]);
  const completedCount = useMemo(() => getCompletedOnboardingStepsCount(steps), [steps]);
  const defaultStepKey = useMemo(() => getDefaultOnboardingStepKey(steps), [steps]);
  const [selectedKey, setSelectedKey] = useState<OnboardingStepKey>(defaultStepKey);

  useEffect(() => {
    setSelectedKey((currentKey) => {
      if (steps.some((step) => step.key === currentKey)) {
        return currentKey;
      }
      return defaultStepKey;
    });
  }, [defaultStepKey, steps]);

  const selectedStep = steps.find((step) => step.key === selectedKey) ?? steps[0];
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const nextStep = steps.find((step) => !step.done) ?? steps[steps.length - 1];

  function handleDismissToggle() {
    startTransition(() => {
      void (async () => {
        if (dismissed) {
          const result = await resumeOnboardingChecklist();
          if (result?.success) {
            setDismissed(false);
          }
          return;
        }

        const result = await dismissOnboardingChecklist();
        if (result?.success) {
          setDismissed(true);
        }
      })();
    });
  }

  function handlePrimaryAction() {
    if (
      selectedStep.key === "dashboard" &&
      onboarding.paymentRecorded &&
      !dashboardExplored
    ) {
      startTransition(() => {
        void (async () => {
          const result = await markOnboardingDashboardExplored();
          if (result?.success) {
            setDashboardExplored(true);
          }
          router.push(selectedStep.href);
          router.refresh();
        })();
      });
      return;
    }

    router.push(selectedStep.href);
  }

  return (
    <div className="space-y-6">
      {showCelebration ? (
        <Card className="overflow-hidden rounded-[28px] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <PartyPopper className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-950">Mise en route terminée</p>
              <p className="text-sm text-emerald-800">
                {agencyName} est prêt à gérer ses premières locations dans Locaryx.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(135deg,#ffffff_0%,#f8fafc_60%,#ecfdf5_100%)] shadow-sm">
        <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:p-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <Rocket className="h-3.5 w-3.5" />
              Démarrage guidé
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {derivedOnboarding.completed
                  ? "Votre agence est prête"
                  : "Faites de Locaryx votre poste de pilotage"}
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                {derivedOnboarding.completed
                  ? "Votre mise en route est terminée. Revenez ici quand vous voulez pour revoir le parcours et relancer un collègue."
                  : "Ce parcours met les nouvelles agences sur les bons rails: flotte, réservation, paiement, puis validation du tableau de bord."}
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Progression</span>
              <span className="font-semibold text-slate-950">
                {completedCount}/{steps.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{derivedOnboarding.completed ? "Parcours terminé" : "Étape suivante"}</span>
              <span className="font-medium text-slate-700">{nextStep.shortLabel}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Étapes clés</p>
              <p className="mt-1 text-xs text-slate-500">
                Sélectionnez une étape pour voir les actions à faire.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl text-slate-600"
              disabled={isPending}
              onClick={handleDismissToggle}
            >
              {dismissed ? "Réactiver le suivi" : "Ignorer pour le moment"}
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isSelected = step.key === selectedKey;

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setSelectedKey(step.key)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    isSelected
                      ? "border-emerald-300 bg-emerald-50/80 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      step.done
                        ? "bg-emerald-500 text-white"
                        : isSelected
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Etape {index + 1}
                      </span>
                      {step.key === nextStep.key && !derivedOnboarding.completed ? (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                          Maintenant
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-slate-900">{step.label}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{step.help}</p>
                  </div>

                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
            {dismissed
              ? "Le suivi est masqué pour les rappels du tableau de bord, mais cette page reste disponible pour terminer la mise en route."
              : "Le suivi reste visible pour les nouvelles agences jusqu'à la fin du parcours, puis devient une page de référence plus discrète."}
          </div>
        </Card>

        <Card className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                <Sparkles className="h-3.5 w-3.5" />
                {selectedStep.done ? "Étape complétée" : "Étape à traiter"}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {selectedStep.title}
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  {selectedStep.description}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Pourquoi cette étape compte</p>
              <p className="mt-1">
                {selectedStep.done
                  ? "Elle est validée. Vous pouvez passer à la suite ou revenir plus tard."
                  : "C'est l'action la plus utile pour faire progresser l'agence sans friction."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {selectedStep.reasons.map((reason) => (
              <div
                key={reason}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
              >
                {reason}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-950">Action recommandée</p>
                <p className="text-sm text-slate-600">
                  {selectedStep.help}
                  {selectedStep.key === "dashboard" && !onboarding.paymentRecorded
                    ? " Cette étape se valide vraiment après votre premier paiement."
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedStep.key === "dashboard" ? (
                  <Button
                    type="button"
                    className="rounded-xl"
                    disabled={isPending}
                    onClick={handlePrimaryAction}
                  >
                    {selectedStep.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button asChild type="button" className="rounded-xl">
                    <Link href={selectedStep.href}>
                      {selectedStep.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild type="button" variant="outline" className="rounded-xl">
                  <Link href={selectedStep.href}>Ouvrir la page</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
