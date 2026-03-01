"use client";

import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  label: string;
  collapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SidebarSection({
  label,
  collapsed = false,
  children,
  className,
}: SidebarSectionProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {!collapsed && (
        <p className="select-none px-3 pb-1.5 pt-5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
      )}
      {collapsed && <div className="pt-3 pb-1" />}
      {children}
    </div>
  );
}
