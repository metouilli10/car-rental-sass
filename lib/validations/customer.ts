import { z } from "zod";

const dateOptional = z
  .string()
  .optional()
  .transform((s) => {
    if (!s || s.trim() === "") return undefined;
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  });

export const customerTypeEnum = z.enum(["PERSONNE_PHYSIQUE", "PERSONNE_MORALE"]);

export const customerSchema = z
  .object({
    customerType: customerTypeEnum.default("PERSONNE_PHYSIQUE"),
    name: z.string().min(1, "Le nom est requis"),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    phone: z.string().min(1, "Le téléphone est requis"),
    passportOrCIN: z.string().optional(),
    passportOrCINExpiry: dateOptional,
    passportPhotoUrl: z.string().optional(),
    licensePhotoUrl: z.string().optional(),
    // Personne morale
    ice: z.string().optional(),
    rc: z.string().optional(),
    representativeName: z.string().optional(),
    address: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.customerType === "PERSONNE_PHYSIQUE") {
      if (!data.passportOrCIN?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le passeport/CIN est requis",
          path: ["passportOrCIN"],
        });
      }
    }
    if (data.customerType === "PERSONNE_MORALE") {
      if (!data.ice?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'ICE est requis pour une personne morale",
          path: ["ice"],
        });
      }
    }
  });

export type CustomerFormData = z.infer<typeof customerSchema>;
