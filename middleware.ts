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

const authMiddleware = withAuth(
  function authMiddlewareInner() {
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
  }
);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  const pathname = request.nextUrl.pathname;

  if (shouldSkipLocaleAndAuth(pathname)) {
    return NextResponse.next();
  }

  const localeRedirect = tryDashboardLocaleRedirect(request);
  if (localeRedirect) {
    return localeRedirect;
  }

  if (requiresAuthForPath(pathname)) {
    const response = authMiddleware(
      request as Parameters<typeof authMiddleware>[0],
      event
    ) as NextResponse;
    return syncLocaleCookieOnResponse(request, response);
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
