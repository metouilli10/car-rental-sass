import { notFound, redirect } from "next/navigation";
import { BookingPaymentStatus, BookingStatus } from "@prisma/client";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ReservationCreatePage } from "@/components/bookings/reservation-create-page";
import type { BookingFormData } from "@/lib/validations/booking";

function toDatetimeLocal(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id: bookingId } = await params;

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      agencyId: session.user.agencyId,
    },
    include: {
      customer: true,
      vehicle: true,
      addons: true,
    },
  });

  if (!booking) {
    notFound();
  }

  if (booking.status === "COMPLETED" || booking.status === "CANCELED") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Modifier la réservation"
          description="Cette réservation est clôturée ou annulée et ne peut pas être modifiée."
        />
        <p className="text-muted-foreground">
          Seules les réservations en cours (brouillon, confirmée ou active) peuvent être modifiées.
        </p>
      </div>
    );
  }

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
          id: { not: bookingId },
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
    ])
  );
  const unpaidByCustomer = new Map(
    customerUnpaidStats.map((item) => [item.customerId, item._count._all])
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

  const formStatus =
    booking.status === "DRAFT" || booking.status === "CONFIRMED" || booking.status === "ACTIVE"
      ? booking.status
      : "CONFIRMED";

  const initialData: BookingFormData = {
    customerId: booking.customerId,
    vehicleId: booking.vehicleId,
    startDate: toDatetimeLocal(booking.startDate),
    endDate: toDatetimeLocal(booking.endDate),
    pickupLocation: booking.pickupLocation ?? "",
    returnLocation: booking.returnLocation ?? "",
    pricePerDay: booking.pricePerDay,
    pricingDays: booking.pricingDays,
    pricingHours: booking.pricingHours,
    addonsTotal: booking.addonsTotal,
    discountType: booking.discountType,
    discountValue: booking.discountValue,
    discountAmount: booking.discountAmount,
    taxEnabled: booking.taxEnabled,
    taxRate: booking.taxRate,
    totalHt: booking.totalHt,
    totalTva: booking.totalTva,
    totalTtc: booking.totalTtc,
    totalPrice: booking.totalPrice,
    paidNow: booking.paidNow,
    remainingAmount: booking.remainingAmount,
    depositAmount: booking.depositAmount,
    paymentType: "CASH",
    status: formStatus,
    addons:
      booking.addons.length > 0
        ? booking.addons.map((a) => ({
            label: a.label,
            quantity: a.quantity,
            unitAmount: a.unitAmount,
            isDefault: a.isDefault,
          }))
        : [
            {
              label: "Assurance complémentaire",
              quantity: 1,
              unitAmount: 0,
              isDefault: true,
            },
          ],
    notes: booking.notes ?? "",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifier la réservation"
        description="Modifiez les détails de la réservation (dates, véhicule, client, tarification)."
      />

      <ReservationCreatePage
        customers={customersWithInsights}
        vehicles={vehicles}
        locationOptions={Array.from(locationSet)}
        activeBookings={activeBookings}
        bookingId={bookingId}
        initialData={initialData}
        submitLabel="Enregistrer les modifications"
        showDraft={false}
      />
    </div>
  );
}
