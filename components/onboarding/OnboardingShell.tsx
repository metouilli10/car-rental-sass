import { ReactNode } from "react";

interface OnboardingShellProps {
  leftPanel: ReactNode;
  children: ReactNode;
}

/** Full-page layout shell for onboarding pages (signup, setup). Server-compatible. */
export function OnboardingShell({ leftPanel, children }: OnboardingShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-gray-50 to-blue-50/30 p-4">
      {/* Animated gradient orbs — matches login page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-48 -top-48 h-96 w-96 rounded-full bg-gradient-to-br from-[#2c2cf2]/20 via-[#2c2cf2]/10 to-transparent blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-[#f5a938]/15 via-[#f5a938]/5 to-transparent blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#2c2cf2]/5 via-transparent to-[#f5a938]/5 blur-3xl"
        />
        {/* Subtle dot-grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #2c2cf2 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Centered container */}
      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="animate-card-appear w-full overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-2xl shadow-black/5 backdrop-blur-xl">
          <div className="grid lg:grid-cols-[360px_1fr]">
            {/* Left: context panel */}
            <aside className="border-b border-border/40 lg:border-b-0 lg:border-r">
              {leftPanel}
            </aside>

            {/* Right: form content */}
            <div className="p-6 sm:p-8 md:p-10">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
