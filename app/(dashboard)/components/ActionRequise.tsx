import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatWhatsAppLink } from "@/lib/utils";
import {
  AlertTriangle,
  CreditCard,
  Banknote,
  MessageCircle,
  Phone,
} from "lucide-react";
import { FlatIcon } from "@/components/shared/flat-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Helper to format phone number for tel: links
const sanitizePhoneForCall = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.startsWith("212")
    ? `+${cleaned}`
    : `+212${cleaned.startsWith("0") ? cleaned.slice(1) : cleaned}`;
};

export async function ActionRequise({ agencyId }: { agencyId: string }) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [overdueBookings, unpaidBookings, depositsToRelease] =
    await Promise.all([
      // Overdue returns (ACTIVE bookings past end date)
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
        take: 10,
      }),

      // Unpaid bookings (PENDING payments)
      prisma.payment.findMany({
        where: {
          booking: { agencyId },
          status: "PENDING",
        },
        include: {
          booking: {
            include: {
              customer: { select: { name: true, phone: true } },
              vehicle: { select: { make: true, model: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Deposits to release (COMPLETED bookings with HELD deposits)
      prisma.deposit.findMany({
        where: {
          booking: { agencyId, status: "COMPLETED" },
          status: "HELD",
        },
        include: {
          booking: {
            include: {
              customer: { select: { name: true, phone: true } },
            },
          },
        },
        orderBy: { heldAt: "asc" },
        take: 10,
      }),
    ]);

  const totalItems =
    overdueBookings.length + unpaidBookings.length + depositsToRelease.length;

  if (totalItems === 0) {
    return null;
  }

  return (
    <Card className="bg-white shadow-lg border border-border/50 transition-shadow duration-200">
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-baseline gap-3 flex-wrap">
                <CardTitle className="text-xl font-semibold text-foreground leading-tight">
                  Action Requise
                </CardTitle>
                <Badge variant="danger" className="text-sm font-semibold shrink-0 bg-red-100/70 text-red-600/90 border-0 h-fit leading-none">
                  {totalItems}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground/55 mt-1">
                {totalItems} élément{totalItems > 1 ? "s" : ""} nécessitant une
                attention immédiate
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pt-0 pb-6">
        <div className="space-y-3.5 transition-[height,padding] duration-200 ease-out">
          {/* Overdue Returns */}
          {overdueBookings.map((booking) => {
            const daysOverdue = Math.floor(
              (todayStart.getTime() - new Date(booking.endDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const waLink = formatWhatsAppLink(
              booking.customer.phone,
              `Bonjour ${booking.customer.name}, retour véhicule en retard - merci de nous contacter.`
            );

            // Severity-based styling
            const getSeverityStyles = () => {
              if (daysOverdue > 3) {
                return {
                  borderCls: "border-l-red-500",
                  iconBg: "bg-red-100",
                  titleWeight: "font-bold",
                };
              }
              if (daysOverdue >= 1) {
                return {
                  borderCls: "border-l-red-400",
                  iconBg: "bg-red-100",
                  titleWeight: "font-semibold",
                };
              }
              return {
                borderCls: "border-l-red-300",
                iconBg: "bg-red-100/90",
                titleWeight: "font-semibold",
              };
            };

            const styles = getSeverityStyles();

            return (
              <div
                key={`overdue-${booking.id}`}
                className={`group flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 px-4 bg-white border-l-4 ${styles.borderCls} rounded-lg hover:bg-muted/20 transition-colors duration-200 ease-out`}
              >
                <Link
                  href={`/bookings/${booking.id}`}
                  className="flex flex-1 min-w-0 items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}
                  >
                    <AlertTriangle className="w-4 h-4 text-danger" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className={`text-sm ${styles.titleWeight} text-danger`}>
                        Retour en retard
                      </p>
                      <Badge
                        variant="danger"
                        className="text-xs"
                      >
                        {daysOverdue} jour{daysOverdue > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground truncate">
                      {booking.customer.name} • {booking.vehicle.make}{" "}
                      {booking.vehicle.model} ({booking.vehicle.plate})
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Fin prévue : {formatDate(booking.endDate)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 self-start sm:self-auto sm:shrink-0 pl-12 sm:pl-0">
                  <div className="tabular-nums">
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(booking.totalPrice)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-info hover:text-info/80 hover:bg-info/10" asChild>
                    <a href={`tel:${sanitizePhoneForCall(booking.customer.phone)}`} title="Appeler">
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-success hover:text-success/80 hover:bg-success/10" asChild>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Unpaid Bookings */}
          {unpaidBookings.map((payment) => {
            const waLink = formatWhatsAppLink(
              payment.booking.customer.phone,
              `Bonjour ${payment.booking.customer.name}, rappel paiement en attente - ${formatCurrency(payment.amount)}.`
            );

            return (
              <div
                key={`payment-${payment.id}`}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 px-4 bg-white border-l-4 border-l-amber-400 rounded-lg hover:bg-muted/20 transition-colors duration-200 ease-out"
              >
                <Link
                  href={`/payments`}
                  className="flex flex-1 min-w-0 items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        Paiement en attente
                      </p>
                      <Badge variant="warning" className="text-xs">
                        {payment.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground truncate">
                      {payment.booking.customer.name} •{" "}
                      {payment.booking.vehicle.make}{" "}
                      {payment.booking.vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Réservation #
                      {payment.booking.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 self-start sm:self-auto sm:shrink-0 pl-12 sm:pl-0">
                  <div className="tabular-nums">
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-info hover:text-info/80 hover:bg-info/10" asChild>
                    <a href={`tel:${sanitizePhoneForCall(payment.booking.customer.phone)}`} title="Appeler">
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-success hover:text-success/80 hover:bg-success/10" asChild>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9" asChild title="Encaisser">
                    <Link href="/payments">
                      <CreditCard className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Deposits to Release */}
          {depositsToRelease.map((deposit) => {
            const waLink = formatWhatsAppLink(
              deposit.booking.customer.phone,
              `Bonjour ${deposit.booking.customer.name}, votre caution peut être remboursée. Merci de nous contacter.`
            );

            return (
              <div
                key={`deposit-${deposit.id}`}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 px-4 bg-white border-l-4 border-l-blue-400 rounded-lg hover:bg-muted/20 transition-colors duration-200 ease-out"
              >
                <Link
                  href={`/bookings/${deposit.bookingId}`}
                  className="flex flex-1 min-w-0 items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-4 h-4 text-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        Caution à rembourser
                      </p>
                      <Badge variant="info" className="text-xs">
                        Complété
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">
                      {deposit.booking.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Retenue depuis : {formatDate(deposit.heldAt)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 self-start sm:self-auto sm:shrink-0 pl-12 sm:pl-0">
                  <div className="tabular-nums">
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(deposit.amount)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-info hover:text-info/80 hover:bg-info/10" asChild>
                    <a href={`tel:${sanitizePhoneForCall(deposit.booking.customer.phone)}`} title="Appeler">
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-success hover:text-success/80 hover:bg-success/10" asChild>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9" asChild title="Rembourser">
                    <Link href={`/bookings/${deposit.bookingId}`}>
                      <Banknote className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
