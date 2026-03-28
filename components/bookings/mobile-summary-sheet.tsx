"use client";

import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn, formatCurrency } from "@/lib/utils";
import { SummaryCard } from "@/components/bookings/summary-card";
import type { BookingCustomerOption, BookingVehicleOption } from "@/components/bookings/types";

interface MobileSummarySheetProps {
  vehicle?: BookingVehicleOption;
  client?: BookingCustomerOption;
  durationLabel: string;
  startAt?: string;
  endAt?: string;
  baseTotal: number;
  addonsTotal: number;
  discountTotal: number;
  vatTotal: number;
  totalTTC: number;
  paid: number;
  remaining: number;
  warnings: string[];
  triggerLabel?: string;
  triggerClassName?: string;
  compactTrigger?: boolean;
}

export function MobileSummarySheet({
  triggerLabel = "Résumé en direct",
  triggerClassName,
  compactTrigger = false,
  ...props
}: MobileSummarySheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant={compactTrigger ? "outline" : "default"}
          className={cn(
            compactTrigger
              ? "h-11 w-full justify-between rounded-2xl border-border/80 bg-white/90 px-4 text-left text-slate-700 shadow-sm hover:bg-white"
              : "h-14 w-full justify-between rounded-2xl bg-blue-600 px-4 text-left text-white hover:bg-blue-700",
            triggerClassName,
          )}
        >
          <span className="min-w-0">
            <span className={cn("block font-semibold", compactTrigger ? "text-sm text-slate-900" : "text-sm")}>
              {triggerLabel}
            </span>
            <span className={cn("block truncate", compactTrigger ? "text-xs text-slate-500" : "text-sm text-blue-100")}>
              TTC {formatCurrency(props.totalTTC)} • Restant {formatCurrency(props.remaining)}
            </span>
          </span>
          <ChevronUp className={cn("h-4 w-4 shrink-0", compactTrigger ? "text-slate-500" : "text-white")} />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-[28px] border-t border-border/70 px-4 pb-safe-bottom pt-6">
        <SheetHeader className="text-left">
          <SheetTitle>Résumé réservation</SheetTitle>
          <SheetDescription>Tarification, paiement et alertes en direct.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-slate-50/90 p-3 text-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">TTC</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(props.totalTTC)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Payé</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(props.paid)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Restant</p>
            <p className="mt-1 text-sm font-semibold text-blue-700">{formatCurrency(props.remaining)}</p>
          </div>
        </div>
        <div className="mt-4">
          <SummaryCard {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
