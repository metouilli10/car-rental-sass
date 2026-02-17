import { prisma } from "@/lib/prisma";
import { DashboardActionStrip, type ActiveRentalForWhatsApp } from "./DashboardActionStrip";
import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { FlatIcon, type FlatIconName } from "@/components/shared/flat-icon";

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

function getYesterdayBounds() {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

interface KpiCardDef {
  label: string;
  value: number;
  flatIcon: FlatIconName;
  accentBorder: string;
  iconBg: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  subtitle?: string;
}

function KpiCard({ kpi }: { kpi: KpiCardDef }) {
  return (
    <div
      className={`relative rounded-2xl p-card-padding bg-white shadow-sm overflow-hidden border-l ${kpi.accentBorder} transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-md`}
    >
      {/* Top row — icon + trend */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`h-14 w-14 rounded-full ${kpi.iconBg} flex items-center justify-center transition-transform duration-200`}
        >
          <FlatIcon name={kpi.flatIcon} size={30} />
        </div>

        {kpi.trend && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors duration-200 ${
              kpi.trend.isUp
                ? "bg-emerald-50/60 text-emerald-600/90"
                : "bg-red-50/40 text-red-600/80"
            }`}
          >
            {kpi.trend.isUp ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5" />
            )}
            {kpi.trend.isUp ? "+" : ""}
            {kpi.trend.value}% vs hier
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-[2.5rem] font-bold text-foreground tracking-tight leading-none">
        {kpi.value}
      </p>

      {/* Label */}
      <p className="text-[13px] font-medium text-muted-foreground/65 mt-3">
        {kpi.label}
      </p>

      {/* Subtitle */}
      {kpi.subtitle && (
        <p className="text-xs text-muted-foreground/55 mt-1">
          {kpi.subtitle}
        </p>
      )}
    </div>
  );
}

export async function DashboardHeader({ agencyId }: DashboardHeaderProps) {
  const { start: todayStart, end: todayEnd } = getTodayBounds();
  const { start: yesterdayStart, end: yesterdayEnd } = getYesterdayBounds();

  const [
    activeRentals,
    sortiesToday,
    retoursToday,
    impayesCount,
    vehiclesRented,
    sortiesYesterday,
    retoursYesterday,
  ] = await Promise.all([
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
    prisma.vehicle.count({
      where: {
        agencyId,
        status: "RENTED",
      },
    }),
    prisma.booking.count({
      where: {
        agencyId,
        startDate: { gte: yesterdayStart, lte: yesterdayEnd },
      },
    }),
    prisma.booking.count({
      where: {
        agencyId,
        endDate: { gte: yesterdayStart, lte: yesterdayEnd },
      },
    }),
  ]);

  const serialized: ActiveRentalForWhatsApp[] = activeRentals.map((r) => ({
    id: r.id,
    customer: r.customer,
    vehicle: r.vehicle,
  }));

  function calcTrend(today: number, yesterday: number) {
    if (yesterday === 0) return undefined;
    const pct = Math.round(((today - yesterday) / yesterday) * 100);
    return { value: Math.abs(pct), isUp: pct >= 0 };
  }

  const totalVehicles = await prisma.vehicle.count({ where: { agencyId } });
  const utilPct = totalVehicles > 0 ? Math.round((vehiclesRented / totalVehicles) * 100) : 0;

  const kpis: KpiCardDef[] = [
    {
      label: "Sorties aujourd'hui",
      value: sortiesToday,
      flatIcon: "sortie",
      accentBorder: "border-l-emerald-400",
      iconBg: "bg-emerald-100",
      trend: calcTrend(sortiesToday, sortiesYesterday),
      subtitle: "Départs prévus",
    },
    {
      label: "Retours aujourd'hui",
      value: retoursToday,
      flatIcon: "rental-car",
      accentBorder: "border-l-blue-400",
      iconBg: "bg-blue-100",
      trend: calcTrend(retoursToday, retoursYesterday),
      subtitle: "Retours attendus",
    },
    {
      label: "Impayés",
      value: impayesCount,
      flatIcon: "late-payment",
      accentBorder: impayesCount > 0 ? "border-l-amber-400" : "border-l-gray-300",
      iconBg: impayesCount > 0 ? "bg-amber-100" : "bg-gray-100",
      subtitle: impayesCount > 0 ? "Action requise" : "Tout est en ordre",
    },
    {
      label: "Véhicules en location",
      value: vehiclesRented,
      flatIcon: "car",
      accentBorder: "border-l-sky-400",
      iconBg: "bg-sky-100",
      subtitle: `${utilPct}% du parc utilisé`,
    },
  ];

  return (
    <>
      {/* Header + actions */}
      <header>
        <div className="flex items-center gap-3 overflow-x-auto md:overflow-visible transition-opacity duration-200">
          <DashboardActionStrip activeRentals={serialized} />
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-card-gap mt-12">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
    </>
  );
}
