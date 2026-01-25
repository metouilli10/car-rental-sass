import { z } from "zod";

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
  mileage: z.coerce.number().min(0, "Le kilométrage doit être positif").optional(),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE"]),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
