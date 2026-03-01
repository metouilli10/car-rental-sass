"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { PaymentType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingSchema, BookingFormData } from "@/lib/validations/booking";
import { canDelete } from "@/lib/authz";
import { syncAgencyOnboardingState } from "@/lib/onboarding/agency-onboarding";

async function validateBookingRelationsForAgency(params: {
  agencyId: string;
  customerId: string;
  vehicleId: string;
}) {
  const { agencyId, customerId, vehicleId } = params;

  const [customer, vehicle] = await Promise.all([
    prisma.customer.findFirst({
      where: { id: customerId, agencyId },
      select: { id: true },
    }),
    prisma.vehicle.findFirst({
      where: { id: vehicleId, agencyId },
      select: { id: true },
    }),
  ]);

  if (!customer) {
    return { error: "Client introuvable pour cette agence" } as const;
  }

  if (!vehicle) {
    return { error: "Véhicule introuvable pour cette agence" } as const;
  }

  return null;
}

export async function createBooking(data: BookingFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  try {
    const validatedData = bookingSchema.parse(data);
    const relationError = await validateBookingRelationsForAgency({
      agencyId: session.user.agencyId,
      customerId: validatedData.customerId,
      vehicleId: validatedData.vehicleId,
    });

    if (relationError) {
      return relationError;
    }

    // Check for overlapping bookings
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    const overlappingCount = await prisma.booking.count({
      where: {
        agencyId: session.user.agencyId,
        vehicleId: validatedData.vehicleId,
        status: { notIn: ["CANCELED", "COMPLETED"] },
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [{ startDate: { lte: endDate } }, { endDate: { gte: endDate } }],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    });

    if (overlappingCount > 0) {
      return {
        error:
          "Ce véhicule n'est pas disponible pour ces dates. Il existe déjà une réservation.",
      };
    }

    // Create booking with payment and deposit
    const paymentStatus =
      validatedData.remainingAmount <= 0
        ? "PAID"
        : validatedData.paidNow > 0
          ? "PARTIAL"
          : "PENDING";

    // NOTE: Some deployed environments may not have PaymentType.OTHER in Prisma client yet.
    // Keep "Autre" in UI, but persist with a compatible enum value until schema/client are aligned.
    const normalizedPaymentType: PaymentType =
      validatedData.paymentType === "OTHER"
        ? PaymentType.TRANSFER
        : validatedData.paymentType;

    const createdBooking = await prisma.booking.create({
      data: {
        agencyId: session.user.agencyId,
        customerId: validatedData.customerId,
        vehicleId: validatedData.vehicleId,
        startDate,
        endDate,
        pickupLocation: validatedData.pickupLocation || null,
        returnLocation: validatedData.returnLocation || null,
        pricePerDay: validatedData.pricePerDay,
        totalPrice: validatedData.totalTtc,
        pricingDays: validatedData.pricingDays,
        pricingHours: validatedData.pricingHours,
        addonsTotal: validatedData.addonsTotal,
        discountType: validatedData.discountType ?? null,
        discountValue: validatedData.discountValue,
        discountAmount: validatedData.discountAmount,
        taxEnabled: validatedData.taxEnabled,
        taxRate: validatedData.taxRate,
        totalHt: validatedData.totalHt,
        totalTva: validatedData.totalTva,
        totalTtc: validatedData.totalTtc,
        paidNow: validatedData.paidNow,
        remainingAmount: validatedData.remainingAmount,
        flowVersion: "reservation_flow_v2",
        depositAmount: validatedData.depositAmount,
        status: validatedData.status,
        paymentStatus,
        notes: validatedData.notes || null,
        payments: {
          create:
            validatedData.paidNow > 0
              ? {
                  amount: validatedData.paidNow,
                  type: normalizedPaymentType,
                  status: "PAID",
                  paidAt: new Date(),
                }
              : {
                  amount: 0,
                  type: normalizedPaymentType,
                  status: "PENDING",
                },
        },
        deposit: {
          create: {
            amount: validatedData.depositAmount,
            status: "HELD",
          },
        },
        addons: {
          create: validatedData.addons.map((addon) => ({
            label: addon.label,
            quantity: addon.quantity,
            unitAmount: addon.unitAmount,
            totalAmount: addon.quantity * addon.unitAmount,
            isDefault: addon.isDefault ?? false,
          })),
        },
      },
      select: { id: true },
    });

    revalidatePath("/bookings");
    revalidatePath("/dashboard");
    revalidatePath("/bookings/create");
    try {
      await syncAgencyOnboardingState(session.user.agencyId);
    } catch (syncError) {
      console.error("syncAgencyOnboardingState error:", syncError);
    }
    return { success: true, bookingId: createdBooking.id };
  } catch (error) {
    console.error("createBooking error:", error);
    return { error: "Erreur lors de la création de la réservation" };
  }
}

export async function saveBookingDraftPlaceholder(data: {
  step: number;
  vehicleId?: string;
  clientId?: string;
  total?: number;
}) {
  void data;
  return { success: true };
}

export async function updateBooking(bookingId: string, data: BookingFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  try {
    const validatedData = bookingSchema.parse(data);
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        agencyId: session.user.agencyId,
      },
      include: {
        deposit: true,
        addons: true,
      },
    });

    if (!booking) {
      return { error: "Réservation non trouvée" };
    }

    if (booking.status === "COMPLETED" || booking.status === "CANCELED") {
      return { error: "Impossible de modifier une réservation clôturée ou annulée" };
    }

    const relationError = await validateBookingRelationsForAgency({
      agencyId: session.user.agencyId,
      customerId: validatedData.customerId,
      vehicleId: validatedData.vehicleId,
    });

    if (relationError) {
      return relationError;
    }

    const overlappingCount = await prisma.booking.count({
      where: {
        agencyId: session.user.agencyId,
        vehicleId: validatedData.vehicleId,
        id: { not: bookingId },
        status: { notIn: ["CANCELED", "COMPLETED"] },
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [{ startDate: { lte: endDate } }, { endDate: { gte: endDate } }],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    });

    if (overlappingCount > 0) {
      return {
        error:
          "Ce véhicule n'est pas disponible pour ces dates. Il existe déjà une réservation.",
      };
    }

    const paidNow = booking.paidNow;
    const remainingAmount = Math.max(0, validatedData.totalTtc - paidNow);
    const paymentStatus =
      remainingAmount <= 0 ? "PAID" : paidNow > 0 ? "PARTIAL" : "PENDING";

    await prisma.$transaction(async (tx) => {
      await tx.bookingAddon.deleteMany({ where: { bookingId } });

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          customerId: validatedData.customerId,
          vehicleId: validatedData.vehicleId,
          startDate,
          endDate,
          pickupLocation: validatedData.pickupLocation || null,
          returnLocation: validatedData.returnLocation || null,
          pricePerDay: validatedData.pricePerDay,
          totalPrice: validatedData.totalTtc,
          pricingDays: validatedData.pricingDays,
          pricingHours: validatedData.pricingHours,
          addonsTotal: validatedData.addonsTotal,
          discountType: validatedData.discountType ?? null,
          discountValue: validatedData.discountValue,
          discountAmount: validatedData.discountAmount,
          taxEnabled: validatedData.taxEnabled,
          taxRate: validatedData.taxRate,
          totalHt: validatedData.totalHt,
          totalTva: validatedData.totalTva,
          totalTtc: validatedData.totalTtc,
          paidNow,
          remainingAmount,
          paymentStatus,
          depositAmount: validatedData.depositAmount,
          status: validatedData.status,
          notes: validatedData.notes || null,
          addons: {
            create: validatedData.addons.map((addon) => ({
              label: addon.label,
              quantity: addon.quantity,
              unitAmount: addon.unitAmount,
              totalAmount: addon.quantity * addon.unitAmount,
              isDefault: addon.isDefault ?? false,
            })),
          },
        },
      });

      if (booking.deposit && booking.deposit.amount !== validatedData.depositAmount) {
        await tx.deposit.update({
          where: { id: booking.deposit.id },
          data: { amount: validatedData.depositAmount },
        });
      }
    });

    revalidatePath("/bookings");
    revalidatePath("/dashboard");
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath(`/bookings/${bookingId}/edit`);
    return { success: true, bookingId };
  } catch (error) {
    console.error("updateBooking error:", error);
    return { error: "Erreur lors de la mise à jour de la réservation" };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: "ACTIVE" | "COMPLETED" | "CANCELED"
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  if (status === "CANCELED" && !canDelete(session.user.role)) {
    throw new Error("Vous n'avez pas l'autorisation d'annuler une réservation");
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, agencyId: true, vehicleId: true, status: true },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      throw new Error("Réservation non trouvée");
    }

    // Atomic transaction: update booking + vehicle status together to prevent inconsistency
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status },
      });

      if (status === "ACTIVE") {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: "RENTED" },
        });
      } else if (status === "COMPLETED" || status === "CANCELED") {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: "AVAILABLE" },
        });
      }
    });

    revalidatePath("/bookings");
    revalidatePath("/dashboard");
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath("/vehicles");
    revalidatePath("/catalogue");
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    throw new Error("Erreur lors de la mise à jour du statut de la réservation");
  }
}

