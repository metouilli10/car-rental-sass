"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { MouseEvent } from "react";
import {
  CheckCircle2,
  Circle,
  Compass,
  CreditCard,
  CarFront,
  CalendarPlus2,
  Rocket,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DashboardV3Onboarding } from "@/lib/dashboard/types";
import {
  dismissOnboardingChecklist,
  markOnboardingDashboardExplored,
  resumeOnboardingChecklist,
} from "@/lib/actions/onboarding";

interface OnboardingChecklistProps {
  onboarding: DashboardV3Onboarding;
  forceVisible?: boolean;
}

const CELEBRATION_KEY = "locaryx-onboarding-celebrated";

export function OnboardingChecklist({
  onboarding,
  forceVisible = false,
}: OnboardingChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(onboarding.dismissed);
  const [dashboardExplored, setDashboardExplored] = useState(onboarding.dashboardExplored);
  const [showCelebration, setShowCelebration] = useState(false);
  const timerStartedRef = useRef(false);

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

  useEffect(() => {
    if (!onboarding.paymentRecorded || dashboardExplored || timerStartedRef.current) {
      return;
    }

    timerStartedRef.current = true;
    const timeout = window.setTimeout(() => {
      startTransition(() => {
        void (async () => {
          const result = await markOnboardingDashboardExplored();
          if (result?.success) {
            setDashboardExplored(true);
          }
        })();
      });
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [dashboardExplored, onboarding.paymentRecorded, startTransition]);

  const items = useMemo(
    () => [
      {
        key: "vehicle",
        label: "Ajoutez votre premier véhicule",
        done: onboarding.vehicleAdded,
        href: "/vehicles/add",
        help: "Ajoutez un véhicule pour commencer à gérer vos locations.",
        icon: CarFront,
      },
      {
        key: "reservation",
        label: "Créez votre première réservation",
        done: onboarding.reservationCreated,
        href: "/bookings/create",
        help: "Créez une réservation pour simuler une vraie location.",
        icon: CalendarPlus2,
      },
      {
        key: "payment",
        label: "Enregistrez votre premier paiement",
        done: onboarding.paymentRecorded,
        href: "/bookings?filter=unpaid",
        help: "Enregistrez un paiement pour voir vos revenus apparaître.",
        icon: CreditCard,
      },
      {
        key: "dashboard",
        label: "Explorez votre tableau de bord",
        done: dashboardExplored,
        href: "/dashboard",
        help: "Vérifiez comment votre tableau de bord se met à jour.",
        icon: Compass,
      },
    ],
    [
      dashboardExplored,
      onboarding.paymentRecorded,
      onboarding.reservationCreated,
      onboarding.vehicleAdded,
    ],
  );

  const completedCount = items.filter((item) => item.done).length;
  const shouldRenderChecklist = !onboarding.completed && (!dismissed || forceVisible);

  if (!onboarding.eligible) {
    return null;
  }

  function handleDashboardStepClick(event: MouseEvent<HTMLAnchorElement>) {
    if (dashboardExplored || !onboarding.paymentRecorded) {
      return;
    }

    event.preventDefault();
    startTransition(() => {
      void (async () => {
        const result = await markOnboardingDashboardExplored();
        if (result?.success) {
          setDashboardExplored(true);
        }
      })();
    });
  }

  if (!shouldRenderChecklist && !showCelebration) {
    return null;
  }

  if (showCelebration) {
    return (
      <div className="overflow-hidden">
        <Card className="rounded-2xl border border-primary/15 bg-white px-4 py-3 shadow-sm ring-1 ring-primary/5 transition-all duration-300">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900">Vous êtes prêt</p>
              <p className="text-sm text-slate-600">
                Vous êtes prêt à gérer votre agence avec Locaryx.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="rounded-2xl border border-subtle bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-subtle bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                <Rocket className="h-3.5 w-3.5" />
                Démarrage guidé
              </div>
              <div className="space-y-1">
                <h2 className="text-[15px] font-semibold text-slate-900">Bienvenue sur Locaryx</h2>
                <p className="text-[12px] text-slate-600">
                  Complétez ces étapes pour démarrer votre agence.
                </p>
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-subtle bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">
                  {completedCount} / 4 étapes complétées
                </div>
                <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${(completedCount / 4) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {forceVisible && dismissed ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-primary/20 bg-white/80 text-primary hover:bg-primary/5"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => {
                      void (async () => {
                        const result = await resumeOnboardingChecklist();
                        if (result?.success) {
                          setDismissed(false);
                        }
                      })();
                    })
                  }
                >
                  Réafficher sur le tableau de bord
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl text-slate-600 hover:bg-white/80 hover:text-slate-900"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => {
                    void (async () => {
                      const result = await dismissOnboardingChecklist();
                      if (result?.success) {
                        setDismissed(true);
                      }
                    })();
                  })
                }
              >
                Ignorer pour le moment
              </Button>
            </div>
          </div>

          <div className="grid gap-2.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={item.key === "dashboard" ? handleDashboardStepClick : undefined}
                    className="flex items-center justify-between rounded-xl border border-subtle bg-slate-50/60 px-3 py-2.5 transition hover:border-primary/20 hover:bg-white"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
                          item.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-700"
                        } transition-all duration-300`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.help}</p>
                      </div>
                    </div>
                    <span className="ml-3 shrink-0">
                      {item.done ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 transition-transform duration-300" />
                      ) : (
                        <Circle className="h-5 w-5 text-primary/50" />
                      )}
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64 text-center text-xs">
                  {item.help}
                </TooltipContent>
              </Tooltip>
            );
          })}
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
