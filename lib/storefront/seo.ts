import { getCustomDomainUrl, normalizeStorefrontHostname } from "@/lib/storefront/domains";
import { getStorefrontPath } from "@/lib/storefront/routes";

export function getPublicSiteBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export function toAbsoluteStorefrontUrl(path: string) {
  return `${getPublicSiteBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function toAbsoluteStorefrontHostnameUrl(hostname: string, path = "/") {
  return getCustomDomainUrl(normalizeStorefrontHostname(hostname), path);
}

export function getCanonicalStorefrontUrl(params: {
  agencySlug: string;
  customHostname?: string | null;
  path?: string;
}) {
  if (params.customHostname) {
    return toAbsoluteStorefrontHostnameUrl(params.customHostname, params.path || "/");
  }

  return toAbsoluteStorefrontUrl(params.path || getStorefrontPath(params.agencySlug));
}
