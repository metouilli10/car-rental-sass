import { z } from "zod";
import * as XLSX from "xlsx";
import type { Prisma } from "@prisma/client";
import {
  VEHICLE_IMPORT_FIELDS,
  type VehicleImportField,
  type VehicleImportMapping,
  type VehicleImportNormalizedRow,
  type VehicleImportPreview,
  type VehicleImportPreviewRow,
  type VehicleSpreadsheetParseResult,
} from "@/lib/vehicles/import-types";
import { buildVehiclePayload } from "@/lib/vehicles/payload";

const HEADER_ALIASES: Record<VehicleImportField, string[]> = {
  make: ["marque", "make", "brand", "constructeur"],
  model: ["modele", "model", "vehicule", "vehicle model"],
  year: ["annee", "year", "mise en circulation"],
  plate: ["plaque", "immatriculation", "plate", "matricule", "numero plaque"],
  color: ["couleur", "color", "couleur vehicule"],
  pricePerDay: ["prix jour", "prix par jour", "price per day", "tarif jour", "prix location", "prix"],
  status: ["statut", "status", "etat", "disponibilite", "availability"],
  mileage: ["kilometrage", "kilometrage total", "mileage", "km"],
  currentKm: ["km actuel", "kilometrage actuel", "current km", "compteur"],
  depositAmount: ["caution", "deposit", "montant caution"],
  category: ["categorie", "category", "segment", "classe"],
  gearbox: ["boite", "gearbox", "transmission"],
  seats: ["places", "seats", "nombre places"],
  hasAC: ["clim", "climatisation", "ac", "a c", "air conditionne"],
};

const requiredFieldSet = new Set<VehicleImportField>(
  VEHICLE_IMPORT_FIELDS.filter((field) => field.required).map(
    (field) => field.key as VehicleImportField,
  ),
);

const importVehicleSchema = z.object({
  make: z.string().min(1, "La marque est requise"),
  model: z.string().min(1, "Le modele est requis"),
  year: z.number().int().min(1900, "Annee invalide").max(new Date().getFullYear() + 1, "Annee invalide"),
  plate: z.string().min(1, "La plaque est requise"),
  color: z.string().min(1, "La couleur est requise"),
  pricePerDay: z.number().min(0, "Le prix / jour doit etre positif"),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE", "UNAVAILABLE"]).optional(),
  mileage: z.number().int().min(0, "Le kilometrage doit etre positif").optional(),
  currentKm: z.number().int().min(0, "Le km actuel doit etre positif").optional(),
  depositAmount: z.number().min(0, "La caution doit etre positive").optional(),
  category: z.string().min(1, "La categorie ne peut pas etre vide").optional(),
  gearbox: z.enum(["MANUAL", "AUTO"]).optional(),
  seats: z.number().int().min(1, "Le nombre de places est invalide").max(99, "Le nombre de places est invalide").optional(),
  hasAC: z.boolean().optional(),
});

