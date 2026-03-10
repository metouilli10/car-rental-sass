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
    <div>
      <div>
        <p className="text-sm font-semibold text-slate-900">Aujourd&apos;hui</p>
        <p className="text-xs text-slate-500">Snapshot des opérations du jour</p>
      </div>

      <section className="mt-2 rounded-2xl border border-slate-200/80 bg-white px-8 py-6 shadow-sm">
        <div className="grid grid-cols-4 gap-10">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const value = operations[item.key];
            return (
              <div key={item.key} className="flex min-w-0 flex-col items-start gap-4">
                <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 opacity-90 ${item.iconTone}`} />
                <p className="text-sm text-slate-500">{item.label}</p>
                </div>
                <p className="text-4xl font-semibold leading-none tracking-tight text-slate-900">
                  {value}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
