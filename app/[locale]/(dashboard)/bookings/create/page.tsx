import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/bookings/booking-form";
import { createBooking } from "@/lib/actions/bookings";
import { getBookingFormOptions } from "@/lib/bookings/form-options";
import { createPerfLogger } from "@/lib/perf";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

export default async function CreateBookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    customerId?: string;
    vehicleId?: string;
    start?: string;
    end?: string;
    pickupLocation?: string;
    returnLocation?: string;
    notes?: string;
    bookingRequestId?: string;
  }>;
}) {
  const perf = createPerfLogger("booking-create-page");
  const session = await getSession();
  perf.step("session-loaded", { hasSession: Boolean(session?.user) });

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const prefilledCustomerId = params.customerId;
  const prefilledVehicleId = params.vehicleId;
  const prefilledStartAt = parseDayKeyToDatetimeLocal(params.start, 9);
  const prefilledEndAt = parseDayKeyToDatetimeLocal(params.end, 9);
  const prefilledPickupLocation = params.pickupLocation;
  const prefilledReturnLocation = params.returnLocation;
  const prefilledNotes =
    params.bookingRequestId && params.notes
      ? `[Demande web ${params.bookingRequestId}] ${params.notes}`
      : params.bookingRequestId
        ? `[Demande web ${params.bookingRequestId}]`
        : params.notes;
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
        description="Créer une nouvelle réservation de véhicule"
      />

      <BookingForm
        customers={customers}
        vehicles={vehicles}
        locationOptions={locationOptions}
        activeBookings={activeBookings}
        prefilledVehicleId={prefilledVehicleId}
        prefilledCustomerId={prefilledCustomerId}
        prefilledStartAt={prefilledStartAt}
        prefilledEndAt={prefilledEndAt}
        prefilledPickupLocation={prefilledPickupLocation}
        prefilledReturnLocation={prefilledReturnLocation}
        prefilledNotes={prefilledNotes}
        prefilledBookingRequestId={params.bookingRequestId}
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
