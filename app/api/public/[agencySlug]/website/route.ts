import { NextResponse } from "next/server";
import { normalizeAgencySlug } from "@/lib/storefront/constants";
import { getWebsiteSettingsBySlug } from "@/lib/storefront/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agencySlug: string }> },
) {
  const { agencySlug: rawSlug } = await context.params;
  const website = await getWebsiteSettingsBySlug(normalizeAgencySlug(rawSlug));

  if (!website || !website.isWebsiteEnabled) {
    return NextResponse.json({ error: "Storefront introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    agency: {
      slug: website.agencySlug,
      name: website.agency.name,
      city: website.agency.city,
      logoUrl: website.agency.logoUrl,
      siteTitle: website.siteTitle || website.agency.name,
      heroTitle: website.heroTitle || website.siteTitle || website.agency.name,
      heroSubtitle: website.heroSubtitle,
      heroImageUrl: website.heroImageUrl,
      contactPhone: website.contactPhone || website.agency.phone,
      whatsappPhone: website.whatsappPhone || website.contactPhone || website.agency.phone,
      contactEmail: website.contactEmail || website.agency.email,
      address: website.address || website.agency.address,
      pickupLocations: website.pickupLocations,
    },
  });
}
