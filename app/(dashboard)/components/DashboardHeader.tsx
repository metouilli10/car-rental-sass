import { prisma } from "@/lib/prisma";
import { DashboardActionStrip, type ActiveRentalForWhatsApp } from "./DashboardActionStrip";

interface DashboardHeaderProps {
  agencyId: string;
}

function getTodayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function DashboardHeader({ agencyId }: DashboardHeaderProps) {
  const { start: todayStart, end: todayEnd } = getTodayBounds();

  const [activeRentals, sortiesToday, retoursToday, impayesCount] =
    await Promise.all([
      prisma.booking.findMany({
    where: {
      agencyId,
      status: "ACTIVE",
    },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      vehicle: {
        select: {
          make: true,
          model: true,
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
    take: 5,
  }),
      prisma.booking.count({
        where: {
          agencyId,
          startDate: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.booking.count({
        where: {
          agencyId,
          endDate: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.payment.count({
        where: {
          booking: { agencyId },
          status: "PENDING",
        },
      }),
    ]);

  const serialized: ActiveRentalForWhatsApp[] = activeRentals.map((r) => ({
    id: r.id,
    customer: r.customer,
    vehicle: r.vehicle,
  }));

  return (
    <>
      {/* Header container — no buttons here */}
      <header className="px-6 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d&apos;ensemble en temps réel de votre agence
        </p>
        <p className="text-sm font-medium text-foreground mt-2">
          Aujourd&apos;hui : {sortiesToday} sortie{sortiesToday !== 1 ? "s" : ""} · {retoursToday} retour{retoursToday !== 1 ? "s" : ""} · {impayesCount} impayé{impayesCount !== 1 ? "s" : ""}
        </p>
      </header>

      {/* Action strip — separate div below header, inside main content */}
      <div className="bg-muted/30 border-b -mx-8 px-8 py-3">
        <div className="flex items-center gap-3 overflow-x-auto md:overflow-visible py-1">
          <DashboardActionStrip activeRentals={serialized} />
        </div>
      </div>
    </>
  );
}
