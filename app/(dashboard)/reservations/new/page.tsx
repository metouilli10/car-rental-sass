import { redirect } from "next/navigation";
import { BookingPaymentStatus, BookingStatus } from "@prisma/client";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/bookings/booking-form";
import { createBooking } from "@/lib/actions/bookings";

interface NewReservationPageProps {
  searchParams: Promise<{ vehicleId?: string }>;
}

export default async function NewReservationPage({
  searchParams,
}: NewReservationPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

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
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
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
        description="Assistant étape par étape pour créer une réservation"
      />

      <BookingForm
        customers={customersWithInsights}
        vehicles={vehicles}
        locationOptions={Array.from(locationSet)}
        activeBookings={activeBookings}
        prefilledVehicleId={params.vehicleId}
        onSubmit={createBooking}
      />
    </div>
  );
}
