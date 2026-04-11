"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import type { CalendarBooking, CalendarVehicle } from "@/lib/actions/calendar";
import { cancelBooking, completeBooking } from "@/lib/actions/bookings";
import { getEffectiveStatus, statusStyles } from "./EventBlock";
import { useLocalizedPath } from "@/components/i18n/use-localized-path";

interface ReservationBlockProps {
  booking: CalendarBooking;
  vehicle: CalendarVehicle;
  canEdit: boolean;
  canManageDestructive: boolean;
  isSaving: boolean;
  highlight?: "valid" | "invalid";
  onDragPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onResizePointerDown: (
    event: React.PointerEvent<HTMLElement>,
    edge: "start" | "end",
  ) => void;
}

export function ReservationBlock({
  booking,
  vehicle,
  canEdit,
  canManageDestructive,
  isSaving,
  highlight,
  onDragPointerDown,
  onResizePointerDown,
}: ReservationBlockProps) {
  const lp = useLocalizedPath();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const effectiveStatus = getEffectiveStatus(booking);
  const style = statusStyles[effectiveStatus] || statusStyles.CONFIRMED;

  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const durationDays = differenceInCalendarDays(endDate, startDate);

  const formattedPrice = useMemo(
    () =>
      new Intl.NumberFormat("fr-MA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(booking.totalPrice),
    [booking.totalPrice],
  );

  const formattedDeposit = useMemo(
    () =>
      new Intl.NumberFormat("fr-MA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(booking.depositAmount),
    [booking.depositAmount],
  );

  const runServerAction = (
    action: () => Promise<void | { success: true } | { error: string }>,
    successMessage: string
  ) => {
    startTransition(async () => {
      try {
        const result = await action();
        if (result && typeof result === "object" && "error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success(successMessage);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Action impossible pour le moment");
      }
    });
  };

  const canClose = booking.status === "ACTIVE";
  const canCancel = canManageDestructive && (booking.status === "CONFIRMED" || booking.status === "ACTIVE");
  const canCollectPayment = booking.paymentStatus === "PENDING" || booking.paymentStatus === "PARTIAL";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerDown={onDragPointerDown}
          className={cn(
            "group/block absolute inset-y-1 w-full rounded-md border-l-4 px-2 py-1.5 text-left transition-all",
            "hover:shadow-md hover:scale-[1.01] hover:z-20",
            "overflow-hidden",
            style.bg,
            style.border,
            style.text,
            highlight === "valid" && "ring-2 ring-emerald-500/70",
            highlight === "invalid" && "ring-2 ring-red-500/80",
          )}
          title={`${booking.customer.name} - ${formattedPrice} MAD`}
        >
          {canEdit && (
            <>
              <span
                className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 transition-opacity group-hover/block:opacity-100"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onResizePointerDown(event, "start");
                }}
              />
              <span
                className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 transition-opacity group-hover/block:opacity-100"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onResizePointerDown(event, "end");
                }}
              />
            </>
          )}

          <div className="truncate text-xs font-semibold leading-tight">
            {booking.customer.name}
          </div>
          <div className="mt-0.5 truncate text-[10px] leading-tight opacity-80">
            {booking.customer.phone}
          </div>
          <div className="mt-0.5 truncate text-[10px] font-medium leading-tight">
            {formattedPrice} MAD
          </div>

          {isSaving && (
            <span className="absolute right-2 top-1 inline-flex items-center gap-1 text-[10px] font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sauvegarde...
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" sideOffset={8}>
        <div className="space-y-3 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold">{booking.customer.name}</p>
            <p className="text-xs text-muted-foreground">{booking.customer.phone}</p>
          </div>

          <div className="text-xs text-muted-foreground">
            {vehicle.make} {vehicle.model} - {vehicle.plate}
          </div>

          <div className="text-sm">
            {format(startDate, "d MMM yyyy", { locale: fr })} -{" "}
            {format(endDate, "d MMM yyyy", { locale: fr })}
            <span className="ml-1 text-xs text-muted-foreground">
              ({durationDays} jour{durationDays > 1 ? "s" : ""})
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{formattedPrice} MAD</span>
            <span className="text-muted-foreground">• Caution {formattedDeposit} MAD</span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge
              status={
                effectiveStatus === "LATE"
                  ? "ACTIVE"
                  : (booking.status as "DRAFT" | "CONFIRMED" | "ACTIVE" | "COMPLETED")
              }
            />
            {effectiveStatus === "LATE" ? (
              <Badge variant="destructive">En retard</Badge>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-border pt-2">
            <Button asChild variant="ghost" size="sm" className="w-full justify-start">
              <Link href={lp(`/bookings/${booking.id}`)}>Voir</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full justify-start">
              <Link href={lp(`/bookings/${booking.id}/edit`)}>Modifier</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              disabled={!canCollectPayment}
              title={canCollectPayment ? undefined : "Bientôt"}
              onClick={() => {
                if (!canCollectPayment) {
                  toast.info("Encaissement : Bientôt");
                } else {
                  toast.info("Encaissement : Bientôt");
                }
              }}
            >
              Encaisser paiement
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              disabled={!canClose || isPending}
              onClick={() =>
                runServerAction(
                  () => completeBooking(booking.id),
                  "Réservation clôturée",
                )
              }
            >
              Clôturer
            </Button>

            {canCancel ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                disabled={isPending}
                onClick={() =>
                  runServerAction(
                    () => cancelBooking(booking.id),
                    "Réservation annulée",
                  )
                }
              >
                Annuler
              </Button>
            ) : null}

            {canManageDestructive ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => toast.info("Suppression : Bientôt")}
              >
                Supprimer
              </Button>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
