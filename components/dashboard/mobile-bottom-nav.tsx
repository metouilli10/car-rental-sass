"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EffectivePermissions } from "@/lib/permissions";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { FlatIcon, type FlatIconName } from "@/components/shared/flat-icon";

type NavItem = {
  href: string;
  label: string;
  iconName: FlatIconName;
  exact: boolean;
};

const primaryNavItems = [
  { href: "/dashboard", label: "Accueil", iconName: "dashboard", exact: true },
  { href: "/bookings", label: "Réservations", iconName: "booking", exact: false },
  { href: "/vehicles", label: "Véhicules", iconName: "car", exact: false },
  { href: "/customers", label: "Clients", iconName: "people", exact: false },
] satisfies NavItem[];

export interface MobileBottomNavProps {
  role: UserRole;
  permissions: EffectivePermissions;
}

export function MobileBottomNav({ role, permissions }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const effectivePrimaryNavItems = [
    permissions["dashboard.view"] ? primaryNavItems[0] : null,
    permissions["bookings.view"] ? primaryNavItems[1] : null,
    permissions["vehicles.view"] ? primaryNavItems[2] : null,
    permissions["customers.view"] ? primaryNavItems[3] : null,
  ].filter(Boolean) as NavItem[];

  const effectiveAllNavItems: NavItem[] = [
    permissions["dashboard.view"]
      ? { href: "/dashboard", label: "Tableau de bord", iconName: "dashboard", exact: true }
      : null,
    permissions["vehicles.view"]
      ? { href: "/vehicles", label: "Véhicules", iconName: "car", exact: false }
      : null,
    permissions["catalogue.view"]
      ? { href: "/catalogue", label: "Catalogue", iconName: "catalogue", exact: false }
      : null,
    permissions["customers.view"]
      ? { href: "/customers", label: "Clients", iconName: "people", exact: false }
      : null,
    permissions["bookings.view"]
      ? { href: "/bookings", label: "Réservations", iconName: "booking", exact: false }
      : null,
    permissions["calendar.view"]
      ? { href: "/calendrier", label: "Calendrier", iconName: "schedule", exact: false }
      : null,
    permissions["finance.view"]
      ? { href: "/finance", label: "Finance", iconName: "payment", exact: false }
      : null,
    permissions["caisse.view"]
      ? { href: "/caisse", label: "Caisse", iconName: "wallet", exact: false }
      : null,
    permissions["inspections.view"]
      ? { href: "/damage-reports", label: "Inspections", iconName: "car-insurance", exact: false }
      : null,
    permissions["infractions.view"]
      ? { href: "/infractions", label: "Infractions", iconName: "late-payment", exact: false }
      : null,
    role === "OWNER"
      ? { href: "/users", label: "Utilisateurs", iconName: "people", exact: false }
      : null,
  ].filter(Boolean) as NavItem[];

  const isMoreActive = !effectivePrimaryNavItems.some((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-border/40 flex items-center justify-around px-1 md:hidden">
        {effectivePrimaryNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors duration-150",
                isActive ? "text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
            >
              <div className="flex h-11 w-11 items-center justify-center">
                <FlatIcon
                  name={item.iconName}
                  size={22}
                  className={cn(
                    "transition-all duration-150",
                    isActive ? "opacity-100 scale-110" : "opacity-70"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none truncate",
                  isActive ? "text-primary" : "text-muted-foreground/60"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* "Plus" button — opens full nav sheet */}
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="Voir tous les menus"
          aria-expanded={sheetOpen}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors duration-150",
            isMoreActive ? "text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center">
            <MoreHorizontal
              className={cn("h-5 w-5 transition-all duration-150", isMoreActive && "scale-110")}
              strokeWidth={isMoreActive ? 2.5 : 1.8}
            />
          </div>
          <span
            className={cn(
              "text-[10px] font-medium leading-none truncate",
              isMoreActive ? "text-primary" : "text-muted-foreground/60"
            )}
          >
            Plus
          </span>
        </button>
      </nav>

      {/* Full-nav bottom sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-safe md:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-border/60" />
          </div>

          <div className="px-4 pb-2">
            <div className="mb-4 flex justify-center">
              <div className="relative h-8 w-[132px]">
                <Image
                  src="/assets/locapro-logo.png"
                  alt="Locapro"
                  fill
                  className="object-contain [filter:contrast(1.08)_saturate(1.06)]"
                  sizes="132px"
                  priority
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-2 mb-3">
              Menu Principal
            </p>
            <div className="grid grid-cols-2 gap-2">
              {effectiveAllNavItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
                    )}
                  >
                    <FlatIcon
                      name={item.iconName}
                      size={20}
                      className={cn("shrink-0", isActive ? "opacity-100" : "opacity-70")}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Bottom padding for home indicator */}
          <div className="h-6" />
        </SheetContent>
      </Sheet>
    </>
  );
}
