import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatWhatsAppLink } from "@/lib/utils";
import { DashboardPeriod, getPeriodBounds } from "@/lib/dashboard-periods";
import { PriorityActionsClient } from "./PriorityActionsClient";
import type { PriorityActionItem } from "./PriorityActionsList";

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

const REMINDER_LABELS: Record<string, string> = {
  OIL_CHANGE: "Vidange à prévoir",
  INSURANCE_EXPIRY: "Assurance à renouveler",
  TECH_INSPECTION: "Visite technique à prévoir",
  VIGNETTE: "Vignette à renouveler",
};

export async function PriorityActions({ agencyId, period }: PriorityActionsProps) {
  const now = new Date();
  const { end } = getPeriodBounds(period, now);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [overdueBookings, unpaidPayments, depositsToRelease, reminderNotifications] =
    await Promise.all([
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
        orderBy: { createdAt: "desc" },
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
      prisma.notification.findMany({
        where: {
          agencyId,
          status: "OPEN",
          severity: { in: ["WARNING", "DUE"] },
        },
        include: {
          vehicle: { select: { id: true, make: true, model: true, plate: true } },
        },
        orderBy: [{ severity: "desc" }, { updatedAt: "asc" }],
        take: 3,
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
    ...reminderNotifications.map((notif) => ({
      id: `rappel-${notif.id}`,
      type: "rappel" as const,
      clientName: REMINDER_LABELS[notif.type] ?? notif.title,
      vehicleName: `${notif.vehicle.make} ${notif.vehicle.model}`,
      plate: notif.vehicle.plate,
      detailsHref: `/notifications`,
      actionLabel: "Voir",
      actionHref: `/notifications`,
      dueLabel: notif.body,
      stripeColor: notif.severity === "DUE" ? "bg-red-500" : "bg-violet-500",
    })),
  ].slice(0, 10);

  return (
    <PriorityActionsClient actions={rows} />
  );
}
