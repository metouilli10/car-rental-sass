"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { ExpenseCategory, PaymentType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { getEffectivePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  expenseSchema,
  listExpensesFiltersSchema,
  type ExpenseFormData,
  type ListExpensesFilters,
} from "@/lib/validations/expense";

type ExpenseResult = { success: true; expenseId: string } | { error: string };
type DeleteExpenseResult = { success: true } | { error: string };

export type ExpenseListItem = {
  id: string;
  date: Date;
  category: ExpenseCategory;
  amount: number;
  method: PaymentType;
  note: string | null;
  receiptUrl: string | null;
  vehicle: { id: string; make: string; model: string; plate: string } | null;
};

function getExpenseDelegate() {
  return (prisma as unknown as { expense?: any }).expense;
}

function toDateOrThrow(value: string, field: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Date invalide pour ${field}`);
  }
  return parsed;
}

export async function createExpense(data: ExpenseFormData): Promise<ExpenseResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Non autorise");
  }

  const permissions = getEffectivePermissions(session.user.role, session.user.permissions);
  if (!permissions["finance.view"] && !permissions["caisse.view"]) {
    return { error: "Acces refuse: droits finance ou caisse requis" };
  }

  try {
    const expenseDelegate = getExpenseDelegate();
    if (!expenseDelegate) {
      return { error: "Le module des charges n'est pas encore initialise" };
    }

    const validated = expenseSchema.parse(data);

    if (validated.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: validated.vehicleId, agencyId: session.user.agencyId },
        select: { id: true },
      });

      if (!vehicle) {
        return { error: "Vehicule introuvable pour cette agence" };
      }
    }

    const created = await expenseDelegate.create({
      data: {
        agencyId: session.user.agencyId,
        date: toDateOrThrow(validated.date, "date"),
        category: validated.category,
        amount: validated.amount,
        method: validated.method,
        vehicleId: validated.vehicleId ?? null,
        note: validated.note ?? null,
        receiptUrl: validated.receiptUrl ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/finance");
    revalidatePath("/payments");
    revalidatePath("/caisse");

    return { success: true, expenseId: created.id };
  } catch (error) {
    console.error("createExpense error:", error);
    return { error: "Erreur lors de la creation de la charge" };
  }
}

export async function listExpenses(filters: ListExpensesFilters = {}): Promise<ExpenseListItem[]> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Non autorise");
  }

  const permissions = getEffectivePermissions(session.user.role, session.user.permissions);
  if (!permissions["finance.view"] && !permissions["caisse.view"]) {
    return [];
  }

  const expenseDelegate = getExpenseDelegate();
  if (!expenseDelegate) {
    return [];
  }

  const validated = listExpensesFiltersSchema.parse(filters);
  const fromDate = validated.from ? toDateOrThrow(validated.from, "from") : undefined;
  const toDate = validated.to ? toDateOrThrow(validated.to, "to") : undefined;

  const where = {
    agencyId: session.user.agencyId,
    ...(validated.category ? { category: validated.category } : {}),
    ...(validated.vehicleId ? { vehicleId: validated.vehicleId } : {}),
    ...(validated.method ? { method: validated.method } : {}),
    ...(fromDate || toDate
      ? {
          date: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {}),
  };

  const rows = await expenseDelegate.findMany({
    where,
    select: {
      id: true,
      date: true,
      category: true,
      amount: true,
      method: true,
      note: true,
      receiptUrl: true,
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          plate: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    ...(validated.limit ? { take: validated.limit } : {}),
  });

  return rows.map((row: any) => ({
    ...row,
    amount: Number(row.amount),
  }));
}

export async function deleteExpense(id: string): Promise<DeleteExpenseResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Non autorise");
  }

  const permissions = getEffectivePermissions(session.user.role, session.user.permissions);
  if (!permissions["finance.view"] && !permissions["caisse.view"]) {
    return { error: "Acces refuse: droits finance ou caisse requis" };
  }

  try {
    const expenseDelegate = getExpenseDelegate();
    if (!expenseDelegate) {
      return { error: "Le module des charges n'est pas encore initialise" };
    }

    const target = await expenseDelegate.findFirst({
      where: { id, agencyId: session.user.agencyId },
      select: { id: true },
    });

    if (!target) {
      return { error: "Charge introuvable" };
    }

    await expenseDelegate.delete({ where: { id } });
    revalidatePath("/finance");
    revalidatePath("/payments");
    return { success: true };
  } catch (error) {
    console.error("deleteExpense error:", error);
    return { error: "Erreur lors de la suppression de la charge" };
  }
}
