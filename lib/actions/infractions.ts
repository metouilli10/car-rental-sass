"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDelete } from "@/lib/authz";
import {
  infractionSchema,
  assignInfractionSchema,
  type InfractionFormData,
} from "@/lib/validations/infraction";
import type { InfractionStatus, InfractionType, Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export async function createInfraction(data: InfractionFormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");
  const agencyId = session.user.agencyId;

  try {
    const validated = infractionSchema.parse(data);

    // Verify vehicle belongs to agency
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: validated.vehicleId, agencyId },
      select: { id: true },
    });
    if (!vehicle) return { error: "Véhicule introuvable pour cette agence" };

    // If bookingId provided, verify it belongs to agency
    if (validated.bookingId) {
      const booking = await prisma.booking.findFirst({
        where: { id: validated.bookingId, agencyId },
        select: { id: true },
      });
      if (!booking) return { error: "Réservation introuvable pour cette agence" };
    }

    const infractionDate = new Date(validated.date);
    if (isNaN(infractionDate.getTime())) {
      return { error: "Date invalide" };
    }

    const infraction = await prisma.infraction.create({
      data: {
        agencyId,
        vehicleId: validated.vehicleId,
        date: infractionDate,
        time: validated.time,
        type: validated.type as InfractionType,
        amount: validated.amount,
        notes: validated.notes,
        bookingId: validated.bookingId || null,
        customerId: validated.customerId || null,
        clientName: validated.clientName || null,
        clientCin: validated.clientCin || null,
        clientPhone: validated.clientPhone || null,
        status: validated.bookingId ? "ASSIGNED" : "PENDING",
      },
    });

    revalidatePath("/infractions");
    return { success: true, infractionId: infraction.id };
  } catch (error) {
    console.error("createInfraction error:", error);
    return { error: "Erreur lors de la création de l'infraction" };
  }
}

// ---------------------------------------------------------------------------
// LIST
// ---------------------------------------------------------------------------

