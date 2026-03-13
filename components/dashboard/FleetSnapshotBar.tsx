import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardV3FleetSnapshot } from "@/lib/dashboard/types";

interface FleetSnapshotBarProps {
  snapshot: DashboardV3FleetSnapshot;
}

const STATUS_ITEMS = [
  { key: "rented", label: "Louées", color: "#3B82F6", href: "/vehicles?status=RENTED" },
  { key: "available", label: "Disponibles", color: "#10B981", href: "/vehicles?status=AVAILABLE" },
  { key: "maintenance", label: "Maintenance", color: "#F59E0B", href: "/vehicles?status=MAINTENANCE" },
  { key: "inactive", label: "Inactifs", color: "#EF4444", href: "/vehicles?status=UNAVAILABLE" },
] as const satisfies ReadonlyArray<{
  key: keyof DashboardV3FleetSnapshot;
  label: string;
  color: string;
  href: string;
}>;

export function FleetSnapshotBar({ snapshot }: FleetSnapshotBarProps) {
  const totalFleet = snapshot.totalActive + snapshot.inactive;
  const safeTotalFleet = totalFleet || 1;
  const activeFleet = snapshot.totalActive;
  const rentalRate = totalFleet > 0 ? Math.round((snapshot.rented / totalFleet) * 100) : 0;
  const numberFormatter = new Intl.NumberFormat("fr-FR");

  const rows = STATUS_ITEMS.map((item) => {
    const value = snapshot[item.key];
    const percent = totalFleet > 0 ? Math.round((value / safeTotalFleet) * 100) : 0;
    return {
      ...item,
      value,
      percent,
    };
  });

  return (
    <Card className="dashboard-panel">
      <CardContent className="flex flex-col p-4">
        <div className="mb-4">
          <div>
            <h3 className="section-title">État du parc</h3>
            <p className="meta-text mt-1">Répartition instantanée de la flotte</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-subtle bg-[hsl(var(--surface-muted))] px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Flotte totale
            </p>
            <p className="mt-2 text-[24px] font-semibold leading-none tracking-tight tabular-nums text-slate-950">
              {numberFormatter.format(totalFleet)}
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-[hsl(var(--surface-muted))] px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Actifs
            </p>
            <p className="mt-2 text-[24px] font-semibold leading-none tracking-tight tabular-nums text-slate-950">
              {numberFormatter.format(activeFleet)}
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-[hsl(var(--surface-muted))] px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Taux de location
            </p>
            <p className="mt-2 text-[24px] font-semibold leading-none tracking-tight tabular-nums text-slate-950">
              {rentalRate}%
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <Link
              key={row.key}
              href={row.href}
              className="group rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-subtle hover:bg-slate-50"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="truncate text-sm font-medium text-slate-600 group-hover:text-slate-900">
                    {row.label}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="min-w-[2ch] text-right text-sm font-medium tabular-nums text-slate-500">
                    {numberFormatter.format(row.value)}
                  </span>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="min-w-[3ch] text-right text-sm font-semibold tabular-nums text-slate-900">
                    {row.percent}%
                  </span>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{
                    width: `${row.percent}%`,
                    backgroundColor: row.color,
                    opacity: row.value > 0 ? 0.88 : 0.35,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
