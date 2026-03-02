"use client";

import Link from "next/link";
import { UserRole } from "@prisma/client";
import { Eye } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookingActionsDropdown } from "@/components/bookings/booking-actions-dropdown";
import type { BookingListItem } from "@/components/bookings/bookings-control-center";
import { ReservationRiskBadges } from "@/components/reservations/ReservationRiskBadges";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  toDate,
  getDurationDays,
  getBookingUrgency,
  getDayProgress,
} from "@/lib/bookings/list-utils";

interface ReservationCardProps {
  booking: BookingListItem;
  role: UserRole;
  today: Date;
}

export function ReservationCard({ booking, role, today }: ReservationCardProps) {
  const startDate = toDate(booking.startDate);
  const endDate = toDate(booking.endDate);
  const durationDays = getDurationDays(startDate, endDate);
  const urgency = getBookingUrgency(booking, today);
  const dayProgress = getDayProgress(booking, today);

  const paidNowValue = typeof booking.paidNow === "number" ? booking.paidNow : null;
  const remainingValue =
    typeof booking.remainingAmount === "number" ? booking.remainingAmount : null;

  return (
    <Card
      className={cn(
        "overflow-hidden",
        booking.risk.hasOverlapConflict && "border-red-200"
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Top row: client name + status pill */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/customers/${booking.customer.id}`}
              className="font-semibold text-foreground underline-offset-4 hover:underline min-w-0 truncate"
            >
              {booking.customer.name}
            </Link>
            <StatusBadge status={booking.status} />
          </div>

          {/* Second line: vehicle name + plate */}
          <div className="text-sm text-muted-foreground">
            <Link
              href={`/vehicles/${booking.vehicle.id}/edit`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {booking.vehicle.make} {booking.vehicle.model}
            </Link>
            <span className="ml-1">({booking.vehicle.plate})</span>
          </div>

          {/* Dates block */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-foreground">
              {formatDate(startDate)} → {formatDate(endDate)}
            </span>
            <span className="text-muted-foreground">({durationDays} jours)</span>
            {dayProgress != null && (
              <span className="text-xs font-medium text-primary">
                Jour {dayProgress}/{durationDays}
              </span>
            )}
            {urgency && (
              <Badge variant={urgency.variant} className="text-xs">
                {urgency.label}
              </Badge>
            )}
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2">
            <ReservationRiskBadges
              signals={booking.risk.signals}
              compact
            />
          </div>

          {/* Finance block */}
          <div
            className={cn(
              "rounded-xl p-2 text-sm",
              booking.risk.hasUnpaidDeposit && "border border-amber-200 bg-amber-50/80"
            )}
          >
            <span className="font-semibold text-foreground">
              {formatCurrency(booking.totalPrice)}
            </span>
            <span className="ml-1 text-muted-foreground">
              Paye: {paidNowValue !== null ? formatCurrency(paidNowValue) : "--"} · Reste:{" "}
              {remainingValue !== null ? formatCurrency(remainingValue) : "--"}
            </span>
            {booking.deposit && (
              <span className="ml-2">
                <StatusBadge status={booking.deposit.status} />
              </span>
            )}
            {booking.risk.hasUnpaidDeposit ? (
              <p className="mt-1 text-xs font-medium text-amber-700">
                Caution non encaissee
              </p>
            ) : null}
          </div>

          {/* Bottom: actions */}
          <div className="flex justify-end gap-1 pt-1">
            <Button asChild size="icon" variant="ghost" aria-label="Voir la réservation" className="h-10 w-10">
              <Link href={`/bookings/${booking.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <BookingActionsDropdown
              bookingId={booking.id}
              status={booking.status}
              paymentStatus={booking.paymentStatus}
              role={role}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
