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
    <div className="flex h-full flex-col gap-6 bg-gradient-to-br from-[#2c2cf2]/[0.04] to-blue-50/80 p-6 lg:p-8">
      {/* Badge */}
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#2c2cf2]/15 bg-[#2c2cf2]/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2c2cf2]">
        {badgeIcon}
        {badgeText}
      </div>

      {/* Title & subtitle */}
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
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2c2cf2]/10 text-xs font-semibold text-[#2c2cf2]">
              {index + 1}
            </span>
            <span className="text-sm text-slate-700">{step}</span>
          </div>
        ))}
      </div>

      {/* Optional tip card */}
      {tip ? (
        <div className="mt-auto hidden rounded-2xl border border-white/70 bg-white/80 p-4 sm:block">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
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
