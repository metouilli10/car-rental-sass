export const LOCALES = ["fr", "ar"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "fr";

/** Session cookie: no Max-Age = browser session */
export const LOCALE_COOKIE_NAME = "locaryx-locale";

/** First path segment for routes that live under /[locale]/... */
export const DASHBOARD_ROOT_SEGMENTS = new Set([
  "dashboard",
  "vehicles",
  "customers",
  "clients",
  "bookings",
  "reservations",
  "users",
  "finance",
  "payments",
  "paiements",
  "damage-reports",
  "infractions",
  "catalogue",
  "calendrier",
  "caisse",
  "settings",
  "notifications",
  "getting-started",
]);

export function isValidLocale(value: string | undefined): value is AppLocale {
  return value === "fr" || value === "ar";
}

export function localeDirection(locale: AppLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Prefix a path that starts with / (e.g. /dashboard) with the locale segment */
export function withLocalePath(locale: AppLocale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`;
}