export function normalizeImportHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeImportedPlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseNumberValue(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const normalized = trimmed
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");

  if (!normalized) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBooleanValue(value: string): boolean | undefined {
  const normalized = normalizeImportHeader(value);
  if (!normalized) return undefined;
  if (["oui", "yes", "true", "1", "avec clim", "clim", "ac"].includes(normalized)) {
    return true;
  }
  if (["non", "no", "false", "0", "sans clim"].includes(normalized)) {
    return false;
  }
  return undefined;
}

function parseStatusValue(value: string) {
  const normalized = normalizeImportHeader(value);
  if (!normalized) return undefined;

  if (["available", "disponible", "dispo", "libre"].includes(normalized)) {
    return "AVAILABLE" as const;
  }
  if (["rented", "loue", "loue", "en location", "reserve", "reservee", "reservé", "reservée"].includes(normalized)) {
    return "RENTED" as const;
  }
  if (["maintenance", "garage", "atelier", "service"].includes(normalized)) {
    return "MAINTENANCE" as const;
  }
  if (["unavailable", "indisponible", "inactive", "desactive", "desactivee", "desactive"].includes(normalized)) {
    return "UNAVAILABLE" as const;
  }

  return undefined;
}

function parseGearboxValue(value: string) {
  const normalized = normalizeImportHeader(value);
  if (!normalized) return undefined;
  if (["auto", "automatique", "automatic"].includes(normalized)) {
    return "AUTO" as const;
  }
  if (["manuel", "manuelle", "manual"].includes(normalized)) {
    return "MANUAL" as const;
  }
  return undefined;
}

function trimToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function inferVehicleImportMapping(headers: string[]): VehicleImportMapping {
  const mapping: VehicleImportMapping = {};
  const normalizedHeaders = headers.map((header) => ({
    raw: header,
    normalized: normalizeImportHeader(header),
  }));
  const usedHeaders = new Set<string>();

  for (const field of VEHICLE_IMPORT_FIELDS) {
    const aliases = HEADER_ALIASES[field.key];
    const match = normalizedHeaders.find(
      (header) => !usedHeaders.has(header.raw) && aliases.includes(header.normalized),
    );

    if (match) {
      mapping[field.key] = match.raw;
      usedHeaders.add(match.raw);
    }
  }

  return mapping;
}

export function getRequiredVehicleImportFieldsMissing(mapping: VehicleImportMapping): VehicleImportField[] {
  return VEHICLE_IMPORT_FIELDS.filter((field) => field.required && !mapping[field.key]).map((field) => field.key);
}

export function parseVehicleSpreadsheet(buffer: Buffer, fileName: string): VehicleSpreadsheetParseResult {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    raw: false,
    dense: true,
    codepage: 65001,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { headers: [], rows: [], sampleRows: [] };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });

  if (rows.length === 0) {
    return { headers: [], rows: [], sampleRows: [] };
  }

  const [headerRow, ...bodyRows] = rows;
  const rawHeaders = headerRow.map((cell, index) => stringifyCell(cell) || `Colonne ${index + 1}`);
  const headers = dedupeHeaders(rawHeaders);

  const mappedRows = bodyRows
    .map((row) => {
      const mappedRow = Object.fromEntries(
        headers.map((header, index) => [header, stringifyCell(row[index])]),
      );
      return mappedRow;
    })
    .filter((row) => Object.values(row).some((value) => value !== ""));

  return {
    headers,
    rows: mappedRows,
    sampleRows: mappedRows.slice(0, 5),
  };
}

function dedupeHeaders(headers: string[]): string[] {
  const counts = new Map<string, number>();

  return headers.map((header) => {
    const base = header || "Colonne";
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    return seen === 0 ? base : `${base} (${seen + 1})`;
  });
}

function readMappedValue(row: Record<string, string>, mapping: VehicleImportMapping, field: VehicleImportField): string {
  const header = mapping[field];
  if (!header) return "";
  return row[header] ?? "";
}

export function normalizeVehicleImportRow(
  row: Record<string, string>,
  mapping: VehicleImportMapping,
): { normalized: VehicleImportNormalizedRow | null; errors: string[] } {
  const rawStatus = readMappedValue(row, mapping, "status");
  const rawGearbox = readMappedValue(row, mapping, "gearbox");
  const rawHasAC = readMappedValue(row, mapping, "hasAC");

  const candidate = {
    make: trimToUndefined(readMappedValue(row, mapping, "make")) ?? "",
    model: trimToUndefined(readMappedValue(row, mapping, "model")) ?? "",
    year: parseNumberValue(readMappedValue(row, mapping, "year")),
    plate: normalizeImportedPlate(readMappedValue(row, mapping, "plate")),
    color: trimToUndefined(readMappedValue(row, mapping, "color")) ?? "",
    pricePerDay: parseNumberValue(readMappedValue(row, mapping, "pricePerDay")),
    status: rawStatus ? parseStatusValue(rawStatus) : undefined,
    mileage: parseNumberValue(readMappedValue(row, mapping, "mileage")),
    currentKm: parseNumberValue(readMappedValue(row, mapping, "currentKm")),
    depositAmount: parseNumberValue(readMappedValue(row, mapping, "depositAmount")),
    category: trimToUndefined(readMappedValue(row, mapping, "category")),
    gearbox: rawGearbox ? parseGearboxValue(rawGearbox) : undefined,
    seats: parseNumberValue(readMappedValue(row, mapping, "seats")),
    hasAC: rawHasAC ? parseBooleanValue(rawHasAC) : undefined,
  };

  const fieldSpecificErrors: string[] = [];

  if (rawStatus && !candidate.status) {
    fieldSpecificErrors.push(`Statut invalide: ${rawStatus}`);
  }
  if (rawGearbox && !candidate.gearbox) {
    fieldSpecificErrors.push(`Boite invalide: ${rawGearbox}`);
  }
  if (rawHasAC && candidate.hasAC === undefined) {
    fieldSpecificErrors.push(`Climatisation invalide: ${rawHasAC}`);
  }

  const parsed = importVehicleSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      normalized: null,
      errors: [
        ...fieldSpecificErrors,
        ...parsed.error.issues.map((issue) => issue.message),
      ],
    };
  }

  return { normalized: parsed.data, errors: fieldSpecificErrors };
}

