import Link from "next/link";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";

import { prisma } from "@/lib/prisma";

interface FleetStatusProps {
  agencyId: string;
}
const sectionIconClass = "h-5 w-5 shrink-0";

export async function FleetStatus({ agencyId }: FleetStatusProps) {
  const vehicleStatusCounts = await prisma.vehicle.groupBy({
    by: ["status"],
    where: { agencyId },
    _count: { id: true },
  });

  const total = vehicleStatusCounts.reduce((sum, item) => sum + item._count.id, 0);
  const rented = vehicleStatusCounts.find((item) => item.status === "RENTED")?._count.id ?? 0;
  const available = vehicleStatusCounts.find((item) => item.status === "AVAILABLE")?._count.id ?? 0;
  const maintenance =
    vehicleStatusCounts.find((item) => item.status === "MAINTENANCE")?._count.id ?? 0;
  const unavailable =
    vehicleStatusCounts.find((item) => item.status === "UNAVAILABLE")?._count.id ?? 0;

  const rentedPct = total > 0 ? Math.round((rented / total) * 100) : 0;
  const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;
  const maintenancePct = total > 0 ? Math.round((maintenance / total) * 100) : 0;
  const unavailablePct = Math.max(0, 100 - rentedPct - availablePct - maintenancePct);

  const donutStyle = {
    background: `conic-gradient(
      #2563eb 0% ${rentedPct}%,
      #16a34a ${rentedPct}% ${rentedPct + availablePct}%,
      #f59e0b ${rentedPct + availablePct}% ${rentedPct + availablePct + maintenancePct}%,
      #cbd5e1 ${rentedPct + availablePct + maintenancePct}% 100%
    )`,
  };

  return (
    <Link
      href="/vehicles"
      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">État du parc</h3>
          <p className="text-xs text-muted-foreground">Distribution en temps réel</p>
        </div>
        <DirectionsCarRoundedIcon className={`${sectionIconClass} text-muted-foreground transition-colors duration-200 group-hover:text-blue-600`} />
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-900">Aucun véhicule enregistré</p>
          <p className="text-xs text-muted-foreground">Ajoutez un véhicule pour activer le suivi.</p>
          <span className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            Ajouter un véhicule
          </span>
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center justify-center">
            <div className="relative h-36 w-36 rounded-full p-4" style={donutStyle}>
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                <p className="text-2xl font-semibold text-slate-900">{total}</p>
                <p className="text-xs text-muted-foreground">Véhicules</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              title={`${rented} loués (${rentedPct}%)`}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50/80 group-focus-visible:ring-2 group-focus-visible:ring-blue-400 group-focus-visible:ring-offset-1"
            >
              <p className="text-xs text-slate-500">Loués</p>
              <p className="text-sm font-semibold text-blue-600">{rented}</p>
            </div>
            <div
              title={`${available} disponibles (${availablePct}%)`}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50/80 group-focus-visible:ring-2 group-focus-visible:ring-blue-400 group-focus-visible:ring-offset-1"
            >
              <p className="text-xs text-slate-500">Disponibles</p>
              <p className="text-sm font-semibold text-emerald-600">{available}</p>
            </div>
            <div
              title={`${maintenance} en maintenance (${maintenancePct}%)`}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50/80 group-focus-visible:ring-2 group-focus-visible:ring-blue-400 group-focus-visible:ring-offset-1"
            >
              <p className="text-xs text-slate-500">Maintenance</p>
              <p className="text-sm font-semibold text-amber-600">{maintenance}</p>
            </div>
            <div
              title={`${unavailable} indisponibles (${unavailablePct}%)`}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50/80 group-focus-visible:ring-2 group-focus-visible:ring-blue-400 group-focus-visible:ring-offset-1"
            >
              <p className="text-xs text-slate-500">Indisponibles</p>
              <p className="text-sm font-semibold text-slate-600">{unavailable}</p>
            </div>
          </div>
        </>
      )}
    </Link>
  );
}
