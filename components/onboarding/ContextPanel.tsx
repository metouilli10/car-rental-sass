import { ReactNode } from "react";

interface ContextPanelProps {
  badgeIcon?: ReactNode;
  badgeText: string;
  title: string;
  subtitle: string;
  steps: string[];
  tip?: {
    icon: ReactNode;
    title: string;
    description: string;
  };
}

/** Structured left-panel for onboarding pages. Purely presentational. */
export function ContextPanel({
  badgeIcon,
  badgeText,
  title,
  subtitle,
  steps,
  tip,
}: ContextPanelProps) {
  return (
    <div className="flex h-full flex-col gap-6 bg-[linear-gradient(180deg,rgba(244,248,252,0.96),rgba(255,255,255,0.92))] p-6 lg:p-8">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {badgeIcon}
        {badgeText}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">{subtitle}</p>
      </div>

      {/* Numbered steps */}
        <div className="space-y-2.5">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <span className="text-sm text-slate-700">{step}</span>
          </div>
        ))}
      </div>

      {/* Optional tip card */}
      {tip ? (
        <div className="mt-auto hidden rounded-2xl border border-border/70 bg-white/90 p-4 shadow-sm sm:block">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
              {tip.icon}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {tip.title}
              </p>
              <p className="text-xs leading-relaxed text-slate-600">
                {tip.description}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
