"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserAccessOrThrow } from "@/lib/authz";
import { canManageVehicles } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { upsertWebsiteSettingsForAgency } from "@/lib/storefront/public";
import { getStorefrontPath } from "@/lib/storefront/routes";
import { websiteSettingsSchema, type WebsiteSettingsFormData } from "@/lib/validations/website";

export async function saveWebsiteSettings(data: WebsiteSettingsFormData) {
  const currentUser = await getCurrentUserAccessOrThrow();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    return { error: "Vous n'avez pas l'autorisation de gérer le site web." };
  }

  try {
    const validated = websiteSettingsSchema.parse(data);
    const previousSettings = await prisma.websiteSettings.findUnique({
      where: { agencyId: currentUser.agencyId },
      select: { agencySlug: true },
    });

    await upsertWebsiteSettingsForAgency(currentUser.agencyId, validated);

    revalidatePath("/settings/website");
    revalidatePath("/vehicles");
    revalidatePath(getStorefrontPath(validated.agencySlug));
    if (previousSettings?.agencySlug && previousSettings.agencySlug !== validated.agencySlug) {
      revalidatePath(getStorefrontPath(previousSettings.agencySlug));
    }
    return { success: true as const };
  } catch (error) {
    console.error("saveWebsiteSettings error:", error);
    return {
      error: error instanceof Error ? error.message : "Impossible d'enregistrer les paramètres du site.",
    };
  }
}

export async function getWebsiteSettingsFormValues(agencyId: string) {
  const [agency, websiteSettings] = await Promise.all([
    prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
      },
    }),
    prisma.websiteSettings.findUnique({
      where: { agencyId },
    }),
  ]);

  return {
    agencySlug: websiteSettings?.agencySlug ?? "",
    siteTitle: websiteSettings?.siteTitle ?? agency?.name ?? "",
    heroTitle: websiteSettings?.heroTitle ?? agency?.name ?? "",
    heroSubtitle: websiteSettings?.heroSubtitle ?? "Louez votre prochaine voiture en quelques clics.",
    heroImageUrl: websiteSettings?.heroImageUrl ?? "",
    contactPhone: websiteSettings?.contactPhone ?? agency?.phone ?? "",
    whatsappPhone: websiteSettings?.whatsappPhone ?? agency?.phone ?? "",
    contactEmail: websiteSettings?.contactEmail ?? agency?.email ?? "",
    address: websiteSettings?.address ?? agency?.address ?? "",
    pickupLocations: websiteSettings?.pickupLocations ?? [],
    isWebsiteEnabled: websiteSettings?.isWebsiteEnabled ?? false,
  } satisfies WebsiteSettingsFormData;
}
