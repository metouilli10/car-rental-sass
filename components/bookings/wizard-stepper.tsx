"use client";

import { CheckCircle2, Circle, CircleDollarSign, CreditCard, CalendarClock, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStepItem {
  id: 1 | 2 | 3 | 4;
  title: string;
  isComplete: boolean;
  isActive: boolean;
}

interface WizardStepperProps {
  steps: WizardStepItem[];
  currentStep: 1 | 2 | 3 | 4;
  onStepClick: (step: 1 | 2 | 3 | 4) => void;
}

const ICONS = {
  1: CalendarClock,
  2: UserRound,
  3: CircleDollarSign,
  4: CreditCard,
} as const;

export function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <>
      <div className="hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:block">
        <ol className="grid grid-cols-4 gap-3">
          {steps.map((step) => {
            const Icon = ICONS[step.id];
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                    step.isActive
                      ? "border-blue-300 bg-blue-50 text-blue-900"
                      : step.isComplete
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : "border-border/70 bg-background text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full",
                      step.isActive
                        ? "bg-blue-100 text-blue-700"
                        : step.isComplete
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {step.isComplete && !step.isActive ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-wide">Étape {step.id}</span>
                    <span className="block truncate text-sm font-medium">{step.title}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:hidden">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Progression</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-base font-semibold">
            Étape {currentStep}/4 — {steps[currentStep - 1].title}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
            {steps.filter((step) => step.isComplete).length}
            <Circle className="h-3 w-3 fill-current" />
            complétées
          </span>
        </div>
      </div>
    </>
  );
}
