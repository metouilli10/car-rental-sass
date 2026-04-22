import { NextResponse } from "next/server";
import { normalizeAgencySlug } from "@/lib/storefront/constants";
import { getPublishedVehiclesBySlug } from "@/lib/storefront/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agencySlug: string }> },
) {
  const { agencySlug: rawSlug } = await context.params;
  const result = await getPublishedVehiclesBySlug(normalizeAgencySlug(rawSlug));

  if (!result) {
    return NextResponse.json({ error: "Storefront introuvable" }, { status: 404 });
  }

  return NextResponse.json({ vehicles: result.vehicles });
}
