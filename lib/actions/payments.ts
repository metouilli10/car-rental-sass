"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PaymentType } from "@prisma/client";
import { syncAgencyOnboardingState } from "@/lib/onboarding/agency-onboarding";

function mapDepositRecordStatusToBookingStatus(
  status: "HELD" | "RETURNED" | "PARTIAL_RETURNED" | "FORFEITED"
): "RECEIVED" | "RETURNED" {
  if (status === "HELD") {
    return "RECEIVED";
  }

  return "RETURNED";
}

/**
 * Record payment received for a booking from the dashboard "Encaisser" action.
 * Finds a PENDING payment for the booking and marks it PAID (with the given amount), or creates one if none.
 * Syncs Booking.paidNow, remainingAmount and paymentStatus from the sum of PAID RENTAL payments.
 */
export async function recordPaymentReceivedByBooking(
  bookingId: string,
  amount: number,
  paymentType: PaymentType = "CASH"
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Non autorisé" };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Montant invalide" };
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: { where: { category: "RENTAL" }, orderBy: { createdAt: "asc" } } },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      return { error: "Réservation non trouvée" };
    }

    const pendingRental = booking.payments.filter((p) => p.status === "PENDING");
    const existing = pendingRental[0];

    if (existing) {
      await prisma.payment.update({
        where: { id: existing.id },
        data: { status: "PAID", paidAt: new Date(), amount, type: paymentType },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId,
          amount,
          type: paymentType,
          category: "RENTAL",
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    const paidRentalSum = await prisma.payment.aggregate({
      where: {
        bookingId,
        category: "RENTAL",
        status: "PAID",
      },
      _sum: { amount: true },
    });
    const paidNow = Number(paidRentalSum._sum.amount ?? 0);
    const total = booking.totalTtc > 0 ? booking.totalTtc : booking.totalPrice;
    const remainingAmount = Math.max(0, total - paidNow);
    const paymentStatus = remainingAmount <= 0 ? "PAID" : paidNow > 0 ? "PARTIAL" : "PENDING";

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paidNow, remainingAmount, paymentStatus },
    });

    try {
      await syncAgencyOnboardingState(session.user.agencyId);
    } catch (syncError) {
      console.error("syncAgencyOnboardingState error:", syncError);
    }

    revalidatePath("/payments");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    revalidatePath(`/bookings/${bookingId}`);
    return { success: true };
  } catch (err) {
    console.error("recordPaymentReceivedByBooking error:", err);
    return { error: "Erreur lors de l'enregistrement du paiement" };
  }
}

export async function markPaymentReceived(paymentId: string, amount?: number) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
      },
    });

    if (!payment || payment.booking.agencyId !== session.user.agencyId) {
      return { error: "Paiement non trouvé" };
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        ...(amount !== undefined && { amount }),
      },
    });

    const paidRentalSum = await prisma.payment.aggregate({
      where: {
        bookingId: payment.bookingId,
        category: "RENTAL",
        status: "PAID",
      },
      _sum: { amount: true },
    });
    const paidNow = Number(paidRentalSum._sum.amount ?? 0);
    const bookingTotal =
      payment.booking.totalTtc > 0 ? payment.booking.totalTtc : payment.booking.totalPrice;
    const remainingAmount = Math.max(0, bookingTotal - paidNow);
    const paymentStatus =
      remainingAmount <= 0 ? "PAID" : paidNow > 0 ? "PARTIAL" : "PENDING";

    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { paidNow, remainingAmount, paymentStatus },
    });

    try {
      await syncAgencyOnboardingState(session.user.agencyId);
    } catch (syncError) {
      console.error("syncAgencyOnboardingState error:", syncError);
    }

    revalidatePath("/payments");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    revalidatePath(`/bookings/${payment.bookingId}`);
  } catch (error) {
    console.error("markPaymentReceived error:", error);
    return { error: "Erreur lors de la mise à jour du paiement" };
  }
}

export async function updateDepositStatus(
  depositId: string,
  status: "RETURNED" | "PARTIAL_RETURNED" | "FORFEITED",
  notes?: string
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  try {
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: {
        booking: true,
      },
    });

    if (!deposit || deposit.booking.agencyId !== session.user.agencyId) {
      return { error: "Caution non trouvée" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id: depositId },
        data: {
          status,
          returnedAt: new Date(),
          notes: notes || null,
        },
      });

      await tx.booking.update({
        where: { id: deposit.bookingId },
        data: {
          depositStatus: mapDepositRecordStatusToBookingStatus(status),
        },
      });
    });

    revalidatePath("/payments");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    revalidatePath(`/bookings/${deposit.bookingId}`);
  } catch (error) {
    console.error("updateDepositStatus error:", error);
    return { error: "Erreur lors de la mise à jour de la caution" };
  }
}
