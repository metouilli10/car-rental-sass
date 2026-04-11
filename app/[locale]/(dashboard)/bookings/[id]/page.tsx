import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ReservationDetailsHeader } from "@/components/reservations/ReservationDetailsHeader";
import { ReservationContractPanel } from "@/components/reservations/ReservationContractPanel";
import { ReservationFinancialSummaryCard } from "@/components/reservations/ReservationFinancialSummaryCard";
import { ReservationNotesCard } from "@/components/reservations/ReservationNotesCard";
import {
  ReservationAlertCard,
  ReservationClientCard,
  ReservationDetailsCard,
  ReservationInspectionsCard,
  ReservationProgressCard,
  ReservationVehicleCard,
} from "@/components/reservations/ReservationDetailCards";
import {
  buildReservationFinanceRows,
  buildReservationStatusSummary,
  calculateDurationDays,
  getReservationAttentionAlert,
} from "@/lib/reservations/details";
import { formatDateFR } from "@/lib/reservations/presentation";
import { canDelete } from "@/lib/authz";
import { isValidLocale, type AppLocale } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

type BookingDetailData = Awaited<ReturnType<typeof getBookingDetailData>>;

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id, locale: localeParam } = await params;
  const locale: AppLocale = isValidLocale(localeParam) ? localeParam : "fr";

  const booking = await getBookingDetailData(id, session.user.agencyId);

  if (!booking || booking.agencyId !== session.user.agencyId) {
    notFound();
  }

  const code = booking.id.slice(0, 8);
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const durationDays = calculateDurationDays(startDate, endDate);
  const customerPhone = booking.customer.phone?.trim() ?? "";
  const customerWhatsappPhone = customerPhone.replace(/\D/g, "");

  const whatsappMessage = encodeURIComponent(
    `Bonjour ${booking.customer.name},\n\nConcernant votre réservation du ${formatDate(
      booking.startDate
    )} au ${formatDate(booking.endDate)} pour le véhicule ${booking.vehicle.make} ${
      booking.vehicle.model
    } (${booking.vehicle.plate}).\n\nCordialement,\n${session.user.agencyName ?? ""}`
  );
  const whatsappLink = customerWhatsappPhone
    ? `https://wa.me/${customerWhatsappPhone}?text=${whatsappMessage}`
    : null;

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const hasDepartInspection = booking.damageReports.some((report) => report.inspectionType === "DEPART");
  const hasReturnInspection = booking.damageReports.some((report) => report.inspectionType === "RETOUR");
  const attentionAlert = getReservationAttentionAlert({
    status: booking.status,
    endDate,
    damageReports: booking.damageReports.map((report) => ({
      inspectionType: report.inspectionType,
      reportedAt: report.reportedAt,
    })),
  });
  const statusSummary = buildReservationStatusSummary({
    status: booking.status,
    totalPrice: booking.totalPrice,
    paidNow: booking.paidNow,
    paymentStatus: booking.paymentStatus,
    depositAmount: booking.depositAmount,
    deposit: booking.deposit
      ? {
          status: booking.deposit.status,
        }
      : null,
    bookingDepositStatus: booking.depositStatus,
  });
  const financeRows = buildReservationFinanceRows({
    totalPrice: booking.totalPrice,
    totalHt: booking.totalHt ?? 0,
    totalTva: booking.totalTva ?? 0,
    taxEnabled: booking.taxEnabled ?? false,
    discountAmount: booking.discountAmount ?? 0,
    addons: booking.addons,
  });
  const paymentMethods = booking.payments
    .filter((payment) => payment.category === "RENTAL" && payment.status === "PAID")
    .map((payment) => payment.type);
  return (
    <div className="space-y-5 pb-6">
      <ReservationDetailsHeader
        bookingId={booking.id}
        code={code}
        status={booking.status}
        startDate={booking.startDate}
        endDate={booking.endDate}
        durationDays={durationDays}
        vehicle={{
          id: booking.vehicle.id,
          make: booking.vehicle.make,
          model: booking.vehicle.model,
          plate: booking.vehicle.plate,
        }}
        customer={{ id: booking.customer.id, name: booking.customer.name }}
        canCancel={canDelete(session.user.role)}
        canDelete={session.user.role === "OWNER"}
        endDateForExtend={booking.endDate}
        pricePerDay={booking.pricePerDay}
      />

      <ReservationProgressCard status={booking.status} createdAt={booking.createdAt} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)] xl:items-start xl:gap-5">
        <div className="space-y-4 xl:space-y-5">
          <ReservationAlertCard bookingId={booking.id} alert={attentionAlert} locale={locale} />

          <div className="xl:hidden">
            <ReservationFinancialSummaryCard
              bookingId={booking.id}
              customerName={booking.customer.name}
              vehicleLabel={`${booking.vehicle.make} ${booking.vehicle.model}`}
              plate={booking.vehicle.plate}
              totalPrice={booking.totalPrice}
              pricePerDay={booking.pricePerDay}
              durationDays={durationDays}
              paidNow={booking.paidNow}
              remainingAmount={booking.remainingAmount}
              depositAmount={booking.depositAmount}
              paymentStatus={booking.paymentStatus}
              paymentStatusLabel={statusSummary.payment.label}
              paymentStatusVariant={statusSummary.payment.variant}
              depositStatusLabel={statusSummary.deposit.label}
              depositStatusVariant={statusSummary.deposit.variant}
              deposit={
                booking.deposit
                  ? {
                      id: booking.deposit.id,
                      amount: Number(booking.deposit.amount),
                      status: booking.deposit.status,
                    }
                  : null
              }
              bookingDepositStatus={booking.depositStatus}
              breakdownRows={financeRows}
              paymentMethods={paymentMethods}
            />
          </div>

          <ReservationClientCard
            customerId={booking.customer.id}
            name={booking.customer.name}
            phone={customerPhone || null}
            whatsappLink={whatsappLink}
            locale={locale}
            history={{
              totalRentals: booking.customer.bookings.filter((item) => item.status !== "CANCELED").length,
              averageDurationDays:
                booking.customer.bookings.filter((item) => item.status !== "CANCELED").length > 0
                  ? Math.round(
                      (booking.customer.bookings
                        .filter((item) => item.status !== "CANCELED")
                        .reduce(
                          (sum, item) => sum + calculateDurationDays(item.startDate, item.endDate),
                          0
                        ) /
                        booking.customer.bookings.filter((item) => item.status !== "CANCELED").length) *
                        10
                    ) / 10
                  : 0,
              totalGenerated: 0,
              incidents: 0,
              lastVehicle: null,
            }}
          />

          <ReservationVehicleCard
            vehicleId={booking.vehicle.id}
            make={booking.vehicle.make}
            model={booking.vehicle.model}
            plate={booking.vehicle.plate}
            color={booking.vehicle.color ?? "—"}
            status={booking.vehicle.status}
            gearbox={booking.vehicle.gearbox}
            locale={locale}
          />

          <ReservationDetailsCard
            startDate={startDate}
            endDate={endDate}
            durationDays={durationDays}
            pickupLocation={booking.pickupLocation}
            returnLocation={booking.returnLocation}
          />

          <div className="xl:hidden space-y-4">
            <ReservationInspectionsCard
              bookingId={booking.id}
              hasDepart={hasDepartInspection}
              hasRetour={hasReturnInspection}
              showCreateAction={!hasDepartInspection || !hasReturnInspection}
              isReturnPending={!hasReturnInspection && endDate <= todayEnd && booking.status !== "CANCELED"}
              locale={locale}
            />

            <ReservationNotesCard bookingId={booking.id} initialNotes={booking.notes} />

          </div>

          <ReservationContractPanel
            bookingId={booking.id}
            contractImageUrl={booking.contractImageUrl}
            contractSignedAt={booking.contractSignedAt?.toISOString() ?? null}
          />
        </div>

        <aside className="hidden xl:block xl:space-y-5">
          <ReservationFinancialSummaryCard
            bookingId={booking.id}
            customerName={booking.customer.name}
            vehicleLabel={`${booking.vehicle.make} ${booking.vehicle.model}`}
            plate={booking.vehicle.plate}
            totalPrice={booking.totalPrice}
            pricePerDay={booking.pricePerDay}
            durationDays={durationDays}
            paidNow={booking.paidNow}
            remainingAmount={booking.remainingAmount}
            depositAmount={booking.depositAmount}
            paymentStatus={booking.paymentStatus}
            paymentStatusLabel={statusSummary.payment.label}
            paymentStatusVariant={statusSummary.payment.variant}
            depositStatusLabel={statusSummary.deposit.label}
            depositStatusVariant={statusSummary.deposit.variant}
            deposit={
              booking.deposit
                ? {
                    id: booking.deposit.id,
                    amount: Number(booking.deposit.amount),
                    status: booking.deposit.status,
                  }
                : null
            }
            bookingDepositStatus={booking.depositStatus}
            breakdownRows={financeRows}
            paymentMethods={paymentMethods}
          />

          <ReservationInspectionsCard
            bookingId={booking.id}
            hasDepart={hasDepartInspection}
            hasRetour={hasReturnInspection}
            showCreateAction={!hasDepartInspection || !hasReturnInspection}
            isReturnPending={!hasReturnInspection && endDate <= todayEnd && booking.status !== "CANCELED"}
            locale={locale}
          />

          <ReservationNotesCard bookingId={booking.id} initialNotes={booking.notes} />
        </aside>
      </div>
    </div>
  );
}

