import Link from "next/link";
import { CarFront, CircleOff, Settings, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardV3FleetSnapshot } from "@/lib/dashboard/types";

interface FleetSnapshotBarProps {
  snapshot: DashboardV3FleetSnapshot;
}

const ITEMS = [
  { key: "rented", label: "Loues", icon: CarFront, href: "/vehicles?status=RENTED" },
  { key: "available", label: "Disponibles", icon: Settings, href: "/vehicles?status=AVAILABLE" },
  { key: "maintenance", label: "Maintenance", icon: Wrench, href: "/vehicles?status=MAINTENANCE" },
  { key: "inactive", label: "Inactifs", icon: CircleOff, href: "/vehicles?status=UNAVAILABLE" },
] as const satisfies ReadonlyArray<{
  key: keyof DashboardV3FleetSnapshot;
  label: string;
  icon: typeof CarFront;
  href: string;
}>;

export function FleetSnapshotBar({ snapshot }: FleetSnapshotBarProps) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:translate-y-0 hover:shadow-md">
      <CardContent className="space-y-3 p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Etat du parc</h3>
          <p className="text-xs text-muted-foreground">Lecture rapide de la disponibilite flotte</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-xl border border-border bg-background px-3 py-3 shadow-sm transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={`Filtrer les vehicules ${item.label.toLowerCase()}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground/80">
                    {item.label}
                  </p>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-foreground/70" />
                  </span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-foreground">{snapshot[item.key]}</p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
