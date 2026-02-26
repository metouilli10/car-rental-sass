import { z } from "zod";

export const infractionTypeSchema = z.enum([
  "SPEEDING",
  "PARKING",
  "RED_LIGHT",
  "TOLL",
  "OTHER",
]);

export const infractionStatusSchema = z.enum([
  "PENDING",
  "ASSIGNED",
  "PAID",
  "CONTESTED",
]);

export const infractionSchema = z.object({
  vehicleId: z.string().min(1, "Le véhicule est requis"),
  date: z.string().min(1, "La date est requise"),
  time: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  type: infractionTypeSchema.default("OTHER"),
  amount: z.coerce
    .number()
    .min(0, "Le montant doit être positif")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  // Set by match UI, not typed manually
  bookingId: z.string().optional(),
  customerId: z.string().optional(),
  clientName: z.string().optional(),
  clientCin: z.string().optional(),
  clientPhone: z.string().optional(),
});

export type InfractionFormData = z.infer<typeof infractionSchema>;

export const updateInfractionStatusSchema = z.object({
  status: infractionStatusSchema,
});

export const assignInfractionSchema = z.object({
  infractionId: z.string().min(1),
  bookingId: z.string().min(1),
});
