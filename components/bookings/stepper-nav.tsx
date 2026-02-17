"use client";

import { cn } from "@/lib/utils";
import { CalendarClock, CircleDollarSign, CreditCard, UserRound } from "lucide-react";

export interface StepperStep {
  id: string;
  title: string;
  completed: boolean;
  active: boolean;
}

interface StepperNavProps {
  steps: StepperStep[];
}

const STEP_ICONS = [CalendarClock, UserRound, CircleDollarSign, CreditCard];

export function StepperNav({ steps }: StepperNavProps) {
  return (
    <nav aria-label="Étapes de création" className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <ol className="grid gap-3 md:grid-cols-4">
        {steps.map((step, idx) => {
          const Icon = STEP_ICONS[idx] ?? CalendarClock;
          return (
            <li key={step.id}>
              <a
                href={`#${step.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                  step.active
                    ? "border-blue-500/40 bg-blue-50 text-blue-900"
                    : step.completed
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-border/70 bg-background text-muted-foreground hover:bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full",
                    step.active
                      ? "bg-blue-100 text-blue-700"
                      : step.completed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-wide">Étape {idx + 1}</span>
                  <span className="block truncate text-sm font-medium">{step.title}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
