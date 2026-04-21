import { DASHBOARD_ROOT_SEGMENTS, LOCALES } from "@/lib/i18n/config";

const EXTRA_RESERVED_SLUGS = [
  "api",
  "cometly-clone-2",
  "contact",
  "blog",
  "landing-2",
  "login",
  "post-login",
  "pricing",
  "seline-clone",
  "signup",
  "setup",
  "storefront",
  "internal",
  "offline",
  "verify-email",
  "manifest.webmanifest",
  "sw.js",
] as const;

export const RESERVED_STOREFRONT_SLUGS = new Set<string>([
  ...LOCALES,
  ...DASHBOARD_ROOT_SEGMENTS,
  ...EXTRA_RESERVED_SLUGS,
]);

export function normalizeAgencySlug(input: string): string {
  return input.trim().toLowerCase();
}

export function isReservedStorefrontSlug(slug: string): boolean {
  return RESERVED_STOREFRONT_SLUGS.has(normalizeAgencySlug(slug));
}
