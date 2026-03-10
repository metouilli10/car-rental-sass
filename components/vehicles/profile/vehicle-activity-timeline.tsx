import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { VehicleActivityItem } from "@/lib/vehicles/profile";
import { getActivityToneClass } from "./presentation";

export function VehicleActivityTimeline({
  activity,
  compact = false,
}: {
  activity: VehicleActivityItem[];
  compact?: boolean;
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-sm">
      <CardHeader className={compact ? "pb-3" : undefined}>
        <CardTitle className="text-base">Activité récente</CardTitle>
      </CardHeader>
      <CardContent className={compact ? "space-y-3" : "space-y-4"}>
        {activity.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Aucune activité récente pour ce véhicule.
          </div>
        ) : (
          activity.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${getActivityToneClass(item.tone)}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <span className="text-xs text-slate-400">{formatDateTime(item.timestamp)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                {item.href ? (
                  <Link href={item.href} className="mt-1 inline-flex text-xs font-medium text-blue-600 hover:text-blue-700">
                    Ouvrir
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
