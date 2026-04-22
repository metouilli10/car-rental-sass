import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { BookingsControlCenter, type BookingListItem } from "@/components/bookings/bookings-control-center";
import { buildBookingRiskSummary, summarizeCustomerRiskHistory } from "@/lib/bookings/risk";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { createPerfLogger } from "@/lib/perf";
import { getMessages, interpolate } from "@/lib/i18n/messages";
import { isValidLocale, withLocalePath, type AppLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const preferredRegion = "fra1";

const PAGE_SIZE = 25;
const BOOKINGS_RISK_CACHE_SECONDS = 30;

const getBookingsRiskContext = unstable_cache(
  async (
    agencyId: string,
    bookingIdsKey: string,
    vehicleIdsKey: string,
    customerIdsKey: string,
    minStartIso: string,
    maxEndIso: string
  ) => {
    const bookingIds = bookingIdsKey ? bookingIdsKey.split(",") : [];
    const vehicleIds = vehicleIdsKey ? vehicleIdsKey.split(",") : [];
    const customerIds = customerIdsKey ? customerIdsKey.split(",") : [];

    const [overlapCandidates, customerHistoryRows] = await Promise.all([
      vehicleIds.length > 0
        ? prisma.booking.findMany({
            where: {
              agencyId,
              vehicleId: { in: vehicleIds },
              status: { notIn: ["CANCELED", "COMPLETED"] },
              startDate: { lte: new Date(maxEndIso) },
              endDate: { gte: new Date(minStartIso) },
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

    return { overlapCandidates, customerHistoryRows };
  },
  ["bookings-risk-context"],
  { revalidate: BOOKINGS_RISK_CACHE_SECONDS }
);

interface BookingsPageProps {
  searchParams: Promise<{
    page?: string;
    clientId?: string;
    customerId?: string;
    filter?: string;
    q?: string;
    status?: string;
    vehicleId?: string;
  }>;
  params: Promise<{ locale: string }>;
}

export default async function BookingsPage({ searchParams, params }: BookingsPageProps) {
  const { locale: localeParam } = await params;
  const locale: AppLocale = isValidLocale(localeParam) ? localeParam : "fr";
  const ui = getMessages(locale);
  const lp = (path: string) => withLocalePath(locale, path);

  const perf = createPerfLogger("bookings-page");
  try {
    const session = await getSession();
    perf.step("session-loaded", { hasSession: Boolean(session?.user) });

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
    const searchQuery = params.q?.trim() || "";
    const vehicleId = params.vehicleId?.trim() || "";
    const statusFilter = params.status?.trim() || "";
    const now = new Date();
    const today = new Date();

    const where: Prisma.BookingWhereInput = {
      agencyId,
      ...(selectedClientId ? { customerId: selectedClientId } : {}),
      ...(vehicleId ? { vehicleId } : {}),
      ...(searchQuery
        ? {
            OR: [
              { customer: { name: { contains: searchQuery, mode: "insensitive" } } },
              { customer: { phone: { contains: searchQuery } } },
              { vehicle: { make: { contains: searchQuery, mode: "insensitive" } } },
              { vehicle: { model: { contains: searchQuery, mode: "insensitive" } } },
              { vehicle: { plate: { contains: searchQuery, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(statusFilter && statusFilter !== "OVERDUE"
        ? { status: statusFilter as Prisma.EnumBookingStatusFilter }
        : {}),
      ...(statusFilter === "OVERDUE"
        ? {
            status: { notIn: ["COMPLETED", "CANCELED"] },
            endDate: { lt: now },
          }
        : {}),
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
          bookingRequest: {
            select: {
              id: true,
              source: true,
            },
          },
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
    perf.step("base-queries-loaded", { bookings: bookings.length, total });

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

    const { overlapCandidates, customerHistoryRows } =
      vehicleIds.length > 0 && minStartDate && maxEndDate
        ? await getBookingsRiskContext(
            agencyId,
            bookingIds.join(","),
            vehicleIds.join(","),
            customerIds.join(","),
            minStartDate.toISOString(),
            maxEndDate.toISOString()
          )
        : { overlapCandidates: [], customerHistoryRows: [] };
    perf.step("risk-context-loaded", {
      overlapCandidates: overlapCandidates.length,
      customerHistoryRows: customerHistoryRows.length,
    });

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

    perf.end({ rendered: bookingsData.length });

    const title = selectedCustomer
      ? interpolate(ui.bookingsPage.titleWithCustomer, { name: selectedCustomer.name })
      : filter === "unpaid"
        ? ui.bookingsPage.titleUnpaid
        : filter === "late"
          ? ui.bookingsPage.titleLate
          : ui.bookingsPage.titleDefault;

    const description =
      filter === "unpaid"
        ? ui.bookingsPage.descUnpaid
        : filter === "late"
          ? ui.bookingsPage.descLate
          : ui.bookingsPage.descDefault;

    return (
    <div className="space-y-8">
      <PageHeader
        title={title}
        description={description}
        action={{
          label: ui.bookingsPage.newBooking,
          href: lp("/bookings/create"),
        }}
      />

      {bookings.length === 0 && page === 1 ? (
        <div className="text-center py-16 rounded-2xl bg-white shadow-card">
          <p className="text-muted-foreground mb-4">
            {filter === "unpaid"
              ? ui.bookingsPage.emptyUnpaid
              : filter === "late"
                ? ui.bookingsPage.emptyLate
                : ui.bookingsPage.emptyDefault}
          </p>
          <Button asChild>
            <Link href={lp("/bookings/create")}>{ui.bookingsPage.createFirstCta}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <BookingsControlCenter
            bookings={bookingsData}
            role={session.user.role}
            defaultSearch={searchQuery}
            defaultStatusFilter={
              statusFilter === "CONFIRMED" ||
              statusFilter === "ACTIVE" ||
              statusFilter === "COMPLETED" ||
              statusFilter === "CANCELED" ||
              statusFilter === "OVERDUE"
                ? statusFilter
                : "ALL"
            }
            defaultVehicleFilter={vehicleId || "ALL"}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={lp("/bookings")}
            searchParams={{
              ...(searchQuery ? { q: searchQuery } : {}),
              ...(statusFilter ? { status: statusFilter } : {}),
              ...(vehicleId ? { vehicleId } : {}),
              ...(selectedClientId ? { clientId: selectedClientId } : {}),
              ...(filter ? { filter } : {}),
            }}
          />
        </div>
      )}
    </div>
    );
  } catch (err) {
    perf.end({ failed: true });
    console.error("BookingsPage error:", err);
    throw err;
  }
}
