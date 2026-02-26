import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logSecurityAudit } from "@/lib/security/audit-log";
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
        status: true,
        updatedAt: true,
      },
    });

    if (!booking) {
      await logSecurityAudit({
        actor: {
          userId: currentUser.id,
          role: currentUser.role,
          email: currentUser.email,
        },
        context: {
          agencyId: currentUser.agencyId,
          requestId: request.headers.get("x-request-id"),
          ip: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent"),
        },
        event: {
          action: "BOOKING_DATES_UPDATE",
          entityType: "BOOKING",
          entityId: id,
          outcome: "DENIED",
          details: { reason: "booking_not_found" },
        },
      });
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
    const isImmutableStatus =
      booking.status === BookingStatus.CANCELED ||
      booking.status === BookingStatus.COMPLETED;

    if (isImmutableStatus) {
      await logSecurityAudit({
        actor: {
          userId: currentUser.id,
          role: currentUser.role,
          email: currentUser.email,
        },
        context: {
          agencyId: currentUser.agencyId,
          requestId: request.headers.get("x-request-id"),
          ip: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent"),
        },
        event: {
          action: "BOOKING_DATES_UPDATE",
          entityType: "BOOKING",
          entityId: id,
          outcome: "DENIED",
          details: { reason: "immutable_status", status: booking.status },
        },
      });
      return NextResponse.json(
        { error: "Impossible de modifier une réservation clôturée ou annulée" },
        { status: 409 },
      );
    }

    const targetVehicle = await prisma.vehicle.findFirst({
      where: {
        id: targetVehicleId,
        agencyId: currentUser.agencyId,
      },
      select: { id: true },
    });

    if (!targetVehicle) {
      await logSecurityAudit({
        actor: {
          userId: currentUser.id,
          role: currentUser.role,
          email: currentUser.email,
        },
        context: {
          agencyId: currentUser.agencyId,
          requestId: request.headers.get("x-request-id"),
          ip: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent"),
        },
        event: {
          action: "BOOKING_DATES_UPDATE",
          entityType: "BOOKING",
          entityId: id,
          outcome: "DENIED",
          details: { reason: "vehicle_not_found_or_cross_agency", vehicleId: targetVehicleId },
        },
      });
      return NextResponse.json(
        { error: "Véhicule introuvable pour cette agence" },
        { status: 400 },
      );
    }

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
      await logSecurityAudit({
        actor: {
          userId: currentUser.id,
          role: currentUser.role,
          email: currentUser.email,
        },
        context: {
          agencyId: currentUser.agencyId,
          requestId: request.headers.get("x-request-id"),
          ip: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent"),
        },
        event: {
          action: "BOOKING_DATES_UPDATE",
          entityType: "BOOKING",
          entityId: id,
          outcome: "DENIED",
          details: { reason: "schedule_conflict", conflictingBookingId: conflicting.id },
        },
      });
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

    await logSecurityAudit({
      actor: {
        userId: currentUser.id,
        role: currentUser.role,
        email: currentUser.email,
      },
      context: {
        agencyId: currentUser.agencyId,
        requestId: request.headers.get("x-request-id"),
        ip: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
      },
      event: {
        action: "BOOKING_DATES_UPDATE",
        entityType: "BOOKING",
        entityId: id,
        outcome: "SUCCESS",
        details: {
          vehicleId: targetVehicleId,
          startDate: updated.startDate.toISOString(),
          endDate: updated.endDate.toISOString(),
        },
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
