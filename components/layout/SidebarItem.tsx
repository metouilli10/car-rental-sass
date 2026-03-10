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
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        collapsed ? "justify-center gap-0 px-0 w-full" : "gap-3",
        isActive && !collapsed && "mx-2",
        isActive
          ? "bg-[#002e5d] text-white"
          : "text-[rgba(255,255,255,0.85)] hover:text-[rgba(255,255,255,0.85)] hover:bg-[#002e5d]"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 text-[rgba(255,255,255,0.75)] transition-colors duration-200 group-hover:text-[rgba(255,255,255,0.75)]",
          isActive && "text-[#60A5FA]"
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
