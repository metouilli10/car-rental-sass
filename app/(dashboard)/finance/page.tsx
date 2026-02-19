import { endOfMonth, startOfMonth } from "date-fns";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { FinanceView } from "@/components/finance/FinanceView";

export default async function FinancePage() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const agencyId = session.user.agencyId;
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const expenseDelegate = (prisma as unknown as { expense?: any }).expense;

  const paymentDateInMonthFilter = {
    OR: [
      { paidAt: { gte: monthStart, lte: monthEnd } },
      {
        AND: [
          { paidAt: null },
          { createdAt: { gte: monthStart, lte: monthEnd } },
        ],
      },
    ],
  };

  const [
    incomes,
    deposits,
    expenses,
    vehicles,
    revenueAgg,
    expensesAgg,
    depositsHeldAgg,
    cashIncomeAgg,
    cashExpenseAgg,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: { booking: { agencyId } },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        paidAt: true,
        createdAt: true,
        booking: {
          select: {
            customer: { select: { name: true } },
            vehicle: { select: { make: true, model: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.deposit.findMany({
      where: { booking: { agencyId } },
      select: {
        id: true,
        amount: true,
        status: true,
        heldAt: true,
        returnedAt: true,
        booking: {
          select: {
            customer: { select: { name: true } },
            vehicle: { select: { make: true, model: true } },
          },
        },
      },
      orderBy: { heldAt: "desc" },
      take: 300,
    }),
    expenseDelegate
      ? expenseDelegate.findMany({
          where: { agencyId },
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
          take: 300,
        })
      : Promise.resolve([]),
    prisma.vehicle.findMany({
      where: { agencyId },
      select: { id: true, make: true, model: true, plate: true },
      orderBy: [{ make: "asc" }, { model: "asc" }],
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "PAID",
        ...paymentDateInMonthFilter,
      },
      _sum: { amount: true },
    }),
    expenseDelegate
      ? expenseDelegate.aggregate({
          where: {
            agencyId,
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
    prisma.deposit.aggregate({
      where: {
        booking: { agencyId },
        status: "HELD",
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "PAID",
        type: "CASH",
        ...paymentDateInMonthFilter,
      },
      _sum: { amount: true },
    }),
    expenseDelegate
      ? expenseDelegate.aggregate({
          where: {
            agencyId,
            method: "CASH",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
  ]);

  const revenueMonth = revenueAgg._sum.amount ?? 0;
  const expensesMonth = Number(expensesAgg._sum.amount ?? 0);
  const netProfit = revenueMonth - expensesMonth;
  const depositsHeld = depositsHeldAgg._sum.amount ?? 0;
  const cashIncome = cashIncomeAgg._sum.amount ?? 0;
  const cashExpense = Number(cashExpenseAgg._sum.amount ?? 0);
  const cashInHand = cashIncome - cashExpense;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Suivez revenus, charges et cautions en un seul endroit"
      />

      <FinanceView
        kpis={{
          revenueMonth,
          expensesMonth,
          netProfit,
          cashInHand,
          depositsHeld,
        }}
        incomes={incomes.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          type: payment.type,
          status: payment.status,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
          customerName: payment.booking.customer.name,
          vehicleName: `${payment.booking.vehicle.make} ${payment.booking.vehicle.model}`,
        }))}
        expenses={expenses.map((expense: any) => ({
          ...expense,
          amount: Number(expense.amount),
        }))}
        deposits={deposits.map((deposit) => ({
          id: deposit.id,
          amount: deposit.amount,
          status: deposit.status,
          heldAt: deposit.heldAt,
          returnedAt: deposit.returnedAt,
          customerName: deposit.booking.customer.name,
          vehicleName: `${deposit.booking.vehicle.make} ${deposit.booking.vehicle.model}`,
        }))}
        vehicles={vehicles}
      />
    </div>
  );
}
