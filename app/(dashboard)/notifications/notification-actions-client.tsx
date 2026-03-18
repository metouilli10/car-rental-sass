"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Clock, X, ExternalLink, ChevronRight } from "lucide-react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  markNotificationDone,
  dismissNotification,
  snoozeNotification,
  snoozeNotificationUntil,
  reopenNotification,
} from "@/lib/actions/notifications";

interface NotificationActionsProps {
  id: string;
  vehicleId?: string | null;
  status: string;
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
}: NotificationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [customDate, setCustomDate] = useState("");

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
        `Rappel snoozé jusqu'au ${format(until, "d MMM yyyy", { locale: fr })}`
      );
      setSnoozeOpen(false);
      router.refresh();
    });
  };

  const handleCustomSnooze = () => {
    if (!customDate) return;
    const until = new Date(customDate);
    startTransition(async () => {
      await snoozeNotificationUntil(id, until);
      toast.success(
        `Rappel snoozé jusqu'au ${format(until, "d MMM yyyy", { locale: fr })}`
      );
      setSnoozeOpen(false);
      router.refresh();
    });
  };

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissNotification(id);
      toast("Notification ignorée");
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
    router.push(`/vehicles/${vehicleId}/edit`);
  };

  const isActive = status === "OPEN";

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {isActive && (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={handleDone}
            disabled={isPending}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Fait
          </Button>

          <Popover open={snoozeOpen} onOpenChange={setSnoozeOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                disabled={isPending}
              >
                <Clock className="h-3.5 w-3.5 mr-1" />
                Snooze
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <p className="text-xs font-medium text-muted-foreground px-2 mb-1.5">
                Reporter jusqu&apos;à
              </p>
              {SNOOZE_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => handleSnooze(opt.days)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span>{opt.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(addDays(new Date(), opt.days), "d MMM", { locale: fr })}
                  </span>
                </button>
              ))}
              <div className="mt-1.5 pt-1.5 border-t border-border/40">
                <p className="text-xs text-muted-foreground px-2 mb-1">Date personnalisée</p>
                <div className="flex gap-1 px-2">
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                    className="flex-1 text-xs border border-border rounded-lg px-2 py-1 bg-background"
                  />
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleCustomSnooze}
                    disabled={!customDate}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs text-primary hover:text-primary/80"
        onClick={handleOpenVehicle}
        disabled={isPending || !vehicleId}
      >
        <ExternalLink className="h-3.5 w-3.5 mr-1" />
        Véhicule
      </Button>

      {isActive && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
          onClick={handleDismiss}
          disabled={isPending}
          title="Ignorer"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}

      {!isActive && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={handleReopen}
          disabled={isPending}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Rouvrir
        </Button>
      )}
    </div>
  );
}
