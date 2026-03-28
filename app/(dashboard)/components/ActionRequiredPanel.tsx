import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatPhoneForCall, formatWhatsAppLink } from "@/lib/utils";
import { ActionRequiredClient } from "./ActionRequiredClient";

interface ActionRequiredPanelProps {
  agencyId: string;
}

export type ActionType = "retard" | "paiement" | "caution";
export type SeverityLevel = "critical" | "high" | "medium";

export interface ActionItem {
  id: string;
  type: ActionType;
  // Decomposed identity
  clientName: string;
  vehicleName: string;
  plate: string;
  // Enriched metadata
  bookingId: string;
  delayDays: number | null;
  severity: SeverityLevel;
  dueLabel: string;
  // Amounts
  amount: number;
  amountText: string;
  // Contact
  phone: string | null;
  phoneHref?: string;
  waLink?: string;
  detailsHref: string;
}

export async function ActionRequiredPanel({ agencyId }: ActionRequiredPanelProps) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [overdueBookings, unpaidPayments, depositsToRelease] = await Promise.all([
    prisma.booking.findMany({
      where: {
        agencyId,
        status: "ACTIVE",
        endDate: { lt: todayStart },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { make: true, model: true, plate: true } },
      },
      orderBy: { endDate: "asc" },
      take: 8,
    }),
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "PENDING",
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
      take: 8,
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId, status: "COMPLETED" },
        amount: { gt: 0 },
        status: "HELD",
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
      take: 8,
    }),
  ]);

  const actionItems: ActionItem[] = [
    ...overdueBookings.map((booking) => {
      const delayDays = Math.max(
        0,
        Math.floor(
          (todayStart.getTime() - new Date(booking.endDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const severity: SeverityLevel =
        delayDays > 3 ? "critical" : delayDays >= 1 ? "high" : "medium";

      return {
        id: `retard-${booking.id}`,
        type: "retard" as const,
        bookingId: booking.id,
        clientName: booking.customer.name,
        vehicleName: `${booking.vehicle.make} ${booking.vehicle.model}`,
        plate: booking.vehicle.plate,
        amount: booking.totalPrice,
        amountText: formatCurrency(booking.totalPrice),
        dueLabel: `Retour prévu le ${formatDate(booking.endDate)}`,
        delayDays,
        severity,
        phone: booking.customer.phone ?? null,
        phoneHref: formatPhoneForCall(booking.customer.phone)
          ? `tel:${formatPhoneForCall(booking.customer.phone)}`
          : undefined,
        waLink: formatWhatsAppLink(
          booking.customer.phone,
          `Bonjour ${booking.customer.name}, votre retour de véhicule est en retard de ${delayDays} jour${delayDays > 1 ? "s" : ""}. Merci de nous contacter.`
        ) ?? undefined,
        detailsHref: `/bookings/${booking.id}`,
      };
    }),
    ...unpaidPayments.map((payment) => ({
      id: `paiement-${payment.id}`,
      type: "paiement" as const,
      bookingId: payment.booking.id,
      clientName: payment.booking.customer.name,
      vehicleName: `${payment.booking.vehicle.make} ${payment.booking.vehicle.model}`,
      plate: payment.booking.vehicle.plate,
      amount: payment.amount,
      amountText: formatCurrency(payment.amount),
      dueLabel: "Paiement en attente",
      delayDays: null,
      severity: "high" as const,
      phone: payment.booking.customer.phone ?? null,
      phoneHref: formatPhoneForCall(payment.booking.customer.phone)
        ? `tel:${formatPhoneForCall(payment.booking.customer.phone)}`
        : undefined,
      waLink: formatWhatsAppLink(
        payment.booking.customer.phone,
        `Bonjour ${payment.booking.customer.name}, rappel : paiement en attente (${formatCurrency(payment.amount)}).`
      ) ?? undefined,
      detailsHref: `/payments`,
    })),
    ...depositsToRelease.map((deposit) => ({
      id: `caution-${deposit.id}`,
      type: "caution" as const,
      bookingId: deposit.bookingId,
      clientName: deposit.booking.customer.name,
      vehicleName: `${deposit.booking.vehicle.make} ${deposit.booking.vehicle.model}`,
      plate: deposit.booking.vehicle.plate,
      amount: deposit.amount,
      amountText: formatCurrency(deposit.amount),
      dueLabel: `Retenue depuis le ${formatDate(deposit.heldAt)}`,
      delayDays: null,
      severity: "medium" as const,
      phone: deposit.booking.customer.phone ?? null,
      phoneHref: formatPhoneForCall(deposit.booking.customer.phone)
        ? `tel:${formatPhoneForCall(deposit.booking.customer.phone)}`
        : undefined,
      waLink: formatWhatsAppLink(
        deposit.booking.customer.phone,
        `Bonjour ${deposit.booking.customer.name}, votre caution peut être remboursée. Merci de nous contacter.`
      ) ?? undefined,
      detailsHref: `/bookings/${deposit.bookingId}`,
    })),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <ActionRequiredClient items={actionItems} />
    </div>
  );
}
