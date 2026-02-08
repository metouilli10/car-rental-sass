import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatWhatsAppLink } from "@/lib/utils";
import {
  AlertTriangle,
  CreditCard,
  Banknote,
  MessageCircle,
  FileText,
  Send,
  Phone,
} from "lucide-react";
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
        orderBy: { createdAt: "asc" },
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
    <Card className="border-danger/20 bg-danger/5">
      <CardHeader className="border-b border-danger/20 bg-danger/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-danger">
                Action Requise
              </CardTitle>
              <p className="text-sm text-danger/80 mt-0.5">
                {totalItems} élément{totalItems > 1 ? "s" : ""} nécessitant une
                attention immédiate
              </p>
            </div>
          </div>
          <Badge variant="danger" className="text-sm font-semibold">
            {totalItems}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-danger/10 transition-[height,padding] duration-300 ease-out">
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
                // CRITICAL: >3 days overdue
                return {
                  container: "bg-danger/10 border-2 border-danger/30 border-l-4 border-l-danger",
                  hoverBg: "hover:bg-danger/20",
                  iconBg: "bg-danger/20 ring-danger/30",
                  titleWeight: "font-bold",
                };
              }
              if (daysOverdue >= 1) {
                // WARNING: 1-3 days overdue
                return {
                  container: "bg-danger/5 border border-danger/20 border-l-4 border-l-danger/60",
                  hoverBg: "hover:bg-danger/10",
                  iconBg: "bg-danger/10 ring-danger/20",
                  titleWeight: "font-semibold",
                };
              }
              return {
                container: "bg-danger/5 border border-danger/10 border-l-4 border-l-danger/40",
                hoverBg: "hover:bg-danger/10",
                iconBg: "bg-danger/5 ring-danger/10",
                titleWeight: "font-semibold",
              };
            };

            const styles = getSeverityStyles();

            return (
              <div
                key={`overdue-${booking.id}`}
                className={`group flex items-center gap-4 p-4 ${styles.container} ${styles.hoverBg} transition-all duration-200 ease-out hover:shadow-md hover:shadow-danger/10 hover:-translate-y-0.5 rounded-lg mx-1 -mx-0.5`}
              >
                <Link
                  href={`/bookings/${booking.id}`}
                  className="flex flex-1 min-w-0 items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-lg ${styles.iconBg} flex items-center justify-center flex-shrink-0 ring-1`}>
                    <AlertTriangle className="w-5 h-5 text-danger" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm ${styles.titleWeight} text-danger`}>
                        Retour en retard
                      </p>
                      <Badge
                        variant="danger"
                        className="text-xs animate-pulse"
                      >
                        {daysOverdue} jour{daysOverdue > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">
                      {booking.customer.name} • {booking.vehicle.make}{" "}
                      {booking.vehicle.model} ({booking.vehicle.plate})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fin prévue : {formatDate(booking.endDate)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right tabular-nums w-20">
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(booking.totalPrice)}
                    </p>
                    <a
                      href={`tel:${sanitizePhoneForCall(booking.customer.phone)}`}
                      className="text-xs text-info hover:text-info/80 hover:underline block"
                    >
                      {booking.customer.phone}
                    </a>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-info hover:text-info/80 hover:bg-info/10" asChild>
                    <a href={`tel:${sanitizePhoneForCall(booking.customer.phone)}`} title="Appeler">
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success/80 hover:bg-success/10" asChild>
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
                className="group flex items-center gap-4 p-4 bg-warning/5 border border-warning/20 border-l-4 border-l-warning hover:bg-warning/10 transition-all duration-200 ease-out hover:shadow-md hover:shadow-warning/10 hover:-translate-y-0.5 rounded-lg mx-1 -mx-0.5"
              >
                <Link
                  href={`/payments`}
                  className="flex flex-1 min-w-0 items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0 ring-1 ring-warning/20">
                    <CreditCard className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">
                        Paiement en attente
                      </p>
                      <Badge variant="warning" className="text-xs animate-pulse">
                        {payment.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">
                      {payment.booking.customer.name} •{" "}
                      {payment.booking.vehicle.make}{" "}
                      {payment.booking.vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Réservation #
                      {payment.booking.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right tabular-nums w-20">
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <a
                      href={`tel:${sanitizePhoneForCall(payment.booking.customer.phone)}`}
                      title="Appeler"
                      className="text-xs text-info hover:text-info/80 hover:underline block cursor-pointer transition-colors duration-150"
                    >
                      {payment.booking.customer.phone}
                    </a>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-info hover:text-info/80 hover:bg-info/10" asChild>
                    <a href={`tel:${sanitizePhoneForCall(payment.booking.customer.phone)}`} title="Appeler">
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success/80 hover:bg-success/10" asChild>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Encaisser">
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
                className="group flex items-center gap-4 p-4 bg-info/5 border border-info/20 border-l-4 border-l-info hover:bg-info/10 transition-all hover:shadow-md rounded-lg mx-1 -mx-0.5"
              >
                <Link
                  href={`/bookings/${deposit.bookingId}`}
                  className="flex flex-1 min-w-0 items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0 ring-1 ring-info/20">
                    <Banknote className="w-5 h-5 text-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
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
                    <p className="text-xs text-muted-foreground">
                      Retenue depuis : {formatDate(deposit.heldAt)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right tabular-nums w-20">
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(deposit.amount)}
                    </p>
                    <a
                      href={`tel:${sanitizePhoneForCall(deposit.booking.customer.phone)}`}
                      title="Appeler"
                      className="text-xs text-info hover:text-info/80 hover:underline block cursor-pointer transition-colors duration-150"
                    >
                      {deposit.booking.customer.phone}
                    </a>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-info hover:text-info/80 hover:bg-info/10" asChild>
                    <a href={`tel:${sanitizePhoneForCall(deposit.booking.customer.phone)}`} title="Appeler">
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success/80 hover:bg-success/10" asChild>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Rembourser">
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
