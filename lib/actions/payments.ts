"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    revalidatePath("/payments");
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

    await prisma.deposit.update({
      where: { id: depositId },
      data: {
        status,
        returnedAt: new Date(),
        notes: notes || null,
      },
    });

    revalidatePath("/payments");
    revalidatePath(`/bookings/${deposit.bookingId}`);
  } catch (error) {
    console.error("updateDepositStatus error:", error);
    return { error: "Erreur lors de la mise à jour de la caution" };
  }
}
