import type { MetadataRoute } from "next";
import { Prisma } from "@prisma/client";
import { getEnabledStorefrontSlugs } from "@/lib/storefront/queries";
import { getStorefrontPath } from "@/lib/storefront/routes";
import { toAbsoluteStorefrontUrl } from "@/lib/storefront/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let storefronts: Awaited<ReturnType<typeof getEnabledStorefrontSlugs>> = [];

  try {
    storefronts = await getEnabledStorefrontSlugs();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021"
    ) {
      console.warn("Skipping storefront sitemap generation because website_settings is unavailable.");
      return [];
    }

    throw error;
  }

  return storefronts.map((storefront) => ({
    url: toAbsoluteStorefrontUrl(getStorefrontPath(storefront.agencySlug)),
    lastModified: storefront.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));
}
