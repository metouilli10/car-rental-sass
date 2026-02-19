"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FlatIcon, type FlatIconName } from "@/components/shared/flat-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell, type LucideIcon } from "lucide-react";

interface NavLinkProps {
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

// Lucide fallback icons for items without a flat icon equivalent
const lucideIconMap: Record<string, LucideIcon> = {
  Bell,
};

function NavLinkInner({
  href,
  iconName,
  label,
  collapsed,
  isActive,
  flatIconName,
  LucideIconFallback,
}: {
  href: string;
  iconName: string;
  label: string;
  collapsed: boolean;
  isActive: boolean;
  flatIconName: FlatIconName | null;
  LucideIconFallback: LucideIcon | null;
}) {
  const linkContent = (
    <Link
      href={href}
      className={cn(
        "relative flex items-center rounded-lg text-sm font-medium transition-all duration-200 ease-out",
        collapsed ? "justify-center px-0 py-3 w-full" : "gap-3.5 px-3 py-3",
        isActive
          ? collapsed
            ? "bg-primary/[0.03] text-primary font-semibold"
            : "bg-primary/[0.04] text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      )}
    >
      {/* Active left indicator bar — visible in both states */}
      {isActive && (
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-primary/70 transition-opacity duration-200",
            collapsed ? "left-0" : "-left-3"
          )}
          aria-hidden
        />
      )}
      {flatIconName ? (
        <FlatIcon
          name={flatIconName}
          size={22}
          className={cn(
            "shrink-0 transition-colors duration-200",
            isActive ? "text-primary opacity-100" : "opacity-75 hover:opacity-100"
          )}
        />
      ) : LucideIconFallback ? (
        <LucideIconFallback
          className={cn(
            "h-[22px] w-[22px] shrink-0 transition-colors duration-200",
            isActive ? "text-primary opacity-100" : "opacity-75"
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
        <TooltipContent side="right" sideOffset={8} className="font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

export function NavLink({ href, iconName, label, collapsed = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const flatIconName = flatIconMap[iconName] ?? null;
  const LucideIconFallback = lucideIconMap[iconName] ?? null;

  if (!flatIconName && !LucideIconFallback) {
    return null;
  }

  return (
    <NavLinkInner
      href={href}
      iconName={iconName}
      label={label}
      collapsed={collapsed}
      isActive={isActive}
      flatIconName={flatIconName}
      LucideIconFallback={LucideIconFallback}
    />
  );
}
