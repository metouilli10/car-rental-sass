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

const optionalTrimmedString = z
  .preprocess((value) => {
    if (value == null) return undefined;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().optional())
  .optional();

const optionalAmount = z.preprocess((value) => {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.replace(",", ".");
  }
  return value;
}, z.coerce.number().min(0, "Le montant doit être positif").optional());

export const infractionSchema = z.object({
  vehicleId: z.string().min(1, "Le véhicule est requis"),
  date: z.string().min(1, "La date est requise"),
  time: optionalTrimmedString,
  type: infractionTypeSchema.default("OTHER"),
  amount: optionalAmount,
  notes: optionalTrimmedString,
  // Set by match UI, not typed manually
  bookingId: optionalTrimmedString,
  customerId: optionalTrimmedString,
  clientName: optionalTrimmedString,
  clientCin: optionalTrimmedString,
  clientPhone: optionalTrimmedString,
});

export type InfractionFormData = z.infer<typeof infractionSchema>;

export const updateInfractionStatusSchema = z.object({
  status: infractionStatusSchema,
});

export const assignInfractionSchema = z.object({
  infractionId: z.string().min(1),
  bookingId: z.string().min(1),
});
