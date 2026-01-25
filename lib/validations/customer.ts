import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().min(1, "Le téléphone est requis"),
  passportOrCIN: z.string().min(1, "Le passeport/CIN est requis"),
  passportPhotoUrl: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
