"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-cache";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO } from "date-fns";

export type CalendarVehicle = {
  id: string;
  make: string;
  model: string;
  plate: string;
  status: string;
  category: string;
  photoUrl: string | null;
};

export type CalendarBooking = {
  id: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  updatedAt: Date;
  totalPrice: number;
  pricePerDay: number;
  depositAmount: number;
  status: string;
  paymentStatus: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
};

export type CalendarData = {
  vehicles: CalendarVehicle[];
  bookings: CalendarBooking[];
  weekStart: Date;
  weekEnd: Date;
  currentUserRole: "OWNER" | "MANAGER" | "EMPLOYEE";
};

export async function getCalendarData(weekParam?: string): Promise<CalendarData> {
  const session = await getSession();

  if (!session) {
    throw new Error("Non autorisé");
  }

  // Parse week param or default to current week (Monday start)
  let targetDate: Date;
  if (weekParam) {
    targetDate = parseISO(weekParam);
  } else {
    targetDate = new Date();
  }

  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 }); // Sunday

  // Fetch vehicles for this agency
  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId: session.user.agencyId },
    orderBy: [{ status: "asc" }, { make: "asc" }, { model: "asc" }],
    select: {
      id: true,
      make: true,
      model: true,
      plate: true,
      status: true,
      category: true,
      photoUrl: true,
    },
  });

  // Fetch bookings that overlap with the visible week
  // A booking overlaps if: booking.startDate <= weekEnd AND booking.endDate >= weekStart
  const bookings = await prisma.booking.findMany({
    where: {
      agencyId: session.user.agencyId,
      status: { notIn: ["CANCELED"] },
      startDate: { lte: weekEnd },
      endDate: { gte: weekStart },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return {
    vehicles: vehicles.map((v) => ({
      ...v,
      status: v.status as string,
    })),
    bookings: bookings.map((b) => ({
      id: b.id,
      vehicleId: b.vehicleId,
      startDate: b.startDate,
      endDate: b.endDate,
      updatedAt: b.updatedAt,
      totalPrice: b.totalPrice,
      pricePerDay: b.pricePerDay,
      depositAmount: b.depositAmount,
      status: b.status as string,
      paymentStatus: b.paymentStatus as string,
      customer: b.customer,
    })),
    weekStart,
    weekEnd,
    currentUserRole: session.user.role,
  };
}