async function getBookingDetailData(id: string, agencyId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        agencyId: true,
        startDate: true,
        endDate: true,
        pricePerDay: true,
        totalPrice: true,
        depositAmount: true,
        status: true,
        paymentStatus: true,
        depositStatus: true,
        notes: true,
        pickupLocation: true,
        returnLocation: true,
        totalHt: true,
        totalTva: true,
        taxEnabled: true,
        discountAmount: true,
        paidNow: true,
        remainingAmount: true,
        contractImageUrl: true,
        contractSignedAt: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            bookings: {
              where: { agencyId },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                createdAt: true,
                startDate: true,
                endDate: true,
                totalPrice: true,
                status: true,
                vehicle: {
                  select: {
                    make: true,
                    model: true,
                    plate: true,
                  },
                },
                infractions: {
                  select: { id: true },
                },
                damageReports: {
                  where: { inspectionType: "RETOUR" },
                  select: {
                    inspectionType: true,
                    depositAction: true,
                  },
                },
              },
            },
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            plate: true,
            color: true,
            status: true,
            gearbox: true,
          },
        },
        payments: {
          orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            amount: true,
            type: true,
            category: true,
            status: true,
            paidAt: true,
            createdAt: true,
          },
        },
        deposit: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
        addons: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            label: true,
            unitAmount: true,
            quantity: true,
            totalAmount: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
            bookingId: true,
          },
        },
        damageReports: {
          orderBy: { reportedAt: "desc" },
          select: {
            id: true,
            inspectionType: true,
            reportedAt: true,
          },
        },
      },
    });

    if (booking) {
      return booking;
    }
  } catch (error) {
    console.error("booking-details rich query failed, falling back to lean query", error);
  }

  const fallback = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      agencyId: true,
      startDate: true,
      endDate: true,
      pricePerDay: true,
      totalPrice: true,
      depositAmount: true,
      status: true,
      paymentStatus: true,
      depositStatus: true,
      notes: true,
      pickupLocation: true,
      returnLocation: true,
      paidNow: true,
      remainingAmount: true,
      contractImageUrl: true,
      contractSignedAt: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          plate: true,
          color: true,
          status: true,
          gearbox: true,
        },
      },
      payments: {
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
      },
      deposit: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
      damageReports: {
        orderBy: { reportedAt: "desc" },
        select: {
          id: true,
          inspectionType: true,
          reportedAt: true,
        },
      },
    },
  });

  if (!fallback) {
    return null;
  }

  return {
    ...fallback,
    totalHt: 0,
    totalTva: 0,
    taxEnabled: false,
    discountAmount: 0,
    addons: [],
    customer: {
      ...fallback.customer,
      bookings: [],
    },
  };
}
