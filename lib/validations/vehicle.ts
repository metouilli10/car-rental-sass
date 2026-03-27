import { z } from "zod";

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const optionalPositiveInt = z.coerce
  .number()
  .int()
  .min(0)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const vehicleSchema = z.object({
  make: z.string().min(1, "La marque est requise"),
  model: z.string().min(1, "Le modèle est requis"),
  year: z.coerce
    .number()
    .min(1900, "Année invalide")
    .max(new Date().getFullYear() + 1, "Année invalide"),
  plate: z.string().min(1, "La plaque d'immatriculation est requise"),
  color: z.string().min(1, "La couleur est requise"),
  pricePerDay: z.coerce.number().min(0, "Le prix doit être positif"),
  depositAmount: z.coerce.number().min(0, "La caution doit être positive"),
  gearbox: z.enum(["MANUAL", "AUTO"]),
  fuelType: z.enum(["DIESEL", "ESSENCE", "HYBRID", "ELECTRIC"]),
  mileage: z.coerce.number().min(0, "Le kilométrage doit être positif").optional(),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE", "UNAVAILABLE"]),
  photoUrl: z.string().optional(),

  // ── Maintenance: oil change ───────────────────────────────────────────────
  currentKm: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
  lastOilChangeMileageKm: optionalPositiveInt,
  lastOilChangeDate: optionalDate,
  oilChangeIntervalKm: z.coerce
    .number()
    .int()
    .min(1000, "L'intervalle doit être au minimum 1 000 km")
    .max(30000, "L'intervalle doit être au maximum 30 000 km")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  oilChangeIntervalMonths: z.coerce
    .number()
    .int()
    .min(1)
    .max(24)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  nextOilChangeMileageKm: optionalPositiveInt,
  nextOilChangeDate: optionalDate,

  // ── Insurance ─────────────────────────────────────────────────────────────
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceStartDate: optionalDate,
  insuranceExpiryDate: optionalDate,
  insuranceReminderDays: z.array(z.number()).optional().default([30, 15, 7]),

  // ── Visite technique ──────────────────────────────────────────────────────
  lastTechnicalInspectionDate: optionalDate,
  nextTechnicalInspectionDate: optionalDate,
  technicalInspectionReminderDays: z.array(z.number()).optional().default([30, 15, 7]),

  // ── Vignette ──────────────────────────────────────────────────────────────
  vignetteExpiryDate: optionalDate,
  vignetteReminderDays: z.array(z.number()).optional().default([30, 15, 7]),

  // ── General ───────────────────────────────────────────────────────────────
  maintenanceNotes: z.string().optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
