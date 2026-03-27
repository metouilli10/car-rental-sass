"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, SyntheticEvent } from "react";
import { UserRole } from "@prisma/client";
import { Eye } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingActionsDropdown } from "@/components/bookings/booking-actions-dropdown";
import type { BookingListItem } from "@/components/bookings/bookings-control-center";
import { ReservationRiskBadges } from "@/components/reservations/ReservationRiskBadges";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  toDate,
  getDurationDays,
  getBookingUrgency,
  getDayProgress,
  getActiveStatusHint,
} from "@/lib/bookings/list-utils";

interface ReservationsTableProps {
  bookings: BookingListItem[];
  role: UserRole;
  today: Date;
}

export function ReservationsTable({ bookings, role, today }: ReservationsTableProps) {
  const router = useRouter();
  const stopPropagation = (event: SyntheticEvent) => {
    event.stopPropagation();
  };
  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, bookingId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(`/bookings/${bookingId}`);
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-card overflow-hidden">
      <div className="max-h-[72vh] overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col style={{ width: "26%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead className="sticky top-0 z-20 border-b border-muted bg-white">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Réservation
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Dates
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Financier
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Risque
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Statut
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/60">
            {bookings.map((booking) => {
              const startDate = toDate(booking.startDate);
              const endDate = toDate(booking.endDate);
              const durationDays = getDurationDays(startDate, endDate);
              const urgency = getBookingUrgency(booking, today);
              const dayProgress = getDayProgress(booking, today);
              const activeStatusHint = getActiveStatusHint(booking, today);

              const paidNowValue =
                typeof booking.paidNow === "number" ? booking.paidNow : null;
              const remainingValue =
                typeof booking.remainingAmount === "number"
                  ? booking.remainingAmount
                  : null;

              return (
                <tr
                  key={booking.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/bookings/${booking.id}`)}
                  onKeyDown={(event) => handleRowKeyDown(event, booking.id)}
                  className="cursor-pointer transition-colors duration-200 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
                >
                  {/* Réservation: client + vehicle merged */}
                  <td
                    className={cn(
                      "px-4 py-3 text-sm align-top",
                      booking.risk.hasOverlapConflict && "border-l-2 border-l-red-500"
                    )}
                  >
                    <div className="min-w-0 break-words">
                      <Link
                        href={`/customers/${booking.customer.id}`}
                        onClick={stopPropagation}
                        className="font-semibold text-foreground underline-offset-4 hover:underline block truncate"
                      >
                        {booking.customer.name}
                      </Link>
                      <div className="text-muted-foreground text-xs truncate">
                        {booking.customer.phone}
                      </div>
                      <div className="font-medium text-foreground mt-0.5 truncate">
                        <Link
                          href={`/vehicles/${booking.vehicle.id}/edit`}
                          onClick={stopPropagation}
                          className="underline-offset-4 hover:underline"
                        >
                          {booking.vehicle.make} {booking.vehicle.model}
                        </Link>
                      </div>
                      <div className="text-muted-foreground text-xs truncate">
                        {booking.vehicle.plate}
                      </div>
                    </div>
                  </td>

                  {/* Dates: range + duration + day progress + urgency inline */}
                  <td className="px-4 py-3 text-sm align-top whitespace-normal">
                    <div className="text-foreground">
                      {formatDate(startDate)} → {formatDate(endDate)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {durationDays} jours
                      {dayProgress != null && (
                        <span className="text-primary font-medium ml-1">
                          · Jour {dayProgress}/{durationDays}
                        </span>
                      )}
                    </div>
                    {urgency && (
                      <Badge variant={urgency.variant} className="mt-1 text-xs">
                        {urgency.label}
                      </Badge>
                    )}
                  </td>

                  {/* Financier */}
                  <td className="px-4 py-3 text-sm align-top">
                    <div
                      className={cn(
                        "rounded-xl p-2",
                        booking.risk.hasUnpaidDeposit &&
                          "border border-amber-200 bg-amber-50/80"
                      )}
                    >
                      <div className="font-semibold text-foreground">
                        {formatCurrency(booking.totalPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Paye: {paidNowValue !== null ? formatCurrency(paidNowValue) : "--"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reste: {remainingValue !== null ? formatCurrency(remainingValue) : "--"}
                      </div>
                      {booking.deposit && (
                        <div className="mt-1">
                          <StatusBadge status={booking.deposit.status} />
                        </div>
                      )}
                      {booking.risk.hasUnpaidDeposit ? (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          Caution non encaissee
                        </p>
                      ) : null}
                    </div>
                  </td>

                  {/* Risque */}
                  <td className="px-4 py-3 text-sm align-top">
                    <ReservationRiskBadges signals={booking.risk.signals} />
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={booking.status} />
                      {activeStatusHint ? (
                        <span className="text-xs font-medium text-muted-foreground">
                          {activeStatusHint}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        asChild
                        size="icon"
                        variant="ghost"
                        aria-label="Voir la réservation"
                      >
                        <Link href={`/bookings/${booking.id}`} onClick={stopPropagation}>
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
