"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isValidLocale, localeDirection, type AppLocale } from "@/lib/i18n/config";

/**
 * Root layout keeps a single <html>; this syncs lang/dir from the URL prefix /fr or /ar.
 */
export function LocaleHtmlAttributes() {
  const pathname = usePathname();

  useEffect(() => {
    const match = pathname.match(/^\/(fr|ar)(\/|$)/);
    const locale: AppLocale = match && isValidLocale(match[1]) ? match[1] : "fr";
    document.documentElement.lang = locale === "ar" ? "ar" : "fr";
    document.documentElement.dir = localeDirection(locale);
  }, [pathname]);

  return null;
}
