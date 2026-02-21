import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ReservationDetailsHeader } from "@/components/reservations/ReservationDetailsHeader";
import { ReservationSummarySticky } from "@/components/reservations/ReservationSummarySticky";
import { ReservationPanels } from "@/components/reservations/ReservationPanels";
import {
  ReservationOperationalAlerts,
  buildReservationAlerts,
} from "@/components/reservations/ReservationOperationalAlerts";
import { InspectionsPanel } from "@/components/reservations/InspectionsPanel";
import { ReservationActivity } from "@/components/reservations/ReservationActivity";
import { getDepositStatus, getPaymentStatus, getReservationTone } from "@/lib/reservations/presentation";
import { canDelete } from "@/lib/authz";

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      payments: true,
      deposit: true,
      damageReports: {
        include: {
          damagePhotos: true,
          sections: true,
        },
        orderBy: { reportedAt: "desc" },
      },
    },
  });

  if (!booking || booking.agencyId !== session.user.agencyId) {
    notFound();
  }

  const code = booking.id.slice(0, 8);
  const durationDays = Math.ceil(
    (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const whatsappMessage = encodeURIComponent(
    `Bonjour ${booking.customer.name},\n\nConcernant votre réservation du ${formatDate(
      booking.startDate
    )} au ${formatDate(booking.endDate)} pour le véhicule ${booking.vehicle.make} ${
      booking.vehicle.model
    } (${booking.vehicle.plate}).\n\nCordialement,\n${session.user.agencyName ?? ""}`
  );
  const whatsappLink = `https://wa.me/${booking.customer.phone.replace(/\D/g, "")}?text=${whatsappMessage}`;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const startDateObj = new Date(booking.startDate);
  const isStartToday =
    startDateObj >= todayStart && startDateObj <= todayEnd;

  const depositStatusResult = getDepositStatus(
    booking.depositAmount,
    booking.deposit,
    booking.depositStatus
  );
  const paymentStatusResult = getPaymentStatus(
    booking.paidNow,
    booking.totalPrice,
    booking.paymentStatus
  );
  const statusResult = getReservationTone(booking.status);

  const alerts = buildReservationAlerts({
    remainingAmount: booking.remainingAmount,
    status: booking.status,
    depositStatusLabel: depositStatusResult.label,
    startDate: booking.startDate,
    isStartToday,
  });

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <ReservationDetailsHeader
        bookingId={booking.id}
        code={code}
        status={booking.status}
        startDate={booking.startDate}
        endDate={booking.endDate}
        durationDays={durationDays}
        vehicle={{ make: booking.vehicle.make, model: booking.vehicle.model }}
        customer={{ name: booking.customer.name }}
        canCancel={canDelete(session.user.role)}
        endDateForExtend={booking.endDate}
        pricePerDay={booking.pricePerDay}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6 lg:pr-2">
          <ReservationOperationalAlerts alerts={alerts} />

          <ReservationPanels
            customer={{
              name: booking.customer.name,
              phone: booking.customer.phone,
              email: booking.customer.email ?? null,
              passportOrCIN: booking.customer.passportOrCIN ?? null,
            }}
            vehicle={{
              make: booking.vehicle.make,
              model: booking.vehicle.model,
              plate: booking.vehicle.plate,
              color: booking.vehicle.color,
              status: booking.vehicle.status,
              currentKm: booking.vehicle.currentKm,
              mileage: booking.vehicle.mileage,
              nextOilChangeDate: booking.vehicle.nextOilChangeDate,
              nextMaintenanceKm: booking.vehicle.nextMaintenanceKm,
            }}
            reservation={{
              status: booking.status,
              startDate: booking.startDate,
              endDate: booking.endDate,
              durationDays,
              pickupLocation: booking.pickupLocation,
              returnLocation: booking.returnLocation,
              notes: booking.notes,
            }}
            whatsappLink={whatsappLink}
          />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start lg:min-h-0">
          <ReservationSummarySticky
            totalPrice={booking.totalPrice}
            pricePerDay={booking.pricePerDay}
            durationDays={durationDays}
            paidNow={booking.paidNow}
            remainingAmount={booking.remainingAmount}
            paymentStatus={booking.paymentStatus}
            depositAmount={booking.depositAmount}
            deposit={booking.deposit}
            bookingDepositStatus={booking.depositStatus}
            bookingId={booking.id}
          />
          <InspectionsPanel
            bookingId={booking.id}
            damageReports={booking.damageReports.map((r) => ({
              id: r.id,
              inspectionType: r.inspectionType,
            }))}
            compact
          />
          <ReservationActivity
            createdAt={booking.createdAt}
            statusLabel={statusResult.label}
            paymentLabel={paymentStatusResult.label}
            compact
          />
        </aside>
      </div>
    </div>
  );
}
