"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FlatIcon, type FlatIconName } from "@/components/shared/flat-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell, Wallet, ShieldAlert, type LucideIcon } from "lucide-react";

interface SidebarItemProps {
  href: string;
  iconName: string;
  label: string;
  collapsed?: boolean;
}

const flatIconMap: Record<string, FlatIconName> = {
  LayoutDashboard: "dashboard",
  Car: "car",
  Users: "people",
  Calendar: "booking",
  CalendarRange: "schedule",
  CreditCard: "payment",
  AlertTriangle: "late-payment",
  BookOpen: "catalogue",
  ClipboardCheck: "car-insurance",
};

const lucideIconMap: Record<string, LucideIcon> = {
  Bell,
  Wallet,
  ShieldAlert,
};

export function SidebarItem({ href, iconName, label, collapsed = false }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const flatIconName = flatIconMap[iconName] ?? null;
  const LucideIconFallback = lucideIconMap[iconName] ?? null;

  if (!flatIconName && !LucideIconFallback) {
    return null;
  }

  const linkContent = (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center rounded-lg text-[13px] transition-all duration-150 ease-in-out",
        collapsed
          ? "justify-center px-0 py-2 w-full"
          : "gap-3 px-3 py-2",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-[2px]"
      )}
    >
      {/* Active left accent bar */}
      {isActive && (
        <span
          className={cn(
            "absolute top-0 left-0 h-full w-[3px] rounded-r bg-primary transition-opacity duration-150",
            collapsed && "left-0"
          )}
          aria-hidden
        />
      )}

      {flatIconName ? (
        <FlatIcon
          name={flatIconName}
          size={18}
          className={cn(
            "shrink-0 transition-all duration-150",
            isActive ? "opacity-100" : "opacity-60 group-hover:opacity-90"
          )}
        />
      ) : LucideIconFallback ? (
        <LucideIconFallback
          className={cn(
            "size-[18px] shrink-0 transition-all duration-150",
            isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
          )}
        />
      ) : null}

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
