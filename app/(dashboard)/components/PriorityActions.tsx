import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatWhatsAppLink } from "@/lib/utils";
import { DashboardPeriod, getPeriodBounds, getPeriodLabel } from "@/lib/dashboard-periods";
import { PriorityActionsClient, type PriorityActionItem } from "./PriorityActionsClient";

interface PriorityActionsProps {
  agencyId: string;
  period: DashboardPeriod;
}

const sanitizePhoneForCall = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.startsWith("212")
    ? `+${cleaned}`
    : `+212${cleaned.startsWith("0") ? cleaned.slice(1) : cleaned}`;
};

export async function PriorityActions({ agencyId, period }: PriorityActionsProps) {
  const now = new Date();
  const { end } = getPeriodBounds(period, now);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [overdueBookings, unpaidPayments, depositsToRelease] = await Promise.all([
    prisma.booking.findMany({
      where: {
        agencyId,
        status: "ACTIVE",
        endDate: { lt: todayStart, lte: end },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { make: true, model: true, plate: true } },
      },
      orderBy: { endDate: "asc" },
      take: 6,
    }),
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "PENDING",
        createdAt: { lte: end },
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true, phone: true } },
            vehicle: { select: { make: true, model: true, plate: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId, status: "COMPLETED" },
        status: "HELD",
        heldAt: { lte: end },
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true, phone: true } },
            vehicle: { select: { make: true, model: true, plate: true } },
          },
        },
      },
      orderBy: { heldAt: "asc" },
      take: 6,
    }),
  ]);

  const rows: PriorityActionItem[] = [
    ...overdueBookings.map((booking) => ({
      id: `retard-${booking.id}`,
      type: "retard" as const,
      clientName: booking.customer.name,
      vehicleName: `${booking.vehicle.make} ${booking.vehicle.model}`,
      plate: booking.vehicle.plate,
      amountText: formatCurrency(booking.totalPrice),
      detailsHref: `/bookings/${booking.id}`,
      actionLabel: "Ouvrir",
      actionHref: `/bookings/${booking.id}`,
      phoneHref: `tel:${sanitizePhoneForCall(booking.customer.phone)}`,
      waLink: formatWhatsAppLink(
        booking.customer.phone,
        `Bonjour ${booking.customer.name}, votre retour de véhicule est attendu. Merci de nous contacter.`
      ),
      dueLabel: `Retour prévu le ${formatDate(booking.endDate)}`,
      stripeColor: "bg-red-500",
    })),
    ...unpaidPayments.map((payment) => ({
      id: `paiement-${payment.id}`,
      type: "paiement" as const,
      clientName: payment.booking.customer.name,
      vehicleName: `${payment.booking.vehicle.make} ${payment.booking.vehicle.model}`,
      plate: payment.booking.vehicle.plate,
      amountText: formatCurrency(payment.amount),
      detailsHref: `/bookings/${payment.booking.id}`,
      actionLabel: "Encaisser",
      actionHref: "/payments",
      phoneHref: `tel:${sanitizePhoneForCall(payment.booking.customer.phone)}`,
      waLink: formatWhatsAppLink(
        payment.booking.customer.phone,
        `Bonjour ${payment.booking.customer.name}, rappel de paiement en attente (${formatCurrency(payment.amount)}).`
      ),
      dueLabel: "Paiement en attente",
      stripeColor: "bg-amber-500",
    })),
    ...depositsToRelease.map((deposit) => ({
      id: `caution-${deposit.id}`,
      type: "caution" as const,
      clientName: deposit.booking.customer.name,
      vehicleName: `${deposit.booking.vehicle.make} ${deposit.booking.vehicle.model}`,
      plate: deposit.booking.vehicle.plate,
      amountText: formatCurrency(deposit.amount),
      detailsHref: `/bookings/${deposit.bookingId}`,
      actionLabel: "Libérer",
      actionHref: `/bookings/${deposit.bookingId}`,
      phoneHref: `tel:${sanitizePhoneForCall(deposit.booking.customer.phone)}`,
      waLink: formatWhatsAppLink(
        deposit.booking.customer.phone,
        `Bonjour ${deposit.booking.customer.name}, votre caution est prête à être libérée.`
      ),
      dueLabel: `Retenue depuis le ${formatDate(deposit.heldAt)}`,
      stripeColor: "bg-blue-500",
    })),
  ].slice(0, 8);

  return (
    <PriorityActionsClient
      periodLabel={getPeriodLabel(period)}
      actions={rows}
    />
  );
}
