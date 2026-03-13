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
  Grid2x2,
  LayoutDashboard,
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
  ShieldAlert,
  Bell,
  UserCog,
} as const;

type SidebarIconName = keyof typeof sidebarIconMap;

interface SidebarItemProps {
  href: string;
  iconName: SidebarIconName;
  label: string;
  collapsed?: boolean;
}

export function SidebarItem({ href, iconName, label, collapsed = false }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const Icon = sidebarIconMap[iconName] as LucideIcon;

  const linkContent = (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150",
        collapsed ? "justify-center gap-0 px-0 w-full" : "gap-3",
        isActive && !collapsed && "mx-2",
        isActive
          ? "bg-slate-950 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-slate-600",
          isActive && "text-white"
        )}
      />

      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="font-medium text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
