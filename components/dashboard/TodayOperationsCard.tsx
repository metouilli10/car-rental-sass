import { CarFront, ClockAlert, CornerUpLeft, LogOut } from "lucide-react";
import type { DashboardV3TodayOperations } from "@/lib/dashboard/types";

interface TodayOperationsCardProps {
  operations: DashboardV3TodayOperations;
}

const ITEMS = [
  { key: "departures", label: "Départs", icon: LogOut, iconTone: "text-blue-600" },
  { key: "returns", label: "Retours", icon: CornerUpLeft, iconTone: "text-emerald-600" },
  { key: "overdueReturns", label: "Retards", icon: ClockAlert, iconTone: "text-red-600" },
  { key: "availableVehicles", label: "Disponibles", icon: CarFront, iconTone: "text-slate-600" },
] as const;

export function TodayOperationsCard({ operations }: TodayOperationsCardProps) {
  return (
    <section className="dashboard-panel p-4">
      <div className="mb-3">
        <p className="section-title">Aujourd&apos;hui</p>
        <p className="meta-text mt-1">Départs, retours et disponibilité immédiate</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const value = operations[item.key];
            return (
              <div
                key={item.key}
                className="rounded-xl border border-subtle bg-[hsl(var(--surface-muted))] px-3 py-3 transition-colors duration-200 hover:border-default hover:bg-white"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${item.iconTone}`} />
                  <p className="text-[12px] font-medium leading-none text-slate-500">{item.label}</p>
                </div>
                <p className="text-[22px] font-semibold leading-none tracking-tight tabular-nums text-slate-950">
                  {value.toString().padStart(2, "0")}
                </p>
              </div>
            );
          })}
      </div>
    </section>
  );
}
