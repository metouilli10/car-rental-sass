"use client";

import { UserRole } from "@prisma/client";
import type { BookingListItem } from "@/components/bookings/bookings-control-center";
import { ReservationCard } from "./ReservationCard";

interface ReservationCardListProps {
  bookings: BookingListItem[];
  role: UserRole;
  today: Date;
}

export function ReservationCardList({ bookings, role, today }: ReservationCardListProps) {
  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <ReservationCard
          key={booking.id}
          booking={booking}
          role={role}
          today={today}
        />
      ))}
    </div>
  );
}
