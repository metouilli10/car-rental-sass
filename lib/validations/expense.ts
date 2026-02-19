import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

export const expenseCategorySchema = z.enum([
  "MAINTENANCE",
  "CARBURANT",
  "NETTOYAGE",
  "ASSURANCE",
  "TAXES",
  "SALAIRES",
  "LOYER",
  "MARKETING",
  "AUTRE",
]);

export const expenseMethodSchema = z.enum(["CASH", "CARD", "TRANSFER"]);

export const expenseSchema = z.object({
  date: z.string().min(1, "La date est requise"),
  category: expenseCategorySchema,
  amount: z.coerce.number().positive("Le montant doit etre superieur a 0"),
  method: expenseMethodSchema,
  vehicleId: optionalString,
  note: optionalString,
  receiptUrl: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    })
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: "Le lien du justificatif doit commencer par http:// ou https://",
    }),
});

export const listExpensesFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  category: expenseCategorySchema.optional(),
  vehicleId: optionalString,
  method: expenseMethodSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type ListExpensesFilters = z.infer<typeof listExpensesFiltersSchema>;
