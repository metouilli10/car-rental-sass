import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FinanceTableShellProps = {
  children: ReactNode;
  compact?: boolean;
  className?: string;
};

export function FinanceTableShell({ children, compact = false, className }: FinanceTableShellProps) {
  return (
    <div className={cn("rounded-xl border border-border/70 bg-card shadow-sm", className)}>
      <div className={cn("overflow-auto", compact ? "max-h-[360px]" : "max-h-[540px]")}>{children}</div>
    </div>
  );
}
