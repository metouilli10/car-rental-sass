import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DASHBOARD_ROOT_SEGMENTS,
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "./config";

/** Print layouts at app root — do not inject /fr or /ar */
export function isPrintInvoicePath(pathname: string): boolean {
  return (
    /^\/bookings\/[^/]+\/invoice\/?$/.test(pathname) ||
    /^\/reservations\/[^/]+\/invoice\/?$/.test(pathname)
  );
}

export function shouldSkipLocaleAndAuth(pathname: string): boolean {
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/internal")) return true;
  if (pathname === "/manifest.webmanifest" || pathname === "/sw.js") return true;
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return false;
}

function cookieLocale(request: NextRequest): AppLocale {
  const raw = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  return raw === "ar" || raw === "fr" ? raw : DEFAULT_LOCALE;
}

export function localeFromPathPrefix(pathname: string): AppLocale | null {
  const match = pathname.match(/^\/(fr|ar)(?:\/|$)/);
  if (!match) return null;
  return match[1] === "ar" ? "ar" : "fr";
}

export function syncLocaleCookieOnResponse(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const locale = localeFromPathPrefix(request.nextUrl.pathname);
  if (!locale) return response;

  const current = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (current === locale) return response;

  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    sameSite: "lax",
  });
  return response;
}

/**
 * If the path is a dashboard route without /fr or /ar prefix, redirect to /{locale}/...
 */
export function tryDashboardLocaleRedirect(
  request: NextRequest
): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  if (isPrintInvoicePath(pathname)) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const first = segments[0];
  if (first === "fr" || first === "ar") return null;

  if (!DASHBOARD_ROOT_SEGMENTS.has(first)) return null;

  const locale = cookieLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export function requiresAuthForPath(pathname: string): boolean {
  if (isPrintInvoicePath(pathname)) return true;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return false;
  const [loc, root] = segments;
  if (loc !== "fr" && loc !== "ar") return false;
  return DASHBOARD_ROOT_SEGMENTS.has(root);
}
