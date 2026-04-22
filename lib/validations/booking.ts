import { z } from "zod";

const addonSchema = z.object({
  label: z.string().min(1, "Nom d'option requis"),
  quantity: z.coerce.number().int().min(1, "Quantité invalide"),
  unitAmount: z.coerce.number().min(0, "Montant invalide"),
  isDefault: z.boolean().optional(),
});

export const bookingSchema = z.object({
  bookingRequestId: z.string().optional(),
  customerId: z.string().min(1, "Le client est requis"),
  vehicleId: z.string().min(1, "Le véhicule est requis"),
  startDate: z.string().min(1, "La date/heure de départ est requise"),
  endDate: z.string().min(1, "La date/heure de retour est requise"),
  pickupLocation: z.string().optional(),
  returnLocation: z.string().optional(),
  pricePerDay: z.coerce.number().min(0, "Le prix doit être positif"),
  pricingDays: z.coerce.number().min(0, "Durée invalide"),
  pricingHours: z.coerce.number().int().min(0, "Durée invalide"),
  addonsTotal: z.coerce.number().min(0, "Total options invalide"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).nullable().optional(),
  discountValue: z.coerce.number().min(0, "Remise invalide"),
  discountAmount: z.coerce.number().min(0, "Remise invalide"),
  taxEnabled: z.boolean(),
  taxRate: z.coerce.number().min(0, "TVA invalide"),
  totalHt: z.coerce.number().min(0, "Montant HT invalide"),
  totalTva: z.coerce.number().min(0, "Montant TVA invalide"),
  totalTtc: z.coerce.number().min(0, "Montant TTC invalide"),
  totalPrice: z.coerce.number().min(0, "Le total doit être positif"), // compat legacy
  paidNow: z.coerce.number().min(0, "Le montant payé doit être positif"),
  remainingAmount: z.coerce.number().min(0, "Le reste à payer doit être positif"),
  depositAmount: z.coerce.number().min(0, "La caution doit être positive"),
  paymentType: z.enum(["CASH", "CARD", "TRANSFER", "CMI", "OTHER"], {
    required_error: "Le mode de paiement est requis",
  }),
  status: z.enum(["DRAFT", "CONFIRMED", "ACTIVE"], {
    required_error: "Le statut est requis",
  }),
  addons: z.array(addonSchema).default([]),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  {
    message: "La date de fin doit être après la date de début",
    path: ["endDate"],
  }
).refine(
  (data) => data.paidNow <= data.totalTtc,
  {
    message: "Le montant payé ne peut pas dépasser le total TTC",
    path: ["paidNow"],
  }
).refine(
  (data) => Math.abs((data.totalTtc - data.paidNow) - data.remainingAmount) < 0.01,
  {
    message: "Le reste à payer est incohérent",
    path: ["remainingAmount"],
  }
);

export type BookingFormData = z.infer<typeof bookingSchema>;
