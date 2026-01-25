import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/bookings/booking-form";
import { createBooking } from "@/lib/actions/bookings";

export default async function CreateBookingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [customers, vehicles] = await Promise.all([
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
        status: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle réservation"
        description="Créer une nouvelle réservation de véhicule"
      />

      <BookingForm
        customers={customers}
        vehicles={vehicles}
        onSubmit={createBooking}
      />
    </div>
  );
}
