import React from "react";
import { cn } from "@/lib/utils";

interface CloneLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function CloneLayout({ children, className }: CloneLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900", className)}>
      {children}
    </div>
  );
}
