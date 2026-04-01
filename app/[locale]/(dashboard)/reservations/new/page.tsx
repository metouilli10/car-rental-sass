import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/bookings/booking-form";
import { createBooking } from "@/lib/actions/bookings";
import { getBookingFormOptions } from "@/lib/bookings/form-options";
import { createPerfLogger } from "@/lib/perf";
import { requireLocaleParam } from "@/lib/i18n/server-params";
import { getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

interface NewReservationPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ vehicleId?: string }>;
}

export default async function NewReservationPage({
  params,
  searchParams,
}: NewReservationPageProps) {
  const locale = await requireLocaleParam(params);
  const ui = getMessages(locale);
  const rn = ui.pageChrome.reservationNew;
  const perf = createPerfLogger("reservation-new-page");
  const session = await getSession();
  perf.step("session-loaded", { hasSession: Boolean(session?.user) });

  if (!session) {
    redirect("/login");
  }

  const sp = await searchParams;
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
      <PageHeader title={rn.title} description={rn.description} />

      <BookingForm
        customers={customers}
        vehicles={vehicles}
        locationOptions={locationOptions}
        activeBookings={activeBookings}
        prefilledVehicleId={sp.vehicleId}
        onSubmit={createBooking}
      />
    </div>
  );
}
