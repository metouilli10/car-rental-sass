import { prisma } from "@/lib/prisma";
import { CashFlowSummary } from "./CashFlowSummary";
import { format } from "date-fns";

export async function CashFlowSummaryWrapper({ agencyId }: { agencyId: string }) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    // Payments received today
    paymentsToday,

    // Deposits received today
    depositsReceivedToday,

    // Deposits returned today
    depositsReturnedToday,

    // Refunds today
    refundsToday,
  ] = await Promise.all([
    // Rental payments received today
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "PAID",
        paidAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    }),

    // Deposits received today (held at)
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: "HELD",
        heldAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { heldAt: "desc" },
    }),

    // Deposits returned today
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: { in: ["RETURNED", "PARTIAL_RETURNED"] },
        returnedAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { returnedAt: "desc" },
    }),

    // Refunds today
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "REFUNDED",
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // Calculate totals
  const entreesPayments = paymentsToday.reduce((sum, p) => sum + p.amount, 0);
  const entreesDeposits = depositsReceivedToday.reduce((sum, d) => sum + d.amount, 0);
  const entrees = entreesPayments + entreesDeposits;

  const sortiesDeposits = depositsReturnedToday.reduce((sum, d) => sum + d.amount, 0);
  const sortiesRefunds = refundsToday.reduce((sum, p) => sum + p.amount, 0);
  const sorties = sortiesDeposits + sortiesRefunds;

  // Build transactions array
  const transactions = [
    ...paymentsToday.map((p) => ({
      id: p.id,
      type: "in" as const,
      category: "payment" as const,
      amount: p.amount,
      customerName: p.booking.customer.name,
      time: format(new Date(p.paidAt!), "HH:mm"),
    })),
    ...depositsReceivedToday.map((d) => ({
      id: d.id,
      type: "in" as const,
      category: "deposit_received" as const,
      amount: d.amount,
      customerName: d.booking.customer.name,
      time: format(new Date(d.heldAt), "HH:mm"),
    })),
    ...depositsReturnedToday.map((d) => ({
      id: d.id,
      type: "out" as const,
      category: "deposit_returned" as const,
      amount: d.amount,
      customerName: d.booking.customer.name,
      time: format(new Date(d.returnedAt!), "HH:mm"),
    })),
    ...refundsToday.map((p) => ({
      id: p.id,
      type: "out" as const,
      category: "refund" as const,
      amount: p.amount,
      customerName: p.booking.customer.name,
      time: format(new Date(p.updatedAt), "HH:mm"),
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)); // Sort by time descending

  return (
    <CashFlowSummary
      entrees={entrees}
      sorties={sorties}
      transactions={transactions}
    />
  );
}
