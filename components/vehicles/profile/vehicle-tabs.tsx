import Link from "next/link";
import { cn } from "@/lib/utils";
import type { VehicleProfileTab } from "@/lib/vehicles/profile";

interface VehicleTabsProps {
  vehicleId: string;
  currentTab: VehicleProfileTab;
}

const tabs: Array<{ value: VehicleProfileTab; label: string }> = [
  { value: "overview", label: "Vue d’ensemble" },
  { value: "reservations", label: "Historique réservations" },
  { value: "inspections", label: "Historique inspections" },
  { value: "maintenance", label: "Entretien & rappels" },
  { value: "compliance", label: "Échéances & documents" },
  { value: "infractions", label: "Infractions" },
];

export function VehicleTabs({ vehicleId, currentTab }: VehicleTabsProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-1">
        <div className="inline-flex min-w-max gap-1 rounded-full bg-muted p-1.5">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/vehicles/${vehicleId}?tab=${tab.value}`}
              className={cn(
                "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                currentTab === tab.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
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
