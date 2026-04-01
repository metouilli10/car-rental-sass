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
import { createVehicleCompat, updateVehicleCompat } from "@/lib/vehicle-fuel-type";
import { revalidatePath } from "next/cache";
import { syncAgencyOnboardingState } from "@/lib/onboarding/agency-onboarding";
import { Prisma } from "@prisma/client";

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
        await updateVehicleCompat(existing.id, buildVehicleUpdatePayload(normalized), { id: true });
        updated += 1;
      } else {
        try {
          const createdVehicle = await createVehicleCompat<{ id: string; plate: string }>(
            {
              ...buildVehicleCreatePayload(normalized),
              agencyId: currentUser.agencyId,
            },
            { id: true, plate: true },
          );
          existingByPlate.set(normalized.plate, {
            id: createdVehicle.id,
            plate: createdVehicle.plate,
          });
          created += 1;
        } catch (error) {
          const isUniquePlateConflict =
            error instanceof Prisma.PrismaClientKnownRequestError &&
            ((error.code === "P2002" && String(error.meta?.target).includes("plate")) ||
              (error.code === "P2010" &&
                typeof error.meta?.message === "string" &&
                error.meta.message.includes("Key (plate)=")));

          if (!isUniquePlateConflict) {
            throw error;
          }

          const conflictingVehicle = await prisma.vehicle.findFirst({
            where: { agencyId: currentUser.agencyId, plate: normalized.plate },
            select: { id: true },
          });

          if (!conflictingVehicle) {
            throw error;
          }

          await updateVehicleCompat(conflictingVehicle.id, buildVehicleUpdatePayload(normalized), {
            id: true,
          });
          existingByPlate.set(normalized.plate, {
            id: conflictingVehicle.id,
            plate: normalized.plate,
          });
          updated += 1;
        }
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
