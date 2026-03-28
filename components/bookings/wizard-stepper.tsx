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
  const completedCount = steps.filter((step) => step.isComplete).length;
  const progressPercent = Math.max(25, (currentStep / steps.length) * 100);

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

      <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(243,247,255,0.96)_100%)] p-5 shadow-sm md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Progression</p>
            <p className="mt-2 text-[1.375rem] font-semibold leading-tight text-slate-950">
              Étape {currentStep}/4
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">{steps[currentStep - 1].title}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm">
            {completedCount}
            <Circle className="h-3 w-3 fill-current" />
            complétées
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#0f4ec9_0%,#2d6df6_100%)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {steps.map((step) => {
            const Icon = ICONS[step.id];
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "rounded-2xl border px-2 py-2 text-left transition-all",
                  step.isActive
                    ? "border-blue-200 bg-blue-50 text-blue-900"
                    : step.isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-white/80 bg-white/80 text-slate-500",
                )}
              >
                <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                  {step.isComplete && !step.isActive ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="block text-[11px] font-medium leading-tight">Étape {step.id}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
