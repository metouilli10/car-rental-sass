import type { Gearbox, VehicleStatus } from "@prisma/client";
import { brandKeyFromMake } from "@/lib/brands";

type VehiclePayloadInput = {
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  pricePerDay: number;
  mileage?: number | null;
  photoUrl?: string | null;
  currentKm?: number | null;
  lastOilChangeMileageKm?: number | null;
  lastOilChangeDate?: Date | null;
  oilChangeIntervalKm?: number | null;
  oilChangeIntervalMonths?: number | null;
  nextOilChangeMileageKm?: number | null;
  nextOilChangeDate?: Date | null;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceStartDate?: Date | null;
  insuranceExpiryDate?: Date | null;
  insuranceReminderDays?: number[];
  lastTechnicalInspectionDate?: Date | null;
  nextTechnicalInspectionDate?: Date | null;
  technicalInspectionReminderDays?: number[];
  vignetteExpiryDate?: Date | null;
  vignetteReminderDays?: number[];
  maintenanceNotes?: string | null;
  status?: VehicleStatus;
  depositAmount?: number | null;
  gearbox?: Gearbox;
  seats?: number | null;
  hasAC?: boolean | null;
  category?: string | null;
};

export function buildVehiclePayload(input: VehiclePayloadInput) {
  return {
    make: input.make,
    brandKey: brandKeyFromMake(input.make),
    model: input.model,
    year: input.year,
    plate: input.plate,
    color: input.color,
    status: input.status ?? "AVAILABLE",
    pricePerDay: input.pricePerDay,
    depositAmount: input.depositAmount ?? 2000,
    gearbox: input.gearbox ?? "MANUAL",
    seats: input.seats ?? 5,
    hasAC: input.hasAC ?? true,
    category: input.category ?? "Citadine",
    mileage: input.mileage ?? null,
    photoUrl: input.photoUrl ?? null,
    currentKm: input.currentKm ?? null,
    lastOilChangeMileageKm: input.lastOilChangeMileageKm ?? null,
    lastOilChangeDate: input.lastOilChangeDate ?? null,
    oilChangeIntervalKm: input.oilChangeIntervalKm ?? null,
    oilChangeIntervalMonths: input.oilChangeIntervalMonths ?? null,
    nextOilChangeMileageKm: input.nextOilChangeMileageKm ?? null,
    nextOilChangeDate: input.nextOilChangeDate ?? null,
    insuranceProvider: input.insuranceProvider ?? null,
    insurancePolicyNumber: input.insurancePolicyNumber ?? null,
    insuranceStartDate: input.insuranceStartDate ?? null,
    insuranceExpiryDate: input.insuranceExpiryDate ?? null,
    insuranceReminderDays: input.insuranceReminderDays ?? [],
    lastTechnicalInspectionDate: input.lastTechnicalInspectionDate ?? null,
    nextTechnicalInspectionDate: input.nextTechnicalInspectionDate ?? null,
    technicalInspectionReminderDays: input.technicalInspectionReminderDays ?? [],
    vignetteExpiryDate: input.vignetteExpiryDate ?? null,
    vignetteReminderDays: input.vignetteReminderDays ?? [],
    maintenanceNotes: input.maintenanceNotes ?? null,
  };
}
