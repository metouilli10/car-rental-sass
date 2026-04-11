import Link from "next/link";
import { BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { VehicleReminderItem } from "@/lib/vehicles/profile";
import { getReminderSheetTypeFromReminderType } from "@/lib/vehicles/reminder-sheet";
import type { AppLocale } from "@/lib/i18n/config";
import { withLocalePath } from "@/lib/i18n/config";
import { getReminderSeverityClass, notificationStatusLabels, reminderTypeLabels } from "./presentation";

export function VehicleRemindersPanel({
  vehicleId,
  overdue,
  open,
  done,
  compact = false,
  locale = "fr",
}: {
  vehicleId: string;
  overdue: VehicleReminderItem[];
  open: VehicleReminderItem[];
  done: VehicleReminderItem[];
  compact?: boolean;
  locale?: AppLocale;
}) {
  const items = compact ? [...overdue, ...open].slice(0, 3) : [...overdue, ...open, ...done];
  const createReminderHref = withLocalePath(locale, `/vehicles/${vehicleId}?tab=tracking&sheet=1`);

  return (
    <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Entretien & rappels</CardTitle>
        <Button variant="secondary" size="sm" asChild>
          <Link href={createReminderHref}>
            Ajouter rappel
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6">
            <p className="text-sm font-semibold text-slate-950">Aucun rappel actif</p>
            <p className="mt-1 text-sm text-slate-500">
              Ajoutez un rappel pour suivre l’entretien ou une échéance à venir.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link href={createReminderHref}>
                Ajouter un rappel
              </Link>
            </Button>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-[20px] px-4 py-3 ${
                compact ? "bg-slate-50/80" : "border border-slate-200/70 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getReminderSeverityClass(item.severity)}`}>
                      {reminderTypeLabels[item.type]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.body}</p>
                </div>
                <span className="text-xs font-medium text-slate-400">{notificationStatusLabels[item.status]}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {item.dueAt ? <span>Échéance: {formatDate(item.dueAt)}</span> : null}
                  {item.dueMileageKm != null ? <span>À {item.dueMileageKm.toLocaleString("fr-FR")} km</span> : null}
                </div>
                <Link
                  href={withLocalePath(
                    locale,
                    `/vehicles/${vehicleId}?tab=tracking&sheet=1&reminder=${getReminderSheetTypeFromReminderType(item.type)}`,
                  )}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Configurer
                </Link>
              </div>
            </div>
          ))
        )}
        {!compact && done.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Terminés</p>
            <p className="mt-1 text-sm text-slate-500">{done.length} rappel(s) clôturé(s).</p>
          </div>
        ) : null}
        {compact ? (
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span>{done.length} rappel(s) terminés dans l’historique.</span>
            </div>
            <Link
              href={withLocalePath(locale, `/vehicles/${vehicleId}?tab=tracking`)}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Voir tous les rappels
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
