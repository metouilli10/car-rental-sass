import Link from "next/link";
import { cn } from "@/lib/utils";
import type { VehicleProfileTab } from "@/lib/vehicles/profile";

interface VehicleTabsProps {
  vehicleId: string;
  currentTab: VehicleProfileTab;
}

const tabs: Array<{ value: VehicleProfileTab; label: string }> = [
  { value: "overview", label: "Aperçu" },
  { value: "reservations", label: "Réservations" },
  { value: "tracking", label: "Suivi véhicule" },
  { value: "documents", label: "Documents" },
];

export function VehicleTabs({ vehicleId, currentTab }: VehicleTabsProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-1">
        <div className="inline-flex min-w-max gap-1 rounded-full border border-slate-200/80 bg-slate-50/85 p-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/vehicles/${vehicleId}?tab=${tab.value}`}
              className={cn(
                "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
                currentTab === tab.value
                  ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
