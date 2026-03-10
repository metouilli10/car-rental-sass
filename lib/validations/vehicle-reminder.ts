import { z } from "zod";

const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

const optionalNumber = z.coerce
  .number()
  .int()
  .min(0)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const vehicleReminderSchema = z.object({
  nextOilChangeDate: optionalDate,
  nextOilChangeMileageKm: optionalNumber,
  insuranceExpiryDate: optionalDate,
  nextTechnicalInspectionDate: optionalDate,
  vignetteExpiryDate: optionalDate,
  maintenanceNotes: z.string().max(1000).optional(),
});

export type VehicleReminderFormData = z.infer<typeof vehicleReminderSchema>;
