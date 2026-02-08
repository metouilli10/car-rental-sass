import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  Car,
  RotateCcw,
  Clock,
  FileText,
  MessageCircle,
  Banknote,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow, format, isPast, isBefore, addHours } from "date-fns";
import { fr } from "date-fns/locale";

type OperationType = "SORTIE" | "RETOUR";
type OperationStatus = "completed" | "in-progress" | "upcoming" | "overdue";

interface TimelineOperation {
  id: string;
  bookingId: string;
  time: Date;
  type: OperationType;
  clientName: string;
  clientPhone: string;
  vehicleModel: string;
  vehiclePlate: string;
  paymentStatus: "paid" | "unpaid";
  depositStatus: "received" | "pending" | "released";
  operationStatus: OperationStatus;
  totalAmount: number;
}

export async function OperationsTimeline({ agencyId }: { agencyId: string }) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const todayDateString = now.toDateString();

  const todayBookings = await prisma.booking.findMany({
    where: {
      agencyId,
      OR: [
        { startDate: { gte: todayStart, lte: todayEnd } },
        { endDate: { gte: todayStart, lte: todayEnd } },
      ],
    },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { make: true, model: true, plate: true } },
      payments: { select: { status: true, amount: true } },
      deposit: { select: { status: true } },
    },
    orderBy: { startDate: "asc" },
  });

  // Build timeline operations
  const operations: TimelineOperation[] = [];

  for (const booking of todayBookings) {
    const isPickupToday =
      new Date(booking.startDate).toDateString() === todayDateString;
    const isReturnToday =
      new Date(booking.endDate).toDateString() === todayDateString;

    // Determine payment status
    const totalPaid = booking.payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);
    const paymentStatus: "paid" | "unpaid" =
      totalPaid >= booking.totalPrice ? "paid" : "unpaid";

    // Determine deposit status
    let depositStatus: "received" | "pending" | "released" = "pending";
    if (booking.deposit) {
      if (booking.deposit.status === "HELD") {
        depositStatus = "received";
      } else if (
        booking.deposit.status === "RETURNED" ||
        booking.deposit.status === "PARTIAL_RETURNED"
      ) {
        depositStatus = "released";
      }
    }

    // SORTIE (Pickup)
    if (isPickupToday) {
      const pickupTime = new Date(booking.startDate);
      let operationStatus: OperationStatus = "upcoming";

      if (booking.status === "ACTIVE") {
        operationStatus = "completed";
      } else if (booking.status === "CONFIRMED") {
        if (isPast(pickupTime)) {
          operationStatus = "overdue";
        } else if (isBefore(now, addHours(pickupTime, 2))) {
          operationStatus = "in-progress";
        }
      }

      operations.push({
        id: `${booking.id}-sortie`,
        bookingId: booking.id,
        time: pickupTime,
        type: "SORTIE",
        clientName: booking.customer.name,
        clientPhone: booking.customer.phone,
        vehicleModel: `${booking.vehicle.make} ${booking.vehicle.model}`,
        vehiclePlate: booking.vehicle.plate,
        paymentStatus,
        depositStatus,
        operationStatus,
        totalAmount: booking.totalPrice,
      });
    }

    // RETOUR (Return)
    if (isReturnToday) {
      const returnTime = new Date(booking.endDate);
      let operationStatus: OperationStatus = "upcoming";

      if (booking.status === "COMPLETED") {
        operationStatus = "completed";
      } else if (booking.status === "ACTIVE") {
        if (isPast(returnTime)) {
          operationStatus = "overdue";
        } else if (isBefore(now, addHours(returnTime, 2))) {
          operationStatus = "in-progress";
        }
      }

      operations.push({
        id: `${booking.id}-retour`,
        bookingId: booking.id,
        time: returnTime,
        type: "RETOUR",
        clientName: booking.customer.name,
        clientPhone: booking.customer.phone,
        vehicleModel: `${booking.vehicle.make} ${booking.vehicle.model}`,
        vehiclePlate: booking.vehicle.plate,
        paymentStatus,
        depositStatus,
        operationStatus,
        totalAmount: booking.totalPrice,
      });
    }
  }

  // Sort chronologically
  operations.sort((a, b) => a.time.getTime() - b.time.getTime());

  const getStatusConfig = (status: OperationStatus) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          textColor: "text-gray-500",
          timeColor: "text-gray-400",
        };
      case "in-progress":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          textColor: "text-blue-900",
          timeColor: "text-blue-600",
        };
      case "overdue":
        return {
          bg: "bg-red-50",
          border: "border-red-300",
          textColor: "text-red-900",
          timeColor: "text-red-600",
        };
      default:
        return {
          bg: "bg-white",
          border: "border-gray-200",
          textColor: "text-gray-900",
          timeColor: "text-gray-600",
        };
    }
  };

  const getRelativeTime = (time: Date) => {
    const diffMs = time.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMs < 0) return null; // Past
    if (diffMins < 60) return `Dans ${diffMins}min`;
    if (diffHours < 24) return `Dans ${diffHours}h`;
    return null;
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Opérations d&apos;aujourd&apos;hui
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {format(now, "EEEE d MMMM yyyy", { locale: fr })} •{" "}
                {operations.length} opération{operations.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {operations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              Aucune opération prévue aujourd&apos;hui
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {operations.map((op) => {
              const config = getStatusConfig(op.operationStatus);
              const relativeTime = getRelativeTime(op.time);
              const TypeIcon = op.type === "SORTIE" ? Car : RotateCcw;

              return (
                <div
                  key={op.id}
                  className={`flex items-start gap-4 p-4 ${config.bg} ${config.border} border-l-4 transition-all`}
                >
                  {/* Time Column */}
                  <div className="flex-shrink-0 w-20 text-right">
                    <p
                      className={`text-sm font-semibold ${config.timeColor}`}
                    >
                      {format(op.time, "HH:mm")}
                    </p>
                    {relativeTime && (
                      <p className="text-xs text-muted-foreground">
                        {relativeTime}
                      </p>
                    )}
                  </div>

                  {/* Type Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      op.type === "SORTIE"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Client & Type */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`text-sm font-semibold ${config.textColor} truncate`}
                      >
                        {op.clientName}
                      </h3>
                      <Badge
                        variant={op.type === "SORTIE" ? "success" : "info"}
                        className="text-xs flex-shrink-0"
                      >
                        {op.type}
                      </Badge>
                      {op.operationStatus === "overdue" && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          En retard
                        </Badge>
                      )}
                      {op.operationStatus === "completed" && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Terminé
                        </Badge>
                      )}
                    </div>

                    {/* Vehicle Info */}
                    <p className="text-sm text-muted-foreground mb-2">
                      {op.vehicleModel} •{" "}
                      <span className="font-mono text-xs">
                        {op.vehiclePlate}
                      </span>
                    </p>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {/* Payment Status */}
                      <Badge
                        variant={
                          op.paymentStatus === "paid" ? "success" : "warning"
                        }
                        className="text-xs"
                      >
                        {op.paymentStatus === "paid"
                          ? "Payé"
                          : "Paiement en attente"}
                      </Badge>

                      {/* Deposit Status */}
                      {op.type === "SORTIE" && (
                        <Badge
                          variant={
                            op.depositStatus === "received"
                              ? "info"
                              : "warning"
                          }
                          className="text-xs"
                        >
                          Caution:{" "}
                          {op.depositStatus === "received"
                            ? "Reçue"
                            : "En attente"}
                        </Badge>
                      )}

                      {op.type === "RETOUR" && (
                        <Badge
                          variant={
                            op.depositStatus === "released"
                              ? "success"
                              : "warning"
                          }
                          className="text-xs"
                        >
                          Caution:{" "}
                          {op.depositStatus === "released"
                            ? "Remboursée"
                            : "À rembourser"}
                        </Badge>
                      )}

                      {/* Amount */}
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(op.totalAmount)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* WhatsApp */}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <a
                          href={`https://wa.me/${op.clientPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                          WhatsApp
                        </a>
                      </Button>

                      {/* Payment Action */}
                      {op.paymentStatus === "unpaid" && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-amber-300 bg-amber-50 hover:bg-amber-100"
                        >
                          <Link href={`/payments?booking=${op.bookingId}`}>
                            <Banknote className="w-3.5 h-3.5 mr-1.5" />
                            Encaisser
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
