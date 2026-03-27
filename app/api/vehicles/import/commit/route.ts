import { NextRequest, NextResponse } from "next/server";
import { canManageVehicles } from "@/lib/permissions";
import { getCurrentUserAccessOrThrow, AuthzError } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  buildVehicleCreatePayload,
  buildVehicleUpdatePayload,
  normalizeImportedPlate,
  parseImportCommitRows,
} from "@/lib/vehicles/import";
import { revalidatePath } from "next/cache";
import { syncAgencyOnboardingState } from "@/lib/onboarding/agency-onboarding";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserAccessOrThrow();

    if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
      return NextResponse.json(
        { error: "Vous n'avez pas l'autorisation de gerer les vehicules" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const rows = parseImportCommitRows(body?.rows ?? []);
    const importableRows = rows.filter((row) => row.action !== "skip" && row.normalized);

    if (importableRows.length === 0) {
      return NextResponse.json(
        { error: "Aucune ligne valide a importer." },
        { status: 400 },
      );
    }

    const existingVehicles = await prisma.vehicle.findMany({
      where: { agencyId: currentUser.agencyId },
      select: { id: true, plate: true },
    });

    const existingByPlate = new Map(
      existingVehicles.map((vehicle) => [normalizeImportedPlate(vehicle.plate), vehicle]),
    );
    const seenPlates = new Set<string>();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of importableRows) {
      const normalized = row.normalized;
      if (!normalized) {
        skipped += 1;
        continue;
      }

      if (seenPlates.has(normalized.plate)) {
        skipped += 1;
        continue;
      }

      seenPlates.add(normalized.plate);

      const existing = existingByPlate.get(normalized.plate);

      if (existing) {
        await prisma.vehicle.update({
          where: { id: existing.id },
          data: buildVehicleUpdatePayload(normalized),
        });
        updated += 1;
      } else {
        const createdVehicle = await prisma.vehicle.create({
          data: {
            ...buildVehicleCreatePayload(normalized),
            agencyId: currentUser.agencyId,
          },
        });
        existingByPlate.set(normalized.plate, { id: createdVehicle.id, plate: createdVehicle.plate });
        created += 1;
      }
    }

    revalidatePath("/vehicles");
    revalidatePath("/catalogue");
    revalidatePath("/dashboard");

    await syncAgencyOnboardingState(currentUser.agencyId);

    return NextResponse.json({
      created,
      updated,
      skipped,
    });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("vehicle import commit error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'import des vehicules" },
      { status: 500 },
    );
  }
}
