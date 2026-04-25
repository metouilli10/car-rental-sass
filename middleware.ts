import { NextResponse } from "next/server";
import type { NextFetchEvent } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import {
  requiresAuthForPath,
  shouldSkipLocaleAndAuth,
  syncLocaleCookieOnResponse,
  tryDashboardLocaleRedirect,
} from "@/lib/i18n/middleware-utils";
import { isReservedStorefrontSlug, normalizeAgencySlug } from "@/lib/storefront/constants";
import { getCustomDomainUrl, isInternalStorefrontHost, normalizeStorefrontHostname } from "@/lib/storefront/domains";
import { getStorefrontPath } from "@/lib/storefront/routes";

const authMiddleware = withAuth(
  function authMiddlewareInner() {
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
  }
);

type InternalStorefrontResolutionResponse = {
  resolved: boolean;
  agencySlug?: string;
  matchedHostname?: string | null;
};

async function resolveStorefrontViaApi(
  request: NextRequest,
  input: { host?: string; slug?: string },
): Promise<InternalStorefrontResolutionResponse | null> {
  const url = request.nextUrl.clone();
  url.pathname = "/api/internal/storefront/resolve";
  url.search = "";

  if (input.host) {
    url.searchParams.set("host", normalizeStorefrontHostname(input.host));
  }
  if (input.slug) {
    url.searchParams.set("slug", normalizeAgencySlug(input.slug));
  }

  const response = await fetch(url, {
    headers: {
      "x-locaryx-storefront-middleware": "1",
    },
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  return response.json() as Promise<InternalStorefrontResolutionResponse>;
}

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent
): Promise<Response | NextResponse> {
  const pathname = request.nextUrl.pathname;
  const requestHost = request.headers.get("host") || request.nextUrl.host;

  const legacyStorefrontMatch = pathname.match(/^\/storefront\/([^/]+)\/?$/);
  if (legacyStorefrontMatch) {
    const slug = normalizeAgencySlug(legacyStorefrontMatch[1] || "");
    if (!isReservedStorefrontSlug(slug)) {
      const url = request.nextUrl.clone();
      url.pathname = getStorefrontPath(slug);
      return NextResponse.redirect(url, 308);
    }
  }

  if (shouldSkipLocaleAndAuth(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/" && requestHost && !isInternalStorefrontHost(requestHost)) {
    const hostResolution = await resolveStorefrontViaApi(request, { host: requestHost });
    if (hostResolution?.resolved && hostResolution.agencySlug) {
      const url = request.nextUrl.clone();
      url.pathname = `/storefront/${hostResolution.agencySlug}`;
      return NextResponse.rewrite(url);
    }
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1) {
    const slug = normalizeAgencySlug(segments[0] || "");
    if (!isReservedStorefrontSlug(slug)) {
      const slugResolution = await resolveStorefrontViaApi(request, { slug });

      if (
        slugResolution?.resolved &&
        slugResolution.matchedHostname &&
        requestHost &&
        isInternalStorefrontHost(requestHost)
      ) {
        return NextResponse.redirect(getCustomDomainUrl(slugResolution.matchedHostname), 308);
      }

      if (
        slugResolution?.resolved &&
        slugResolution.matchedHostname &&
        requestHost &&
        normalizeStorefrontHostname(requestHost) === slugResolution.matchedHostname
      ) {
        return NextResponse.redirect(getCustomDomainUrl(slugResolution.matchedHostname), 308);
      }

      const url = request.nextUrl.clone();
      url.pathname = `/storefront/${slug}`;
      return NextResponse.rewrite(url);
    }
  }

  const localeRedirect = tryDashboardLocaleRedirect(request);
  if (localeRedirect) {
    return localeRedirect;
  }

  if (requiresAuthForPath(pathname)) {
    const authResult = await authMiddleware(
      request as Parameters<typeof authMiddleware>[0],
      event
    );
    return syncLocaleCookieOnResponse(
      request,
      (authResult ?? NextResponse.next()) as Response | NextResponse
    );
  }

  return syncLocaleCookieOnResponse(request, NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Exclude static files and Next internals; everything else can run locale + auth logic.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif|txt|xml|webmanifest)$).*)",
  ],
};
