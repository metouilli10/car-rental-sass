import { z } from "zod";

export const agencyProfileSchema = z.object({
  name: z.string().trim().min(1, "Le nom de l'agence est requis"),
  city: z.string().trim().min(1, "La ville est requise"),
  address: z.string().trim().optional().or(z.literal("")),
  rcNumber: z.string().trim().optional().or(z.literal("")),
  logoUrl: z.string().trim().optional().or(z.literal("")),
});

export type AgencyProfileFormData = z.infer<typeof agencyProfileSchema>;
