"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CalendarRange,
  Car,
  Users,
  MoreHorizontal,
  BookOpen,
  CreditCard,
  ClipboardCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const primaryNavItems = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard, exact: true },
  { href: "/bookings", label: "Réservations", icon: Calendar, exact: false },
  { href: "/vehicles", label: "Véhicules", icon: Car, exact: false },
  { href: "/customers", label: "Clients", icon: Users, exact: false },
];

const allNavItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/vehicles", label: "Véhicules", icon: Car, exact: false },
  { href: "/catalogue", label: "Catalogue", icon: BookOpen, exact: false },
  { href: "/customers", label: "Clients", icon: Users, exact: false },
  { href: "/bookings", label: "Réservations", icon: Calendar, exact: false },
  { href: "/calendrier", label: "Calendrier", icon: CalendarRange, exact: false },
  { href: "/payments", label: "Paiements", icon: CreditCard, exact: false },
  { href: "/damage-reports", label: "Inspections", icon: ClipboardCheck, exact: false },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isMoreActive = !primaryNavItems.some((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-border/40 flex items-center justify-around px-1 md:hidden">
        {primaryNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

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
                <Icon
                  className={cn("h-5 w-5 transition-all duration-150", isActive && "scale-110")}
                  strokeWidth={isActive ? 2.5 : 1.8}
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
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-2 mb-3">
              Menu Principal
            </p>
            <div className="grid grid-cols-2 gap-2">
              {allNavItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

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
                    <Icon
                      className="h-5 w-5 shrink-0"
                      strokeWidth={isActive ? 2.5 : 1.8}
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
