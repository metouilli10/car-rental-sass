"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Calendar, User, Car } from "lucide-react";

interface FabAction {
  href: string;
  label: string;
  icon: React.ElementType;
  ariaLabel: string;
  primary?: boolean;
}

const FAB_ACTIONS: FabAction[] = [
  {
    href: "/vehicles/add",
    label: "Ajouter véhicule",
    icon: Car,
    ariaLabel: "Ajouter un véhicule",
  },
  {
    href: "/customers/add",
    label: "Ajouter client",
    icon: User,
    ariaLabel: "Ajouter un client",
  },
  {
    href: "/reservations/new",
    label: "Nouvelle réservation",
    icon: Calendar,
    ariaLabel: "Créer une nouvelle réservation",
    primary: true,
  },
];

export function MobileFAB() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isReservationWizard = pathname === "/reservations/new";
  if (isReservationWizard) return null;

  return (
    <>
      {/* Backdrop — closes speed-dial */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/25 md:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* FAB container — mobile only, above bottom nav (bottom nav height ~56px + gap) */}
      <div className="fixed bottom-[76px] right-4 z-50 flex flex-col items-end gap-3 md:hidden">
        {/* Speed-dial items (ordered bottom to top visually) */}
        <div className="flex flex-col items-end gap-3" role="group" aria-label="Actions rapides">
          {FAB_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            const delay = open ? `${i * 40}ms` : "0ms";
            return (
              <div
                key={action.href}
                className="flex items-center gap-2.5 transition-all duration-200"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
                  pointerEvents: open ? "auto" : "none",
                  transitionDelay: delay,
                }}
              >
                {/* Label chip */}
                <span
                  className={`text-xs font-medium rounded-full px-3 py-1.5 shadow-md border whitespace-nowrap ${
                    action.primary
                      ? "bg-primary text-white border-primary/20"
                      : "bg-white text-foreground border-border/40"
                  }`}
                >
                  {action.label}
                </span>

                {/* Icon button */}
                <Link
                  href={action.href}
                  aria-label={action.ariaLabel}
                  onClick={() => setOpen(false)}
                  className={`h-11 w-11 rounded-full shadow-md flex items-center justify-center transition-colors ${
                    action.primary
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-white text-foreground border border-border/30 hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Main FAB toggle button */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer les actions" : "Ouvrir les actions rapides"}
          aria-expanded={open}
          aria-haspopup="true"
          className="h-14 w-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus
            className="h-6 w-6 transition-transform duration-300"
            style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          />
        </button>
      </div>
    </>
  );
}
