import { z } from "zod";

export const bookingSchema = z.object({
  customerId: z.string().min(1, "Le client est requis"),
  vehicleId: z.string().min(1, "Le véhicule est requis"),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
  pricePerDay: z.coerce.number().min(0, "Le prix doit être positif"),
  totalPrice: z.coerce.number().min(0, "Le total doit être positif"),
  depositAmount: z.coerce.number().min(0, "La caution doit être positive"),
  paymentType: z.enum(["CASH", "CARD", "TRANSFER"], {
    required_error: "Le mode de paiement est requis",
  }),
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
);

export type BookingFormData = z.infer<typeof bookingSchema>;
