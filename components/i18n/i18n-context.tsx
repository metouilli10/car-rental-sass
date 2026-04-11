"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { AppLocale } from "@/lib/i18n/config";
import {
  getMessages,
  interpolate,
  messageAt,
  type Messages,
} from "@/lib/i18n/messages";

type I18nContextValue = {
  locale: AppLocale;
  messages: Messages;
  /** Dot path, e.g. `shell.sidebar.dashboard` */
  t: (path: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  const messages = useMemo(() => getMessages(locale), [locale]);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const raw = messageAt(messages, path);
      return vars ? interpolate(raw, vars) : raw;
    },
    [messages]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, messages, t }),
    [locale, messages, t]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

/** For client components that may render outside `I18nProvider` (e.g. auth/setup). */
export function useOptionalI18n(): I18nContextValue | null {
  return useContext(I18nContext);
}
