import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AgencyStorefrontPage } from "@/components/storefront/agency-storefront-page";
import { isReservedStorefrontSlug, normalizeAgencySlug } from "@/lib/storefront/constants";
import { isInternalStorefrontHost, normalizeStorefrontHostname } from "@/lib/storefront/domains";
import { getPublishedVehiclesBySlug, getWebsiteSettingsBySlug } from "@/lib/storefront/queries";
import { getCanonicalStorefrontUrl } from "@/lib/storefront/seo";

function getRequestHost(headerList: Awaited<ReturnType<typeof headers>>) {
  return normalizeStorefrontHostname(headerList.get("x-forwarded-host") || headerList.get("host") || "");
}

function buildStorefrontMetadata({
  agencySlug,
  siteTitle,
  heroTitle,
  heroSubtitle,
  heroImageUrl,
  city,
  customHostname,
}: {
  agencySlug: string;
  siteTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string | null;
  city: string;
  customHostname?: string | null;
}): Metadata {
  const canonical = getCanonicalStorefrontUrl({
    agencySlug,
    customHostname,
  });
  const title = `${siteTitle} | Location de voiture à ${city}`;
  const description =
    heroSubtitle ||
    "Découvrez les véhicules publiés par l'agence et envoyez une demande de réservation avec validation humaine.";

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: siteTitle,
      images: heroImageUrl
        ? [
            {
              url: heroImageUrl,
              alt: heroTitle,
            },
          ]
        : undefined,
    },
    twitter: {
      card: heroImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: heroImageUrl ? [heroImageUrl] : undefined,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}): Promise<Metadata> {
  const { agencySlug: rawSlug } = await params;
  const agencySlug = normalizeAgencySlug(rawSlug);

  if (isReservedStorefrontSlug(agencySlug)) {
    return {
      title: "Page indisponible | Locaryx",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const website = await getWebsiteSettingsBySlug(agencySlug);
  if (!website || !website.isWebsiteEnabled) {
    return {
      title: "Storefront indisponible | Locaryx",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const headerList = await headers();
  const requestHost = getRequestHost(headerList);
  const verifiedHostname =
    website.agency.storefrontDomain?.status === "VERIFIED"
      ? website.agency.storefrontDomain.hostname
      : null;
  const customHostname =
    verifiedHostname && requestHost === verifiedHostname ? verifiedHostname : null;
  const siteTitle = website.siteTitle || website.agency.name;
  const heroTitle = website.heroTitle || siteTitle;
  const heroSubtitle =
    website.heroSubtitle ||
    "Découvrez les véhicules publiés par l'agence et envoyez une demande de réservation en quelques instants.";

  return buildStorefrontMetadata({
    agencySlug: website.agencySlug,
    siteTitle,
    heroTitle,
    heroSubtitle,
    heroImageUrl: website.heroImageUrl || null,
    city: website.agency.city,
    customHostname,
  });
}

export default async function AgencyStorefrontPageRoute({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}) {
  const { agencySlug: rawSlug } = await params;
  const agencySlug = normalizeAgencySlug(rawSlug);

  if (isReservedStorefrontSlug(agencySlug)) {
    notFound();
  }

  const result = await getPublishedVehiclesBySlug(agencySlug);
  if (!result) {
    notFound();
  }

  const headerList = await headers();
  const requestHost = getRequestHost(headerList);
  const verifiedHostname =
    result.settings.agency.storefrontDomain?.status === "VERIFIED"
      ? result.settings.agency.storefrontDomain.hostname
      : null;

  if (verifiedHostname && (!requestHost || isInternalStorefrontHost(requestHost))) {
    redirect(getCanonicalStorefrontUrl({ agencySlug, customHostname: verifiedHostname }));
  }

  return <AgencyStorefrontPage settings={result.settings} vehicles={result.vehicles} />;
}
