import { redirect } from "next/navigation";
import { BookingPaymentStatus } from "@prisma/client";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/bookings/booking-form";
import { createBooking } from "@/lib/actions/bookings";

export default async function CreateBookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    customerId?: string;
    vehicleId?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const prefilledCustomerId = params.customerId;
  const prefilledVehicleId = params.vehicleId;
  const prefilledStartAt = parseDayKeyToDatetimeLocal(params.start, 9);
  const prefilledEndAt = parseDayKeyToDatetimeLocal(params.end, 9);

  const [customers, vehicles, locations, customerBookingStats, customerUnpaidStats, activeBookings] =
    await Promise.all([
    prisma.customer.findMany({
      where: { agencyId: session.user.agencyId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    }),
    prisma.vehicle.findMany({
      where: { agencyId: session.user.agencyId },
      orderBy: { make: "asc" },
      select: {
        id: true,
        make: true,
        model: true,
        plate: true,
        pricePerDay: true,
        depositAmount: true,
        category: true,
        status: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        agencyId: session.user.agencyId,
        OR: [{ pickupLocation: { not: null } }, { returnLocation: { not: null } }],
      },
      select: {
        pickupLocation: true,
        returnLocation: true,
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.groupBy({
      by: ["customerId"],
      where: { agencyId: session.user.agencyId },
      _count: { _all: true },
      _max: { endDate: true },
    }),
    prisma.booking.groupBy({
      by: ["customerId"],
      where: {
        agencyId: session.user.agencyId,
        paymentStatus: { in: [BookingPaymentStatus.PENDING, BookingPaymentStatus.PARTIAL] },
        status: { not: "CANCELED" },
      },
      _count: { _all: true },
    }),
    prisma.booking.findMany({
      where: {
        agencyId: session.user.agencyId,
        status: { notIn: ["CANCELED", "COMPLETED"] },
      },
      select: {
        id: true,
        vehicleId: true,
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  const statsByCustomer = new Map(
    customerBookingStats.map((item) => [
      item.customerId,
      { bookingCount: item._count._all, lastBookingAt: item._max.endDate },
    ]),
  );
  const unpaidByCustomer = new Map(
    customerUnpaidStats.map((item) => [item.customerId, item._count._all]),
  );

  const customersWithInsights = customers.map((customer) => {
    const baseStats = statsByCustomer.get(customer.id);
    const unpaidCount = unpaidByCustomer.get(customer.id) ?? 0;
    const bookingCount = baseStats?.bookingCount ?? 0;

    return {
      ...customer,
      bookingCount,
      lastBookingAt: baseStats?.lastBookingAt ?? null,
      unpaidCount,
      isVip: bookingCount >= 5,
      isBlacklisted: unpaidCount >= 3,
    };
  });

  const locationSet = new Set<string>();
  for (const row of locations) {
    if (row.pickupLocation) locationSet.add(row.pickupLocation);
    if (row.returnLocation) locationSet.add(row.returnLocation);
  }
  ["Agence", "Aéroport", "Centre-ville"].forEach((loc) => locationSet.add(loc));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle réservation"
        description="Créer une nouvelle réservation de véhicule"
      />

      <BookingForm
        customers={customersWithInsights}
        vehicles={vehicles}
        locationOptions={Array.from(locationSet)}
        activeBookings={activeBookings}
        prefilledVehicleId={prefilledVehicleId}
        prefilledCustomerId={prefilledCustomerId}
        prefilledStartAt={prefilledStartAt}
        prefilledEndAt={prefilledEndAt}
        onSubmit={createBooking}
      />
    </div>
  );
}

function parseDayKeyToDatetimeLocal(dayKey: string | undefined, hour: number): string | undefined {
  if (!dayKey) return undefined;
  const [yearRaw, monthRaw, dayRaw] = dayKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return undefined;
  }

  const monthValue = `${month}`.padStart(2, "0");
  const dayValue = `${day}`.padStart(2, "0");
  const hourValue = `${hour}`.padStart(2, "0");

  return `${year}-${monthValue}-${dayValue}T${hourValue}:00`;
}
