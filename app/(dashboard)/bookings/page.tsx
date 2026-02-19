import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { BookingsControlCenter, type BookingListItem } from "@/components/bookings/bookings-control-center";
import Link from "next/link";

const PAGE_SIZE = 25;

interface BookingsPageProps {
  searchParams: Promise<{ page?: string; clientId?: string; customerId?: string }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const selectedClientId = params.clientId || params.customerId;

  const where = {
    agencyId: session.user.agencyId,
    ...(selectedClientId ? { customerId: selectedClientId } : {}),
  };

  const [bookings, total, selectedCustomer] = await Promise.all([
    prisma.booking.findMany({
      where,
      select: {
        id: true,
        paymentStatus: true,
        paidNow: true,
        remainingAmount: true,
        startDate: true,
        endDate: true,
        totalPrice: true,
        depositAmount: true,
        status: true,
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, make: true, model: true, plate: true } },
        deposit: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
    selectedClientId
      ? prisma.customer.findFirst({
          where: { id: selectedClientId, agencyId: session.user.agencyId },
          select: { name: true },
        })
      : null,
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const bookingsData: BookingListItem[] = bookings;

  return (
    <div className="space-y-8">
      <PageHeader
        title={selectedCustomer ? `Réservations > ${selectedCustomer.name}` : "Réservations"}
        description="Gérez toutes vos réservations"
        action={{
          label: "Nouvelle réservation",
          href: "/bookings/create",
        }}
      />

      {bookings.length === 0 && page === 1 ? (
        <div className="text-center py-16 rounded-2xl bg-white shadow-card">
          <p className="text-muted-foreground mb-4">
            Aucune réservation enregistrée
          </p>
          <Button asChild>
            <Link href="/bookings/create">Créer votre première réservation</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <BookingsControlCenter bookings={bookingsData} role={session.user.role} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/bookings"
            searchParams={selectedClientId ? { clientId: selectedClientId } : {}}
          />
        </div>
      )}
    </div>
  );
}
