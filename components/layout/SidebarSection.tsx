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
        <p className="mb-2 mt-5 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
      )}
      {collapsed && <div className="pt-3 pb-1" />}
      {children}
    </div>
  );
}
