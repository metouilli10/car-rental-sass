"use client";

import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
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
}

export function MobileSummarySheet(props: MobileSummarySheetProps) {
  return (
    <div className="fixed inset-x-0 bottom-3 z-40 mx-auto w-[calc(100%-1rem)] max-w-md md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="h-14 w-full justify-between rounded-2xl bg-blue-600 px-4 text-left text-white hover:bg-blue-700">
            <span className="text-sm">
              <span className="font-semibold">TTC:</span> {formatCurrency(props.totalTTC)}
            </span>
            <span className="text-sm">
              Payé: {formatCurrency(props.paid)} • Restant: {formatCurrency(props.remaining)}
            </span>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Résumé réservation</SheetTitle>
            <SheetDescription>Tarification, paiement et alertes en direct.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <SummaryCard {...props} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
