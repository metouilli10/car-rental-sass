"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart3,
  Bell,
  Calendar,
  CalendarCheck,
  Car,
  ClipboardCheck,
  ClipboardList,
  Grid2x2,
  LayoutDashboard,
  Rocket,
  ShieldAlert,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const sidebarIconMap = {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Users,
  Car,
  Grid2x2,
  Wallet,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  ShieldAlert,
  Bell,
  UserCog,
  Rocket,
} as const;

type SidebarIconName = keyof typeof sidebarIconMap;

interface SidebarItemProps {
  href: string;
  iconName: SidebarIconName;
  label: string;
  collapsed?: boolean;
  badge?: string;
  emphasized?: boolean;
}

export function SidebarItem({
  href,
  iconName,
  label,
  collapsed = false,
  badge,
  emphasized = false,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const Icon = sidebarIconMap[iconName] as LucideIcon;
  const showBadge = Boolean(!collapsed && badge);
  const emphasizedIdleClasses =
    "border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/70 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-50";
  const defaultIdleClasses = "text-slate-600 hover:bg-slate-100 hover:text-slate-950";
  const emphasizedActiveClasses =
    "border border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/20";
  const defaultActiveClasses = "bg-slate-950 text-white";

  const linkContent = (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150",
        collapsed ? "justify-center gap-0 px-0 w-full" : "gap-3",
        isActive && !collapsed && "mx-2",
        emphasized && !collapsed && "px-3.5 py-2.5",
        isActive
          ? emphasized
            ? emphasizedActiveClasses
            : defaultActiveClasses
          : emphasized
            ? emphasizedIdleClasses
            : defaultIdleClasses
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors duration-200",
          isActive
            ? "text-white"
            : emphasized
              ? "text-emerald-700 group-hover:text-emerald-800"
              : "text-slate-400 group-hover:text-slate-600"
        )}
      />

      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {showBadge ? (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                isActive
                  ? "bg-white/15 text-white"
                  : emphasized
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
              )}
            >
              {badge}
            </span>
          ) : null}
        </>
      ) : null}

      {collapsed && emphasized && !isActive ? (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      ) : null}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="font-medium text-xs">
          {badge ? `${label} • ${badge}` : label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