export async function getInfractions(params: {
  from?: string;
  to?: string;
  status?: string;
  vehicleId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");
  const agencyId = session.user.agencyId;

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.InfractionWhereInput = { agencyId };

  if (params.status) {
    where.status = params.status as InfractionStatus;
  }

  if (params.vehicleId) {
    where.vehicleId = params.vehicleId;
  }

  if (params.from || params.to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (params.from) dateFilter.gte = new Date(params.from);
    if (params.to) dateFilter.lte = endOfDay(new Date(params.to));
    where.date = dateFilter;
  }

  if (params.search) {
    const q = params.search.trim();
    where.OR = [
      { clientName: { contains: q, mode: "insensitive" } },
      { clientCin: { contains: q, mode: "insensitive" } },
      { vehicle: { plate: { contains: q, mode: "insensitive" } } },
      { vehicle: { make: { contains: q, mode: "insensitive" } } },
      { vehicle: { model: { contains: q, mode: "insensitive" } } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }

  const [infractions, total] = await Promise.all([
    prisma.infraction.findMany({
      where,
      include: {
        vehicle: { select: { id: true, plate: true, make: true, model: true } },
      },
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.infraction.count({ where }),
  ]);

  return {
    infractions,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ---------------------------------------------------------------------------
// GET SINGLE
// ---------------------------------------------------------------------------

export async function getInfraction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");
  const agencyId = session.user.agencyId;

  const infraction = await prisma.infraction.findFirst({
    where: { id, agencyId },
    include: {
      vehicle: { select: { id: true, plate: true, make: true, model: true } },
      booking: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          totalPrice: true,
        },
      },
      customer: {
        select: { id: true, name: true, passportOrCIN: true, phone: true },
      },
    },
  });

  if (!infraction) return null;
  return infraction;
}

// ---------------------------------------------------------------------------
// MATCH BOOKINGS (core auto-match logic)
// ---------------------------------------------------------------------------

export async function matchBookingsForInfraction(
  vehicleId: string,
  date: string,
  time?: string
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");
  const agencyId = session.user.agencyId;

  // Parse "YYYY-MM-DD" as local midnight (not UTC) to avoid timezone mismatch with DB dates
  const dateStr = date.includes("T") ? date : `${date}T00:00:00`;
  const infractionDate = new Date(dateStr);
  if (isNaN(infractionDate.getTime())) {
    return { matches: [] };
  }

  let rangeStart: Date;
  let rangeEnd: Date;

  if (time) {
    const [hours, minutes] = time.split(":").map(Number);
    const exactDateTime = new Date(dateStr);
    exactDateTime.setHours(hours, minutes, 0, 0);
    rangeStart = exactDateTime;
    rangeEnd = exactDateTime;
  } else {
    rangeStart = startOfDay(infractionDate);
    rangeEnd = endOfDay(infractionDate);
  }

  const bookings = await prisma.booking.findMany({
    where: {
      agencyId,
      vehicleId,
      status: { notIn: ["CANCELED"] },
      startDate: { lte: rangeEnd },
      endDate: { gte: rangeStart },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          passportOrCIN: true,
          phone: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return {
    matches: bookings.map((b) => ({
      bookingId: b.id,
      customerId: b.customer.id,
      customerName: b.customer.name,
      customerCin: b.customer.passportOrCIN,
      customerPhone: b.customer.phone,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      status: b.status,
    })),
  };
}

// ---------------------------------------------------------------------------
// ASSIGN
// ---------------------------------------------------------------------------

export async function assignInfraction(data: {
  infractionId: string;
  bookingId: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");
  const agencyId = session.user.agencyId;

  try {
    const validated = assignInfractionSchema.parse(data);

    // Verify infraction belongs to agency
    const infraction = await prisma.infraction.findFirst({
      where: { id: validated.infractionId, agencyId },
      select: { id: true },
    });
    if (!infraction) return { error: "Infraction introuvable" };

    // Verify booking belongs to agency and get customer
    const booking = await prisma.booking.findFirst({
      where: { id: validated.bookingId, agencyId },
      include: {
        customer: {
          select: { id: true, name: true, passportOrCIN: true, phone: true },
        },
      },
    });
    if (!booking) return { error: "Réservation introuvable" };

    await prisma.infraction.update({
      where: { id: validated.infractionId },
      data: {
        bookingId: booking.id,
        customerId: booking.customer.id,
        clientName: booking.customer.name,
        clientCin: booking.customer.passportOrCIN,
        clientPhone: booking.customer.phone,
        status: "ASSIGNED",
      },
    });

    revalidatePath("/infractions");
    revalidatePath(`/infractions/${validated.infractionId}`);
    return { success: true };
  } catch (error) {
    console.error("assignInfraction error:", error);
    return { error: "Erreur lors de l'assignation" };
  }
}

// ---------------------------------------------------------------------------
// UPDATE STATUS
// ---------------------------------------------------------------------------

export async function updateInfractionStatus(
  id: string,
  status: InfractionStatus
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");
  const agencyId = session.user.agencyId;

  try {
    const infraction = await prisma.infraction.findFirst({
      where: { id, agencyId },
      select: { id: true },
    });
    if (!infraction) return { error: "Infraction introuvable" };

    await prisma.infraction.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/infractions");
    revalidatePath(`/infractions/${id}`);
    return { success: true };
  } catch (error) {
    console.error("updateInfractionStatus error:", error);
    return { error: "Erreur lors de la mise à jour du statut" };
  }
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

export async function deleteInfraction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");
  const agencyId = session.user.agencyId;

  if (!canDelete(session.user.role)) {
    return { error: "Vous n'avez pas l'autorisation de supprimer cette infraction" };
  }

  try {
    const infraction = await prisma.infraction.findFirst({
      where: { id, agencyId },
      select: { id: true },
    });
    if (!infraction) return { error: "Infraction introuvable" };

    await prisma.infraction.delete({ where: { id } });

    revalidatePath("/infractions");
    return { success: true };
  } catch (error) {
    console.error("deleteInfraction error:", error);
    return { error: "Erreur lors de la suppression" };
  }
}

// ---------------------------------------------------------------------------
// GET COUNTS BY STATUS (for filter badges)
// ---------------------------------------------------------------------------

export async function getInfractionCounts() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");
  const agencyId = session.user.agencyId;

  const counts = await prisma.infraction.groupBy({
    by: ["status"],
    where: { agencyId },
    _count: { status: true },
  });

  const result: Record<string, number> = {
    ALL: 0,
    PENDING: 0,
    ASSIGNED: 0,
    PAID: 0,
    CONTESTED: 0,
  };

  for (const c of counts) {
    result[c.status] = c._count.status;
    result.ALL += c._count.status;
  }

  return result;
}
