import { NextRequest, NextResponse } from "next/server";
import { resolveStorefrontRequest } from "@/lib/storefront/resolve";

export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get("host");
  const slug = request.nextUrl.searchParams.get("slug");
  const result = await resolveStorefrontRequest({ host, pathSlug: slug });

  if (!result) {
    return NextResponse.json({ resolved: false });
  }

  return NextResponse.json({
    resolved: true,
    agencySlug: result.agencySlug,
    source: result.source,
    matchedHostname: result.matchedHostname,
  });
}
