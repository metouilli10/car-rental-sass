import { BookingRequestSource, BookingRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createBookingRequestNotification } from "@/lib/notifications/booking-requests";
import { publicBookingRequestSchema, websiteSettingsSchema, type PublicBookingRequestInput, type WebsiteSettingsFormData } from "@/lib/validations/website";
import { getWebsiteSettingsBySlug } from "@/lib/storefront/queries";

export async function upsertWebsiteSettingsForAgency(agencyId: string, input: WebsiteSettingsFormData) {
  const validated = websiteSettingsSchema.parse(input);

  const existingWithSlug = await prisma.websiteSettings.findUnique({
    where: { agencySlug: validated.agencySlug },
    select: { agencyId: true },
  });

  if (existingWithSlug && existingWithSlug.agencyId !== agencyId) {
    throw new Error("Ce slug est déjà utilisé.");
  }

  return prisma.websiteSettings.upsert({
    where: { agencyId },
    update: {
      agencySlug: validated.agencySlug,
      siteTitle: validated.siteTitle || null,
      heroTitle: validated.heroTitle || null,
      heroSubtitle: validated.heroSubtitle || null,
      heroImageUrl: validated.heroImageUrl || null,
      contactPhone: validated.contactPhone || null,
      whatsappPhone: validated.whatsappPhone || null,
      contactEmail: validated.contactEmail || null,
      address: validated.address || null,
      pickupLocations: validated.pickupLocations,
      isWebsiteEnabled: validated.isWebsiteEnabled,
    },
    create: {
      agencyId,
      agencySlug: validated.agencySlug,
      siteTitle: validated.siteTitle || null,
      heroTitle: validated.heroTitle || null,
      heroSubtitle: validated.heroSubtitle || null,
      heroImageUrl: validated.heroImageUrl || null,
      contactPhone: validated.contactPhone || null,
      whatsappPhone: validated.whatsappPhone || null,
      contactEmail: validated.contactEmail || null,
      address: validated.address || null,
      pickupLocations: validated.pickupLocations,
      isWebsiteEnabled: validated.isWebsiteEnabled,
    },
  });
}

export async function createBookingRequestFromPublicForm(agencySlug: string, input: PublicBookingRequestInput) {
  const validated = publicBookingRequestSchema.parse(input);
  if (validated.website) {
    throw new Error("Soumission invalide.");
  }

  const website = await getWebsiteSettingsBySlug(agencySlug);
  if (!website || !website.isWebsiteEnabled) {
    throw new Error("SITE_NOT_AVAILABLE");
  }

  if (website.pickupLocations.length > 0) {
    if (!website.pickupLocations.includes(validated.pickupLocation)) {
      throw new Error("Lieu de départ invalide.");
    }
    if (!website.pickupLocations.includes(validated.returnLocation)) {
      throw new Error("Lieu de retour invalide.");
    }
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: validated.vehicleId,
      agencyId: website.agencyId,
      publishedToWebsite: true,
    },
    select: { id: true, make: true, model: true },
  });

  if (!vehicle) {
    throw new Error("VEHICLE_NOT_FOUND");
  }

  const bookingRequest = await prisma.bookingRequest.create({
    data: {
      agencyId: website.agencyId,
      vehicleId: vehicle.id,
      fullName: validated.fullName,
      email: validated.email,
      phone: validated.phone,
      pickupDate: new Date(validated.pickupDate),
      returnDate: new Date(validated.returnDate),
      pickupLocation: validated.pickupLocation,
      returnLocation: validated.returnLocation,
      note: validated.note || null,
      status: BookingRequestStatus.PENDING,
      source: BookingRequestSource.WEBSITE,
    },
    select: { id: true },
  });

  try {
    await createBookingRequestNotification({
      agencyId: website.agencyId,
      bookingRequestId: bookingRequest.id,
      customerName: validated.fullName,
      vehicleLabel: `${vehicle.make} ${vehicle.model}`,
    });
  } catch (error) {
    console.error("create booking request notification error:", error);
  }

  return bookingRequest;
}

export async function updateBookingRequestStatusForAgency(params: {
  agencyId: string;
  requestId: string;
  status: BookingRequestStatus;
}) {
  const bookingRequest = await prisma.bookingRequest.findFirst({
    where: {
      id: params.requestId,
      agencyId: params.agencyId,
    },
    select: { id: true },
  });

  if (!bookingRequest) {
    throw new Error("Demande introuvable.");
  }

  return prisma.bookingRequest.update({
    where: { id: bookingRequest.id },
    data: { status: params.status },
  });
}
