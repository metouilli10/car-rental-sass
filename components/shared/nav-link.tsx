"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  CalendarRange,
  CreditCard,
  AlertTriangle,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

interface NavLinkProps {
  href: string;
  iconName: string;
  label: string;
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  CalendarRange,
  CreditCard,
  AlertTriangle,
  BookOpen,
};

export function NavLink({ href, iconName, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const Icon = iconMap[iconName];

  if (!Icon) {
    return null;
  }

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-muted text-foreground border-l-4 border-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
