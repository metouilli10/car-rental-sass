import { z } from "zod";

export const registerOwnerSchema = z
  .object({
    name: z.string().trim().min(2, "Le nom est requis"),
    email: z.string().trim().email("Email invalide"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
      });
    }
  });

export type RegisterOwnerFormData = z.infer<typeof registerOwnerSchema>;
