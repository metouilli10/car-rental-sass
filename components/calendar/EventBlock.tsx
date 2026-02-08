"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CalendarBooking } from "@/lib/actions/calendar";
import { isBefore, startOfDay } from "date-fns";

const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
  CONFIRMED: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-l-blue-500",
    text: "text-blue-900 dark:text-blue-100",
  },
  ACTIVE: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-l-emerald-500",
    text: "text-emerald-900 dark:text-emerald-100",
  },
  COMPLETED: {
    bg: "bg-gray-50 dark:bg-gray-800/40",
    border: "border-l-gray-400",
    text: "text-gray-700 dark:text-gray-300",
  },
  DRAFT: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-l-amber-500",
    text: "text-amber-900 dark:text-amber-100",
  },
  LATE: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-l-red-500",
    text: "text-red-900 dark:text-red-100",
  },
};

function getEffectiveStatus(booking: CalendarBooking): string {
  // Check for late return: status is ACTIVE and endDate is before today
  if (
    booking.status === "ACTIVE" &&
    isBefore(new Date(booking.endDate), startOfDay(new Date()))
  ) {
    return "LATE";
  }
  return booking.status;
}

interface EventBlockProps {
  booking: CalendarBooking;
  columnStart: number;
  columnEnd: number;
}

export function EventBlock({ booking, columnStart, columnEnd }: EventBlockProps) {
  const router = useRouter();
  const effectiveStatus = getEffectiveStatus(booking);
  const style = statusStyles[effectiveStatus] || statusStyles.CONFIRMED;

  const formattedPrice = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(booking.totalPrice);

  return (
    <button
      onClick={() => router.push(`/bookings/${booking.id}`)}
      className={cn(
        "absolute top-1 bottom-1 rounded-md border-l-4 px-2 py-1.5 cursor-pointer transition-all",
        "hover:shadow-md hover:scale-[1.02] hover:z-20",
        "overflow-hidden text-left",
        style.bg,
        style.border,
        style.text
      )}
      style={{
        gridColumnStart: columnStart,
        gridColumnEnd: columnEnd,
        left: columnStart === 1 ? undefined : undefined,
      }}
      title={`${booking.customer.name} - ${formattedPrice} MAD`}
    >
      <div className="font-semibold text-xs truncate leading-tight">
        {booking.customer.name}
      </div>
      <div className="text-[10px] opacity-75 truncate leading-tight mt-0.5">
        {booking.customer.phone}
      </div>
      <div className="text-[10px] font-medium truncate leading-tight mt-0.5">
        {formattedPrice} MAD
      </div>
    </button>
  );
}

export { getEffectiveStatus, statusStyles };