export function buildVehicleImportPreview(options: {
  rows: Record<string, string>[];
  mapping: VehicleImportMapping;
  existingVehicles: Array<{ id: string; plate: string }>;
}): VehicleImportPreview {
  const normalizedExistingVehicles = new Map<string, { id: string; plate: string }>();
  for (const vehicle of options.existingVehicles) {
    normalizedExistingVehicles.set(normalizeImportedPlate(vehicle.plate), vehicle);
  }

  const seenPlates = new Set<string>();
  const previewRows: VehicleImportPreviewRow[] = options.rows.map((row, index) => {
    const rowNumber = index + 2;
    const { normalized, errors } = normalizeVehicleImportRow(row, options.mapping);

    if (!normalized) {
      return {
        rowNumber,
        action: "skip",
        errors,
        raw: row,
        normalized: null,
      };
    }

    if (seenPlates.has(normalized.plate)) {
      return {
        rowNumber,
        action: "skip",
        errors: ["Plaque dupliquee dans le fichier"],
        raw: row,
        normalized,
      };
    }

    seenPlates.add(normalized.plate);

    const matchedVehicle = normalizedExistingVehicles.get(normalized.plate);

    return {
      rowNumber,
      action: matchedVehicle ? "update" : "create",
      errors,
      raw: row,
      normalized,
      matchedVehicleId: matchedVehicle?.id,
    };
  });

  return {
    counts: {
      create: previewRows.filter((row) => row.action === "create").length,
      update: previewRows.filter((row) => row.action === "update").length,
      skip: previewRows.filter((row) => row.action === "skip").length,
    },
    rows: previewRows,
  };
}

export function buildVehicleCreatePayload(
  row: VehicleImportNormalizedRow,
): Omit<Prisma.VehicleUncheckedCreateInput, "agencyId"> {
  return buildVehiclePayload({
    ...row,
    mileage: row.mileage ?? null,
    currentKm: row.currentKm ?? null,
    depositAmount: row.depositAmount ?? 2000,
    category: row.category ?? "Citadine",
    gearbox: row.gearbox ?? "MANUAL",
    seats: row.seats ?? 5,
    hasAC: row.hasAC ?? true,
  });
}

export function buildVehicleUpdatePayload(row: VehicleImportNormalizedRow): Prisma.VehicleUncheckedUpdateInput {
  return {
    make: row.make,
    model: row.model,
    year: row.year,
    plate: row.plate,
    color: row.color,
    pricePerDay: row.pricePerDay,
    brandKey: buildVehiclePayload(row).brandKey,
    ...(row.status !== undefined ? { status: row.status } : {}),
    ...(row.mileage !== undefined ? { mileage: row.mileage } : {}),
    ...(row.currentKm !== undefined ? { currentKm: row.currentKm } : {}),
    ...(row.depositAmount !== undefined ? { depositAmount: row.depositAmount } : {}),
    ...(row.category !== undefined ? { category: row.category } : {}),
    ...(row.gearbox !== undefined ? { gearbox: row.gearbox } : {}),
    ...(row.seats !== undefined ? { seats: row.seats } : {}),
    ...(row.hasAC !== undefined ? { hasAC: row.hasAC } : {}),
  };
}

export function parseImportCommitRows(value: unknown): VehicleImportPreviewRow[] {
  const schema = z.array(
    z.object({
      rowNumber: z.number().int().min(2),
      action: z.enum(["create", "update", "skip"]),
      errors: z.array(z.string()),
      raw: z.record(z.string(), z.string()),
      normalized: importVehicleSchema.nullable(),
      matchedVehicleId: z.string().optional(),
    }),
  );

  return schema.parse(value);
}

export function hasAllRequiredVehicleMappings(mapping: VehicleImportMapping): boolean {
  return getRequiredVehicleImportFieldsMissing(mapping).length === 0;
}

export function isRequiredVehicleImportField(field: VehicleImportField): boolean {
  return requiredFieldSet.has(field);
}
