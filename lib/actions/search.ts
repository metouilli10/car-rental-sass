"use server";

import { getServerSession } from "next-auth";
import type { BookingStatus, InfractionStatus, InfractionType, VehicleStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { compactSearchToken, getBookingReference, normalizeSearchQuery } from "@/lib/search-utils";

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

export type SearchInfraction = {
  id: string;
  type: InfractionType;
  status: InfractionStatus;
  vehicle: string;
  client: string | null;
  amount: number | null;
  date: string;
};

export type SearchResult = {
  clients: SearchClient[];
  reservations: SearchReservation[];
  vehicles: SearchVehicle[];
  infractions: SearchInfraction[];
};

export async function searchGlobal(query: string): Promise<SearchResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.agencyId) {
    return { clients: [], reservations: [], vehicles: [], infractions: [] };
  }
  const agencyId = session.user.agencyId;
  const q = normalizeSearchQuery(query);
  const compactQuery = compactSearchToken(query);
  if (!q || q.length < 2) {
    return { clients: [], reservations: [], vehicles: [], infractions: [] };
  }

  const [clients, reservations, vehicles, infractions] = await Promise.all([
    prisma.customer.findMany({
      where: {
        agencyId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { passportOrCIN: { contains: q, mode: "insensitive" } },
          { licenseNumber: { contains: q, mode: "insensitive" } },
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
          { customer: { phone: { contains: q } } },
          { customer: { email: { contains: q, mode: "insensitive" } } },
          { customer: { passportOrCIN: { contains: q, mode: "insensitive" } } },
          { vehicle: { make: { contains: q, mode: "insensitive" } } },
          { vehicle: { model: { contains: q, mode: "insensitive" } } },
          { vehicle: { plate: { contains: q, mode: "insensitive" } } },
          ...(compactQuery.length >= 4
            ? [{ id: { endsWith: compactQuery, mode: "insensitive" as const } }]
            : []),
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
          { color: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
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
    prisma.infraction.findMany({
      where: {
        agencyId,
        OR: [
          { vehicle: { plate: { contains: q, mode: "insensitive" } } },
          { vehicle: { make: { contains: q, mode: "insensitive" } } },
          { vehicle: { model: { contains: q, mode: "insensitive" } } },
          { clientName: { contains: q, mode: "insensitive" } },
          { clientCin: { contains: q, mode: "insensitive" } },
          { clientPhone: { contains: q } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        date: true,
        clientName: true,
        vehicle: {
          select: {
            make: true,
            model: true,
            plate: true,
          },
        },
      },
      take: SEARCH_LIMIT,
      orderBy: { date: "desc" },
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
      ref: getBookingReference(r.id),
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
    infractions: infractions.map((infraction) => ({
      id: infraction.id,
      type: infraction.type,
      status: infraction.status,
      vehicle: `${infraction.vehicle.make} ${infraction.vehicle.model} · ${infraction.vehicle.plate}`,
      client: infraction.clientName,
      amount: infraction.amount,
      date: format(infraction.date, "d MMM yyyy", { locale: fr }),
    })),
  };
}
