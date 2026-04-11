"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LOCALE_COOKIE_NAME, type AppLocale } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n/i18n-context";

function pathWithLocale(pathname: string, target: AppLocale): string {
  const m = pathname.match(/^\/(fr|ar)(\/.*)?$/);
  if (m) {
    const rest = m[2] ?? "";
    return `/${target}${rest === "" ? "" : rest}`;
  }
  const suffix = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/${target}${suffix}`;
}

function setSessionLocaleCookie(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; SameSite=Lax`;
}

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(target: AppLocale) {
    if (target === locale) return;
    setSessionLocaleCookie(target);

    const basePath = pathWithLocale(pathname, target);
    const query = searchParams.toString();
    const hash = window.location.hash;
    const nextUrl = `${basePath}${query ? `?${query}` : ""}${hash}`;

    router.push(nextUrl);
  }

  return (
    <div
      className={cn(
        "inline-flex h-9 items-center rounded-xl border border-subtle bg-slate-50 p-0.5 text-xs font-semibold",
        className
      )}
      role="group"
      aria-label={t("shell.language.ariaLabel")}
    >
      <button
        type="button"
        onClick={() => go("fr")}
        aria-pressed={locale === "fr"}
        className={cn(
          "rounded-[10px] px-2.5 py-1.5 transition-colors",
          locale === "fr"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => go("ar")}
        aria-pressed={locale === "ar"}
        className={cn(
          "rounded-[10px] px-2.5 py-1.5 transition-colors",
          locale === "ar"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        عربي
      </button>
    </div>
  );
}
