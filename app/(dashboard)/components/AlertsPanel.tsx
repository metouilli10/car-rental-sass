import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  AlertCircle,
  Clock,
  CreditCard,
  Wrench,
  ShieldCheck,
  CheckCircle,
  TrendingUp,
  Phone,
  Eye,
  Banknote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { addHours, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type AlertSeverity = "critical" | "warning" | "info";
type ActionType = "contact" | "view" | "payment";

interface Alert {
  id: string;
  severity: AlertSeverity;
  icon: typeof AlertCircle;
  message: string;
  time: string;
  href: string;
  actionType: ActionType;
  actionLabel: string;
  metadata?: {
    amount?: number;
    phone?: string;
  };
}

export async function AlertsPanel({ agencyId }: { agencyId: string }) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const twoHoursFromNow = addHours(now, 2);

  const [
    // CRITICAL: Overdue returns
    overdueReturns,

    // CRITICAL: Unpaid bookings with pickup today or past
    unpaidBookingsToday,

    // WARNING: Returns within next 2 hours
    upcomingReturns,

    // WARNING: High deposits held
    highDeposits,

    // WARNING: Vehicles due for maintenance (if mileage tracked)
    maintenanceVehicles,

    // INFO: New bookings confirmed today
    newBookingsToday,

    // INFO: Payments received today
    paymentsToday,
  ] = await Promise.all([
    // CRITICAL: Bookings with return date passed and not returned
    prisma.booking.findMany({
      where: {
        agencyId,
        status: "ACTIVE",
        endDate: { lt: now },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { make: true, model: true } },
      },
      orderBy: { endDate: "asc" },
      take: 10,
    }),

    // CRITICAL: Unpaid bookings with pickup today or past
    prisma.booking.findMany({
      where: {
        agencyId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        startDate: { lte: todayEnd },
        payments: {
          some: {
            status: "PENDING",
          },
        },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { make: true, model: true } },
        payments: {
          where: { status: "PENDING" },
          select: { amount: true },
        },
      },
      take: 10,
    }),

    // WARNING: Returns expected within next 2 hours
    prisma.booking.findMany({
      where: {
        agencyId,
        status: "ACTIVE",
        endDate: {
          gte: now,
          lte: twoHoursFromNow,
        },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { make: true, model: true } },
      },
      orderBy: { endDate: "asc" },
      take: 5,
    }),

    // WARNING: Deposits held > 5000 DH
    prisma.deposit.findMany({
      where: {
        booking: { agencyId },
        status: "HELD",
        amount: { gt: 5000 },
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { amount: "desc" },
      take: 5,
    }),

    // WARNING: Vehicles due for maintenance (mileage > 10000 or null placeholder)
    prisma.vehicle.findMany({
      where: {
        agencyId,
        status: "MAINTENANCE",
      },
      select: {
        id: true,
        make: true,
        model: true,
        plate: true,
        mileage: true,
      },
      take: 3,
    }),

    // INFO: New bookings confirmed today
    prisma.booking.findMany({
      where: {
        agencyId,
        status: "CONFIRMED",
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),

    // INFO: Payments received today
    prisma.payment.findMany({
      where: {
        booking: { agencyId },
        status: "PAID",
        paidAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 3,
    }),
  ]);

  // Build alerts array
  const alerts: Alert[] = [];

  // CRITICAL ALERTS
  overdueReturns.forEach((booking) => {
    alerts.push({
      id: `critical-overdue-${booking.id}`,
      severity: "critical",
      icon: AlertCircle,
      message: `Retour en retard: ${booking.customer.name}`,
      time: formatDistanceToNow(new Date(booking.endDate), {
        addSuffix: true,
        locale: fr,
      }),
      href: `/bookings/${booking.id}`,
      actionType: "contact",
      actionLabel: "Contacter",
      metadata: {
        phone: booking.customer.phone,
      },
    });
  });

  unpaidBookingsToday.forEach((booking) => {
    const unpaidAmount = booking.payments.reduce(
      (sum, p) => sum + p.amount,
      0
    );
    alerts.push({
      id: `critical-unpaid-${booking.id}`,
      severity: "critical",
      icon: CreditCard,
      message: `Paiement urgent: ${booking.customer.name}`,
      time: formatDistanceToNow(new Date(booking.startDate), {
        addSuffix: true,
        locale: fr,
      }),
      href: `/payments?booking=${booking.id}`,
      actionType: "payment",
      actionLabel: "Encaisser",
      metadata: {
        amount: unpaidAmount,
        phone: booking.customer.phone,
      },
    });
  });

  // WARNING ALERTS
  upcomingReturns.forEach((booking) => {
    alerts.push({
      id: `warning-upcoming-${booking.id}`,
      severity: "warning",
      icon: Clock,
      message: `Retour imminent: ${booking.customer.name}`,
      time: formatDistanceToNow(new Date(booking.endDate), {
        addSuffix: true,
        locale: fr,
      }),
      href: `/bookings/${booking.id}`,
      actionType: "contact",
      actionLabel: "Contacter",
      metadata: {
        phone: booking.customer.phone,
      },
    });
  });

  highDeposits.forEach((deposit) => {
    alerts.push({
      id: `warning-deposit-${deposit.id}`,
      severity: "warning",
      icon: Banknote,
      message: `Caution élevée: ${deposit.booking.customer.name}`,
      time: formatDistanceToNow(new Date(deposit.heldAt), {
        addSuffix: true,
        locale: fr,
      }),
      href: `/bookings/${deposit.bookingId}`,
      actionType: "view",
      actionLabel: "Voir détails",
      metadata: {
        amount: deposit.amount,
      },
    });
  });

  maintenanceVehicles.forEach((vehicle) => {
    alerts.push({
      id: `warning-maintenance-${vehicle.id}`,
      severity: "warning",
      icon: Wrench,
      message: `Maintenance: ${vehicle.make} ${vehicle.model}`,
      time: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "—",
      href: `/vehicles/${vehicle.id}/edit`,
      actionType: "view",
      actionLabel: "Voir détails",
    });
  });

  // INFO ALERTS
  newBookingsToday.forEach((booking) => {
    alerts.push({
      id: `info-booking-${booking.id}`,
      severity: "info",
      icon: CheckCircle,
      message: `Nouvelle réservation: ${booking.customer.name}`,
      time: formatDistanceToNow(new Date(booking.createdAt), {
        addSuffix: true,
        locale: fr,
      }),
      href: `/bookings/${booking.id}`,
      actionType: "view",
      actionLabel: "Voir détails",
    });
  });

  paymentsToday.forEach((payment) => {
    alerts.push({
      id: `info-payment-${payment.id}`,
      severity: "info",
      icon: TrendingUp,
      message: `Paiement reçu: ${payment.booking.customer.name}`,
      time: formatDistanceToNow(new Date(payment.paidAt!), {
        addSuffix: true,
        locale: fr,
      }),
      href: `/payments`,
      actionType: "view",
      actionLabel: "Voir détails",
      metadata: {
        amount: payment.amount,
      },
    });
  });

  // Sort by priority: critical > warning > info
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Severity configuration
  const severityConfig: Record<
    AlertSeverity,
    {
      dot: string;
      bg: string;
      badge: "destructive" | "warning" | "info";
    }
  > = {
    critical: {
      dot: "bg-red-500",
      bg: "hover:bg-red-50/50",
      badge: "destructive",
    },
    warning: {
      dot: "bg-amber-500",
      bg: "hover:bg-amber-50/50",
      badge: "warning",
    },
    info: {
      dot: "bg-blue-500",
      bg: "hover:bg-blue-50/50",
      badge: "info",
    },
  };

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  // Empty state
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Alertes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-50 mx-auto mb-3 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              ✅ Aucune alerte
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tout est en ordre pour le moment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Alertes</CardTitle>
          </div>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1.5" />
              {criticalCount} critique{criticalCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = alert.icon;

            return (
              <Link
                key={alert.id}
                href={alert.href}
                className={`flex items-center gap-3 p-4 ${config.bg} transition-colors group`}
              >
                {/* Colored dot */}
                <span
                  className={`w-2 h-2 rounded-full ${config.dot} flex-shrink-0 ${
                    alert.severity === "critical" ? "animate-pulse" : ""
                  }`}
                />

                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.severity === "critical"
                      ? "bg-red-100 text-red-600"
                      : alert.severity === "warning"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Message & Time */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                    {alert.metadata?.amount && (
                      <span className="text-xs font-semibold text-gray-700">
                        {formatCurrency(alert.metadata.amount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs flex-shrink-0"
                  onClick={(e) => {
                    if (
                      alert.actionType === "contact" &&
                      alert.metadata?.phone
                    ) {
                      e.preventDefault();
                      window.open(
                        `https://wa.me/${alert.metadata.phone.replace(/\D/g, "")}`,
                        "_blank"
                      );
                    }
                    // For 'view' and 'payment', let the Link handle navigation
                  }}
                >
                  {alert.actionType === "contact" && (
                    <Phone className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {alert.actionType === "view" && (
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {alert.actionType === "payment" && (
                    <Banknote className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {alert.actionLabel}
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
