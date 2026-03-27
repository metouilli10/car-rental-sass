import type { Gearbox, VehicleStatus } from "@prisma/client";

export const VEHICLE_IMPORT_FIELDS = [
  { key: "make", label: "Marque", required: true },
  { key: "model", label: "Modele", required: true },
  { key: "year", label: "Annee", required: true },
  { key: "plate", label: "Plaque", required: true },
  { key: "color", label: "Couleur", required: true },
  { key: "pricePerDay", label: "Prix / jour", required: true },
  { key: "status", label: "Statut", required: false },
  { key: "mileage", label: "Kilometrage", required: false },
  { key: "currentKm", label: "Km actuel", required: false },
  { key: "depositAmount", label: "Caution", required: false },
  { key: "category", label: "Categorie", required: false },
  { key: "gearbox", label: "Boite", required: false },
  { key: "seats", label: "Places", required: false },
  { key: "hasAC", label: "Climatisation", required: false },
] as const;

export type VehicleImportField = (typeof VEHICLE_IMPORT_FIELDS)[number]["key"];
export type VehicleImportMapping = Partial<Record<VehicleImportField, string>>;

export type VehicleImportNormalizedRow = {
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  pricePerDay: number;
  status?: VehicleStatus;
  mileage?: number;
  currentKm?: number;
  depositAmount?: number;
  category?: string;
  gearbox?: Gearbox;
  seats?: number;
  hasAC?: boolean;
};

export type VehicleImportAction = "create" | "update" | "skip";

export type VehicleImportPreviewRow = {
  rowNumber: number;
  action: VehicleImportAction;
  errors: string[];
  raw: Record<string, string>;
  normalized: VehicleImportNormalizedRow | null;
  matchedVehicleId?: string;
};

export type VehicleImportPreview = {
  counts: {
    create: number;
    update: number;
    skip: number;
  };
  rows: VehicleImportPreviewRow[];
};

export type VehicleSpreadsheetParseResult = {
  headers: string[];
  rows: Record<string, string>[];
  sampleRows: Record<string, string>[];
};
