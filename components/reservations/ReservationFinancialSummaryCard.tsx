"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EncaisserDialog } from "@/components/dashboard/EncaisserDialog";
import { LibererCautionDialog } from "@/components/dashboard/LibererCautionDialog";
import { paymentMethodLabel } from "@/components/finance/constants";
import { formatMad, type ReservationToneVariant } from "@/lib/reservations/presentation";
import type { BookingDepositStatus, BookingPaymentStatus, DepositStatus, PaymentType } from "@prisma/client";
import type { ReservationFinanceRow } from "@/lib/reservations/details";
import { useLocalizedPath } from "@/components/i18n/use-localized-path";

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

export function ReservationFinancialSummaryCard({
  bookingId,
  customerName,
  vehicleLabel,
  plate,
  totalPrice,
  pricePerDay,
  durationDays,
  paidNow,
  remainingAmount,
  depositAmount,
  paymentStatus,
  paymentStatusLabel,
  paymentStatusVariant,
  depositStatusLabel,
  depositStatusVariant,
  deposit,
  bookingDepositStatus,
  breakdownRows,
  paymentMethods,
}: {
  bookingId: string;
  customerName: string;
  vehicleLabel: string;
  plate: string;
  totalPrice: number;
  pricePerDay: number;
  durationDays: number;
  paidNow: number;
  remainingAmount: number;
  depositAmount: number;
  paymentStatus: BookingPaymentStatus;
  paymentStatusLabel: string;
  paymentStatusVariant: ReservationToneVariant;
  depositStatusLabel: string;
  depositStatusVariant: ReservationToneVariant;
  deposit: { id: string; amount: number; status: DepositStatus } | null;
  bookingDepositStatus: BookingDepositStatus;
  breakdownRows: ReservationFinanceRow[];
  paymentMethods: PaymentType[];
}) {
  const lp = useLocalizedPath();
  const router = useRouter();
  const [libererCautionOpen, setLibererCautionOpen] = useState(false);
  const [encaisserOpen, setEncaisserOpen] = useState(false);
  const canReleaseInPlace = deposit?.status === "HELD" && deposit?.id;
  const showReleaseAction = canReleaseInPlace || bookingDepositStatus === "RECEIVED";
  const paymentMethodLabels = Array.from(new Set(paymentMethods)).map(
    (method) => paymentMethodLabel[method] ?? method
  );

  return (
    <>
      <Card className="overflow-hidden shadow-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Résumé financier</CardTitle>
              <CardDescription>Lecture rapide des montants, paiements et caution</CardDescription>
            </div>
            <Badge variant={badgeVariantMap[paymentStatusVariant]}>{paymentStatusLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary/80">Total</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{formatMad(totalPrice)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMad(pricePerDay)} / jour × {durationDays} jour{durationDays > 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-2">
            {breakdownRows.map((row) => (
              <div key={`${row.label}-${row.amount}`} className="flex items-center justify-between gap-4 text-sm">
                <span className={row.tone === "muted" ? "text-muted-foreground" : "text-foreground"}>
                  {row.label}
                </span>
                <span className="font-medium">{formatMad(row.amount)}</span>
              </div>
            ))}
            <Separator className="my-1" />
            <div className="flex items-center justify-between gap-4 text-sm font-semibold">
              <span>Total</span>
              <span>{formatMad(totalPrice)}</span>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">État du paiement</span>
              <Badge variant={badgeVariantMap[paymentStatusVariant]}>{paymentStatusLabel}</Badge>
            </div>
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span className="pt-0.5 text-muted-foreground">Mode de règlement</span>
              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                {paymentMethodLabels.length > 0 ? (
                  paymentMethodLabels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))
                ) : (
                  <span className="font-medium text-muted-foreground">Non renseigné</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Montant payé</span>
              <span className="font-semibold">{formatMad(paidNow)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Reste dû</span>
              <span className="font-semibold">{formatMad(remainingAmount)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Caution</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatMad(depositAmount)}</span>
                <Badge variant={badgeVariantMap[depositStatusVariant]}>{depositStatusLabel}</Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              size="sm"
              variant={paymentStatus === "PAID" ? "outline" : "default"}
              className="w-full"
              onClick={() => setEncaisserOpen(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Ajouter paiement
            </Button>

            {showReleaseAction ? (
              canReleaseInPlace && deposit ? (
                <Button size="sm" variant="outline" className="w-full" onClick={() => setLibererCautionOpen(true)}>
                  <Banknote className="mr-2 h-4 w-4" />
                  Restituer caution
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={lp("/finance?tab=cautions")}>
                    <Banknote className="mr-2 h-4 w-4" />
                    Restituer caution
                  </Link>
                </Button>
              )
            ) : null}
          </div>
        </CardContent>
      </Card>

      <EncaisserDialog
        open={encaisserOpen}
        onOpenChange={setEncaisserOpen}
        bookingId={bookingId}
        defaultAmount={remainingAmount}
        customerName={customerName}
        vehicleLabel={vehicleLabel}
        onSuccess={() => router.refresh()}
      />

      {canReleaseInPlace && deposit ? (
        <LibererCautionDialog
          open={libererCautionOpen}
          onOpenChange={setLibererCautionOpen}
          depositId={deposit.id}
          customerName={customerName}
          vehicleLabel={vehicleLabel}
          plate={plate}
          amount={deposit.amount}
          onSuccess={() => router.refresh()}
        />
      ) : null}
    </>
  );
}
