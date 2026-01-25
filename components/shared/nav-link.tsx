"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  CreditCard,
  AlertTriangle,
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
  CreditCard,
  AlertTriangle,
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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
