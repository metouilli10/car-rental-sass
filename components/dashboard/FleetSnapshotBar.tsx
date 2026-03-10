import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
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

  // Calculate chart segments
  const nonZeroRows = rows.filter((row) => row.value > 0);
  const segmentGap = nonZeroRows.length > 1 ? 6 : 0; // Increased gap for visual separation
  const usablePct = Math.max(0, 100 - segmentGap * nonZeroRows.length);
  
  let cursor = 0;
  const donutSegments = rows.map((row) => {
    if (row.value <= 0) {
      return { ...row, pct: 0, offset: cursor };
    }

    const pct = totalFleet > 0 ? (row.value / safeTotalFleet) * usablePct : 0;
    const segment = {
      ...row,
      pct,
      offset: cursor,
    };
    cursor += pct + segmentGap;
    return segment;
  });

  return (
    <Card className="h-full rounded-3xl border border-slate-100 bg-white shadow-sm">
      <CardContent className="flex flex-col h-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">État du parc</h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mx-auto mb-8">
          {/* Donut Chart */}
          <div className="h-48 w-48 relative">
            <svg viewBox="0 0 200 200" className="h-full w-full rotate-[-90deg]">
              {/* Background circle (optional, usually not needed if segments cover it, but good for empty state) */}
              {totalFleet === 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="24"
                />
              )}
              
              {donutSegments.map((segment) =>
                segment.pct > 0 ? (
                  <circle
                    key={segment.key}
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="24"
                    strokeLinecap="round"
                    pathLength={100}
                    strokeDasharray={`${Math.max(0, segment.pct)} 100`}
                    strokeDashoffset={-segment.offset}
                    className="transition-all duration-500 ease-out"
                  />
                ) : null
              )}
            </svg>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-sm font-medium text-slate-500 mb-1">Total Véhicules</span>
              <span className="text-4xl font-bold text-[#2e2e48]">
                {numberFormatter.format(totalFleet)}
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4 mt-auto">
          {rows.map((row) => (
            <Link
              key={row.key}
              href={row.href}
              className="group flex items-center justify-between text-sm hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span 
                  className="h-3 w-3 rounded-sm" 
                  style={{ backgroundColor: row.color }} 
                />
                <span className="font-medium text-slate-600 group-hover:text-slate-900">
                  {row.label}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-medium">
                  {numberFormatter.format(row.value)}
                </span>
                <div className="h-4 w-px bg-slate-200" />
                <span className="font-bold text-slate-900 min-w-[3ch] text-right">
                  {row.percent}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
