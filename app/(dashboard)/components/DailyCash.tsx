import Link from "next/link";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ArrowCircleDownRoundedIcon from "@mui/icons-material/ArrowCircleDownRounded";
import ArrowCircleUpRoundedIcon from "@mui/icons-material/ArrowCircleUpRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

interface DailyCashProps {
  agencyId: string;
}
const sectionIconClass = "h-5 w-5 shrink-0";

export async function DailyCash({ agencyId }: DailyCashProps) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const [paymentsToday, depositsReceivedToday, depositsReturnedToday, refundsToday] =
    await Promise.all([
      prisma.payment.findMany({
        where: {
          booking: { agencyId },
          status: "PAID",
          paidAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          amount: true,
          paidAt: true,
          booking: { select: { customer: { select: { name: true } } } },
        },
      }),
      prisma.deposit.findMany({
        where: {
          booking: { agencyId },
          status: "HELD",
          heldAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          amount: true,
          heldAt: true,
          booking: { select: { customer: { select: { name: true } } } },
        },
      }),
      prisma.deposit.findMany({
        where: {
          booking: { agencyId },
          status: { in: ["RETURNED", "PARTIAL_RETURNED"] },
          returnedAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          amount: true,
          returnedAt: true,
          booking: { select: { customer: { select: { name: true } } } },
        },
      }),
      prisma.payment.findMany({
        where: {
          booking: { agencyId },
          status: "REFUNDED",
          updatedAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          amount: true,
          updatedAt: true,
          booking: { select: { customer: { select: { name: true } } } },
        },
      }),
    ]);

  const entrees = [...paymentsToday, ...depositsReceivedToday].reduce((sum, item) => sum + item.amount, 0);
  const sorties = [...depositsReturnedToday, ...refundsToday].reduce((sum, item) => sum + item.amount, 0);
  const solde = entrees - sorties;

  const transactions = [
    ...paymentsToday.map((item) => ({
      id: item.id,
      label: "Paiement location",
      customer: item.booking.customer.name,
      amount: item.amount,
      type: "in" as const,
      time: format(new Date(item.paidAt ?? now), "HH:mm"),
    })),
    ...depositsReceivedToday.map((item) => ({
      id: item.id,
      label: "Caution reçue",
      customer: item.booking.customer.name,
      amount: item.amount,
      type: "in" as const,
      time: format(new Date(item.heldAt), "HH:mm"),
    })),
    ...depositsReturnedToday.map((item) => ({
      id: item.id,
      label: "Caution remboursée",
      customer: item.booking.customer.name,
      amount: item.amount,
      type: "out" as const,
      time: format(new Date(item.returnedAt ?? now), "HH:mm"),
    })),
    ...refundsToday.map((item) => ({
      id: item.id,
      label: "Remboursement",
      customer: item.booking.customer.name,
      amount: item.amount,
      type: "out" as const,
      time: format(new Date(item.updatedAt), "HH:mm"),
    })),
  ]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 4);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AccountBalanceWalletRoundedIcon className={`${sectionIconClass} text-muted-foreground`} />
            <h3 className="text-sm font-semibold text-slate-900">Caisse du jour</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Flux entrants et sortants d&apos;aujourd&apos;hui</p>
        </div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          <ArrowForwardRoundedIcon className="h-4 w-4" />
          Voir transactions
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <ArrowCircleDownRoundedIcon className={`${sectionIconClass} text-emerald-600`} />
            <p className="text-sm text-slate-600">Entrées</p>
          </div>
          <p className="text-lg font-semibold text-emerald-600 transition-all duration-200">
            +{formatCurrency(entrees)}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <ArrowCircleUpRoundedIcon className={`${sectionIconClass} text-red-600`} />
            <p className="text-sm text-slate-600">Sorties</p>
          </div>
          <p className="text-lg font-semibold text-red-600 transition-all duration-200">
            -{formatCurrency(sorties)}
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 shadow-sm ${
            solde >= 0
              ? "border-emerald-200/60 bg-emerald-50/40"
              : "border-red-200 bg-red-50/40"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solde du jour</p>
          <p className={`mt-1 text-2xl font-semibold tracking-tight ${solde >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            {solde >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(solde))}
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-900">Aucune transaction enregistrée</p>
            <p className="text-xs text-muted-foreground">Les nouveaux mouvements apparaîtront ici.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Derniers mouvements</p>
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{tx.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.label} · {tx.time}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${tx.type === "in" ? "text-emerald-700" : "text-red-700"}`}>
                    {tx.type === "in" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
