import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/bookings/booking-form";
import { createBooking } from "@/lib/actions/bookings";
import { getBookingFormOptions } from "@/lib/bookings/form-options";
import { createPerfLogger } from "@/lib/perf";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

interface NewReservationPageProps {
  searchParams: Promise<{ vehicleId?: string }>;
}

export default async function NewReservationPage({
  searchParams,
}: NewReservationPageProps) {
  const perf = createPerfLogger("reservation-new-page");
  const session = await getSession();
  perf.step("session-loaded", { hasSession: Boolean(session?.user) });

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const { customers, vehicles, locationOptions, activeBookings } = await getBookingFormOptions({
    agencyId: session.user.agencyId,
  });
  perf.end({
    customers: customers.length,
    vehicles: vehicles.length,
    activeBookings: activeBookings.length,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle réservation"
        description="Assistant étape par étape pour créer une réservation"
      />

      <BookingForm
        customers={customers}
        vehicles={vehicles}
        locationOptions={locationOptions}
        activeBookings={activeBookings}
        prefilledVehicleId={params.vehicleId}
        onSubmit={createBooking}
      />
    </div>
  );
}
