import { ReactNode } from "react";

interface OnboardingShellProps {
  leftPanel: ReactNode;
  children: ReactNode;
}

/** Full-page layout shell for onboarding pages (signup, setup). Server-compatible. */
export function OnboardingShell({ leftPanel, children }: OnboardingShellProps) {
  return (
    <div className="public-shell relative min-h-screen overflow-x-hidden overflow-y-auto p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-0 h-80 w-80 rounded-full bg-primary/[0.08] blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-primary/[0.05] blur-3xl" />
        <div className="absolute inset-0 grid-dots opacity-[0.22]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-start justify-center py-4 lg:items-center">
        <div className="animate-card-appear w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/88 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="grid lg:grid-cols-[360px_1fr]">
            <aside className="border-b border-border/40 lg:border-b-0 lg:border-r">
              {leftPanel}
            </aside>

            <div className="p-6 sm:p-8 md:p-10">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
