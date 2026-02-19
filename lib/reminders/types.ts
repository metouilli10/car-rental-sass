import type {
  ReminderType,
  NotificationSeverity,
  NotificationStatus,
} from "@prisma/client";

export type { ReminderType, NotificationSeverity, NotificationStatus };

export interface ReminderComputeVehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
  // Mileage
  currentKm: number | null;
  lastOilChangeMileageKm: number | null;
  lastOilChangeDate: Date | null;
  oilChangeIntervalKm: number | null;
  oilChangeIntervalMonths: number | null;
  nextOilChangeMileageKm: number | null;
  nextOilChangeDate: Date | null;
  // Insurance
  insuranceExpiryDate: Date | null;
  insuranceReminderDays: number[];
  // Visite technique
  nextTechnicalInspectionDate: Date | null;
  technicalInspectionReminderDays: number[];
  // Vignette
  vignetteExpiryDate: Date | null;
  vignetteReminderDays: number[];
}

export interface ReminderRuleDefaults {
  type: ReminderType;
  enabled: boolean;
  leadDays: number[];
  leadKm: number[];
}

export const DEFAULT_LEAD_DAYS = [30, 15, 7];
export const DEFAULT_LEAD_KM = [500, 100, 0];
