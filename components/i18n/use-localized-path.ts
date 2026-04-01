"use client";

import { useCallback } from "react";
import { DEFAULT_LOCALE, withLocalePath } from "@/lib/i18n/config";
import { useI18n, useOptionalI18n } from "@/components/i18n/i18n-context";

/** Prefix internal app paths with the active locale (`/fr/...`, `/ar/...`). */
export function useLocalizedPath() {
  const { locale } = useI18n();
  return useCallback((path: string) => withLocalePath(locale, path), [locale]);
}

/**
 * Same as `useLocalizedPath` but uses `DEFAULT_LOCALE` when outside `I18nProvider`
 * (e.g. setup page after agency profile save).
 */
export function useLocalizedPathWithFallback() {
  const ctx = useOptionalI18n();
  const locale = ctx?.locale ?? DEFAULT_LOCALE;
  return useCallback((path: string) => withLocalePath(locale, path), [locale]);
}
