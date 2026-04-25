import { normalizeAgencySlug } from "@/lib/storefront/constants";
import {
  getVerifiedStorefrontDomainByHostname,
  getWebsiteSettingsBySlug,
  type WebsiteSettingsWithAgency,
} from "@/lib/storefront/queries";
import {
  isInternalStorefrontHost,
  normalizeStorefrontHostname,
} from "@/lib/storefront/domains";

export type StorefrontResolutionSource = "custom-domain" | "slug";

export type StorefrontRequestResolution = {
  agencySlug: string;
  source: StorefrontResolutionSource;
  matchedHostname: string | null;
  settings: WebsiteSettingsWithAgency;
};

export async function resolveStorefrontRequest(input: {
  host?: string | null;
  pathSlug?: string | null;
}): Promise<StorefrontRequestResolution | null> {
  const normalizedHost = input.host ? normalizeStorefrontHostname(input.host) : "";

  if (normalizedHost && !isInternalStorefrontHost(normalizedHost)) {
    const domain = await getVerifiedStorefrontDomainByHostname(normalizedHost);
    const settings = domain?.agency.websiteSettings;

    if (domain && settings?.isWebsiteEnabled) {
      return {
        agencySlug: settings.agencySlug,
        source: "custom-domain",
        matchedHostname: domain.hostname,
        settings,
      };
    }
  }

  const normalizedSlug = normalizeAgencySlug(input.pathSlug || "");
  if (!normalizedSlug) {
    return null;
  }

  const settings = await getWebsiteSettingsBySlug(normalizedSlug);
  if (!settings?.isWebsiteEnabled) {
    return null;
  }

  return {
    agencySlug: settings.agencySlug,
    source: "slug",
    matchedHostname: settings.agency.storefrontDomain?.status === "VERIFIED"
      ? settings.agency.storefrontDomain.hostname
      : null,
    settings,
  };
}
