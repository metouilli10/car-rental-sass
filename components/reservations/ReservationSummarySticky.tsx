import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Banknote } from "lucide-react";
import {
  formatMad,
  getPaymentStatus,
  getDepositStatus,
  type ReservationToneVariant,
} from "@/lib/reservations/presentation";
import type { DepositStatus } from "@prisma/client";
import type { BookingDepositStatus } from "@prisma/client";

const badgeVariantMap: Record<
  ReservationToneVariant,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
> = {
  default: "default",
  secondary: "secondary",
  success: "success",
  warning: "warning",
  destructive: "destructive",
  info: "info",
};

export interface ReservationSummaryStickyProps {
  totalPrice: number;
  pricePerDay: number;
  durationDays: number;
  paidNow: number;
  remainingAmount: number;
  paymentStatus?: "PENDING" | "PARTIAL" | "PAID";
  depositAmount: number;
  deposit?: { status: DepositStatus } | null;
  bookingDepositStatus?: BookingDepositStatus;
  bookingId: string;
}

export function ReservationSummarySticky({
  totalPrice,
  pricePerDay,
  durationDays,
  paidNow,
  remainingAmount,
  paymentStatus,
  depositAmount,
  deposit,
  bookingDepositStatus,
  bookingId,
}: ReservationSummaryStickyProps) {
  const payment = getPaymentStatus(paidNow, totalPrice, paymentStatus);
  const depositStatus = getDepositStatus(depositAmount, deposit, bookingDepositStatus);

  const paymentVariant = badgeVariantMap[payment.variant] ?? "secondary";
  const depositVariant = badgeVariantMap[depositStatus.variant] ?? "secondary";

  return (
    <>
      {/* Desktop: sticky card */}
      <Card className="lg:sticky lg:top-6 lg:self-start hidden lg:block">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Résumé financier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-2xl font-bold">{formatMad(totalPrice)}</p>
            <p className="text-sm text-muted-foreground">
              {formatMad(pricePerDay)} / jour · {durationDays} jour(s)
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Paiement</span>
              <Badge variant={paymentVariant}>{payment.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Payé : {formatMad(paidNow)} · Reste : {formatMad(remainingAmount)}
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/payments?booking=${bookingId}`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Ajouter paiement
              </Link>
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Caution</span>
              <Badge variant={depositVariant}>{depositStatus.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatMad(depositAmount)}
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/payments?booking=${bookingId}`}>
                <Banknote className="mr-2 h-4 w-4" />
                Restituer caution
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile: fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{formatMad(totalPrice)}</p>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              <Badge variant={paymentVariant} className="text-xs">
                {payment.label}
              </Badge>
              <Badge variant={depositVariant} className="text-xs">
                {depositStatus.label}
              </Badge>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/payments?booking=${bookingId}`}>
                <CreditCard className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Paiement</span>
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/payments?booking=${bookingId}`}>
                <Banknote className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Caution</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
