import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type StepKey = "CONFIRMED" | "ACTIVE" | "COMPLETED";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "CONFIRMED", label: "Confirmée" },
  { key: "ACTIVE", label: "En cours" },
  { key: "COMPLETED", label: "Terminée" },
];

type Props = {
  status: "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELED" | "DRAFT" | string;
  className?: string;
};

function getStepIndex(status: string) {
  if (status === "CONFIRMED") return 0;
  if (status === "ACTIVE") return 1;
  if (status === "COMPLETED") return 2;
  return -1;
}

export function BookingLifecycleStepper({ status, className }: Props) {
  // If canceled/draft/unknown: show a single premium state chip instead of the 3-stepper.
  if (status === "CANCELED") {
    return (
      <div
        className={cn("flex items-center", className)}
        aria-label="Statut de la réservation"
      >
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-destructive">
          Annulée
        </span>
      </div>
    );
  }

  const current = getStepIndex(status);

  return (
    <nav
      className={cn(
        "rounded-xl border bg-card shadow-sm",
        "px-3 py-2 sm:px-4 sm:py-3",
        "min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]",
        className
      )}
      aria-label="Progression de la réservation"
    >
      <ol className="flex flex-nowrap items-center gap-2 sm:gap-3">
        {STEPS.map((s, i) => {
          const done = current > i;
          const isCurrent = current === i;
          const upcoming = current !== -1 ? current < i : true;

          return (
            <li key={s.key} className="flex shrink-0 items-center">
              {/* Step pill */}
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full py-1.5 font-medium transition-colors",
                  "px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm",
                  done && "text-foreground",
                  isCurrent &&
                    "bg-primary/10 text-primary ring-1 ring-primary/20",
                  upcoming && "text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* dot / check */}
                <span
                  className={cn(
                    "grid shrink-0 place-items-center rounded-full border transition-colors",
                    "size-4 sm:size-5",
                    done &&
                      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
                    isCurrent &&
                      "border-primary/30 bg-primary/10 text-primary",
                    upcoming &&
                      "border-muted-foreground/20 bg-transparent text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {done ? (
                    <Check className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-current sm:h-1.5 sm:w-1.5" />
                  )}
                </span>

                <span className="whitespace-nowrap">{s.label}</span>
              </div>

              {/* Connector (desktop only) */}
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "mx-2 hidden h-px w-8 shrink-0 rounded bg-muted sm:mx-3 sm:w-10 lg:block",
                    done && "bg-emerald-500/30",
                    isCurrent && "bg-primary/20"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile connector line (full width under steps) */}
      <div
        className="mt-2 h-px w-full rounded bg-muted lg:hidden"
        aria-hidden="true"
      />
    </nav>
  );
}
