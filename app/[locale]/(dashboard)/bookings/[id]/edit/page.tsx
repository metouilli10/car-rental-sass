import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { ReservationCreatePage } from "@/components/bookings/reservation-create-page";
import type { BookingFormData } from "@/lib/validations/booking";
import { getBookingFormOptions } from "@/lib/bookings/form-options";
import { createPerfLogger } from "@/lib/perf";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

function toDatetimeLocal(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const perf = createPerfLogger("booking-edit-page");
  const session = await getSession();
  perf.step("session-loaded", { hasSession: Boolean(session?.user) });

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

  const { customers, vehicles, locationOptions, activeBookings } = await getBookingFormOptions({
    agencyId: session.user.agencyId,
    excludeBookingId: bookingId,
  });
  perf.end({
    customers: customers.length,
    vehicles: vehicles.length,
    activeBookings: activeBookings.length,
  });

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
        customers={customers}
        vehicles={vehicles}
        locationOptions={locationOptions}
        activeBookings={activeBookings}
        bookingId={bookingId}
        initialData={initialData}
        submitLabel="Enregistrer les modifications"
        showDraft={false}
      />
    </div>
  );
}