export async function cancelBooking(bookingId: string) {
  return updateBookingStatus(bookingId, "CANCELED");
}

export async function startBooking(bookingId: string) {
  return updateBookingStatus(bookingId, "ACTIVE");
}

export async function completeBooking(bookingId: string) {
  return updateBookingStatus(bookingId, "COMPLETED");
}

/**
 * Reconcile past-due ACTIVE bookings: set them to COMPLETED and their vehicles to AVAILABLE.
 * Called on dashboard load as a best-effort background sync.
 */
export async function reconcilePastDueBookings(agencyId: string) {
  const now = new Date();
  const pastDue = await prisma.booking.findMany({
    where: {
      agencyId,
      status: "ACTIVE",
      endDate: { lt: now },
    },
    select: { id: true, vehicleId: true },
  });

  if (pastDue.length === 0) return;

  const bookingIds = pastDue.map((b) => b.id);
  const vehicleIds = [...new Set(pastDue.map((b) => b.vehicleId))];

  await prisma.$transaction(async (tx) => {
    await tx.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: "COMPLETED" },
    });
    await tx.vehicle.updateMany({
      where: { id: { in: vehicleIds } },
      data: { status: "AVAILABLE" },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  revalidatePath("/vehicles");
  revalidatePath("/catalogue");
}

export async function extendActiveBooking(
  bookingId: string,
  additionalDays: number
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  if (!["OWNER", "MANAGER", "EMPLOYEE"].includes(session.user.role)) {
    throw new Error("Vous n'avez pas l'autorisation de prolonger cette réservation");
  }

  if (!Number.isFinite(additionalDays) || additionalDays <= 0 || additionalDays > 30) {
    throw new Error("Le nombre de jours doit être compris entre 1 et 30");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: {
          id: bookingId,
          agencyId: session.user.agencyId,
        },
        include: {
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!booking) {
        throw new Error("Réservation non trouvée");
      }

      if (booking.status !== "ACTIVE") {
        throw new Error("Seules les réservations actives peuvent être prolongées");
      }

      const newEndDate = new Date(booking.endDate);
      newEndDate.setDate(newEndDate.getDate() + additionalDays);

      const conflictingBooking = await tx.booking.findFirst({
        where: {
          agencyId: session.user.agencyId,
          vehicleId: booking.vehicleId,
          id: { not: booking.id },
          status: { notIn: ["CANCELED", "COMPLETED"] },
          startDate: { lt: newEndDate },
          endDate: { gt: booking.startDate },
        },
        select: { id: true },
      });

      if (conflictingBooking) {
        throw new Error("Conflit: ce véhicule est déjà réservé sur cette période");
      }

      const extraAmount = additionalDays * booking.pricePerDay;
      const nextRemainingAmount = booking.remainingAmount + extraAmount;
      const nextTotalPrice = booking.totalPrice + extraAmount;
      const nextTotalTtc =
        (booking.totalTtc > 0 ? booking.totalTtc : booking.totalPrice) + extraAmount;
      const nextPricingDays = booking.pricingDays + additionalDays;
      const nextPaymentStatus =
        nextRemainingAmount <= 0
          ? "PAID"
          : booking.paidNow > 0
            ? "PARTIAL"
            : "PENDING";

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          endDate: newEndDate,
          totalPrice: nextTotalPrice,
          totalTtc: nextTotalTtc,
          remainingAmount: nextRemainingAmount,
          pricingDays: nextPricingDays,
          paymentStatus: nextPaymentStatus,
        },
      });

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: extraAmount,
          type: booking.payments[0]?.type ?? PaymentType.CASH,
          category: "RENTAL",
          status: "PENDING",
        },
      });

      return {
        newEndDate,
        extraAmount,
      };
    });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath("/dashboard");
    revalidatePath("/payments");
    revalidatePath("/finance");

    return {
      success: true,
      newEndDate: result.newEndDate,
      extraAmount: result.extraAmount,
    };
  } catch (error) {
    console.error("extendActiveBooking error:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Erreur lors de la prolongation de la réservation");
  }
}
