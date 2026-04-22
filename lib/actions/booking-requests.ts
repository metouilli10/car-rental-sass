"use server";

import { BookingRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserAccessOrThrow } from "@/lib/authz";
import { getEffectivePermissions } from "@/lib/permissions";
import { markBookingRequestAsRead } from "@/lib/notifications/booking-requests";
import { updateBookingRequestStatusForAgency } from "@/lib/storefront/public";
import { prisma } from "@/lib/prisma";
import { withLocalePath } from "@/lib/i18n/config";

async function updateStatus(requestId: string, status: BookingRequestStatus) {
  const currentUser = await getCurrentUserAccessOrThrow();
  const permissions = getEffectivePermissions(currentUser.role, currentUser.permissions);

  if (!permissions["bookings.manage"]) {
    return { error: "Vous n'avez pas l'autorisation de gérer les demandes." };
  }

  try {
    await markBookingRequestAsRead(requestId, currentUser.agencyId);

    await updateBookingRequestStatusForAgency({
      agencyId: currentUser.agencyId,
      requestId,
      status,
    });

    revalidatePath("/booking-requests");
    return { success: true as const };
  } catch (error) {
    console.error("update booking request status error:", error);
    return {
      error: error instanceof Error ? error.message : "Impossible de mettre à jour la demande.",
    };
  }
}

export async function approveBookingRequest(requestId: string) {
  return updateStatus(requestId, BookingRequestStatus.APPROVED);
}

export async function rejectBookingRequest(requestId: string) {
  return updateStatus(requestId, BookingRequestStatus.REJECTED);
}

export async function approveAndStartBookingRequestConversion(
  requestId: string,
  locale: "fr" | "ar",
) {
  const approval = await approveBookingRequest(requestId);

  if ("error" in approval) {
    return approval;
  }

  return startBookingRequestConversion(requestId, locale);
}

export async function startBookingRequestConversion(requestId: string, locale: "fr" | "ar") {
  const currentUser = await getCurrentUserAccessOrThrow();
  const permissions = getEffectivePermissions(currentUser.role, currentUser.permissions);

  if (!permissions["bookings.manage"]) {
    return { error: "Vous n'avez pas l'autorisation de convertir cette demande." };
  }

  await markBookingRequestAsRead(requestId, currentUser.agencyId);

  const bookingRequest = await prisma.bookingRequest.findFirst({
    where: {
      id: requestId,
      agencyId: currentUser.agencyId,
    },
    select: {
      id: true,
      bookingId: true,
      status: true,
      fullName: true,
      email: true,
      phone: true,
      pickupDate: true,
      returnDate: true,
      pickupLocation: true,
      returnLocation: true,
      note: true,
      vehicleId: true,
    },
  });

  if (!bookingRequest) {
    return { error: "Demande introuvable." };
  }

  if (bookingRequest.bookingId) {
    redirect(withLocalePath(locale, `/bookings/${bookingRequest.bookingId}`));
  }

  if (bookingRequest.status !== BookingRequestStatus.APPROVED) {
    return { error: "Seules les demandes approuvées peuvent être converties." };
  }

  const customer =
    (await prisma.customer.findFirst({
      where: {
        agencyId: currentUser.agencyId,
        OR: [
          { phone: bookingRequest.phone },
          ...(bookingRequest.email ? [{ email: bookingRequest.email }] : []),
        ],
      },
      select: { id: true },
    })) ??
    (await prisma.customer.create({
      data: {
        agencyId: currentUser.agencyId,
        name: bookingRequest.fullName,
        email: bookingRequest.email || null,
        phone: bookingRequest.phone,
        passportOrCIN: "PENDING",
      },
      select: { id: true },
    }));

  revalidatePath("/customers");

  const params = new URLSearchParams({
    customerId: customer.id,
    vehicleId: bookingRequest.vehicleId,
    start: bookingRequest.pickupDate.toISOString().slice(0, 10),
    end: bookingRequest.returnDate.toISOString().slice(0, 10),
    pickupLocation: bookingRequest.pickupLocation,
    returnLocation: bookingRequest.returnLocation,
  });

  if (bookingRequest.note) {
    params.set("notes", bookingRequest.note);
  }
  params.set("bookingRequestId", bookingRequest.id);

  redirect(`${withLocalePath(locale, "/bookings/create")}?${params.toString()}`);
}
