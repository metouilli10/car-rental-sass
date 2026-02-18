import Link from "next/link";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

interface MonthlyOverviewProps {
  agencyId: string;
}
const sectionIconClass = "h-5 w-5 shrink-0";

export async function MonthlyOverview({ agencyId }: MonthlyOverviewProps) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthRevenue, monthBookings, monthCompletedBookings] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        booking: { agencyId },
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.booking.count({
      where: {
        agencyId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.booking.count({
      where: {
        agencyId,
        status: "COMPLETED",
        updatedAt: { gte: startOfMonth },
      },
    }),
  ]);

  const completionRate =
    monthBookings > 0 ? Math.round((monthCompletedBookings / monthBookings) * 100) : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Ce mois</h3>
          <p className="text-xs text-muted-foreground">Performance commerciale et exécution</p>
        </div>
        <TrendingUpRoundedIcon className={`${sectionIconClass} text-muted-foreground`} />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Chiffre d&apos;affaires</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {formatCurrency(monthRevenue._sum.amount ?? 0)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/bookings"
            className="rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarMonthRoundedIcon className="h-4 w-4 text-muted-foreground" />
              <p>Réservations</p>
            </div>
            <p className="mt-1 text-xl font-semibold text-slate-900">{monthBookings}</p>
          </Link>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <TaskAltRoundedIcon className="h-4 w-4 text-muted-foreground" />
              <p>Complétées</p>
            </div>
            <p className="mt-1 text-xl font-semibold text-slate-900">{monthCompletedBookings}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-slate-600">Taux de complétion</p>
            <p className="text-sm font-semibold text-slate-900">{completionRate}%</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-200"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
