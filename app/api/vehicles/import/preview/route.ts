import { NextRequest, NextResponse } from "next/server";
import { canManageVehicles } from "@/lib/permissions";
import { getCurrentUserAccessOrThrow, AuthzError } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  buildVehicleImportPreview,
  getRequiredVehicleImportFieldsMissing,
  hasAllRequiredVehicleMappings,
  inferVehicleImportMapping,
  parseVehicleSpreadsheet,
} from "@/lib/vehicles/import";
import type { VehicleImportMapping } from "@/lib/vehicles/import-types";

const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
];

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserAccessOrThrow();

    if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
      return NextResponse.json(
        { error: "Vous n'avez pas l'autorisation de gerer les vehicules" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Le fichier est vide" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas depasser 10 Mo." },
        { status: 400 },
      );
    }

    const lowerName = file.name.toLowerCase();
    const isSupportedExtension = lowerName.endsWith(".xlsx") || lowerName.endsWith(".csv");
    const isSupportedMime = !file.type || ALLOWED_MIME_TYPES.includes(file.type);

    if (!isSupportedExtension && !isSupportedMime) {
      return NextResponse.json(
        { error: "Format non supporte. Utilisez un fichier .xlsx ou .csv." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parseResult = parseVehicleSpreadsheet(buffer, file.name);

    if (parseResult.headers.length === 0) {
      return NextResponse.json(
        { error: "Impossible de lire les colonnes du fichier." },
        { status: 400 },
      );
    }

    const suggestedMapping = inferVehicleImportMapping(parseResult.headers);
    const mappingValue = formData.get("mapping");

    if (typeof mappingValue !== "string" || mappingValue.trim() === "") {
      return NextResponse.json({
        headers: parseResult.headers,
        sampleRows: parseResult.sampleRows,
        suggestedMapping,
      });
    }

    const mapping = JSON.parse(mappingValue) as VehicleImportMapping;
    const missingFields = getRequiredVehicleImportFieldsMissing(mapping);

    if (!hasAllRequiredVehicleMappings(mapping)) {
      return NextResponse.json(
        {
          error: "Veuillez mapper tous les champs obligatoires.",
          missingFields,
          headers: parseResult.headers,
          sampleRows: parseResult.sampleRows,
          suggestedMapping,
        },
        { status: 400 },
      );
    }

    const existingVehicles = await prisma.vehicle.findMany({
      where: { agencyId: currentUser.agencyId },
      select: { id: true, plate: true },
    });

    const preview = buildVehicleImportPreview({
      rows: parseResult.rows,
      mapping,
      existingVehicles,
    });

    return NextResponse.json({
      headers: parseResult.headers,
      sampleRows: parseResult.sampleRows,
      suggestedMapping,
      preview,
    });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("vehicle import preview error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du fichier" },
      { status: 500 },
    );
  }
}
