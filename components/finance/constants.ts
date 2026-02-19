import type { ExpenseCategory, PaymentType } from "@prisma/client";

export const expenseCategoryLabel: Record<ExpenseCategory, string> = {
  MAINTENANCE: "Maintenance",
  CARBURANT: "Carburant",
  NETTOYAGE: "Nettoyage",
  ASSURANCE: "Assurance",
  TAXES: "Taxes",
  SALAIRES: "Salaires",
  LOYER: "Loyer",
  MARKETING: "Marketing",
  AUTRE: "Autre",
};

export const paymentMethodLabel: Record<PaymentType, string> = {
  CASH: "Especes",
  CARD: "Carte",
  TRANSFER: "Virement",
  CMI: "CMI",
  OTHER: "Autre",
};
