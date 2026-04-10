"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, ChevronRight, Clock3, Ellipsis, ExternalLink, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  dismissNotification,
  markNotificationDone,
  reopenNotification,
  snoozeNotification,
  snoozeNotificationUntil,
} from "@/lib/actions/notifications";
import type { NotificationStatus } from "@prisma/client";

interface NotificationActionsProps {
  id: string;
  vehicleId?: string | null;
  status: NotificationStatus;
  primaryLabel?: string;
}

const SNOOZE_OPTIONS = [
  { label: "1 jour", days: 1 },
  { label: "3 jours", days: 3 },
  { label: "7 jours", days: 7 },
];

export function NotificationActions({
  id,
  vehicleId,
  status,
  primaryLabel = "Voir le véhicule",
}: NotificationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [customDate, setCustomDate] = useState("");

  const isActive = status === "OPEN";

  const handleDone = () => {
    startTransition(async () => {
      await markNotificationDone(id);
      toast.success("Marqué comme terminé");
      router.refresh();
    });
  };

  const handleSnooze = (days: number) => {
    const until = addDays(new Date(), days);
    startTransition(async () => {
      await snoozeNotification(id, days);
      toast.success(
        `Rappel snoozé jusqu'au ${format(until, "d MMM yyyy", { locale: fr })}`,
      );
      setOverflowOpen(false);
      router.refresh();
    });
  };

  const handleCustomSnooze = () => {
    if (!customDate) return;

    const until = new Date(customDate);
    startTransition(async () => {
      await snoozeNotificationUntil(id, until);
      toast.success(
        `Rappel snoozé jusqu'au ${format(until, "d MMM yyyy", { locale: fr })}`,
      );
      setOverflowOpen(false);
      setCustomDate("");
      router.refresh();
    });
  };

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissNotification(id);
      toast("Notification ignorée");
      setOverflowOpen(false);
      router.refresh();
    });
  };

  const handleReopen = () => {
    startTransition(async () => {
      await reopenNotification(id);
      toast.success("Notification rouverte");
      router.refresh();
    });
  };

  const handleOpenVehicle = () => {
    if (!vehicleId) {
      toast.error("Véhicule introuvable pour cette notification.");
      return;
    }

    router.push(`/vehicles/${vehicleId}`);
  };

  return (
    <div className="flex w-full flex-col gap-2 border-t border-subtle pt-3 sm:w-auto sm:min-w-[220px] sm:border-t-0 sm:pt-0 lg:items-end">
      <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end">
        <Button
          size="sm"
          onClick={handleOpenVehicle}
          disabled={isPending || !vehicleId}
          className="h-9 rounded-xl px-3.5 text-sm"
        >
          <ExternalLink className="h-4 w-4" />
          {primaryLabel}
        </Button>

        {isActive ? (
          <Button
            size="sm"
            variant="secondary"
            className="h-9 rounded-xl border-subtle px-3.5 text-sm text-slate-700"
            onClick={handleDone}
            disabled={isPending}
          >
            <Check className="h-4 w-4" />
            Marquer comme fait
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-9 rounded-xl px-3.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            onClick={handleReopen}
            disabled={isPending}
          >
            <RotateCcw className="h-4 w-4" />
            Rouvrir
          </Button>
        )}

        {isActive ? (
          <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 rounded-xl border border-subtle bg-white p-0 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                disabled={isPending}
                aria-label="Plus d'actions"
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 rounded-2xl border border-subtle p-2 shadow-card-lg">
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Actions rapides
                </p>
              </div>

              <div className="space-y-1 px-1 pb-2">
                <p className="px-2 pt-1 text-[11px] font-medium text-slate-500">
                  Snoozer jusqu&apos;à
                </p>
                {SNOOZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => handleSnooze(opt.days)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-amber-500" />
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {format(addDays(new Date(), opt.days), "d MMM", { locale: fr })}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-subtle px-3 py-3">
                <p className="mb-2 text-[11px] font-medium text-slate-500">
                  Date personnalisée
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customDate}
                    onChange={(event) => setCustomDate(event.target.value)}
                    min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                    className="h-9 flex-1 rounded-xl border border-subtle bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  />
                  <Button
                    size="sm"
                    className="h-9 rounded-xl px-3"
                    onClick={handleCustomSnooze}
                    disabled={!customDate}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t border-subtle px-1 pt-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  Ignorer
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
    </div>
  );
}
