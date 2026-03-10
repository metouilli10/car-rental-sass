"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Car, ClipboardList, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EffectivePermissions } from "@/lib/permissions";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export interface MobileBottomNavProps {
  permissions: EffectivePermissions;
}

export function MobileBottomNav({ permissions }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const isReservationsActive = pathname.startsWith("/bookings") || pathname.startsWith("/reservations");
  const isCalendarActive = pathname.startsWith("/calendrier");
  const isVehiclesActive = pathname.startsWith("/vehicles");
  const isClientsActive = pathname.startsWith("/customers") || pathname.startsWith("/clients");

  const quickActions = [
    permissions["bookings.view"] ? { href: "/bookings/create", label: "Nouvelle réservation" } : null,
    permissions["customers.view"] ? { href: "/customers/add", label: "Ajouter client" } : null,
    permissions["vehicles.view"] ? { href: "/vehicles/add", label: "Ajouter véhicule" } : null,
    permissions["inspections.view"] ? { href: "/damage-reports/new", label: "Créer inspection" } : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  const renderNavItem = ({
    allowed,
    href,
    label,
    active,
    icon: Icon,
  }: {
    allowed: boolean;
    href: string;
    label: string;
    active: boolean;
    icon: typeof ClipboardList;
  }) => {
    if (!allowed) {
      return <div className="flex-1" aria-hidden="true" />;
    }

    return (
      <Link
        href={href}
        className={cn(
          "flex h-full flex-1 flex-col items-center justify-center gap-1",
          active ? "text-blue-600" : "text-slate-400"
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="text-[10px] font-medium leading-none">{label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white md:hidden">
        {renderNavItem({
          allowed: permissions["bookings.view"],
          href: "/bookings",
          label: "Réservations",
          active: isReservationsActive,
          icon: ClipboardList,
        })}
        {renderNavItem({
          allowed: permissions["calendar.view"],
          href: "/calendrier",
          label: "Calendrier",
          active: isCalendarActive,
          icon: Calendar,
        })}
        <button
          type="button"
          onClick={() => setActionsSheetOpen(true)}
          aria-label="Ouvrir les actions rapides"
          aria-expanded={actionsSheetOpen}
          className="flex flex-1 items-center justify-center"
        >
          <span className="flex h-12 w-12 -translate-y-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700">
            <Plus className="h-5 w-5" />
          </span>
        </button>
        {renderNavItem({
          allowed: permissions["vehicles.view"],
          href: "/vehicles",
          label: "Véhicules",
          active: isVehiclesActive,
          icon: Car,
        })}
        {renderNavItem({
          allowed: permissions["customers.view"],
          href: "/customers",
          label: "Clients",
          active: isClientsActive,
          icon: Users,
        })}
      </nav>

      <Sheet open={actionsSheetOpen} onOpenChange={setActionsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-safe pt-8 md:hidden">
          <SheetTitle className="sr-only">Actions rapides</SheetTitle>
          <div className="mb-5 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-slate-200" />
          </div>
          <div className="space-y-2 pb-4">
            {quickActions.length > 0 ? (
              quickActions.map((action) => (
                <Button
                  key={action.href}
                  asChild
                  variant="outline"
                  className="h-11 w-full justify-start rounded-xl border-slate-200 text-sm font-medium text-slate-700"
                >
                  <Link href={action.href} onClick={() => setActionsSheetOpen(false)}>
                    {action.label}
                  </Link>
                </Button>
              ))
            ) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Aucune action rapide disponible.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
