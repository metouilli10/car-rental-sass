import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  Clock,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface ActionItem {
  id: string;
  type: "overdue" | "payment" | "ending_soon";
  title: string;
  description: string;
  href: string;
  urgency: "high" | "medium";
}

export async function ActionRequiredSection({
  agencyId,
}: {
  agencyId: string;
}) {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const [overdueBookings, pendingPayments, endingSoonBookings] =
    await Promise.all([
      // Bookings past end date that are still ACTIVE
      prisma.booking.findMany({
        where: {
          agencyId,
          status: "ACTIVE",
          endDate: { lt: todayStart },
        },
        include: {
          customer: { select: { name: true } },
          vehicle: { select: { make: true, model: true, plate: true } },
        },
        take: 5,
      }),
      // Pending payments
      prisma.payment.findMany({
        where: {
          booking: { agencyId },
          status: "PENDING",
        },
        include: {
          booking: {
            include: {
              customer: { select: { name: true } },
            },
          },
        },
        take: 5,
      }),
      // Bookings ending within 3 days
      prisma.booking.findMany({
        where: {
          agencyId,
          status: "ACTIVE",
          endDate: {
            gte: todayStart,
            lte: threeDaysFromNow,
          },
        },
        include: {
          customer: { select: { name: true } },
          vehicle: { select: { make: true, model: true, plate: true } },
        },
        take: 5,
      }),
    ]);

  const actions: ActionItem[] = [
    ...overdueBookings.map((b) => ({
      id: b.id,
      type: "overdue" as const,
      title: `Retour en retard - ${b.customer.name}`,
      description: `${b.vehicle.make} ${b.vehicle.model} (${b.vehicle.plate}) - Fin prévue le ${formatDate(b.endDate)}`,
      href: `/bookings/${b.id}`,
      urgency: "high" as const,
    })),
    ...pendingPayments.map((p) => ({
      id: p.id,
      type: "payment" as const,
      title: `Paiement en attente - ${p.booking.customer.name}`,
      description: `Montant: ${formatCurrency(p.amount)}`,
      href: `/payments`,
      urgency: "medium" as const,
    })),
    ...endingSoonBookings.map((b) => ({
      id: b.id,
      type: "ending_soon" as const,
      title: `Retour imminent - ${b.customer.name}`,
      description: `${b.vehicle.make} ${b.vehicle.model} - Retour le ${formatDate(b.endDate)}`,
      href: `/bookings/${b.id}`,
      urgency: "medium" as const,
    })),
  ];

  if (actions.length === 0) {
    return null;
  }

  const iconMap = {
    overdue: AlertTriangle,
    payment: CreditCard,
    ending_soon: Clock,
  };

  const colorMap = {
    overdue: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      iconBg: "bg-red-100",
    },
    payment: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-600",
      iconBg: "bg-amber-100",
    },
    ending_soon: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      iconBg: "bg-blue-100",
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Actions requises ({actions.length})
        </h2>
      </div>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = iconMap[action.type];
          const colors = colorMap[action.type];

          return (
            <Link
              key={`${action.type}-${action.id}`}
              href={action.href}
              className={`group flex items-center gap-4 p-4 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-md transition-all duration-200`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {action.title}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {action.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
