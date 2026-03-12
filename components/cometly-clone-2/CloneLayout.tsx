import React from "react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { cn } from "@/lib/utils";

interface CloneLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function CloneLayout({ children, className }: CloneLayoutProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900",
        className
      )}
    >
      <BackgroundPaths className="absolute inset-x-0 top-0 z-0 h-[980px] opacity-50" stroke="#2563EB" />
      {children}
    </div>
  );
}
