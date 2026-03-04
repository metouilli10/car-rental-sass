import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { BookingsControlCenter, type BookingListItem } from "@/components/bookings/bookings-control-center";
import { buildBookingRiskSummary, summarizeCustomerRiskHistory } from "@/lib/bookings/risk";
import type { Prisma } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 25;

interface BookingsPageProps {
  searchParams: Promise<{
    page?: string;
    clientId?: string;
    customerId?: string;
    filter?: string;
  }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect("/login");
    }

    const agencyId = session.user.agencyId;
    if (!agencyId) {
      redirect("/setup");
    }

    const params = await searchParams;
    const page = Math.max(1, Number(params.page) || 1);
    const selectedClientId = params.clientId || params.customerId;
    const filter = params.filter;
    const now = new Date();
    const today = new Date();

    const where: Prisma.BookingWhereInput = {
      agencyId,
      ...(selectedClientId ? { customerId: selectedClientId } : {}),
      ...(filter === "unpaid"
        ? {
            paymentStatus: { in: ["PENDING", "PARTIAL"] },
            status: { not: "CANCELED" },
          }
        : {}),
      ...(filter === "late"
        ? {
            status: { notIn: ["COMPLETED", "CANCELED"] },
            endDate: { lt: now },
          }
        : {}),
    };

    const [bookings, total, selectedCustomer] = await Promise.all([
    prisma.booking.findMany({
      where,
      select: {
        id: true,
        vehicleId: true,
        customerId: true,
        paymentStatus: true,
        paidNow: true,
        remainingAmount: true,
        startDate: true,
        endDate: true,
        actualReturnDate: true,
        totalPrice: true,
        depositAmount: true,
        depositStatus: true,
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
          where: { id: selectedClientId, agencyId },
          select: { name: true },
        })
      : null,
  ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const bookingIds = bookings.map((booking) => booking.id);
    const vehicleIds = Array.from(new Set(bookings.map((booking) => booking.vehicleId)));
    const customerIds = Array.from(new Set(bookings.map((booking) => booking.customerId)));

    const minStartDate =
      bookings.length > 0
        ? bookings.reduce(
            (minDate, booking) =>
              booking.startDate < minDate ? booking.startDate : minDate,
            bookings[0].startDate
          )
        : null;
    const maxEndDate =
      bookings.length > 0
        ? bookings.reduce(
            (maxDate, booking) => (booking.endDate > maxDate ? booking.endDate : maxDate),
            bookings[0].endDate
          )
        : null;

    const [overlapCandidates, customerHistoryRows] = await Promise.all([
      vehicleIds.length > 0 && minStartDate && maxEndDate
        ? prisma.booking.findMany({
            where: {
              agencyId,
              vehicleId: { in: vehicleIds },
              status: { notIn: ["CANCELED", "COMPLETED"] },
              startDate: { lte: maxEndDate },
              endDate: { gte: minStartDate },
            },
            select: {
              id: true,
              vehicleId: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          })
        : Promise.resolve([]),
      customerIds.length > 0
        ? prisma.booking.findMany({
            where: {
              agencyId,
              customerId: { in: customerIds },
              ...(bookingIds.length > 0 ? { id: { notIn: bookingIds } } : {}),
            },
            select: {
              id: true,
              customerId: true,
              endDate: true,
              actualReturnDate: true,
              status: true,
              _count: {
                select: {
                  infractions: true,
                },
              },
              damageReports: {
                where: {
                  inspectionType: "RETOUR",
                },
                orderBy: {
                  reportedAt: "desc",
                },
                take: 1,
                select: {
                  depositAction: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const historyByCustomerId = new Map<string, (typeof customerHistoryRows)[number][]>();

    for (const historyRow of customerHistoryRows) {
      const current = historyByCustomerId.get(historyRow.customerId);
      if (current) {
        current.push(historyRow);
      } else {
        historyByCustomerId.set(historyRow.customerId, [historyRow]);
      }
    }

    // Serialize to plain JSON-safe shape so client never gets non-serializable values
    const bookingsData: BookingListItem[] = bookings.map((b) => ({
      ...b,
      startDate: b.startDate instanceof Date ? b.startDate.toISOString() : b.startDate,
      endDate: b.endDate instanceof Date ? b.endDate.toISOString() : b.endDate,
      actualReturnDate:
        b.actualReturnDate instanceof Date
          ? b.actualReturnDate.toISOString()
          : b.actualReturnDate,
      risk: buildBookingRiskSummary({
        booking: {
          id: b.id,
          customerId: b.customerId,
          vehicleId: b.vehicleId,
          startDate: b.startDate,
          endDate: b.endDate,
          status: b.status,
          depositStatus: b.depositStatus,
          depositRecordStatus: b.deposit?.status ?? null,
        },
        overlapCandidates,
        customerHistory: summarizeCustomerRiskHistory({
          bookings: (historyByCustomerId.get(b.customerId) ?? []).map((historyRow) => ({
            status: historyRow.status,
            infractionCount: historyRow._count.infractions,
            returnDepositAction: historyRow.damageReports[0]?.depositAction ?? null,
            hasReturnInspection: historyRow.damageReports.length > 0,
          })),
        }),
        today,
      }),
    }));

    return (
    <div className="space-y-8">
      <PageHeader
        title={
          selectedCustomer
            ? `Réservations > ${selectedCustomer.name}`
            : filter === "unpaid"
              ? "Réservations à encaisser"
              : filter === "late"
                ? "Retours en retard"
                : "Réservations"
        }
        description={
          filter === "unpaid"
            ? "Retrouvez les dossiers avec un solde restant à encaisser."
            : filter === "late"
              ? "Suivez les réservations qui dépassent leur date de retour."
              : "Gérez toutes vos réservations"
        }
        action={{
          label: "Nouvelle réservation",
          href: "/bookings/create",
        }}
      />

      {bookings.length === 0 && page === 1 ? (
        <div className="text-center py-16 rounded-2xl bg-white shadow-card">
          <p className="text-muted-foreground mb-4">
            {filter === "unpaid"
              ? "Aucun dossier à encaisser"
              : filter === "late"
                ? "Aucun retour en retard"
                : "Créez votre première réservation."}
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
            searchParams={{
              ...(selectedClientId ? { clientId: selectedClientId } : {}),
              ...(filter ? { filter } : {}),
            }}
          />
        </div>
      )}
    </div>
    );
  } catch (err) {
    console.error("BookingsPage error:", err);
    throw err;
  }
}
