import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AuthzError,
  getCurrentUserOrThrow,
  requireRole,
} from "@/lib/authz";

type UpdateBookingDatesPayload = {
  startDate?: string;
  endDate?: string;
  vehicleId?: string;
  updatedAt?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUserOrThrow();
    requireRole(currentUser.role, ["OWNER", "MANAGER", "EMPLOYEE"]);

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as UpdateBookingDatesPayload;

    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const expectedUpdatedAt = body.updatedAt ? new Date(body.updatedAt) : null;

    if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    if (!(startDate < endDate)) {
      return NextResponse.json(
        { error: "La date de fin doit être après la date de début" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        agencyId: currentUser.agencyId,
      },
      select: {
        id: true,
        agencyId: true,
        vehicleId: true,
        updatedAt: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (
      expectedUpdatedAt &&
      booking.updatedAt.getTime() !== expectedUpdatedAt.getTime()
    ) {
      return NextResponse.json(
        { error: "Cette réservation a déjà été modifiée. Rechargez les données." },
        { status: 409 },
      );
    }

    const targetVehicleId = body.vehicleId ?? booking.vehicleId;

    const conflicting = await prisma.booking.findFirst({
      where: {
        agencyId: currentUser.agencyId,
        vehicleId: targetVehicleId,
        id: { not: booking.id },
        status: {
          notIn: [BookingStatus.CANCELED, BookingStatus.COMPLETED],
        },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: { id: true },
    });

    if (conflicting) {
      return NextResponse.json({ error: "Conflit" }, { status: 409 });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        startDate,
        endDate,
        vehicleId: targetVehicleId,
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      booking: {
        id: updated.id,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("PATCH /api/bookings/[id]/dates error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
