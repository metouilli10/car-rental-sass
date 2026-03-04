"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { VehicleStatus, BookingStatus } from "@prisma/client";

const SEARCH_LIMIT = 5;

export type SearchClient = {
  id: string;
  name: string;
  phone: string;
  bookings: number;
};

export type SearchReservation = {
  id: string;
  ref: string;
  client: string;
  vehicle: string;
  status: BookingStatus;
  dates: string;
};

export type SearchVehicle = {
  id: string;
  plate: string;
  make: string;
  model: string;
  status: VehicleStatus;
};

export type SearchResult = {
  clients: SearchClient[];
  reservations: SearchReservation[];
  vehicles: SearchVehicle[];
};

export async function searchGlobal(query: string): Promise<SearchResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.agencyId) {
    return { clients: [], reservations: [], vehicles: [] };
  }
  const agencyId = session.user.agencyId;
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) {
    return { clients: [], reservations: [], vehicles: [] };
  }

  const searchPattern = `%${q}%`;

  const [clients, reservations, vehicles] = await Promise.all([
    prisma.customer.findMany({
      where: {
        agencyId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        _count: { select: { bookings: true } },
      },
      take: SEARCH_LIMIT,
      orderBy: { name: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        agencyId,
        OR: [
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { vehicle: { make: { contains: q, mode: "insensitive" } } },
          { vehicle: { model: { contains: q, mode: "insensitive" } } },
          { vehicle: { plate: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        customer: { select: { name: true } },
        vehicle: { select: { make: true, model: true } },
      },
      take: SEARCH_LIMIT,
      orderBy: { startDate: "desc" },
    }),
    prisma.vehicle.findMany({
      where: {
        agencyId,
        OR: [
          { make: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
          { plate: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        plate: true,
        make: true,
        model: true,
        status: true,
      },
      take: SEARCH_LIMIT,
      orderBy: { plate: "asc" },
    }),
  ]);

  return {
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      bookings: c._count.bookings,
    })),
    reservations: reservations.map((r) => ({
      id: r.id,
      ref: `#${r.id.slice(-6).toUpperCase()}`,
      client: r.customer.name,
      vehicle: `${r.vehicle.make} ${r.vehicle.model}`,
      status: r.status,
      dates: `${format(r.startDate, "d MMM", { locale: fr })} – ${format(r.endDate, "d MMM", { locale: fr })}`,
    })),
    vehicles: vehicles.map((v) => ({
      id: v.id,
      plate: v.plate,
      make: v.make,
      model: v.model,
      status: v.status,
    })),
  };
}
