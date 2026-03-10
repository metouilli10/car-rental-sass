import { z } from "zod";

export const vehicleDocumentTypes = [
  "INSURANCE",
  "TECHNICAL_INSPECTION",
  "VIGNETTE",
  "REGISTRATION",
] as const;

export type VehicleDocumentTypeValue = (typeof vehicleDocumentTypes)[number];

const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const vehicleDocumentSchema = z.object({
  type: z.enum(vehicleDocumentTypes),
  reference: z.string().max(200).optional(),
  startDate: optionalDate,
  expiryDate: optionalDate,
  fileUrl: z.string().url().optional().or(z.literal("")).transform((value) => value || undefined),
});

export type VehicleDocumentFormData = z.infer<typeof vehicleDocumentSchema>;
