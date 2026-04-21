import { NextResponse } from "next/server";
import { normalizeAgencySlug } from "@/lib/storefront/constants";
import { getPublishedVehicleBySlugAndVehicleId } from "@/lib/storefront/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ agencySlug: string; vehicleId: string }> },
) {
  const { agencySlug: rawSlug, vehicleId } = await context.params;
  const result = await getPublishedVehicleBySlugAndVehicleId(normalizeAgencySlug(rawSlug), vehicleId);

  if (!result) {
    return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  }

  return NextResponse.json({ vehicle: result.vehicle });
}
