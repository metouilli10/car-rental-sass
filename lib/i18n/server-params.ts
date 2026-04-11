import { notFound } from "next/navigation";
import { isValidLocale, type AppLocale } from "@/lib/i18n/config";

/** Resolve `[locale]` segment for dashboard server pages; 404 if invalid. */
export async function requireLocaleParam(
  params: Promise<{ locale: string }>
): Promise<AppLocale> {
  const { locale: raw } = await params;
  if (!isValidLocale(raw)) {
    notFound();
  }
  return raw;
}
